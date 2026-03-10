"use client";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Brain,
  ClipboardCopy,
  Moon,
  Play,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface HeaderProps {
  title: string;
  roomId: string;
  onRunProject?: () => void;
  onAnalyzeCodebase?: () => void;
  isAnalyzingCodebase?: boolean;
}

export default function Header({
  title,
  roomId,
  onRunProject,
  onAnalyzeCodebase,
  isAnalyzingCodebase = false,
}: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const handleCopyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied to clipboard!");
  };

  const shortRoomId = roomId?.slice(0, 6);

  return (
    <div className="h-10 flex items-center justify-between px-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800 text-sm">
      <div className="flex items-center gap-2">
        {/* <Button size="icon" variant="ghost" onClick={onToggleSidebar}>
          <Menu className="w-4 h-4" />
        </Button> */}

        <span className="font-semibold text-neutral-800 dark:text-neutral-100">Room: {title}</span>

        {shortRoomId && (
          <span className="ml-2 px-2 bg-neutral-200 dark:bg-neutral-700 text-xs rounded text-neutral-700 dark:text-neutral-300">
            #{shortRoomId}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onAnalyzeCodebase}
              variant="secondary"
              size="sm"
              disabled={isAnalyzingCodebase}
              className="text-xs bg-neutral dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
            >
              <Brain size={12} />
              <span className="hidden sm:inline">
                {isAnalyzingCodebase ? "Analyzing..." : "Analyze"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Analyze codebase from file tree
          </TooltipContent>
        </Tooltip>
        <Toggle
          pressed={resolvedTheme === "dark"}
          onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
          aria-label="Toggle theme"
          className="h-8 w-8 bg-neutral dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          {resolvedTheme === "dark" ? (
            <Sun size={14} />
          ) : (
            <Moon size={14} />
          )}
        </Toggle>


        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onRunProject}
              variant="secondary"
              size="sm"
              className="text-xs bg-neutral dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
            >
              <Play size={10} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Run Project</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleCopyRoomId}
              variant="secondary"
              size="sm"
              className="text-xs bg-neutral dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
            >
              <ClipboardCopy size={8} className="" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Copy Room ID</TooltipContent>
        </Tooltip>

        {/* <Button size="icon" variant="ghost" onClick={onToggleBottomPanel}>
          <PanelBottom className="w-4 h-4" />
        </Button>

        <Button size="icon" variant="ghost" onClick={onToggleTools}>
          <Terminal className="w-4 h-4" />
        </Button> */}
      </div>
    </div>
  );
}
