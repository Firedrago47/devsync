import { NextResponse } from "next/server";

const WISDOM_BASE = "https://wisdom-ai-fn24.onrender.com";
const WISDOM_CHAT = `${WISDOM_BASE}/api/wisdom/chat`;
const WISDOM_HEALTH = `${WISDOM_BASE}/health`;
const WISDOM_KEY = "devsync_live_abc123";

/* wake wisdom render server */
async function wakeWisdom() {
  try {
    await fetch(WISDOM_HEALTH);
    await new Promise((r) => setTimeout(r, 4000));
  } catch {
    console.log("wake done");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = body.message || "";
    const file = body.file || "editor.py";
    const code = body.code || "";
    const language = body.language || "python";

    if (!message) {
      return NextResponse.json(
        { error: "Message required" },
        { status: 400 }
      );
    }

    // wake render backend
    await wakeWisdom();

    // CALL WISDOM STREAM BACKEND
    const wisdomRes = await fetch(WISDOM_CHAT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": WISDOM_KEY,
      },
      body: JSON.stringify({
        message: message,
        session_id: "devsync-user-1",
        file: file,
        code: code,
        language: language
      }),
    });

    if (!wisdomRes.ok) {
      const errText = await wisdomRes.text();
      console.log("WISDOM ERROR:", errText);
      return NextResponse.json(
        { error: "Wisdom backend error", details: errText },
        { status: 500 }
      );
    }

    //  IMPORTANT: STREAM RESPONSE BACK TO FRONTEND
    if (!wisdomRes.body) {
      return NextResponse.json(
        { error: "No response body from wisdom" },
        { status: 500 }
      );
    }

    return new Response(wisdomRes.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (err) {
    console.error("CHAT ROUTE ERROR:", err);
    return NextResponse.json(
      { error: "Server crash" },
      { status: 500 }
    );
  }
}