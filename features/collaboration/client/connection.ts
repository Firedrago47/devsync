// features/collaboration/client/connection.ts

import { getSocket } from "./socket";
import { eventBus } from "./event-bus";
import {
  toFSDeleteEventPayload,
  toFSNodeEventPayload,
  toFSSnapshotPayload,
  toPresenceLeavePayload,
  toPresenceSnapshotPayload,
  toPresenceUserPayload,
  toRoomErrorPayload,
  toRoomJoinRequestPayload,
  toCollabMessagePayload,
  toCollabHistoryPayload,
  type RoomSnapshotPayload,
} from "./socket.contract";

let activeRoomId: string | null = null;
let activeUserId: string | null = null;
let activeUserName: string | null = null;
let activeUserEmail: string | null = null;
let isConnecting = false;
let hasSnapshot = false;
let listenersRegistered = false;

function isRoomSnapshotPayload(payload: unknown): payload is RoomSnapshotPayload {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<RoomSnapshotPayload>;

  return (
    typeof candidate.roomId === "string" &&
    !!candidate.room &&
    Array.isArray(candidate.members) &&
    Array.isArray(candidate.tree)
  );
}

function emitJoinIfReady() {
  const socket = getSocket();
  if (!socket.connected || !activeRoomId || !activeUserId) return;
  hasSnapshot = false;

  socket.emit("room:join", {
    roomId: activeRoomId,
    userId: activeUserId,
    name: activeUserName ?? undefined,
    email: activeUserEmail ?? undefined,
  });
}

