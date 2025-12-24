"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import ActivityBar from "@/components/layout/ActivityBar";
import Sidebar from "@/components/layout/Sidebar";
import BottomPanel from "@/components/layout/BottomPanel";
import PreviewPanel from "@/components/layout/PreviewPanel";
import Header from "@/components/layout/Header";
import EditorTabs from "@/components/editor/EditorTabs";
import CodeEditor from "@/components/editor/CodeEditor";
import CursorOverlay from "@/components/editor/CursorOverlay";
import SplitHandle from "@/components/layout/SplitHandle";

/* ---------- Constants (VS Code–like) ---------- */
const SIDEBAR = { MIN: 150, MAX: 420, CLOSE: 120, DEFAULT: 256 };
const PREVIEW = { MIN: 150, MAX: 420, CLOSE: 120, DEFAULT: 256 };
const BOTTOM = { MIN: 140, MAX: 400, CLOSE: 100, DEFAULT: 200 };

export default function RoomPage() {
  const params = useParams();
  const roomId = params?.id as string;

  /* ---------- Layout State ---------- */
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR.DEFAULT);
  const [previewWidth, setPreviewWidth] = useState(PREVIEW.DEFAULT);
  const [bottomHeight, setBottomHeight] = useState(BOTTOM.DEFAULT);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);

  /* ---------- Resize Flags ---------- */
  const resizing = useRef<"sidebar" | "preview" | "bottom" | null>(null);

  /* ---------- Global Resize Engine ---------- */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      /* Sidebar */
      if (resizing.current === "sidebar") {
        if (e.clientX < SIDEBAR.CLOSE) {
          setSidebarOpen(false);
          resizing.current = null;
          return;
        }
        setSidebarOpen(true);
        setSidebarWidth(
          Math.min(Math.max(e.clientX, SIDEBAR.MIN), SIDEBAR.MAX)
        );
      }

      /* Preview */
      if (resizing.current === "preview") {
        const width = window.innerWidth - e.clientX;
        if (width < PREVIEW.CLOSE) {
          setPreviewOpen(false);
          resizing.current = null;
          return;
        }
        setPreviewOpen(true);
        setPreviewWidth(Math.min(Math.max(width, PREVIEW.MIN), PREVIEW.MAX));
      }

      /* Bottom */
      if (resizing.current === "bottom") {
        const height = window.innerHeight - e.clientY;
        if (height < BOTTOM.CLOSE) {
          setBottomOpen(false);
          resizing.current = null;
          return;
        }
        setBottomOpen(true);
        setBottomHeight(Math.min(Math.max(height, BOTTOM.MIN), BOTTOM.MAX));
      }
    };

    const stop = () => (resizing.current = null);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
    };
  }, []);

  if (!roomId) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Initializing…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e]">
      <Header
        roomId={roomId}
        title="DevSync"
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onToggleBottomPanel={() => setBottomOpen((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar onSelect={() => {}} active="explorer" />

        {/* Sidebar */}
        {sidebarOpen && <Sidebar width={sidebarWidth} />}
        <SplitHandle
          direction="vertical"
          onMouseDown={() => {
            resizing.current = "sidebar";
            setSidebarOpen(true);
          }}
        />

        <div className="flex flex-col flex-1">

        {/* Editor Area */}
        <div className="flex flex-col flex-1 relative overflow-hidden">
          <EditorTabs  />

          <div
            className="relative flex-1 overflow-hidden"
            >
            <CodeEditor
              fileName="main.py"
              roomId={roomId}
              code="Hello"
              onChange={() => {}}
              socket={null}
            />
          </div>

          {/* <CursorOverlay /> */}
        </div>
          {/* Bottom Split Handle — ALWAYS visible */}
          <SplitHandle
            direction="horizontal"
            onMouseDown={() => {
              resizing.current = "bottom";
              if (!bottomOpen) setBottomOpen(true);
            }}
          />

          {/* Bottom Panel — conditional */}
          {bottomOpen && (
            <div style={{ height: bottomHeight }}>
              <BottomPanel logs={[]} />
            </div>
          )}
            </div>

        {/* Preview */}
        <SplitHandle
          direction="vertical"
          onMouseDown={() => {
            resizing.current = "preview";
            setPreviewOpen(true);
          }}
        />
        {previewOpen && <PreviewPanel width={previewWidth} />}
      </div>
    </div>
  );
}
