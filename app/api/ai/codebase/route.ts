import { NextResponse } from "next/server";

interface AnalyzeRequestBody {
  roomId?: string;
  projectName?: string;
  files?: string[];
}

function extensionOf(path: string): string {
  const index = path.lastIndexOf(".");
  if (index === -1 || index === path.length - 1) return "unknown";
  return path.slice(index + 1).toLowerCase();
}

function detectStack(files: string[]) {
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

export async function POST(req: Request) {
  try {
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

    const extCount = new Map<string, number>();
    for (const file of files) {
      const ext = extensionOf(file);
      extCount.set(ext, (extCount.get(ext) ?? 0) + 1);
    }

    const sortedExt = Array.from(extCount.entries()).sort((a, b) => b[1] - a[1]);
    const primaryExt = sortedExt[0]?.[0] ?? "unknown";
    const folderSet = new Set(
      files
        .map((file) => {
          const index = file.lastIndexOf("/");
          return index > 0 ? file.slice(0, index) : "";
        })
        .filter(Boolean)
    );

    const warnings: string[] = [];
    if (!files.some((file) => file.toLowerCase().includes("readme"))) {
      warnings.push("README is missing from the indexed file tree.");
    }
    if (!files.some((file) => file.includes("test") || file.includes("__tests__"))) {
      warnings.push("No obvious test files were detected.");
    }
    if (files.length > 300) {
      warnings.push("Large project detected; consider incremental module analysis.");
    }

    const stack = detectStack(files);
    const summary = `${body.projectName || "Project"} includes ${files.length} files across ${folderSet.size} folders. Dominant file type: .${primaryExt}.`;

    return NextResponse.json({
      success: true,
      roomId: body.roomId ?? null,
      summary,
      totalFiles: files.length,
      totalFolders: folderSet.size,
      techStack: stack,
      insights: [
        `Top file types: ${sortedExt
          .slice(0, 4)
          .map(([ext, count]) => `.${ext} (${count})`)
          .join(", ")}`,
        "Use architecture docs for onboarding open-source contributors.",
        "Prioritize analysis of core modules before peripheral tooling.",
      ],
      warnings,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("CODEBASE ANALYSIS ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Failed to analyze codebase" },
      { status: 500 }
    );
  }
}
