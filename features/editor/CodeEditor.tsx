"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Awareness } from "y-protocols/awareness";
import * as monaco from "monaco-editor";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";

import { getYDoc } from "@/features/collaboration/editor/yjs";
import { bindMonacoToYText } from "@/features/collaboration/editor/monaco-yjs";
import { bindYjsToSocket } from "@/features/collaboration/editor/yjs-transport";
import { setupAwareness } from "@/features/collaboration/editor/yjs-awareness";
import { bindAwarenessToMonaco } from "@/features/collaboration/editor/monaco-awareness";
import { renderRemoteCursors } from "@/features/collaboration/editor/render-cursors";
import { hasRoomSnapshot } from "@/features/collaboration/client/connection";
import { eventBus } from "@/features/collaboration/client/event-bus";

import { useEditorStore } from "@/features/collaboration/editor/editor.store";
import { usePresenceStore } from "@/features/collaboration/presence/presence.store";
import { findCurrentPresenceUser } from "@/features/rooms/identity";
import { useEditorContext } from "@/state/editorContext";

interface CodeEditorProps {
  roomId: string;
}

export default function CodeEditor({ roomId }: CodeEditorProps) {
  /* ---------- State ---------- */
  const activeFileId = useEditorStore((s) => s.activeFileId);
  const openFiles = useEditorStore((s) => s.openFiles);
  const users = usePresenceStore((s) => s.users);
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();

  const file = activeFileId ? openFiles[activeFileId] : null;
  const { setSelection, clearSelection } = useEditorContext();
  const currentUser = useMemo(() => {
    const fromSession = findCurrentPresenceUser(users, session?.user);
    if (fromSession) return fromSession;
    return Object.values(users).find((u) => u.online) ?? null;
  }, [users, session?.user]);
  const awarenessUser = useMemo(
    () => ({
      userId: currentUser?.userId ?? session?.user?.id ?? "anonymous",
      name: currentUser?.name ?? session?.user?.name ?? "Anonymous",
      color: currentUser?.color ?? "#3b82f6",
    }),
    [currentUser, session?.user?.id, session?.user?.name]
  );

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const selectionListenerRef = useRef<monaco.IDisposable | null>(null);
  const activeFileNameRef = useRef<string | null>(null);

  const modelsRef = useRef<
    Map<
      string,
      {
        model: monaco.editor.ITextModel;
        cleanup?: () => void;
      }
    >
  >(new Map());

  const [error, setError] = useState<string | null>(null);
  const [snapshotState, setSnapshotState] = useState(() => ({
    roomId,
    ready: hasRoomSnapshot(),
  }));
  const snapshotReady =
    snapshotState.roomId === roomId
      ? snapshotState.ready
      : false;

  useEffect(() => {
    activeFileNameRef.current = file?.name ?? null;
  }, [file?.name]);

  useEffect(() => {
    clearSelection();
  }, [file?.fileId, clearSelection]);

  useEffect(() => {
    const offSnapshot = eventBus.on(
      "room:snapshot",
      (payload) => {
        if (payload.roomId !== roomId) return;
        setSnapshotState({ roomId, ready: true });
      }
    );

    const offLeave = eventBus.on("room:left", ({ roomId: leftRoomId }) => {
      if (leftRoomId !== roomId) return;
      setSnapshotState({ roomId, ready: false });
    });

    return () => {
      offSnapshot();
      offLeave();
    };
  }, [roomId]);

  /* ---------- Editor mount ---------- */
  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    selectionListenerRef.current?.dispose();
    selectionListenerRef.current = editor.onDidChangeCursorSelection((event) => {
      const model = editor.getModel();
      const fileName = activeFileNameRef.current;
      if (!model || !fileName) {
        clearSelection();
        return;
      }

      const selection = event.selection;
      if (selection.isEmpty()) {
        clearSelection();
        return;
      }

      const selectedText = model.getValueInRange(selection);
      if (!selectedText.trim()) {
        clearSelection();
        return;
      }

      setSelection(
        fileName,
        selectedText,
        selection.startLineNumber,
        selection.endLineNumber
      );
    });
  };

  /* ---------- Global cleanup ---------- */
  useEffect(() => {
    return () => {
      modelsRef.current.forEach(({ model, cleanup }) => {
        try {
          cleanup?.();
          if (!model.isDisposed()) model.dispose();
        } catch {}
      });
      modelsRef.current.clear();
      selectionListenerRef.current?.dispose();
      selectionListenerRef.current = null;
      clearSelection();
      editorRef.current = null;
      monacoRef.current = null;
    };
  }, [clearSelection]);

  /* ---------- Collaboration setup (ALWAYS CALLED) ---------- */
  useEffect(() => {
    // 🔒 HARD guards INSIDE effect
    if (
      !snapshotReady ||
      !file ||
      !editorRef.current ||
      !monacoRef.current
    ) {
      return;
    }

    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;

    let isMounted = true;
    let cleanup: (() => void) | undefined;

    setError(null);

    try {
      /* ---------- Model ---------- */
      let entry = modelsRef.current.get(file.fileId);

      if (!entry) {
        const model = monacoInstance.editor.createModel("", file.language);
        entry = { model };
        modelsRef.current.set(file.fileId, entry);
      } else if (entry.model.getLanguageId() !== file.language) {
        monacoInstance.editor.setModelLanguage(entry.model, file.language);
      }

      const model = entry.model;
      if (model.isDisposed()) return;

      if (
        editor.getModel() !== model &&
        editor.getModel() !== null &&
        !(editor as any)._isDisposed
      ) {
        editor.setModel(model);
      } else if ((editor as any)._isDisposed) {
        return;
      }

      /* ---------- Yjs ---------- */
      const doc = getYDoc(roomId, file.fileId);
      const ytext = doc.getText("content");

      const unbindText = bindMonacoToYText(model, ytext);
      const unbindTransport = bindYjsToSocket(doc, roomId, file.fileId);

      /* ---------- Awareness ---------- */
      const awareness = new Awareness(doc);
      awareness.setLocalState({
        user: {
          userId: awarenessUser.userId,
          name: awarenessUser.name,
          color: awarenessUser.color,
        },
        cursor: null,
      });

      const unbindAwareness = setupAwareness(
        awareness,
        roomId,
        file.fileId
      );
      bindAwarenessToMonaco(editor, awareness);

      /* ---------- Cursor rendering ---------- */
      const interval = setInterval(() => {
        if (isMounted) {
          renderRemoteCursors(editor, awareness);
        }
      }, 100);

      let disposed = false;
      cleanup = () => {
        if (disposed) return;
        disposed = true;
        isMounted = false;
        clearInterval(interval);
        unbindAwareness();
        awareness.destroy();
        unbindTransport();
        unbindText();

        const latest = modelsRef.current.get(file.fileId);
        if (latest && latest.cleanup === cleanup) {
          latest.cleanup = undefined;
        }
      };

      entry.cleanup = cleanup;
    } catch (err) {
      console.error("Editor setup failed", err);
      if (isMounted) setError("Failed to setup collaboration");
    }

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [
    roomId,
    snapshotReady,
    file?.fileId,
    file?.language,
    awarenessUser.userId,
    awarenessUser.name,
    awarenessUser.color,
  ]);

  /* ---------- Error ---------- */
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="text-red-500">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500">
        Open a file to start coding
      </div>
    );
  }

  /* ---------- Render editor ---------- */
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
          fontSize: 14,
          lineNumbers: "on",
          wordWrap: "on",
          tabSize: 2,
          quickSuggestions: false,
          wordBasedSuggestions: "off",
        }}
      />
    </div>
  );
}
