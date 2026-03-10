"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { SendHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useCollabChatStore } from "@/features/collaboration/chat/chat.store";
import { sendCollabMessage } from "@/features/collaboration/chat/chat.service";
import { cn } from "@/lib/utils";

interface CollabPanelProps {
  roomId: string;
}

export default function CollabPanel({ roomId }: CollabPanelProps) {
  const { data: session } = useSession();
  const messages = useCollabChatStore((s) => s.messages);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const filteredMessages = useMemo(
    () => messages.filter((message) => message.channel === "room"),
    [messages]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [filteredMessages.length]);

  const myUserId = session?.user?.id;
  const myName = session?.user?.name ?? "You";

  function handleSend() {
    if (!myUserId) return;
    if (!input.trim()) return;

    sendCollabMessage({
      roomId,
      channel: "room",
      text: input,
      senderId: myUserId,
      senderName: myName,
      senderRole: "member",
    });

    setInput("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/70">
      <div className="h-9 border-b border-neutral-300 dark:border-neutral-800 flex items-center px-3 text-xs text-neutral-500">
        Room Chat
      </div>

      <ScrollArea className="flex-1 min-h-0 p-3 space-y-2">
        {filteredMessages.length === 0 && (
          <div className="text-center text-sm text-neutral-500 mt-10">
            Start collaborating with your room members.
          </div>
        )}

        {filteredMessages.map((message) => {
          const isMine = message.senderId === myUserId;
          return (
            <div key={message.id} className={isMine ? "flex justify-end" : "flex justify-start"}>
              <div
                className={cn(
                  "max-w-[90%] mb-2 rounded border px-2 py-1 text-sm",
                  isMine
                    ? "bg-neutral-700 text-white border-neutral-800"
                    : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800"
                )}
              >
                <div
                  className={cn(
                    "mb-1 flex items-center gap-2 text-[9px]",
                    isMine ? "text-neutral-300" : "text-neutral-500"
                  )}
                >
                  <span className="font-sm">{message.senderName}</span>
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="whitespace-pre-wrap">{message.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </ScrollArea>

      <div className="border-t border-neutral-300 dark:border-neutral-800 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message the room..."
            className="flex-1 h-9 rounded-md border border-neutral-300 dark:border-neutral-700 px-3 text-sm bg-white dark:bg-neutral-900"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!myUserId || !input.trim()}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
