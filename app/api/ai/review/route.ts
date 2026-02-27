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
        policy: { org: "devsync" },
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
    const results = (data.issues || []).map((i: any, index: number) => ({
      id: String(index),
      severity: i.severity || "info",
      category:
        i.category === "security"
          ? "security"
          : i.category === "performance"
          ? "performance"
          : i.category === "bug"
          ? "bug"
          : "style",
      message: i.message || "Issue detected",
      confidence: i.confidence || "medium",
    }));

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