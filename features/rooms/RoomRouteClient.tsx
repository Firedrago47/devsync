"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import CollaborationProvider from "@/features/collaboration/collaboration.provider";
import RoomShellClient from "@/features/rooms/RoomShellClient";

interface RoomRouteClientProps {
  roomId: string;
}

export default function RoomRouteClient({ roomId }: RoomRouteClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!roomId) {
      router.replace("/dashboard");
      return;
    }

    if (status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [roomId, status, router]);

  if (!roomId) return null;

  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500">
        Loading room...
      </div>
    );
  }

  if (!session?.user?.id) {
    return null;
  }

  return (
    <CollaborationProvider
      roomId={roomId}
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
    >
      <RoomShellClient
        roomId={roomId}
        initialRoom={{
          id: roomId,
          name: "Loading room...",
          ownerId: session.user.id,
        }}
      />
    </CollaborationProvider>
  );
}
