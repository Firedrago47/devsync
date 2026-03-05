import type { ReactNode } from "react";
import { Toaster } from "sonner";

interface RoomLayoutProps {
  children: ReactNode;
  params: Promise<{
    roomId: string;
  }>;
}

export default async function RoomLayout({
  children,
  params,
}: RoomLayoutProps) {
  const { roomId } = await params;

  return (
    <div
      className="h-screen w-screen bg-[#1e1e1e] text-neutral-200 overflow-hidden"
      data-room-id={roomId}
    >
      <Toaster />
      {children}
    </div>
  );
}
