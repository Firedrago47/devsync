'use client';

import React, { useState } from 'react';
import Terminal from '../terminal/Terminal';
import Output from '../terminal/output';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

type BottomPanelProps = {
  logs: string[];
};

export default function BottomPanel({ logs }: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<'output' | 'terminal'>('output');

  return (
    <div className="h-full bg-[#1E1E1E] text-white flex flex-col border-t border-[#2D2D2D]">
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'output' | 'terminal')}
        className="flex flex-col flex-1"
      >
        <TabsList className="rounded-none bg-[#252526] border-b border-[#2D2D2D] p-0">
          {(['output', 'terminal'] as const).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="px-5 py-2.5 text-sm capitalize font-medium rounded-none
                text-gray-400 hover:text-gray-200 hover:bg-[#2C2C2C]
                data-[state=active]:bg-[#1E1E1E]
                data-[state=active]:text-white
                data-[state=active]:border-t-2
                data-[state=active]:border-gray-400
              "
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
}
