"use client";

import { useEffect, useRef } from "react";
import { connect, disconnect } from "./client/connection";

import { registerPresenceHandlers } from "./presence/presence.handlers";
import { registerFSHandlers } from "./filesystem/fs.handlers";
import { registerTerminalHandlers } from "@/features/terminal/terminal.handlers";
import { useRoomSnapshot } from "../rooms/room.hooks";

interface CollaborationProviderProps {
  roomId: string;
  userId: string;
  children: React.ReactNode;
}

/**
 * Authoritative collaboration lifecycle owner
 *
 * Guarantees:
 * - Snapshot is never missed
 * - StrictMode safe
 * - Handlers registered exactly once
 */
export default function CollaborationProvider({
  roomId,
  userId,
  children,
}: CollaborationProviderProps) {
  const joinedRef = useRef(false);
  const handlersRegisteredRef = useRef(false);
  const unregisterPresenceRef = useRef<(() => void) | null>(null);
  const unregisterFSRef = useRef<(() => void) | null>(null);
  const unregisterTerminalRef = useRef<(() => void) | null>(null);

  // IMPORTANT: subscribe FIRST
  useRoomSnapshot(roomId);

  useEffect(() => {
    // Register handlers before connect to avoid missing early fs/presence events.
    if (!handlersRegisteredRef.current) {
      unregisterPresenceRef.current = registerPresenceHandlers(roomId);
      unregisterFSRef.current = registerFSHandlers(roomId);
      unregisterTerminalRef.current = registerTerminalHandlers(roomId);
      handlersRegisteredRef.current = true;
    }

    connect(roomId, userId);
    joinedRef.current = true;

    return () => {
      if (handlersRegisteredRef.current) {
        unregisterPresenceRef.current?.();
        unregisterFSRef.current?.();
        unregisterTerminalRef.current?.();
        unregisterPresenceRef.current = null;
        unregisterFSRef.current = null;
        unregisterTerminalRef.current = null;
        handlersRegisteredRef.current = false;
      }

      //  StrictMode-safe disconnect
      if (joinedRef.current) {
        disconnect(roomId);
        joinedRef.current = false;
      }
    };
  }, [roomId, userId]);

  return <>{children}</>;
}
