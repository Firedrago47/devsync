"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Sparkles,
  SendHorizontal,
  Wand2,
  Bug,
  ShieldCheck,
  AlertTriangle,
  Info,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEditorContext } from "@/state/editorContext";

/* ================= TYPES ================= */

type Tab = "chat" | "review";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ReviewItem = {
  id: string;
  severity: "error" | "warning" | "info";
  category: "bug" | "security" | "performance" | "style";
  message: string;
  confidence: "low" | "medium" | "high";
};

type Filter = "all" | "error" | "warning" | "info";

/* ================= ICONS ================= */

const iconByCategory = {
  bug: <Bug className="h-4 w-4 text-neutral-500" />,
  security: <ShieldCheck className="h-4 w-4 text-neutral-500" />,
  performance: <AlertTriangle className="h-4 w-4 text-neutral-500" />,
  style: <Info className="h-4 w-4 text-neutral-500" />,
};

const severityStyle: Record<ReviewItem["severity"], string> = {
  error: "border-l-red-500 bg-neutral-100 dark:bg-neutral-900/70",
  warning: "border-l-yellow-500 bg-neutral-100 dark:bg-neutral-900/70",
  info: "border-l-blue-500 bg-neutral-100 dark:bg-neutral-900/70",
};

const REVIEW_STEPS = [
  "Preparing selected code context",
  "Running static pattern checks",
  "Asking AI for issue analysis",
  "Scoring severity and confidence",
  "Formatting final suggestions",
];

/* ================= MAIN ================= */

