// features/collaboration/editor/monaco-yjs.ts

import type * as monaco from "monaco-editor";
import * as Y from "yjs";

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

  const syncFromYText = () => {
    const next = ytext.toString();
    if (model.getValue() === next) return;

    const savedSelections = editor
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
    void event;
    if (disposed || model.isDisposed()) return;
    if (applyingLocal) return;
    if (transaction.local) return;
    // Correctness-first sync for concurrent edits.
    // Yjs doc is authoritative; Monaco mirrors it.
    syncFromYText();
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
