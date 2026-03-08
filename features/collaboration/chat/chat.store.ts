import { create } from "zustand";
import type { CollabMessagePayload } from "@/features/collaboration/client/socket.contract";

interface CollabChatState {
  messages: CollabMessagePayload[];
  addMessage: (message: CollabMessagePayload) => void;
  setMessages: (messages: CollabMessagePayload[]) => void;
  clear: () => void;
}

const MAX_MESSAGES = 300;

export const useCollabChatStore = create<CollabChatState>((set) => ({
  messages: [],

  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((item) => item.id === message.id)) {
        return state;
      }

      const next = [...state.messages, message];
      if (next.length <= MAX_MESSAGES) {
        return { messages: next };
      }

      return { messages: next.slice(next.length - MAX_MESSAGES) };
    }),

  setMessages: (messages) => {
    const deduped = new Map<string, CollabMessagePayload>();
    for (const message of messages) {
      deduped.set(message.id, message);
    }

    const list = [...deduped.values()];
    const trimmed =
      list.length <= MAX_MESSAGES
        ? list
        : list.slice(list.length - MAX_MESSAGES);

    set({ messages: trimmed });
  },

  clear: () => set({ messages: [] }),
}));
