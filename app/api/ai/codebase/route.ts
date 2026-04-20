import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/security/auth";
import { logSecurity } from "@/lib/security/logger";
import { getClientIp, isTrustedOrigin } from "@/lib/security/request";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getWisdomConfig } from "@/lib/security/wisdom";

interface AnalyzeRequestBody {
  roomId?: string;
  projectName?: string;
  files?: string[];
}

function extensionOf(filePath: string): string {
  const index = filePath.lastIndexOf(".");
  if (index === -1 || index === filePath.length - 1) return "unknown";
  return filePath.slice(index + 1).toLowerCase();
}

function detectStack(files: string[]): string[] {
  const hasNext = files.some(
    (file) =>
      file.includes("next.config") ||
      file.startsWith("app/") ||
      file.startsWith("pages/")
  );
  const hasTs = files.some((file) => file.endsWith(".ts") || file.endsWith(".tsx"));
  const hasJs = files.some((file) => file.endsWith(".js") || file.endsWith(".jsx"));
  const hasPython = files.some((file) => file.endsWith(".py"));
  const hasDocker = files.some((file) => file.toLowerCase().includes("dockerfile"));

  const stack: string[] = [];
  if (hasNext) stack.push("Next.js");
  if (hasTs) stack.push("TypeScript");
  if (hasJs) stack.push("JavaScript");
  if (hasPython) stack.push("Python");
  if (hasDocker) stack.push("Docker");
  return stack.length ? stack : ["Unknown stack"];
}

function fileRoleHint(filePath: string): string | null {
  const lower = filePath.toLowerCase();
  if (lower.includes("/app/api/")) return `${filePath}: API route / backend integration logic`;
  if (lower.includes("/ui/layout/")) return `${filePath}: UI layout and shell composition`;
  if (lower.includes("/features/collaboration/")) return `${filePath}: realtime collaboration client state/transport`;
  if (lower.includes("/features/editor/")) return `${filePath}: editor integration and document interaction`;
  if (lower.includes("/features/rooms/")) return `${filePath}: room lifecycle, access flow, and orchestration`;
  if (lower.includes("/socket/")) return `${filePath}: realtime backend event handlers`;
  if (lower.includes("/storage/")) return `${filePath}: persistence/storage provider logic`;
  if (lower.endsWith("route.ts") || lower.endsWith("route.js")) return `${filePath}: HTTP API endpoint`;
  return null;
}

function buildManifest(projectName: string, files: string[]): string {
  const limited = files.slice(0, 500);
  return [
    `Project: ${projectName}`,
    "",
    "Task: Explain codebase flow and file responsibilities for contributors.",
    "Expected output:",
    "- high-level request/data flow",
    "- module responsibilities",
    "- key entry points",
    "- files that are likely critical for contributors to read first",
    "",
    "Important:",
    "- Do NOT do bug-finding, security scanning, or quality scoring.",
    "- Do NOT output phrases like 'no issues found'.",
    "- Focus on architecture understanding only.",
    "",
    "Files:",
    ...limited.map((file, index) => `${index + 1}. ${file}`),
  ].join("\n");
}

function extractFlowInsights(data: unknown): string[] {
  const record =
    data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : {};
  const insights: string[] = [];

  const llmExplanation =
    record.llm_explanation &&
    typeof record.llm_explanation === "object"
      ? (record.llm_explanation as Record<string, unknown>)
      : {};

  const explanation = llmExplanation.content;
  if (typeof explanation === "string" && explanation.trim()) {
    const lines = explanation
      .split("\n")
      .map((line: string) => line.replace(/^[-*]\s*/, "").trim())
      .filter((line: string) => !!line)
      .filter(
        (line: string) =>
          !/no\s+issues?|no\s+major\s+issues?|issues?\s+found/i.test(line)
      )
      .slice(0, 6);
    insights.push(...lines);
  }

  if (typeof record.summary === "string" && record.summary.trim()) {
    const summaryLine = record.summary.trim();
    if (!/no\s+issues?|issues?\s+found/i.test(summaryLine)) {
      insights.unshift(summaryLine);
    }
  }

  return [...new Set(insights)].slice(0, 8);
}

