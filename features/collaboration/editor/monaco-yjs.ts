// features/collaboration/editor/monaco-yjs.ts

import type * as monaco from "monaco-editor";
import * as Y from "yjs";

function mapOffsetThroughDelta(
  offset: number,
  delta: Y.YTextEvent["delta"],
  assoc: -1 | 1 = 1
) {
  let oldPos = 0;
  let newPos = 0;

  for (const part of delta) {
    if (part.retain) {
      const retainEnd = oldPos + part.retain;
      if (offset < retainEnd || (offset === retainEnd && assoc < 0)) {
        return newPos + (offset - oldPos);
      }
      oldPos = retainEnd;
      newPos += part.retain;
      continue;
    }

    if (part.delete) {
      const deleteEnd = oldPos + part.delete;
      if (offset <= deleteEnd) {
        return newPos;
      }
      oldPos = deleteEnd;
      continue;
    }

    if (typeof part.insert === "string") {
      newPos += part.insert.length;
    }
  }

  return newPos + (offset - oldPos);
}

export function bindMonacoToYText(
  model: monaco.editor.ITextModel,
  ytext: Y.Text,
  editor?: monaco.editor.IStandaloneCodeEditor
) {
  let applyingRemote = false;
  let applyingLocal = false;
  let disposed = false;

  if (model.isDisposed()) {
    console.error("Cannot bind disposed model");
    return () => {};
  }

  const syncFromYText = (
    mappedSelections?: Array<{ start: number; end: number }>
  ) => {
    const next = ytext.toString();
    if (model.getValue() === next) return;

    const savedSelections =
      mappedSelections ??
      editor
      ?.getSelections()
      ?.map((selection) => ({
        start: model.getOffsetAt(selection.getStartPosition()),
        end: model.getOffsetAt(selection.getEndPosition()),
      }));

    applyingRemote = true;
    try {
      model.setValue(next);

      if (editor && savedSelections && savedSelections.length > 0) {
        const maxOffset = model.getValueLength();
        editor.setSelections(
          savedSelections.map((selection) => {
            const start = model.getPositionAt(
              Math.max(0, Math.min(selection.start, maxOffset))
            );
            const end = model.getPositionAt(
              Math.max(0, Math.min(selection.end, maxOffset))
            );
            return {
              selectionStartLineNumber: start.lineNumber,
              selectionStartColumn: start.column,
              positionLineNumber: end.lineNumber,
              positionColumn: end.column,
              startLineNumber: start.lineNumber,
              startColumn: start.column,
              endLineNumber: end.lineNumber,
              endColumn: end.column,
            };
          })
        );
      }
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

    const mappedSelections = editor
      ?.getSelections()
      ?.map((selection) => {
        const start = model.getOffsetAt(selection.getStartPosition());
        const end = model.getOffsetAt(selection.getEndPosition());

        return {
          start: mapOffsetThroughDelta(start, event.delta, -1),
          end: mapOffsetThroughDelta(end, event.delta, 1),
        };
      });

    // Correctness-first sync for concurrent edits.
    // Yjs doc is authoritative; Monaco mirrors it.
    syncFromYText(mappedSelections);
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
