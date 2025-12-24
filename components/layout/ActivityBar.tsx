'use client';

import React from 'react';
import {
  Folder,
  Terminal,
  Eye,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Props = {
  onSelect: (panel: 'explorer' | 'terminal' | 'preview') => void;
  active: 'explorer' | 'terminal' | 'preview';
};

const ActivityBar: React.FC<Props> = ({ onSelect, active }) => {
  const icons = [
    { id: 'explorer', icon: Folder, label: 'Explorer' },
    { id: 'terminal', icon: Terminal, label: 'Terminal' },
    { id: 'preview', icon: Eye, label: 'Preview' },
  ] as const;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full w-12 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-3 space-y-4">
        {icons.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSelect(id)}
                className={`w-10 h-10 rounded-md transition-colors duration-200
                  ${
                    active === id
                      ? 'bg-neutral-700 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
              >
                <Icon size={20} />
              </Button>
            </TooltipTrigger>

            <TooltipContent
              side="right"
              className="bg-neutral-800 text-white text-xs px-2 py-1 rounded shadow-lg"
            >
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default ActivityBar;
