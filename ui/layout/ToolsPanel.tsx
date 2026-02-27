"use client";

import AIReviewPanel from "@/features/tools/AiReview";

interface ToolsPanelProps {
  roomId: string;
}

export default function ToolsPanel({ roomId: _roomId }: ToolsPanelProps) {
  return (
    <div className="h-full flex flex-col bg-neutral-100 dark:bg-neutral-900 border-l border-neutral-300 dark:border-neutral-800 text-sm">

      {/* HEADER */}
      <div className="h-8 flex items-center px-3 border-b border-neutral-300 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
        AI Assistant
      </div>

      {/* AI PANEL */}
      <div className="flex-1 overflow-hidden">
        <div className="p-3 h-full">
          <AIReviewPanel />
        </div>
      </div>

    </div>
  );
} 