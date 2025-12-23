'use client';

import React from 'react';

type OutputProps = {
  logs: string[]; // receive logs from parent
};

const Output: React.FC<OutputProps> = ({ logs }) => {
  return (
    <div className="bg-[#1E1E1E] text-gray-300 font-mono text-[13px] h-full px-5 py-4 overflow-y-auto leading-relaxed">
      {logs.length === 0 && (
        <div className="text-gray-400">[Running] Waiting for code output...</div>
      )}
      {logs.map((line, idx) => (
        <div key={idx}>{line}</div>
      ))}
    </div>
  );
};

export default Output;
