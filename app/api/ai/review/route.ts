import { NextResponse } from "next/server";

const WISDOM_BASE = "https://wisdom-ai-fn24.onrender.com";
const WISDOM_REVIEW = `${WISDOM_BASE}/review`;
const WISDOM_HEALTH = `${WISDOM_BASE}/health`;
const WISDOM_KEY = "devsync_live_abc123";

/* Wake Render server (prevents cold start fail) */
async function wakeWisdom() {
  try {
    await fetch(WISDOM_HEALTH, { method: "GET" });
    await new Promise((r) => setTimeout(r, 4000));
  } catch {
    console.log("Wake attempt done");
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

function normalizeLocation(issue: any): string | null {
  const startLine =
    typeof issue?.start_line === "number"
      ? issue.start_line
      : typeof issue?.line === "number"
        ? issue.line
        : typeof issue?.lineNumber === "number"
          ? issue.lineNumber
          : null;
  const endLine =
    typeof issue?.end_line === "number"
      ? issue.end_line
      : typeof issue?.lineEnd === "number"
        ? issue.lineEnd
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
  try {
    const { scope, file, language, code } = await req.json();

    if (!file || !code) {
      return NextResponse.json(
        { error: "Missing file or code" },
        { status: 400 }
      );
    }

    /* wake render */
    await wakeWisdom();

    /* call wisdom engine */
    const wisdomRes = await fetch(WISDOM_REVIEW, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": WISDOM_KEY,
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

    if (!data.success) {
      return NextResponse.json(
        { error: "Wisdom analysis failed", details: data },
        { status: 500 }
      );
    }

    /* Convert Wisdom → DevSync UI format */
    const results = (data.issues || []).map((i: any, index: number) => {
      const message =
        firstString(i?.title, i?.message, i?.description) || "Issue detected";
      const fix = firstString(
        i?.fix,
        i?.suggestion,
        i?.recommendation,
        i?.remediation
      );
      const location = firstString(i?.location, normalizeLocation(i));
      const simple = buildSimpleReviewText({
        message,
        fix,
        location,
        code: typeof code === "string" ? code : "",
        language: typeof language === "string" ? language : "auto",
      });

      return {
        id: String(index),
        severity: normalizeSeverity(i?.severity),
        category: normalizeCategory(i?.category),
        message,
        confidence: normalizeConfidence(i?.confidence),
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
    console.error("WISDOM ERROR:", err);
    return NextResponse.json(
      { error: "Wisdom connection failed" },
      { status: 500 }
    );
  }
}
