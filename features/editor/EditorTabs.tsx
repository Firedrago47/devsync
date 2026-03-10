// features/editor/EditorTabs.tsx

"use client";

import { useEditorStore } from "@/features/collaboration/editor/editor.store";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export default function EditorTabs() {
  const openFiles = useEditorStore((s) => s.openFiles);
  const activeFileId = useEditorStore((s) => s.activeFileId);
  const setActiveFile = useEditorStore((s) => s.setActiveFile);
  const closeFile = useEditorStore((s) => s.closeFile);

  const files = Object.values(openFiles);

  if (!files.length) return null;

  const handleCloseFile = (
    e: React.MouseEvent,
    fileId: string
  ) => {
    e.stopPropagation();
    closeFile(fileId);
  };

  return (
    <div className="h-9 flex items-end gap-1 overflow-x-auto border-b border-neutral-300 bg-neutral-100 px-3 dark:border-neutral-800 dark:bg-neutral-900">
      {files.map((file) => {
        const isActive = file.fileId === activeFileId;
        
        return (
          <div
            key={file.fileId}
            className={cn(
              "group flex h-8 min-w-0 max-w-[220px] cursor-pointer items-center gap-2 rounded border px-2 text-sm transition-all",
              isActive
                ? " border-t bg-white text-neutral-900 dark:border-t dark:bg-neutral-800 dark:text-white"
                : "border-transparent bg-neutral-200/50 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            )}
            onClick={() => setActiveFile(file.fileId)}
            title={file.name}
          >
            <span className="truncate text-[13px] leading-none">
              {file.name}
            </span>

            <button
              className={cn(
                "flex h-3 w-3 items-center justify-center rounded transition-colors",
                "hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
                isActive
                  ? "text-neutral-500 dark:text-neutral-400"
                  : "text-neutral-400 opacity-0 group-hover:opacity-100 dark:text-neutral-500"
              )}
              onClick={(e) => handleCloseFile(e, file.fileId)}
              aria-label="Close file"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
