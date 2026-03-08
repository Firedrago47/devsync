import type {
  PresenceSnapshot,
  PresenceJoinPayload,
  PresenceLeavePayload,
} from "@/features/collaboration/presence/presence.types";

import type {
  TerminalSession,
  TerminalLog,
} from "@/features/terminal/terminal.store";

import type { FSNode } from "@/features/collaboration/filesystem/fs.types";
import type { Room, RoomMember } from "@/features/rooms/room.types";
import type {
  RoomErrorPayload,
  RoomJoinRequestPayload,
  CollabMessagePayload,
  CollabHistoryPayload,
} from "./socket.contract";

/* ---------- Room snapshot ---------- */
export interface RoomSnapshot {
  roomId: string;
  room: Room;
  members: RoomMember[];
  tree: FSNode[];
}

type EventMap = {
  /* -------- Room -------- */
  "room:snapshot": RoomSnapshot;
  "room:joined": { roomId: string };
  "room:left": { roomId: string };
  "room:error": RoomErrorPayload;
  "room:join-request": RoomJoinRequestPayload;

  /* -------- Filesystem -------- */
  "fs:snapshot": {
    roomId: string;
    nodes: FSNode[];
  };
  "fs:create": FSNode;
  "fs:rename": FSNode;
  "fs:delete": { id: string };

  /* -------- Presence -------- */
  "presence:update": PresenceSnapshot;
  "presence:join": PresenceJoinPayload;
  "presence:leave": PresenceLeavePayload;

  /* -------- Terminal -------- */
  "terminal:session": TerminalSession;
  "terminal:log": TerminalLog;

  /* -------- Collab chat -------- */
  "collab:message": CollabMessagePayload;
  "collab:history": CollabHistoryPayload;
};

type Handler<T> = (payload: T) => void;

class EventBus {
  private listeners = new Map<
    keyof EventMap,
    Set<Handler<unknown>>
  >();

  on<K extends keyof EventMap>(
    event: K,
    handler: Handler<EventMap[K]>
  ) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const castHandler = handler as unknown as Handler<unknown>;
    this.listeners.get(event)!.add(castHandler);

    return () => {
      this.listeners.get(event)?.delete(castHandler);
    };
  }

  emit<K extends keyof EventMap>(
    event: K,
    payload: EventMap[K]
  ) {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error(
          `Error in event handler for ${String(event)}`,
          err
        );
      }
    });
  }

  clear() {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
