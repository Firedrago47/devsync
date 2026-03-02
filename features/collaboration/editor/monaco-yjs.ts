// features/collaboration/editor/monaco-yjs.ts

import type * as monaco from "monaco-editor";
import * as Y from "yjs";

function toRangeFromOffsets(
  model: monaco.editor.ITextModel,
  startOffset: number,
  endOffset: number
) {
  const start = model.getPositionAt(startOffset);
  const end = model.getPositionAt(endOffset);

  return {
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column,
  };
}

export function bindMonacoToYText(
  model: monaco.editor.ITextModel,
  ytext: Y.Text
) {
  let applyingRemote = false;
  let applyingLocal = false;
  let disposed = false;

  if (model.isDisposed()) {
    console.error("Cannot bind disposed model");
    return () => {};
  }

  const syncFromYText = () => {
    const next = ytext.toString();
    if (model.getValue() === next) return;

    applyingRemote = true;
    try {
      model.setValue(next);
    } finally {
      applyingRemote = false;
    }
  };

  // Initial source of truth is Yjs doc state.
  syncFromYText();

  const yObserver = (event: Y.YTextEvent, transaction: Y.Transaction) => {
    if (disposed || model.isDisposed()) return;
    if (applyingLocal) return;
    if (transaction.local) return;

    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];
    let index = 0;

    for (const part of event.delta) {
      if (part.retain) {
        index += part.retain;
        continue;
      }

      if (part.delete) {
        edits.push({
          range: toRangeFromOffsets(model, index, index + part.delete),
          text: "",
          forceMoveMarkers: true,
        });
        continue;
      }

      if (typeof part.insert === "string") {
        edits.push({
          range: toRangeFromOffsets(model, index, index),
          text: part.insert,
          forceMoveMarkers: true,
        });
        index += part.insert.length;
      }
    }

    if (edits.length === 0) return;

    applyingRemote = true;
    try {
      model.applyEdits(edits);
    } catch (err) {
      console.error("Error applying Yjs delta to Monaco:", err);
    } finally {
      applyingRemote = false;
    }
  };

  ytext.observe(yObserver);

  const monacoDisposable = model.onDidChangeContent((contentEvent) => {
    if (disposed || model.isDisposed()) return;
    if (applyingRemote) return;
    if (!ytext.doc) return;

    applyingLocal = true;
    try {
      ytext.doc.transact(() => {
        // Apply from the end so offsets remain valid for this transaction.
        const changes = [...contentEvent.changes].sort(
          (a, b) => b.rangeOffset - a.rangeOffset
        );

        for (const change of changes) {
          if (change.rangeLength > 0) {
            ytext.delete(change.rangeOffset, change.rangeLength);
          }
          if (change.text.length > 0) {
            ytext.insert(change.rangeOffset, change.text);
          }
        }
      }, "monaco");
    } catch (err) {
      console.error("Error applying Monaco delta to Yjs:", err);
    } finally {
      applyingLocal = false;
    }
  });

  return () => {
    if (disposed) return;
    disposed = true;

    try {
      ytext.unobserve(yObserver);
    } catch {}

    try {
      monacoDisposable.dispose();
    } catch {}
  };
}