export default function AIReviewPanel() {
  const [tab, setTab] = useState<Tab>("chat");

  /* CHAT */
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  /* REVIEW */
  const [filter, setFilter] = useState<Filter>("all");
  const [results, setResults] = useState<ReviewItem[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [reviewStepIndex, setReviewStepIndex] = useState(0);
  const reviewTimerRef = useRef<number | null>(null);

  const { fileName, code, range } = useEditorContext();

  useEffect(() => {
    return () => {
      if (reviewTimerRef.current) {
        window.clearInterval(reviewTimerRef.current);
      }
    };
  }, []);

  /* ================= CHAT STREAM ================= */

  async function handleSend() {
    const input = chatInput.trim();
    if (!input || chatLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);
    setChatError(null);

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

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let assistantText = "";
      const assistantId = crypto.randomUUID();

      setChatMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantText += chunk;

        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantText } : m
          )
        );
      }
    } catch (err) {
      console.error(err);
      setChatError("AI stream failed");
    } finally {
      setChatLoading(false);
    }
  }

  /* ================= REVIEW ================= */

  const filtered = results.filter(
    (i) => filter === "all" || i.severity === filter
  );

  async function handleRunReview() {
    if (!fileName || !code?.trim() || !range) return;

    setReviewLoading(true);
    setResults([]);
    setReviewError(null);
    setHasRun(true);
    setReviewStepIndex(0);

    reviewTimerRef.current = window.setInterval(() => {
      setReviewStepIndex((prev) =>
        prev >= REVIEW_STEPS.length - 1 ? prev : prev + 1
      );
    }, 1100);

    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "selection",
          file: fileName,
          language: "auto",
          code,
          range,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setReviewError(data?.error || "AI review failed");
        return;
      }

      if (data.success) {
        setReviewStepIndex(REVIEW_STEPS.length - 1);
        setResults(
          data.results.map((r: ReviewItem, i: number) => ({
            ...r,
            id: String(i),
          }))
        );
      }
    } catch {
      setReviewError("Network error");
    } finally {
      if (reviewTimerRef.current) {
        window.clearInterval(reviewTimerRef.current);
        reviewTimerRef.current = null;
      }
      setReviewLoading(false);
    }
  }

  const canReview = Boolean(fileName && code?.trim() && range);

  /* ================= UI ================= */

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">

      {/* TAB HEADER */}
      <div className="border-b border-neutral-300 dark:border-neutral-800 flex">
        <TabBtn icon={MessageSquare} label="Chat" active={tab==="chat"} onClick={()=>setTab("chat")} />
        <TabBtn icon={Sparkles} label="Review" active={tab==="review"} onClick={()=>setTab("review")} />
      </div>

      {/* ================= CHAT ================= */}
      {tab === "chat" && (
        <>
          <ScrollArea className="flex-1 min-h-0 p-3 space-y-2">
            {chatMessages.length === 0 && (
              <div className="text-center text-sm text-neutral-500 mt-10">
                Start a conversation with AI.
              </div>
            )}

            {chatMessages.map((m) => (
              <div key={m.id} className={m.role==="user"?"flex justify-end":"flex justify-start"}>
                <div className={
                  m.role==="user"
                    ?"max-w-[85%] mb-2 rounded-lg bg-neutral-800 text-white px-3 py-2 text-sm"
                    :"max-w-[85%] mb-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm whitespace-pre-wrap"
                }>
                  {m.content}
                </div>
              </div>
            ))}

            {chatLoading && <div className="text-xs text-neutral-500">Thinking...</div>}
            {chatError && <div className="text-xs text-red-500">{chatError}</div>}
          </ScrollArea>

          <div className="border-t border-neutral-300 dark:border-neutral-800 p-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e)=>setChatInput(e.target.value)}
              onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
              placeholder="Ask AI..."
              className="flex-1 h-9 rounded-md border px-3 text-sm bg-white dark:bg-neutral-900"
            />
            <Button size="sm" onClick={handleSend} disabled={chatLoading || !chatInput.trim()}>
              <SendHorizontal className="h-4 w-4"/>
            </Button>
          </div>
        </>
      )}

      {/* ================= REVIEW ================= */}
      {tab === "review" && (
        <>
          <div className="border-b border-neutral-300 dark:border-neutral-800 p-3 flex justify-between">
            <div className="text-sm text-neutral-500">
              {fileName && range ? `${fileName} (${range.startLine}-${range.endLine})` : "Select code to review"}
            </div>
            <Button size="sm" onClick={handleRunReview} disabled={!canReview || reviewLoading}>
              <Wand2 className="h-4 w-4 mr-1"/>
              {reviewLoading?"Reviewing":"Review"}
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0 p-3 space-y-2">
            {reviewError && <div className="text-sm text-red-500">{reviewError}</div>}

            {reviewLoading && (
              <div className="rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                  <span className="text-sm font-medium">
                    Reviewing code with AI...
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-neutral-500 transition-all duration-500"
                    style={{
                      width: `${((reviewStepIndex + 1) / REVIEW_STEPS.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="space-y-2">
                  {REVIEW_STEPS.map((step, index) => {
                    const done = index < reviewStepIndex;
                    const active = index === reviewStepIndex;

                    return (
                      <div key={step} className="flex items-center gap-2 text-xs">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-neutral-500" />
                        ) : active ? (
                          <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-neutral-300 dark:border-neutral-700" />
                        )}
                        <span
                          className={
                            done || active
                              ? "text-neutral-700 dark:text-neutral-200"
                              : "text-neutral-500"
                          }
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!reviewLoading && filtered.map(item=>(
              <div key={item.id} className={`rounded-lg border border-l-4 p-3 ${severityStyle[item.severity]}`}>
                <div className="flex gap-3">
                  {iconByCategory[item.category]}
                  <div>
                    <div className="text-sm">{item.message}</div>
                    <div className="flex gap-1 mt-2">
                      <Badge variant="outline">{item.severity}</Badge>
                      <Badge variant="outline">{item.category}</Badge>
                      <Badge variant="outline">{item.confidence}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {!reviewLoading && hasRun && results.length===0 && (
              <div className="text-sm text-neutral-500">No issues found.</div>
            )}
          </ScrollArea>
        </>
      )}
    </div>
  );
}

/* TAB BUTTON */
function TabBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 h-9 flex items-center justify-center gap-2 text-xs cursor-pointer transition-colors",
        active
          ?"bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white"
          :"text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
      )}
    >
      <Icon className="w-4 h-4"/>
      {label}
    </button>
  );
}
