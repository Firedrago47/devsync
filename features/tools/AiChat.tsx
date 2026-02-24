"use client";

import { useState } from "react";
import { MessageSquare, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorContext } from "@/state/editorContext";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function AIChatPanel() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { fileName, code } = useEditorContext();

  async function handleSend() {
    const input = message.trim();
    if (!input || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          file: fileName ?? "editor.py",
          code: code ?? "",
          language: "python",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError(data?.error ?? "AI chat request failed");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: String(data.reply ?? "No reply from AI"),
        },
      ]);
    } catch (err) {
      console.error("AI chat failed", err);
      setError("Network error while calling AI chat");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950/70 shadow-inner">
      <div className="border-b border-neutral-300 dark:border-neutral-800 p-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          <MessageSquare className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          AI Chat
        </p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Ask coding questions about your current file.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-6 text-center text-sm text-neutral-500">
            Start a conversation with AI.
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-lg bg-neutral-800 text-neutral-100 px-3 py-2 text-sm"
                  : "max-w-[85%] rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 px-3 py-2 text-sm"
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Thinking...</div>
        )}

        {error && (
          <div className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-neutral-300 dark:border-neutral-800 p-3">
        <div className="flex items-center gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask AI about your code..."
            className="h-9 flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm outline-none focus:ring-1 focus:ring-neutral-400"
          />
          <Button
            size="sm"
            onClick={() => void handleSend()}
            disabled={loading || !message.trim()}
            className="h-9"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
