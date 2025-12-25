'use client';

import { AlertTriangle, Bug, ShieldCheck, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useEditorContext } from '@/state/editorContext';

type ReviewItem = {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'bug' | 'security' | 'performance' | 'style';
  message: string;
  confidence: 'low' | 'medium' | 'high';
};

const iconByCategory = {
  bug: <Bug className="h-4 w-4 text-red-400" />,
  security: <ShieldCheck className="h-4 w-4 text-amber-400" />,
  performance: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  style: <Info className="h-4 w-4 text-blue-400" />,
};

export default function AIReviewPanel() {
  const [filter, setFilter] =
    useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [results, setResults] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { fileName, code, range } = useEditorContext();

  const filtered = results.filter(
    (i) => filter === 'all' || i.severity === filter
  );

  const handleRunReview = async () => {
    if (!fileName) return;

    setLoading(true);
    setResults([]);

    try {
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: code ? 'selection' : 'file',
          file: fileName,
          language: 'auto',
          code: code ?? '',
          range: range ?? null,
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.results)) {
        // normalize AI output
        setResults(
          data.results.map((r: any, index: number) => ({
            id: `${index}`,
            severity: r.severity,
            category: r.category,
            message: r.message,
            confidence: r.confidence,
          }))
        );
      }
    } catch (err) {
      console.error('AI Review failed', err);
    } finally {
      setLoading(false);
    }
  };

  const canReview = Boolean(fileName);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-neutral-400">
          AI Review
        </span>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleRunReview}
          disabled={!canReview || loading}
        >
          {loading
            ? 'Reviewing…'
            : code
            ? 'Review Selection'
            : 'Review File'}
        </Button>
      </div>

      {/* Selection Context */}
      {code && range && fileName && (
        <div className="px-3 py-2 text-xs border-b border-neutral-800 bg-neutral-900 text-neutral-400">
          Reviewing selection in{' '}
          <span className="text-neutral-200">{fileName}</span>
          <br />
          Lines {range.startLine}–{range.endLine}
        </div>
      )}

      {/* Filters */}
      <div className="px-2 py-2 flex gap-1 border-b border-neutral-800">
        {(['all', 'error', 'warning', 'info'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 text-xs rounded
              ${
                filter === f
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-400 hover:bg-neutral-800'
              }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Review List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {!fileName && (
            <div className="text-sm text-neutral-500 text-center py-4">
              Open a file to run AI review.
            </div>
          )}

          {fileName && filtered.map((item) => (
            <div
              key={item.id}
              className="group rounded-md bg-neutral-900/50 p-3 border border-neutral-800 hover:border-neutral-700 transition"
            >
              <div className="flex gap-2">
                {iconByCategory[item.category]}

                <div className="flex-1">
                  <p className="text-sm text-neutral-200">
                    {item.message}
                  </p>

                  <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                    <Badge
                      variant="outline"
                      className=" text-[10px]"
                    >
                      {item.confidence} confidence
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-2 hidden group-hover:flex gap-2">
                <Button size="sm" variant="outline">
                  Explain
                </Button>
                <Button size="sm">
                  Apply Fix
                </Button>
              </div>
            </div>
          ))}

          {fileName && !loading && filtered.length === 0 && (
            <div className="text-sm text-neutral-500 text-center py-6">
              No issues found.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
