'use client';

import React from 'react';
import FileTree from '../file-explorer/FileTree';

import { ScrollArea } from '@/components/ui/scroll-area';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#252526] text-white border-r border-[#333] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#333]">
        <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Explorer
        </h2>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1 px-2 py-2">
        <FileTree />
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
