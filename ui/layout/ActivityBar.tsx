"use client";

import { Folder, GitBranch, Play, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarView } from "./layout.types";

interface ActivityBarProps {
  active: SidebarView;
  onSelect: (view: SidebarView) => void;
}

const items: { id: SidebarView; icon: React.ElementType }[] = [
  { id: "explorer", icon: Folder },
  { id: "collab", icon: Users },
  { id: "git", icon: GitBranch },
  { id: "run", icon: Play },
  { id: "settings", icon: Settings },
];

export default function ActivityBar({
  active,
  onSelect,
}: ActivityBarProps) {
  return (
    <div className="w-10 border-r border-neutral-300 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 flex flex-col items-center gap-1">
      {items.map(({ id, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded text-neutral-500 dark:text-neutral-400 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800",
            active === id &&
              "border-l border-neutral-500 bg-neutral-200 text-neutral-900 dark:border-neutral-400 dark:bg-neutral-800 dark:text-white"
          )}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}
