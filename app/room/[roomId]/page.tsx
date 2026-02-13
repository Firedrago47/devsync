import { redirect } from "next/navigation";
import { getServerAuth } from "@/features/auth/getServerAuth";

import CollaborationProvider from "@/features/collaboration/collaboration.provider";
import RoomShellClient from "@/features/rooms/RoomShellClient";

const ROOM_FETCH_TIMEOUT_MS = 10000;

function getBackendUrl(): string | null {
  const url =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.NEXT_PUBLIC_WS_URL ??
    "";

  const trimmed = url.trim();
  return trimmed ? trimmed : null;
}

async function fetchRoom(roomId: string) {
  const backendUrl = getBackendUrl();
  if (!backendUrl) return null;

  try {
    const res = await fetch(`${backendUrl}/api/rooms/${roomId}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(ROOM_FETCH_TIMEOUT_MS),
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("fetchRoom failed", {
      roomId,
      backendUrl,
      timeoutMs: ROOM_FETCH_TIMEOUT_MS,
      error,
    });
    return null;
  }
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!roomId) redirect("/dashboard");

  const session = await getServerAuth();
  if (!session?.user?.id) redirect("/auth");

  const room = await fetchRoom(roomId);
  if (!room) redirect("/dashboard");

  return (
    <CollaborationProvider roomId={roomId} userId={session.user.id}>
      <RoomShellClient
        roomId={roomId}
        initialRoom={{
          id: room.id,
          name: room.name,
          ownerId: room.ownerId,
        }}
      />
    </CollaborationProvider>
  );
}