export function connect(
  roomId: string,
  userId: string,
  profile?: { name?: string | null; email?: string | null }
) {
  if (isConnecting) return;

  isConnecting = true;
  hasSnapshot = false;

  const socket = getSocket();
  activeRoomId = roomId;
  activeUserId = userId;
  activeUserName = profile?.name?.trim() || null;
  activeUserEmail = profile?.email?.trim() || null;

  if (!socket.connected) {
    socket.connect();
  }

  if (!listenersRegistered) {
    listenersRegistered = true;

    /* ---------- Connect ---------- */
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      emitJoinIfReady();
    });

    /* ---------- Room snapshot (CRITICAL) ---------- */
    socket.on("room:snapshot", (payload: unknown) => {
      if (!isRoomSnapshotPayload(payload)) return;
      console.log("✅ Room snapshot received", payload);

      if (payload.roomId !== activeRoomId) return;

      hasSnapshot = true;

      // Emit snapshot FIRST
      eventBus.emit("room:snapshot", payload);

      // Only now mark room as joined
      eventBus.emit("room:joined", {
        roomId: payload.roomId,
      });
    });

    socket.on("room:error", (payload: unknown) => {
      const roomError = toRoomErrorPayload(payload);
      if (roomError.roomId && roomError.roomId !== activeRoomId) return;

      const joinRequest = toRoomJoinRequestPayload(payload);
      if (
        joinRequest &&
        joinRequest.roomId === activeRoomId &&
        roomError.code?.toLowerCase().includes("join_request")
      ) {
        eventBus.emit("room:join-request", joinRequest);
        return;
      }

      hasSnapshot = false;
      eventBus.emit("room:error", roomError);
    });

    socket.on("room:join-request", (payload: unknown) => {
      const request = toRoomJoinRequestPayload(payload);
      if (!request) return;
      if (request.roomId !== activeRoomId) return;

      eventBus.emit("room:join-request", request);
    });

    /* ---------- Disconnect ---------- */
    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      isConnecting = false;
      hasSnapshot = false;
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connection error:", err);
      isConnecting = false;
      hasSnapshot = false;
      eventBus.emit("room:error", {
        roomId: activeRoomId ?? undefined,
        code: "connection_error",
        message: "Unable to connect to realtime server",
      });
    });

    /* ---------- Filesystem ---------- */
    socket.on("fs:snapshot", (p: unknown) => {
      const snapshot = toFSSnapshotPayload(p);
      if (!snapshot) return;
      if (snapshot.roomId !== activeRoomId) return;

      eventBus.emit("fs:snapshot", snapshot);
    });

    socket.on("fs:create", (p: unknown) => {
      const created = toFSNodeEventPayload(p);
      if (!created) return;
      if (created.roomId && created.roomId !== activeRoomId) return;

      eventBus.emit("fs:create", created.node);
    });

    socket.on("fs:rename", (p: unknown) => {
      const renamed = toFSNodeEventPayload(p);
      if (!renamed) return;
      if (renamed.roomId && renamed.roomId !== activeRoomId) return;

      eventBus.emit("fs:rename", renamed.node);
    });

    socket.on("fs:delete", (p: unknown) => {
      const del = toFSDeleteEventPayload(p);
      if (!del) return;
      eventBus.emit("fs:delete", { id: del.id });
    });

    /* ---------- Presence ---------- */
    socket.on("presence:update", (p: unknown) => {
      const snapshot = toPresenceSnapshotPayload(p);
      if (!snapshot) return;
      if (snapshot.roomId !== activeRoomId) return;

      eventBus.emit("presence:update", snapshot);
    });

    socket.on("presence:join", (p: unknown) => {
      const joined = toPresenceUserPayload(p);
      if (!joined) return;
      if (joined.roomId && joined.roomId !== activeRoomId) return;

      eventBus.emit("presence:join", joined.user);
    });

    socket.on("presence:leave", (p: unknown) => {
      const left = toPresenceLeavePayload(p);
      if (!left) return;
      if (left.roomId && left.roomId !== activeRoomId) return;

      eventBus.emit("presence:leave", { userId: left.userId });
    });

    /* ---------- Terminal ---------- */
    socket.on("terminal:session", (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const session = payload as {
        id?: string;
        roomId?: string;
        status?: "idle" | "starting" | "running" | "stopped" | "error";
      };

      if (
        typeof session.id !== "string" ||
        typeof session.roomId !== "string" ||
        typeof session.status !== "string"
      ) {
        return;
      }

      if (session.roomId !== activeRoomId) return;
      eventBus.emit("terminal:session", {
        id: session.id,
        roomId: session.roomId,
        status: session.status,
      });
    });

    socket.on("terminal:log", (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const log = payload as {
        id?: string;
        timestamp?: number;
        message?: string;
        type?: "stdout" | "stderr" | "system";
      };

      if (
        typeof log.id !== "string" ||
        typeof log.timestamp !== "number" ||
        typeof log.message !== "string" ||
        (log.type !== "stdout" && log.type !== "stderr" && log.type !== "system")
      ) {
        return;
      }

      eventBus.emit("terminal:log", {
        id: log.id,
        timestamp: log.timestamp,
        message: log.message,
        type: log.type,
      });
    });

    /* ---------- Collab chat ---------- */
    socket.on("collab:message", (payload: unknown) => {
      const message = toCollabMessagePayload(payload);
      if (!message) return;
      if (message.roomId !== activeRoomId) return;

      eventBus.emit("collab:message", message);
    });

    socket.on("collab:history", (payload: unknown) => {
      const history = toCollabHistoryPayload(payload);
      if (!history) return;
      if (history.roomId !== activeRoomId) return;

      eventBus.emit("collab:history", history);
    });
  }

  /* ---------- If already connected ---------- */
  emitJoinIfReady();

  isConnecting = false;
}

export function disconnect(roomId: string) {
  const socket = getSocket();

  if (socket.connected && activeRoomId === roomId) {
    socket.emit("room:leave", { roomId });
  }

  activeRoomId = null;
  activeUserId = null;
  activeUserName = null;
  activeUserEmail = null;
  hasSnapshot = false;

  eventBus.emit("room:left", { roomId });
}

export function hasRoomSnapshot(): boolean {
  return hasSnapshot;
}

export function isConnected(): boolean {
  return getSocket().connected;
}

export function getActiveRoomId(): string | null {
  return activeRoomId;
}
