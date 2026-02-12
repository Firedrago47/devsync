"use client";

import {
  AlertTriangle,
  Bug,
  FileCode2,
  Info,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useEditorContext } from "@/state/editorContext";
import { cn } from "@/lib/utils";

type ReviewItem = {
  id: string;
  severity: "error" | "warning" | "info";
  category: "bug" | "security" | "performance" | "style";
  message: string;
  confidence: "low" | "medium" | "high";
};

type Filter = "all" | "error" | "warning" | "info";

const iconByCategory = {
  bug: <Bug className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />,
  security: <ShieldCheck className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />,
  performance: <AlertTriangle className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />,
  style: <Info className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />,
};

const severityStyle: Record<ReviewItem["severity"], string> = {
  error:
    "border-l-neutral-500 bg-neutral-100 dark:bg-neutral-900/70 ring-1 ring-neutral-300 dark:ring-neutral-700 text-neutral-800 dark:text-neutral-200",
  warning:
    "border-l-neutral-500 bg-neutral-100 dark:bg-neutral-900/70 ring-1 ring-neutral-300 dark:ring-neutral-700 text-neutral-800 dark:text-neutral-200",
  info:
    "border-l-neutral-500 bg-neutral-100 dark:bg-neutral-900/70 ring-1 ring-neutral-300 dark:ring-neutral-700 text-neutral-800 dark:text-neutral-200",
};

export default function AIReviewPanel() {
  const [filter, setFilter] = useState<Filter>("all");
  const [results, setResults] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const { fileName, code, range } = useEditorContext();

  const filtered = results.filter(
    (i) => filter === "all" || i.severity === filter
  );
  const counts = results.reduce(
    (acc, item) => {
      acc[item.severity] += 1;
      return acc;
    },
    { error: 0, warning: 0, info: 0 }
  );

  const handleRunReview = async () => {
    if (!fileName || !code?.trim() || !range) return;

    setLoading(true);
    setResults([]);
    setError(null);
    setHasRun(true);

    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "selection",
          file: fileName,
          language: "auto",
          code,
          range,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "AI review request failed");
        return;
      }

      if (data.success && Array.isArray(data.results)) {
        // normalize AI output
        setResults(
          data.results.map((r: ReviewItem, index: number) => ({
            id: `${index}`,
            severity: r.severity,
            category: r.category,
            message: r.message,
            confidence: r.confidence,
          }))
        );
      } else {
        setError("Invalid AI response format");
      }
    } catch (err) {
      console.error("AI Review failed", err);
      setError("Network error while running AI review");
    } finally {
      setLoading(false);
    }
  };

  const clearReviewState = () => {
    setResults([]);
    setHasRun(false);
    setError(null);
    setFilter("all");
  };

  const canReview = Boolean(fileName && code?.trim() && range);
  const selectedLineCount =
    range ? range.endLine - range.startLine + 1 : 0;
  const filterOptions: Filter[] = ["all", "error", "warning", "info"];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950/70 shadow-inner">
      <div className="border-b border-neutral-300 dark:border-neutral-800 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              <Sparkles className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              AI Review
            </p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Scan selected code for bugs, security issues, and performance risks.
            </p>
          </div>
          {hasRun && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={clearReviewState}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              aria-label="Clear review"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-3 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 p-2">
          {fileName && range ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                  <FileCode2 className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                  <span className="truncate">{fileName}</span>
                </p>
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-500">
                  Lines {range.startLine}-{range.endLine} ({selectedLineCount} selected)
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleRunReview}
                disabled={!canReview || loading}
                className="bg-neutral-800 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 disabled:bg-neutral-300 disabled:text-neutral-500 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {loading ? "Reviewing..." : "Review"}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              Select code in editor to enable AI review.
            </p>
          )}
        </div>
      </div>

      <div className="border-b border-neutral-300 dark:border-neutral-800 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((option) => {
            const count =
              option === "all" ? results.length : counts[option];
            const active = filter === option;
            return (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition",
                  active
                    ? "border-neutral-500 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    : "border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-700 hover:text-neutral-800 dark:hover:text-neutral-200"
                )}
              >
                {option.toUpperCase()} {count}
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {!fileName && (
            <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-6 text-center text-sm text-neutral-500">
              Open a file to start AI review.
            </div>
          )}

          {fileName && (!code || !range) && (
            <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-6 text-center text-sm text-neutral-500">
              Select a code range in the editor to run review.
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300">
              {error}
            </div>
          )}

          {loading &&
            [0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/70 p-3"
              >
                <div className="h-3 w-1/2 rounded bg-neutral-300 dark:bg-neutral-800" />
                <div className="mt-2 h-3 w-full rounded bg-neutral-300 dark:bg-neutral-800" />
                <div className="mt-1 h-3 w-2/3 rounded bg-neutral-300 dark:bg-neutral-800" />
              </div>
            ))}

          {!loading &&
            filtered.map((item) => (
              <article
                key={item.id}
                className={`rounded-lg border border-l-4 border-neutral-800 p-3 ${severityStyle[item.severity]}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{iconByCategory[item.category]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5 text-neutral-800 dark:text-neutral-100">{item.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="border-neutral-400 dark:border-neutral-700 text-[10px] text-neutral-700 dark:text-neutral-300">
                        {item.severity}
                      </Badge>
                      <Badge variant="outline" className="border-neutral-400 dark:border-neutral-700 text-[10px] text-neutral-700 dark:text-neutral-300">
                        {item.category}
                      </Badge>
                      <Badge variant="outline" className="border-neutral-400 dark:border-neutral-700 text-[10px] text-neutral-700 dark:text-neutral-300">
                        {item.confidence} confidence
                      </Badge>
                    </div>
                  </div>
                </div>
              </article>
            ))}

          {!loading && fileName && hasRun && !error && results.length === 0 && (
            <div className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-6 text-center text-sm text-neutral-700 dark:text-neutral-300">
              No issues found in this selection.
            </div>
          )}

          {!loading &&
            fileName &&
            hasRun &&
            !error &&
            results.length > 0 &&
            filtered.length === 0 && (
              <div className="rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/60 p-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                No {filter.toUpperCase()} findings for this review.
              </div>
            )}

          {!loading && fileName && !hasRun && canReview && (
            <div className="rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/60 p-6 text-center text-sm text-neutral-500">
              Run review to generate findings for the current selection.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
