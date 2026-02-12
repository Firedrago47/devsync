"use client";

import { useEffect, useRef } from "react";
import { useTerminalStore } from "./terminal.store";

export default function TerminalPanel() {
  const { logs } = useTerminalStore();
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!outputRef.current) return;
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f3f3f3] dark:bg-[#1e1e1e] text-neutral-700 dark:text-[#d4d4d4]">
      <div
        ref={outputRef}
        className="flex-1 overflow-auto px-3 py-2 font-mono text-[12.5px] leading-5"
      >
        {logs.length === 0 && (
          <div className="text-neutral-500 dark:text-[#808080]">No terminal output yet.</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="grid grid-cols-[64px_56px_1fr] gap-2">
            <span className="text-neutral-500 dark:text-[#808080]">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className="uppercase text-neutral-500 dark:text-[#9e9e9e]">
              {log.type}
            </span>
            <span className="whitespace-pre-wrap break-words">
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