async function wakeWisdom(healthUrl: string) {
  try {
    await fetch(healthUrl, { method: "GET" });
    await new Promise((resolve) => setTimeout(resolve, 4000));
  } catch {
    logSecurity("info", { event: "wisdom_wake_attempt_done" });
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  try {
    const session = await requireApiSession();
    if (!session?.user?.id) {
      logSecurity("warn", {
        event: "unauthorized_api_access",
        ip,
        path: "/api/ai/codebase",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTrustedOrigin(req)) {
      logSecurity("warn", {
        event: "untrusted_origin_blocked",
        userId: session.user.id,
        ip,
        path: "/api/ai/codebase",
      });
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    const limit = checkRateLimit({
      key: `ai-codebase:${session.user.id}:${ip}`,
      max: 10,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = (await req.json()) as AnalyzeRequestBody;
    const files = Array.isArray(body.files)
      ? body.files.filter((item): item is string => typeof item === "string")
      : [];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided for analysis" },
        { status: 400 }
      );
    }
    if (files.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Too many files in analysis request" },
        { status: 413 }
      );
    }

    const projectName = body.projectName || "Open Source Project";
    const folderSet = new Set(
      files
        .map((file) => {
          const index = file.lastIndexOf("/");
          return index > 0 ? file.slice(0, index) : "";
        })
        .filter(Boolean)
    );

    const extCount = new Map<string, number>();
    for (const file of files) {
      const ext = extensionOf(file);
      extCount.set(ext, (extCount.get(ext) ?? 0) + 1);
    }
    const sortedExt = Array.from(extCount.entries()).sort((a, b) => b[1] - a[1]);

    const warnings: string[] = [];
    if (files.length > 500) {
      warnings.push("Large project detected; analysis used a truncated file manifest.");
    }

    const manifest = buildManifest(projectName, files);
    let aiSummary = `${projectName} includes ${files.length} files across ${folderSet.size} folders.`;
    let aiInsights: string[] = [];

    const wisdom = getWisdomConfig();
    await wakeWisdom(wisdom.healthUrl);

    const wisdomRes = await fetch(wisdom.reviewUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": wisdom.key,
      },
      body: JSON.stringify({
        file: "CODEBASE_MANIFEST.md",
        language: "markdown",
        code: manifest,
        scope: "codebase_architecture",
        policy: {
          org: "devsync",
          goal: "Explain codebase flow and file responsibilities for contributors",
        },
      }),
    });

    if (!wisdomRes.ok) {
      const details = await wisdomRes.text().catch(() => "");
      logSecurity("warn", {
        event: "wisdom_codebase_error",
        userId: session.user.id,
        ip,
        path: "/api/ai/codebase",
        details: { status: wisdomRes.status },
      });
      throw new Error(details || `Wisdom HTTP ${wisdomRes.status}`);
    }

    const wisdomData = await wisdomRes.json();
    if (wisdomData?.success) {
      if (typeof wisdomData.summary === "string" && wisdomData.summary.trim()) {
        aiSummary = wisdomData.summary.trim();
      }
      aiInsights = extractFlowInsights(wisdomData);
    } else {
      warnings.push("Wisdom response was not successful; partial fallback insights used.");
    }

    const roleHints = files
      .map((file) => fileRoleHint(file))
      .filter((value): value is string => !!value)
      .slice(0, 6);

    const insights = [
      `Top file types: ${sortedExt
        .slice(0, 4)
        .map(([ext, count]) => `.${ext} (${count})`)
        .join(", ")}`,
      ...aiInsights,
      ...roleHints,
    ]
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12);

    return NextResponse.json({
      success: true,
      engine: "WISDOM AI",
      roomId: body.roomId ?? null,
      summary: aiSummary,
      totalFiles: files.length,
      totalFolders: folderSet.size,
      techStack: detectStack(files),
      insights,
      warnings,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logSecurity("error", {
      event: "codebase_route_exception",
      ip,
      path: "/api/ai/codebase",
      details: { message: err instanceof Error ? err.message : String(err) },
    });
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to analyze codebase",
      },
      { status: 500 }
    );
  }
}
