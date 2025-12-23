'use client';

export default function PreviewPanel() {
  return (
    <aside className="w-96 bg-slate-950 border-l border-slate-800 text-slate-300">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-400 border-b border-slate-800">
        Preview
      </div>
      <div className="p-3 text-sm">
        Live preview will appear here.
      </div>
    </aside>
  );
}
