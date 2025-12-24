'use client';

import React, { useState, useRef, useEffect } from 'react';

const Terminal: React.FC = () => {
  const [lines, setLines] = useState<string[]>([
    'DevSync Shell v1.0.0',
    'Type "help" for available commands.',
    '',
  ]);
  const [currentLine, setCurrentLine] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Handle a command
  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    const newLines = [...lines];

    // Append the command to lines
    newLines.push(`user@devsync:~$ ${trimmed}`);

    // Command logic
    if (trimmed.toLowerCase() === 'help') {
      newLines.push('Available commands: help, clear, echo [text]');
    } else if (trimmed.toLowerCase() === 'clear') {
      setLines([]);
      setCurrentLine('');
      return;
    } else if (trimmed.startsWith('echo ')) {
      newLines.push(trimmed.slice(5));
    } else if (trimmed) {
      newLines.push(`Command not found: ${trimmed}`);
    }

    setLines(newLines);
    setCurrentLine('');
  };

  // Keyboard input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(currentLine);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setCurrentLine((prev) => prev.slice(0, -1));
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setCurrentLine((prev) => prev + e.key);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, currentLine]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full h-full bg-neutral-900 text-gray-200 font-mono text-[13px] px-5 py-3 outline-none overflow-y-auto flex flex-col leading-[1.4]"
    >
      {/* Render previous lines */}
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}

      {/* Current typing line */}
      <div className="flex">
        <span className="text-green-400">user@devsync:~$</span>
        <span className="ml-2 flex items-center">
          <span>{currentLine}</span>
          <span className="animate-pulse">▮</span>
        </span>
      </div>


      <div ref={endRef} />
    </div>
  );
};

export default Terminal;
