import type { FSNode } from "@/features/collaboration/filesystem/fs.types";
import type { PresenceUser } from "@/features/collaboration/presence/presence.types";
import type {
  Room,
  RoomMember,
  RoomJoinRequest,
} from "@/features/rooms/room.types";

export interface RoomCreatePayload {
  name: string;
  userId: string;
}

export interface RoomJoinPayload {
  roomId: string;
  userId: string;
}

export interface RoomLeavePayload {
  roomId: string;
}

export interface RoomCreatedPayload {
  roomId: string;
}

export interface RoomSnapshotPayload {
  roomId: string;
  room: Room;
  members: RoomMember[];
  tree: FSNode[];
}

export interface RoomErrorPayload {
  roomId?: string;
  message: string;
  code?: string;
}

export type RoomJoinRequestPayload = RoomJoinRequest;

export interface FSCreatePayload {
  roomId: string;
  parentId: string | null;
  name: string;
  type: "file" | "folder";
}

export interface FSRenamePayload {
  roomId: string;
  id: string;
  name: string;
}

export interface FSDeletePayload {
  roomId: string;
  id: string;
}

export interface AwarenessUpdatePayload {
  roomId: string;
  fileId: string;
  clientId: number;
  state: Record<string, unknown> | null;
}

export interface YjsJoinPayload {
  roomId: string;
  fileId: string;
}

export interface YjsUpdatePayload {
  roomId: string;
  fileId: string;
  update: number[] | Uint8Array;
}

export interface PresenceUserEventPayload {
  roomId?: string;
  user: PresenceUser;
}

export interface PresenceLeaveEventPayload {
  roomId?: string;
  userId: string;
}

export type CollabMessageChannel = "room" | "mentor";
export type CollabSenderRole = "member" | "mentor" | "mentee";

export interface CollabMessagePayload {
  id: string;
  roomId: string;
  channel: CollabMessageChannel;
  senderId: string;
  senderName: string;
  senderRole: CollabSenderRole;
  text: string;
  timestamp: number;
}

export interface CollabHistoryPayload {
  roomId: string;
  messages: CollabMessagePayload[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

export function toRoomErrorPayload(payload: unknown): RoomErrorPayload {
  if (typeof payload === "string") {
    return { message: payload };
  }

  if (!isRecord(payload)) {
    return { message: "Unknown room error" };
  }

  const message =
    typeof payload.message === "string"
      ? payload.message
      : typeof payload.error === "string"
        ? payload.error
        : "Unknown room error";

  return {
    roomId: typeof payload.roomId === "string" ? payload.roomId : undefined,
    code: typeof payload.code === "string" ? payload.code : undefined,
    message,
  };
}

export function toRoomJoinRequestPayload(
  payload: unknown
): RoomJoinRequestPayload | null {
  if (!isRecord(payload)) return null;

  const requestRaw =
    isRecord(payload.request)
      ? payload.request
      : payload;

  if (
    typeof requestRaw.roomId !== "string" ||
    typeof requestRaw.userId !== "string" ||
    typeof requestRaw.name !== "string"
  ) {
    return null;
  }

  return {
    roomId: requestRaw.roomId,
    userId: requestRaw.userId,
    name: requestRaw.name,
    email:
      typeof requestRaw.email === "string"
        ? requestRaw.email
        : undefined,
    requestedAt:
      typeof requestRaw.requestedAt === "number"
        ? requestRaw.requestedAt
        : Date.now(),
  };
}

export function toYjsUpdatePayload(payload: unknown): YjsUpdatePayload | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.roomId !== "string") return null;
  if (typeof payload.fileId !== "string") return null;

  const update = payload.update;
  if (
    !(update instanceof Uint8Array) &&
    !(
      Array.isArray(update) &&
      update.every((value) => typeof value === "number")
    )
  ) {
    return null;
  }

  return {
    roomId: payload.roomId,
    fileId: payload.fileId,
    update,
  };
}

function toUpdatedAt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

export function toFSNode(payload: unknown): FSNode | null {
  if (!isRecord(payload)) return null;
  if (
    typeof payload.id !== "string" ||
    typeof payload.name !== "string" ||
    (payload.type !== "file" && payload.type !== "folder")
  ) {
    return null;
  }

  return {
    id: payload.id,
    name: payload.name,
    type: payload.type,
    parentId:
      typeof payload.parentId === "string" || payload.parentId === null
        ? payload.parentId
        : null,
    path: typeof payload.path === "string" ? payload.path : payload.name,
    updatedAt: toUpdatedAt(payload.updatedAt),
  };
}

