"use client";

import { useState } from "react";
import AIReviewPanel from "@/features/tools/AiReview";
import CollabPanel from "@/features/tools/CollabPanel";
import { cn } from "@/lib/utils";
import { Bot, Group, User, User2, UserCheck, Users2 } from "lucide-react";

interface ToolsPanelProps {
  roomId: string;
}

type ToolSection = "ai" | "collab";

export default function ToolsPanel({ roomId }: ToolsPanelProps) {
  const [section, setSection] = useState<ToolSection>("ai");

  return (
    <div className="h-full flex flex-col bg-neutral-100 dark:bg-neutral-900 border-l border-neutral-300 dark:border-neutral-800 text-sm">
      <div className="h-9 grid grid-cols-2 border-b border-neutral-300 dark:border-neutral-800 text-xs">
        <button
          onClick={() => setSection("ai")}
          className={cn(
            "transition-colors cursor-pointer",
            section === "ai"
              ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          )}
        >
          <Bot className="h-4 w-4 mr-2 inline-block" />
          AI Assistant
        </button>
        <button
          onClick={() => setSection("collab")}
          className={cn(
            "transition-colors border-l border-neutral-300 dark:border-neutral-800 cursor-pointer",
            section === "collab"
              ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          )}
        >
          <Users2 className="h-4 w-4 mr-2 inline-block" />
          Collab
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-3 h-full">
          {section === "ai" ? <AIReviewPanel /> : <CollabPanel roomId={roomId} />}
        </div>
      </div>
    </div>
  );
}
