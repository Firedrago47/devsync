import { getSocket } from "@/features/collaboration/client/socket";
import type {
  CollabMessageChannel,
  CollabMessagePayload,
  CollabSenderRole,
} from "@/features/collaboration/client/socket.contract";
import { useCollabChatStore } from "./chat.store";

interface SendCollabMessageInput {
  roomId: string;
  channel: CollabMessageChannel;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: CollabSenderRole;
}

export function sendCollabMessage(input: SendCollabMessageInput) {
  const text = input.text.trim();
  if (!text) return;

  const message: CollabMessagePayload = {
    id: crypto.randomUUID(),
    roomId: input.roomId,
    channel: input.channel,
    senderId: input.senderId,
    senderName: input.senderName.trim() || "Anonymous",
    senderRole: input.senderRole,
    text,
    timestamp: Date.now(),
  };

  // Optimistic local append, then sync through socket broadcast.
  useCollabChatStore.getState().addMessage(message);
  getSocket().emit("collab:message", message);
}
