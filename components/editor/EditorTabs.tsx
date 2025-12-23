'use client';

import { X } from 'lucide-react';
import { useTabStore } from '@/state/tabState';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const EditorTabs = () => {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-11 items-center bg-zinc-800 border-b border-zinc-700 px-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            name={tab.name}
            isActive={tab.id === activeTabId}
            onActivate={() => setActiveTab(tab.id)}
            onClose={() => closeTab(tab.id)}
          />
        ))}
      </div>
    </TooltipProvider>
  );
};

type TabProps = {
  id: string;
  name: string;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
};

const Tab = ({ name, isActive, onActivate, onClose }: TabProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div
        onClick={onActivate}
        role="tab"
        aria-selected={isActive}
        title={name}
        className={`flex text-sm items-center px-3 py-1 mr-2 rounded cursor-pointer select-none transition-colors
          ${
            isActive
              ? 'bg-zinc-900 text-white border border-zinc-600'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
      >
        <span className="truncate max-w-[120px]">{name}</span>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-2 h-5 w-5 text-zinc-400 hover:text-red-400"
          aria-label={`Close ${name}`}
        >
          <X size={14} />
        </Button>
      </div>
    </TooltipTrigger>

    <TooltipContent side="bottom" className="max-w-xs truncate">
      {name}
    </TooltipContent>
  </Tooltip>
);

export default EditorTabs;
