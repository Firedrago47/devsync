"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Sparkles } from "lucide-react";
import AIReviewPanel from "@/features/tools/AiReview";
import AIChatPanel from "@/features/tools/AiChat";

type ToolTab = "chat" | "review";

interface ToolsPanelProps {
  roomId: string;
}

export default function ToolsPanel({ roomId: _roomId }: ToolsPanelProps) {
  const [tab, setTab] = useState<ToolTab>("chat");

  return (
    <div className="h-full flex flex-col bg-neutral-100 dark:bg-neutral-900 border-l border-neutral-300 dark:border-neutral-800 text-sm">
      <div className="h-8 flex items-center justify-around border-b border-neutral-300 dark:border-neutral-800">
        <Tab
          icon={MessageSquare}
          label="Chat"
          active={tab === "chat"}
          onClick={() => setTab("chat")}
        />
        <Tab
          icon={Sparkles}
          label="Review"
          active={tab === "review"}
          onClick={() => setTab("review")}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "chat" && (
          <div className="p-3">
            <AIChatPanel />
          </div>
        )}

        {tab === "review" && (
          <div className="p-3">
            <AIReviewPanel />
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-full flex items-center justify-center gap-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800",
        active && "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
