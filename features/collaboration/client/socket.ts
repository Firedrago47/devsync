// features/collaboration/client/socket.ts

import { io, Socket } from "socket.io-client";

const SOCKET_CONFIG_VERSION = 2;

/**
 * We store the socket on `globalThis` to survive
 * Next.js Fast Refresh / HMR without duplicating connections.
 */
declare global {
  // eslint-disable-next-line no-var
  var __devsyncSocket: Socket | undefined;
  // eslint-disable-next-line no-var
  var __devsyncSocketVersion: number | undefined;
}

let socket: Socket | null = null;

/**
 * Create or return the singleton socket instance
 */
export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("Socket can only be used in the browser");
  }

  if (!socket) {
    const wsUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      window.location.origin;

    // Drop stale HMR socket when connection config changes.
    if (
      globalThis.__devsyncSocket &&
      globalThis.__devsyncSocketVersion !== SOCKET_CONFIG_VERSION
    ) {
      globalThis.__devsyncSocket.disconnect();
      globalThis.__devsyncSocket = undefined;
    }

    socket =
      globalThis.__devsyncSocket ??
      io(wsUrl, {
        // Polling from localhost -> remote can fail with xhr poll error.
        // Use websocket transport only.
        transports: ["websocket"],
        upgrade: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        timeout: 20000,

        /**
         * Auth is transport-level metadata.
         * You can extend this later (JWT, session, etc).
         */
        auth: {
          client: "web",
        },
      });

    globalThis.__devsyncSocket = socket;
    globalThis.__devsyncSocketVersion = SOCKET_CONFIG_VERSION;

    console.log("🔌 Socket target:", wsUrl);

    /* ---------- Debug (optional but useful) ---------- */
    socket.on("connect", () => {
      console.log("🟢 Socket connected", socket!.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("🔴 Socket disconnected:", reason);
    });

    socket.on("reconnect", (attempt) => {
      console.log("🔁 Socket reconnected after", attempt);
      /**
       * IMPORTANT:
       * Room rejoin is handled by `connection.ts`
       * via `connect()` → `room:join`
       */
    });

    socket.on("connect_error", (err) => {
      const anyErr = err as Error & {
        description?: unknown;
        context?: unknown;
        type?: string;
        data?: unknown;
      };

      console.error("⚠️ Socket connect_error message:", anyErr?.message ?? String(err));
      console.error("⚠️ Socket connect_error raw:", err);
      console.error("⚠️ Socket connect_error details:", {
        target: wsUrl,
        type: anyErr?.type,
        description: anyErr?.description,
        context: anyErr?.context,
        data: anyErr?.data,
        connected: socket?.connected,
        transport: socket?.io.engine?.transport?.name,
      });
    });
  }

  return socket;
}

/**
 * Ephemeral client instance ID
 * Used ONLY for awareness/cursors
 * (never for auth, never persisted)
 */
export const CLIENT_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
