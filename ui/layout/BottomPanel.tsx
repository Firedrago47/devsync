"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import TerminalPanel from "@/features/terminal/TerminalPanel";
import { useTerminalStore } from "@/features/terminal/terminal.store";

type BottomTab = "terminal" | "problems" | "output";

export default function BottomPanel() {
  const [tab, setTab] = useState<BottomTab>("terminal");
  const { logs } = useTerminalStore();
  const problemLogs = useMemo(
    () => logs.filter((log) => log.type === "stderr"),
    [logs]
  );
  const outputLogs = useMemo(
    () => logs.filter((log) => log.type !== "system"),
    [logs]
  );

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-neutral-300 dark:border-[#2d2d2d] bg-[#f3f3f3] dark:bg-[#1e1e1e]">
      <div className="flex h-9 items-center border-b border-neutral-300 dark:border-[#2d2d2d] px-1 text-xs">
        {(["terminal", "problems", "output"] as BottomTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "h-full border-b border-transparent px-3 text-neutral-500 dark:text-[#969696]",
              tab === t
                ? "border-neutral-500 dark:border-neutral-400 bg-white dark:bg-[#252526] text-neutral-900 dark:text-[#ffffff]"
                : "hover:bg-neutral-200 dark:hover:bg-[#252526] hover:text-neutral-700 dark:hover:text-[#d4d4d4]"
            )}
          >
            {t === "problems" ? `PROBLEMS (${problemLogs.length})` : t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "terminal" && <TerminalPanel />}
        {tab === "problems" && (
          <div className="h-full overflow-auto px-3 py-2 font-mono text-[12.5px] text-neutral-700 dark:text-[#d4d4d4]">
            {problemLogs.length === 0 ? (
              <div className="text-neutral-500 dark:text-[#808080]">No problems have been detected.</div>
            ) : (
              <div className="space-y-1">
                {problemLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[64px_1fr] gap-2">
                    <span className="text-neutral-500 dark:text-[#808080]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="whitespace-pre-wrap break-words text-neutral-700 dark:text-[#d4d4d4]">
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "output" && (
          <div className="h-full overflow-auto px-3 py-2 font-mono text-[12.5px] text-neutral-700 dark:text-[#d4d4d4]">
            {outputLogs.length === 0 ? (
              <div className="text-neutral-500 dark:text-[#808080]">No output yet.</div>
            ) : (
              <div className="space-y-1">
                {outputLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[64px_1fr] gap-2">
                    <span className="text-neutral-500 dark:text-[#808080]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={cn(
                        "whitespace-pre-wrap break-words",
                        log.type === "stderr"
                          ? "text-neutral-700 dark:text-[#d4d4d4]"
                          : "text-neutral-700 dark:text-[#d4d4d4]"
                      )}
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
