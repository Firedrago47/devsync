'use client';

type PreviewPanelProps = {
  width: number;
};

export default function PreviewPanel({ width }: PreviewPanelProps) {
  return (
    <aside
      style={{ width }}
      className="bg-neutral-900 border-l border-neutral-800 text-neutral-300 flex-shrink-0"
    >
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-neutral-400 border-b border-neutral-800">
        Preview
      </div>
      <div className="p-3 text-sm">
        Live preview will appear here.
      </div>
    </aside>
  );
}
