'use client';

import React, { useState, useRef, useEffect } from 'react';
import Terminal from '../terminal/Terminal';
import Output from '../terminal/output';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

type BottomPanelProps = {
  isVisible: boolean;
  onResize?: (height: number) => void;
  logs: string[];
};

const BottomPanel: React.FC<BottomPanelProps> = ({
  isVisible,
  onResize,
  logs,
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'terminal'>('output');
  const panelRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !panelRef.current) return;
      const newHeight = window.innerHeight - e.clientY;
      onResize?.(Math.min(Math.max(newHeight, 140), 500));
    };

    const stopResize = () => (isResizing.current = false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [onResize]);

  if (!isVisible) return null;

  return (
    <div
      ref={panelRef}
      className="bg-[#1E1E1E] text-white flex flex-col border-t border-[#2D2D2D] shadow-[0_-1px_4px_rgba(0,0,0,0.4)]"
      style={{ height: '300px', minHeight: '140px', maxHeight: '500px' }}
    >
      {/* Resize Handle */}
      <div
        className="h-1 cursor-row-resize bg-[#2D2D2D] hover:bg-[#3E3E3E] transition-colors"
        onMouseDown={() => (isResizing.current = true)}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'output' | 'terminal')}
        className="flex flex-col flex-1"
      >
        <TabsList className="h-auto rounded-none bg-[#252526] border-b border-[#2D2D2D] p-0">
          {(['output', 'terminal'] as const).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={`px-5 py-2.5 text-sm capitalize font-medium rounded-none
                data-[state=active]:bg-[#1E1E1E]
                data-[state=active]:text-white
                data-[state=active]:border-t-2
                data-[state=active]:border-gray-400
                text-gray-400 hover:text-gray-200 hover:bg-[#2C2C2C]
              `}
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content */}
        <ScrollArea className="flex-1">
          <TabsContent value="output" className="m-0 h-full">
            <Output logs={logs} />
          </TabsContent>

          <TabsContent value="terminal" className="m-0 h-full">
            <Terminal />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default BottomPanel;
