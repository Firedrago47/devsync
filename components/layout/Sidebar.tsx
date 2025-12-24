"use client";

import React, { useEffect, useRef, useState } from "react";
import FileTree from "../file-explorer/FileTree";
import { ScrollArea } from "@/components/ui/scroll-area";

type SidebarProps = { width: number };

export default function Sidebar({ width }: SidebarProps) {
 return(
  <div
    style={{ width }}
    className="bg-[#252526] text-white border-r border-[#333] flex flex-col"
  >
    <div className="px-4 py-3 border-b border-[#333]">
      <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
        Explorer
      </h2>
    </div>

    <ScrollArea className="flex-1 px-2 py-2">
      <FileTree />
    </ScrollArea>
  </div>
);
}
