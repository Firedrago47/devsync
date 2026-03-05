import RoomRouteClient from "@/features/rooms/RoomRouteClient";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <RoomRouteClient roomId={roomId} />;
}
