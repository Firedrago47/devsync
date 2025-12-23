"use client";

import { useParams } from "next/navigation";

import ActivityBar from "@/components/layout/ActivityBar";
import Sidebar from "@/components/layout/Sidebar";
import PreviewPanel from "@/components/layout/PreviewPanel";
import BottomPanel from "@/components/layout/BottomPanel";
import { io, Socket } from 'socket.io-client';

import EditorTabs from "@/components/editor/EditorTabs";
import CodeEditor from "@/components/editor/CodeEditor";
import CursorOverlay from "@/components/editor/CursorOverlay";
import Header from "@/components/layout/Header";
import { useEffect, useState } from "react";

export default function RoomPage() {
  const params = useParams();
  const roomId = params?.id as string;
  const [showSidebar, setShowSidebar] = useState(true);
    const [showBottomPanel, setShowBottomPanel] = useState(true);
    const [bottomHeight, setBottomHeight] = useState(200);
  
    const [code, setCode] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
  
    // Initialize Socket
    useEffect(() => {
      const newSocket = io('http://localhost:6969');
      setSocket(newSocket);
  
      newSocket.on('code-output', (output: string) => {
        setLogs((prev) => [...prev, output]);
      });
  
      return () => {
        newSocket.disconnect();
      };
    }, []);
  
    // Handle Run Button
    const handleRunCode = () => {
      if (!socket) return;
      setLogs([]); // reset logs before running
      socket.emit('run-code', { roomId, code });
    };

  if (!roomId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e] text-white">
        Initializing…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      <Header
        roomId={roomId}
        title="DevSync"
        onToggleSidebar={() => setShowSidebar((prev) => !prev)}
        onToggleBottomPanel={() => setShowBottomPanel((prev) => !prev)}
        onRunCode={handleRunCode}
      />
      <div className="flex flex-1">

      {/* Activity Bar */}
      <ActivityBar onSelect={() => {}} active="explorer" />

      {/* Sidebar */}
      {showSidebar && <Sidebar />}

      {/* Editor Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
          <EditorTabs />

          <div className="flex-1 overflow-hidden relative">
            {/* Editor */}
            <div
              className="absolute inset-0"
              style={{
                height: `calc(100% - ${showBottomPanel ? bottomHeight : 0}px)`,
              }}
            >
              <CodeEditor
                fileName="main.py"
                roomId={roomId}
                code={code}
                onChange={setCode}
                socket={socket}
              />
            </div>

            {/* Bottom Panel */}
            {showBottomPanel && (
              <div
                className="absolute bottom-0 left-0 right-0 border-t border-gray-700"
                style={{ height: bottomHeight }}
              >
                <BottomPanel
                  isVisible={true}
                  logs={logs}
                  onResize={(h) => setBottomHeight(h)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
