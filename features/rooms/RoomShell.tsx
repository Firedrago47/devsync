/* ===============================
   FILE: RoomShell.tsx
=============================== */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  BrainCircuit,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

import ActivityBar from "@/ui/layout/ActivityBar";
import Sidebar from "@/ui/layout/Sidebar";
import BottomPanel from "@/ui/layout/BottomPanel";
import ToolsPanel from "@/ui/layout/ToolsPanel";
import VoiceOverlayDock from "@/ui/layout/VoiceOverlayDock";
import Header from "@/ui/layout/Header";
import { startTerminal } from "@/features/terminal/terminal.service";

import EditorTabs from "@/features/editor/EditorTabs";
import CodeEditor from "@/features/editor/CodeEditor";

import { SidebarView } from "@/ui/layout/layout.types";
import { useRoomStore } from "./room.store";
import { useEditorStore } from "@/features/collaboration/editor/editor.store";
import { useFSStore } from "@/features/collaboration/filesystem/fs.store";
import { resolveMyRole } from "./identity";
import { eventBus } from "@/features/collaboration/client/event-bus";

interface RoomShellProps {
  roomId: string;
}

const ANALYSIS_STEPS = [
  "Collecting file tree context",
  "Indexing project structure",
  "Detecting architecture and stacks",
  "Generating quality and risk insights",
  "Preparing actionable summary",
];

interface CodebaseAnalysisResponse {
  success: boolean;
  summary: string;
  totalFiles: number;
  totalFolders: number;
  techStack: string[];
  insights: string[];
  warnings: string[];
}

