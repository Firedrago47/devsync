'use client';

export default function CursorOverlay() {
  return (
    <div className="absolute top-10 left-20 pointer-events-none">
      <div className="flex items-center space-x-1">
        <span className="h-4 w-[2px] bg-blue-400 animate-pulse" />
        <span className="text-xs bg-blue-500 text-white px-1 rounded">
          Alex
        </span>
      </div>
    </div>
  );
}
