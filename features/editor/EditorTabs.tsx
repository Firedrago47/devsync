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
    <div className="h-8 flex border-b border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 overflow-x-auto">
      {files.map((file) => {
        const isActive = file.fileId === activeFileId;
        
        return (
          <div
            key={file.fileId}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-r border-neutral-300 dark:border-neutral-800 min-w-fit transition-colors",
              "hover:bg-neutral-200 dark:hover:bg-neutral-800",
              isActive  
                ? "bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white"
                : "text-neutral-600 dark:text-neutral-400"
            )}
            onClick={() => setActiveFile(file.fileId)}
          >
            <span className="truncate max-w-[140px]">
              {file.name}
            </span>

            <button
              className={cn(
                "flex items-center justify-center w-4 h-4 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700",
                "text-neutral-500 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
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
