import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/security/auth";
import { logSecurity } from "@/lib/security/logger";
import { getClientIp, isTrustedOrigin } from "@/lib/security/request";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getWisdomConfig } from "@/lib/security/wisdom";

async function wakeWisdom(healthUrl: string) {
  try {
    await fetch(healthUrl);
    await new Promise((r) => setTimeout(r, 4000));
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
        path: "/api/ai/chat",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTrustedOrigin(req)) {
      logSecurity("warn", {
        event: "untrusted_origin_blocked",
        userId: session.user.id,
        ip,
        path: "/api/ai/chat",
      });
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    const limit = checkRateLimit({
      key: `ai-chat:${session.user.id}:${ip}`,
      max: 30,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      logSecurity("warn", {
        event: "rate_limit_exceeded",
        userId: session.user.id,
        ip,
        path: "/api/ai/chat",
      });
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json();

    const message =
      typeof body?.message === "string" ? body.message.trim() : "";
    const file = typeof body?.file === "string" ? body.file : "editor.py";
    const code = typeof body?.code === "string" ? body.code : "";
    const language =
      typeof body?.language === "string" ? body.language : "python";

    if (!message || message.length > 5000) {
      return NextResponse.json(
        { error: "Message is required and must be <= 5000 chars" },
        { status: 400 }
      );
    }

    if (code.length > 200_000) {
      return NextResponse.json({ error: "Code payload too large" }, { status: 413 });
    }

    const wisdom = getWisdomConfig();
    await wakeWisdom(wisdom.healthUrl);

    const wisdomRes = await fetch(wisdom.chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": wisdom.key,
      },
      body: JSON.stringify({
        message,
        session_id: session.user.id,
        file,
        code,
        language,
      }),
    });

    if (!wisdomRes.ok) {
      const errText = await wisdomRes.text();
      logSecurity("error", {
        event: "wisdom_chat_error",
        userId: session.user.id,
        ip,
        path: "/api/ai/chat",
        details: { status: wisdomRes.status, errText },
      });
      return NextResponse.json(
        { error: "Wisdom backend error" },
        { status: 500 }
      );
    }

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
    logSecurity("error", {
      event: "chat_route_exception",
      ip,
      path: "/api/ai/chat",
      details: { message: err instanceof Error ? err.message : String(err) },
    });
    return NextResponse.json(
      { error: "Server crash" },
      { status: 500 }
    );
  }
}
