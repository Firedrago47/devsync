import { eventBus } from "@/features/collaboration/client/event-bus";
import { useCollabChatStore } from "./chat.store";

export function registerCollabChatHandlers(roomId: string) {
  const store = useCollabChatStore.getState();

  const offMessage = eventBus.on("collab:message", (message) => {
    if (message.roomId !== roomId) return;
    store.addMessage(message);
  });

  const offLeave = eventBus.on("room:left", () => {
    store.clear();
  });

  return () => {
    offMessage();
    offLeave();
  };
}
