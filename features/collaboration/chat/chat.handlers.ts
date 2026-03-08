import { eventBus } from "@/features/collaboration/client/event-bus";
import { useCollabChatStore } from "./chat.store";

export function registerCollabChatHandlers(roomId: string) {
  const store = useCollabChatStore.getState();

  const offHistory = eventBus.on("collab:history", (payload) => {
    if (payload.roomId !== roomId) return;
    store.setMessages(payload.messages);
  });

  const offMessage = eventBus.on("collab:message", (message) => {
    if (message.roomId !== roomId) return;
    store.addMessage(message);
  });

  const offLeave = eventBus.on("room:left", () => {
    store.clear();
  });

  return () => {
    offHistory();
    offMessage();
    offLeave();
  };
}