export default function RoomShell({ roomId }: RoomShellProps) {
  const { data: session } = useSession();
  const room = useRoomStore((s) => s.room);
  const members = useRoomStore((s) => s.members);
  const fsNodes = useFSStore((s) => s.nodes);
  const roomError = useRoomStore((s) => s.error);
  const isAwaitingRoleAssignment = useRoomStore(
    (s) => s.isAwaitingRoleAssignment
  );
  const awaitingRoleMessage = useRoomStore(
    (s) => s.awaitingRoleMessage
  );
  const activeFileId = useEditorStore((s) => s.activeFileId);

  const [sidebarOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [toolsOpen] = useState(true);
  const [isAnalyzingCodebase, setIsAnalyzingCodebase] = useState(false);
  const [showAnalysisOverlay, setShowAnalysisOverlay] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [analysisResult, setAnalysisResult] =
    useState<CodebaseAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [sidebarView, setSidebarView] =
    useState<SidebarView>("explorer");
  const myRole = resolveMyRole(members, session?.user);
  const myUserId = session?.user?.id ?? null;
  const notifiedJoinRequestsRef = useRef<Set<string>>(new Set());
  const analysisTimerRef = useRef<number | null>(null);

  const filePaths = useMemo(
    () =>
      Object.values(fsNodes)
        .filter((node) => node.type === "file")
        .map((node) => node.path || node.name)
        .sort((a, b) => a.localeCompare(b)),
    [fsNodes]
  );

  useEffect(() => {
    return () => {
      if (analysisTimerRef.current) {
        window.clearInterval(analysisTimerRef.current);
      }
    };
  }, []);

  async function handleAnalyzeCodebase() {
    if (isAnalyzingCodebase) return;

    if (filePaths.length === 0) {
      toast.error("No files found in file tree to analyze");
      return;
    }

    setShowAnalysisOverlay(true);
    setIsAnalyzingCodebase(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisStepIndex(0);

    analysisTimerRef.current = window.setInterval(() => {
      setAnalysisStepIndex((prev) =>
        prev >= ANALYSIS_STEPS.length - 1 ? prev : prev + 1
      );
    }, 1400);

    try {
      const res = await fetch("/api/ai/codebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          files: filePaths,
          projectName: room?.name ?? "Open Source Project",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "Codebase analysis failed");
      }

      setAnalysisStepIndex(ANALYSIS_STEPS.length - 1);
      setAnalysisResult(data as CodebaseAnalysisResponse);
      toast.success("Codebase analysis completed");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to analyze codebase";
      setAnalysisError(message);
      toast.error(message);
    } finally {
      setIsAnalyzingCodebase(false);
      if (analysisTimerRef.current) {
        window.clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
    }
  }

  useEffect(() => {
    if (myRole !== "owner") return;

    const offJoin = eventBus.on("presence:join", (user) => {
      if (myUserId && user.userId === myUserId) return;
      toast(`${user.name} joined the room`);
    });

    return () => {
      offJoin();
    };
  }, [myRole, myUserId]);

  useEffect(() => {
    if (myRole !== "owner") return;

    const offJoinRequest = eventBus.on("room:join-request", (request) => {
      if (request.roomId !== roomId) return;
      const key = `${request.userId}:${request.requestedAt}`;
      if (notifiedJoinRequestsRef.current.has(key)) return;
      notifiedJoinRequestsRef.current.add(key);

      toast(`${request.name} is waiting for approval`);
    });

    return () => {
      offJoinRequest();
    };
  }, [myRole, roomId]);

  if (roomError) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        {roomError}
      </div>
    );
  }

  if (isAwaitingRoleAssignment) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin text-muted-foreground" />
        <p className="text-sm">Waiting for role assignment</p>
        <p className="text-xs text-muted-foreground">
          {awaitingRoleMessage ?? "The room owner needs to assign your access role before you can enter."}
        </p>
      </div>
    );
  }

  // Defensive guard
  if (!room) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex flex-col bg-background text-foreground">
      <Header
        title={room.name}
        roomId={roomId}
        onAnalyzeCodebase={handleAnalyzeCodebase}
        isAnalyzingCodebase={isAnalyzingCodebase}
        onRunProject={() => {
          setBottomOpen(true);
          startTerminal(roomId, activeFileId);
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
              <ResizablePanel defaultSize={28} >
                <ToolsPanel roomId={roomId} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      <VoiceOverlayDock roomId={roomId} />

      {showAnalysisOverlay && (
        <div className="absolute inset-0 z-40 bg-background/85 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card/95 text-card-foreground shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isAnalyzingCodebase ? (
                  <Loader2 className="h-5 w-5 animate-spin text-green-300" />
                ) : (
                  <BrainCircuit className="h-5 w-5 text-green-300" />
                )}
                <div>
                  <h3 className="text-sm font-semibold">Codebase Analysis</h3>
                  <p className="text-xs text-muted-foreground">
                    {isAnalyzingCodebase
                      ? "Analyzing project files from your file tree..."
                      : "Analysis complete"}
                  </p>
                </div>
              </div>

              {!isAnalyzingCodebase && (
                <button
                  onClick={() => setShowAnalysisOverlay(false)}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label="Close analysis overlay"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-green-400 transition-all duration-500"
                  style={{
                    width: `${((analysisStepIndex + 1) / ANALYSIS_STEPS.length) * 100}%`,
                  }}
                />
              </div>

              <div className="space-y-2">
                {ANALYSIS_STEPS.map((step, index) => {
                  const done = index < analysisStepIndex || (!isAnalyzingCodebase && index <= analysisStepIndex);
                  const active = index === analysisStepIndex && isAnalyzingCodebase;

                  return (
                    <div
                      key={step}
                      className="flex items-center gap-2 text-xs"
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : active ? (
                        <Loader2 className="h-4 w-4 animate-spin text-green-300" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-border" />
                      )}
                      <span
                        className={
                          done || active ? "text-foreground" : "text-muted-foreground"
                        }
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              {analysisError && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {analysisError}
                </div>
              )}

              {analysisResult && !analysisError && (
                <div className="rounded-md border border-green-400/30 bg-green-400/10 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">Summary</span>
                  </div>
                  <p className="text-xs text-foreground">
                    {analysisResult.summary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Files: {analysisResult.totalFiles} | Folders:{" "}
                    {analysisResult.totalFolders}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
