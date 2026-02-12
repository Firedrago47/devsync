/* ===============================
   FILE: RoomShell.tsx
=============================== */

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

import ActivityBar from "@/ui/layout/ActivityBar";
import Sidebar from "@/ui/layout/Sidebar";
import BottomPanel from "@/ui/layout/BottomPanel";
import ToolsPanel from "@/ui/layout/ToolsPanel";
import Header from "@/ui/layout/Header";
import { startTerminal } from "@/features/terminal/terminal.service";

import EditorTabs from "@/features/editor/EditorTabs";
import CodeEditor from "@/features/editor/CodeEditor";

import { SidebarView } from "@/ui/layout/layout.types";
import { useRoomStore } from "./room.store";

interface RoomShellProps {
  roomId: string;
}

export default function RoomShell({ roomId }: RoomShellProps) {
  const room = useRoomStore((s) => s.room);
  const roomError = useRoomStore((s) => s.error);
  const isAwaitingRoleAssignment = useRoomStore(
    (s) => s.isAwaitingRoleAssignment
  );
  const awaitingRoleMessage = useRoomStore(
    (s) => s.awaitingRoleMessage
  );

  const [sidebarOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [toolsOpen] = useState(true);
  const [sidebarView, setSidebarView] =
    useState<SidebarView>("explorer");

  if (roomError) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-700 dark:text-neutral-300">
        {roomError}
      </div>
    );
  }

  if (isAwaitingRoleAssignment) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-700 dark:text-neutral-300">
        <Loader2 className="animate-spin text-neutral-500 dark:text-neutral-400" />
        <p className="text-sm">Waiting for role assignment</p>
        <p className="text-xs text-neutral-600 dark:text-neutral-500">
          {awaitingRoleMessage ?? "The room owner needs to assign your access role before you can enter."}
        </p>
      </div>
    );
  }

  // Defensive guard
  if (!room) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-500 dark:text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-neutral-100 dark:bg-[#1e1e1e] text-neutral-800 dark:text-neutral-200">
      <Header
        title={room.name}
        roomId={roomId}
        onRunProject={() => {
          setBottomOpen(true);
          startTerminal(roomId);
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ActivityBar
            active={sidebarView}
            onSelect={setSidebarView}
          />

          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={18} maxSize={25}>
                <Sidebar
                  view={sidebarView}
                  roomId={roomId}
                  projectName={room.name}
                />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          <ResizablePanel minSize={40}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel minSize={40}>
                <EditorTabs />
                <CodeEditor roomId={roomId} />
              </ResizablePanel>

              {bottomOpen && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={25}>
                    <BottomPanel />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {toolsOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={22}>
                <ToolsPanel roomId={roomId} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
