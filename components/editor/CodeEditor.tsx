'use client';

import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Socket } from 'socket.io-client';

import { Skeleton } from '@/components/ui/skeleton';
import { getLanguageFromExtension } from '@/utils/helper';

type CodeEditorProps = {
  fileName: string;
  roomId: string;
  code: string;
  onChange: (code: string) => void;
  socket: Socket | null;
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  fileName,
  roomId,
  code,
  onChange,
  socket,
}) => {
  const editorRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const language = getLanguageFromExtension(fileName);

  /* ---------------- Socket Sync ---------------- */
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-room', { roomId });

    const handleInit = (initialCode: string) => {
      const value = initialCode || '';
      onChange(value);
      editorRef.current?.setValue(value);
    };

    const handleRemoteChange = (newCode: string) => {
      if (!editorRef.current) return;
      if (newCode !== editorRef.current.getValue()) {
        editorRef.current.setValue(newCode);
        onChange(newCode);
      }
    };

    socket.on('init-code', handleInit);
    socket.on('code-change', handleRemoteChange);

    return () => {
      socket.off('init-code', handleInit);
      socket.off('code-change', handleRemoteChange);
    };
  }, [socket, roomId, onChange]);

  /* ---------------- Editor Mount ---------------- */
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    setIsReady(true);
    editor.focus();
  };

  const handleChange = (value?: string) => {
    const newValue = value ?? '';
    onChange(newValue);
    socket?.emit('code-change', { roomId, code: newValue });
  };

  return (
    <div className="h-full w-full relative">
      {!isReady && (
        <div className="absolute inset-0 p-4 bg-[#1E1E1E]">
          <Skeleton className="h-full w-full bg-zinc-800" />
        </div>
      )}

      <Editor
        height="100%"
        language={language}
        value={code}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        onChange={handleChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollbar: {
            verticalScrollbarSize: 4,
            horizontalScrollbarSize: 4,
          },
        }}
      />
    </div>
  );
};

export default CodeEditor;
