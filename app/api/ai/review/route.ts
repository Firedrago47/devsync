import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/security/auth";
import { logSecurity } from "@/lib/security/logger";
import { getClientIp, isTrustedOrigin } from "@/lib/security/request";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getWisdomConfig } from "@/lib/security/wisdom";

async function wakeWisdom(healthUrl: string) {
  try {
    await fetch(healthUrl, { method: "GET" });
    await new Promise((r) => setTimeout(r, 4000));
  } catch {
    logSecurity("info", { event: "wisdom_wake_attempt_done" });
  }
}

function normalizeSeverity(value: unknown): "error" | "warning" | "info" {
  const raw = typeof value === "string" ? value.toLowerCase() : "";
  if (raw === "error" || raw === "critical" || raw === "high") return "error";
  if (raw === "warning" || raw === "medium") return "warning";
  return "info";
}

function normalizeCategory(
  value: unknown
): "bug" | "security" | "performance" | "style" {
  const raw = typeof value === "string" ? value.toLowerCase() : "";
  if (raw === "security") return "security";
  if (raw === "performance") return "performance";
  if (raw === "bug" || raw === "logic") return "bug";
  return "style";
}

function normalizeConfidence(value: unknown): "low" | "medium" | "high" {
  const raw = typeof value === "string" ? value.toLowerCase() : "";
  if (raw === "high") return "high";
  if (raw === "low") return "low";
  return "medium";
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeLocation(issue: unknown): string | null {
  const record = toRecord(issue);
  const startLine =
    typeof record.start_line === "number"
      ? record.start_line
      : typeof record.line === "number"
        ? record.line
        : typeof record.lineNumber === "number"
          ? record.lineNumber
          : null;
  const endLine =
    typeof record.end_line === "number"
      ? record.end_line
      : typeof record.lineEnd === "number"
        ? record.lineEnd
        : null;

  if (startLine && endLine && endLine !== startLine) {
    return `L${startLine}-L${endLine}`;
  }
  if (startLine) {
    return `L${startLine}`;
  }
  return null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function buildSimpleReviewText(input: {
  message: string;
  fix: string | null;
  location: string | null;
  code: string;
  language: string;
}) {
  const message = input.message.trim();
  const lower = message.toLowerCase();
  const language = (input.language || "").toLowerCase();

  let fix = input.fix;

  // Practical heuristic for common demo case:
  // Python syntax error caused by JS-style comment and bad quoting.
  if (
    /syntax/.test(lower) &&
    (language === "python" || language === "auto") &&
    input.code.includes("//")
  ) {
    fix =
      "In Python use `#` for comments (not `//`). Also fix mismatched quotes, e.g. `print(\"hello\")`.";
  }

  const locationText = input.location ? ` at ${input.location}` : "";
  const explanation = `Issue${locationText}: ${message}`;
  const resolution = fix
    ? `Fix: ${fix}`
    : "Fix: Review the indicated line and correct the syntax/logic in that statement.";

  return { explanation, resolution };
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  try {
    const session = await requireApiSession();
    if (!session?.user?.id) {
      logSecurity("warn", {
        event: "unauthorized_api_access",
        ip,
        path: "/api/ai/review",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTrustedOrigin(req)) {
      logSecurity("warn", {
        event: "untrusted_origin_blocked",
        userId: session.user.id,
        ip,
        path: "/api/ai/review",
      });
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    const limit = checkRateLimit({
      key: `ai-review:${session.user.id}:${ip}`,
      max: 20,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { scope, file, language, code } = await req.json();

    if (
      typeof file !== "string" ||
      typeof code !== "string" ||
      !file.trim() ||
      !code.trim()
    ) {
      return NextResponse.json(
        { error: "Missing file or code" },
        { status: 400 }
      );
    }

    if (code.length > 200_000) {
      return NextResponse.json({ error: "Code payload too large" }, { status: 413 });
    }

    const wisdom = getWisdomConfig();
    await wakeWisdom(wisdom.healthUrl);

    const wisdomRes = await fetch(wisdom.reviewUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": wisdom.key,
      },
      body: JSON.stringify({
        file,
        language: language || "python",
        code,
        scope: scope || "file",
        policy: {
          org: "devsync",
          mode: "actionable_review",
          include_location: true,
          include_fix: true,
          include_impact: true,
        },
      }),
    });

    const data = await wisdomRes.json();

    if (!wisdomRes.ok || !data.success) {
      logSecurity("warn", {
        event: "wisdom_review_error",
        userId: session.user.id,
        ip,
        path: "/api/ai/review",
        details: {
          status: wisdomRes.status,
        },
      });
      return NextResponse.json(
        { error: "Wisdom analysis failed" },
        { status: 500 }
      );
    }

    /* Convert Wisdom → DevSync UI format */
    const issues: unknown[] = Array.isArray(data.issues) ? data.issues : [];
    const results = issues.map((issue, index: number) => {
      const record = toRecord(issue);
      const message =
        firstString(record.title, record.message, record.description) || "Issue detected";
      const fix = firstString(
        record.fix,
        record.suggestion,
        record.recommendation,
        record.remediation
      );
      const location = firstString(record.location, normalizeLocation(issue));
      const simple = buildSimpleReviewText({
        message,
        fix,
        location,
        code: typeof code === "string" ? code : "",
        language: typeof language === "string" ? language : "auto",
      });

      return {
        id: String(index),
        severity: normalizeSeverity(record.severity),
        category: normalizeCategory(record.category),
        message,
        confidence: normalizeConfidence(record.confidence),
        impact: simple.explanation,
        fix: simple.resolution,
        location,
      };
    });

    return NextResponse.json({
      success: true,
      engine: "WISDOM AI",
      summary: data.summary,
      policy: data.policy,
      results: results,
      explanation: data.llm_explanation?.content || null,
    });
  } catch (err) {
    logSecurity("error", {
      event: "review_route_exception",
      ip,
      path: "/api/ai/review",
      details: { message: err instanceof Error ? err.message : String(err) },
    });
    return NextResponse.json(
      { error: "Wisdom connection failed" },
      { status: 500 }
    );
  }
}
