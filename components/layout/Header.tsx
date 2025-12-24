'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Menu, ClipboardCopy, ChevronDown, Play } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type HeaderProps = {
  roomId?: string;
  title?: string;
  onToggleSidebar: () => void;
  onToggleBottomPanel: () => void;
  onRunCode?: () => void;
};

const Header: React.FC<HeaderProps> = ({
  title,
  onToggleSidebar,
  onToggleBottomPanel,
  onRunCode,
}) => {
  const params = useParams();
  const roomId = params?.id as string | undefined;

  const displayTitle = title ?? 'Untitled Project';

  const handleCopyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard!');
  };

  return (
    <TooltipProvider delayDuration={200}>
      <header className="h-12 px-4 flex items-center justify-between bg-neutral-900 border-b border-neutral-700">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="text-neutral-300 hover:text-white"
              >
                <Menu size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Sidebar</TooltipContent>
          </Tooltip>

          <h1 className="text-sm font-semibold truncate text-white">
            {displayTitle}
          </h1>

          {roomId && (
            <span className="ml-2 px-2 py-0.5 bg-neutral-700 text-xs rounded text-neutral-300">
              Room: {roomId.slice(0, 8)}…
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {roomId && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCopyRoomId}
                    variant="secondary"
                    size="sm"
                    className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                  >
                    <ClipboardCopy size={14} className="mr-1" />
                    Copy ID
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Copy Room ID</TooltipContent>
              </Tooltip>

              {onRunCode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onRunCode}
                      size="sm"
                      className="text-xs bg-green-600 hover:bg-green-500 text-white"
                    >
                      <Play size={14} className="mr-1" />
                      Run
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Run Code</TooltipContent>
                </Tooltip>
              )}
            </>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleBottomPanel}
                className="text-neutral-300 hover:text-white"
              >
                <ChevronDown size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Bottom Panel</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
};

export default Header;