export function toFSNodeEventPayload(
  payload: unknown
): { roomId?: string; node: FSNode } | null {
  const direct = toFSNode(payload);
  if (direct) {
    return { node: direct };
  }

  if (!isRecord(payload)) return null;
  const node = toFSNode(payload.node);
  if (!node) return null;

  return {
    roomId: typeof payload.roomId === "string" ? payload.roomId : undefined,
    node,
  };
}

export function toFSSnapshotPayload(
  payload: unknown
): { roomId: string; nodes: FSNode[] } | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.roomId !== "string") return null;
  if (!Array.isArray(payload.nodes)) return null;

  const nodes = payload.nodes
    .map((node) => toFSNode(node))
    .filter((node): node is FSNode => node !== null);

  return {
    roomId: payload.roomId,
    nodes,
  };
}

export function toFSDeleteEventPayload(
  payload: unknown
): { roomId?: string; id: string } | null {
  if (!isRecord(payload) || typeof payload.id !== "string") return null;

  return {
    roomId: typeof payload.roomId === "string" ? payload.roomId : undefined,
    id: payload.id,
  };
}

export function toPresenceUserPayload(
  payload: unknown
): PresenceUserEventPayload | null {
  if (!isRecord(payload)) return null;

  const userRaw =
    isRecord(payload.user)
      ? payload.user
      : payload;

  if (
    typeof userRaw.userId !== "string" ||
    typeof userRaw.name !== "string" ||
    typeof userRaw.color !== "string"
  ) {
    return null;
  }

  return {
    roomId: typeof payload.roomId === "string" ? payload.roomId : undefined,
    user: {
      userId: userRaw.userId,
      name: userRaw.name,
      color: userRaw.color,
      cursor: userRaw.cursor ?? null,
      online:
        typeof userRaw.online === "boolean"
          ? userRaw.online
          : true,
      lastSeen:
        typeof userRaw.lastSeen === "number"
          ? userRaw.lastSeen
          : Date.now(),
    },
  };
}

export function toPresenceSnapshotPayload(
  payload: unknown
): { roomId: string; users: PresenceUser[] } | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.roomId !== "string") return null;
  if (!Array.isArray(payload.users)) return null;

  const users = payload.users
    .map((user) => toPresenceUserPayload(user))
    .filter((user): user is PresenceUserEventPayload => user !== null)
    .map((entry) => entry.user);

  return {
    roomId: payload.roomId,
    users,
  };
}

export function toPresenceLeavePayload(
  payload: unknown
): PresenceLeaveEventPayload | null {
  if (!isRecord(payload) || typeof payload.userId !== "string") return null;

  return {
    roomId: typeof payload.roomId === "string" ? payload.roomId : undefined,
    userId: payload.userId,
  };
}

export function toCollabMessagePayload(
  payload: unknown
): CollabMessagePayload | null {
  if (!isRecord(payload)) return null;

  if (
    typeof payload.id !== "string" ||
    typeof payload.roomId !== "string" ||
    (payload.channel !== "room" && payload.channel !== "mentor") ||
    typeof payload.senderId !== "string" ||
    typeof payload.senderName !== "string" ||
    (payload.senderRole !== "member" &&
      payload.senderRole !== "mentor" &&
      payload.senderRole !== "mentee") ||
    typeof payload.text !== "string"
  ) {
    return null;
  }

  const text = payload.text.trim();
  if (!text) return null;

  return {
    id: payload.id,
    roomId: payload.roomId,
    channel: payload.channel,
    senderId: payload.senderId,
    senderName: payload.senderName,
    senderRole: payload.senderRole,
    text,
    timestamp:
      typeof payload.timestamp === "number" && Number.isFinite(payload.timestamp)
        ? payload.timestamp
        : Date.now(),
  };
}

export function toCollabHistoryPayload(
  payload: unknown
): CollabHistoryPayload | null {
  if (!isRecord(payload) || typeof payload.roomId !== "string") {
    return null;
  }

  if (!Array.isArray(payload.messages)) {
    return null;
  }

  const messages = payload.messages
    .map((message) => toCollabMessagePayload(message))
    .filter((message): message is CollabMessagePayload => message !== null);

  return {
    roomId: payload.roomId,
    messages,
  };
}
