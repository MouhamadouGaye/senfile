"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Editor } from "@tiptap/react";
import { X } from "lucide-react";

type Box = { left: number; top: number; width: number; height: number };

/** Met à l'échelle les largeurs de colonnes et hauteurs de lignes du tableau actif. */
function applyTableSize(editor: Editor, rx: number, ry: number) {
  const { state, view } = editor;
  const { $from } = state.selection;
  let depth = $from.depth;
  while (depth > 0 && $from.node(depth).type.name !== "table") depth--;
  if (depth === 0) return;

  const table = $from.node(depth);
  const tableStart = $from.start(depth);
  const dom = view.nodeDOM($from.before(depth)) as HTMLElement | null;
  const tableEl =
    dom?.tagName === "TABLE"
      ? (dom as HTMLTableElement)
      : dom?.querySelector("table");
  if (!tableEl) return;

  const rowEls = Array.from(tableEl.rows);
  const colWidths: number[] = [];
  Array.from(rowEls[0].cells).forEach((c) => {
    const span = c.colSpan || 1;
    for (let i = 0; i < span; i++) colWidths.push(c.offsetWidth / span);
  });

  const tr = state.tr;
  table.forEach((row, rowOffset, rowIndex) => {
    const rowPos = tableStart + rowOffset;
    const h = Math.max(
      28,
      Math.round((rowEls[rowIndex]?.offsetHeight ?? 34) * ry),
    );
    tr.setNodeMarkup(rowPos, undefined, { ...row.attrs, rowHeight: h });
    let col = 0;
    row.forEach((cell, cellOffset) => {
      const span = cell.attrs.colspan || 1;
      const colwidth = Array.from({ length: span }, (_, i) =>
        Math.max(40, Math.round((colWidths[col + i] ?? 100) * rx)),
      );
      col += span;
      tr.setNodeMarkup(rowPos + 1 + cellOffset, undefined, {
        ...cell.attrs,
        colwidth,
      });
    });
  });
  view.dispatch(tr);
}

export default function TableControls({ editor }: { editor: Editor }) {
  const [box, setBox] = useState<Box | null>(null);
  const [page, setPage] = useState<HTMLElement | null>(null);

  useEffect(() => {
    function measure() {
      if (!editor.isEditable || !editor.isActive("table")) return setBox(null);
      const pageEl = editor.view.dom.closest(
        "[data-page-surface]",
      ) as HTMLElement | null;
      const { node } = editor.view.domAtPos(editor.state.selection.from);
      const el =
        node.nodeType === 1 ? (node as HTMLElement) : node.parentElement;
      const table = el?.closest("table");
      if (!pageEl || !table) return setBox(null);
      const p = pageEl.getBoundingClientRect();
      const t = table.getBoundingClientRect();
      setPage(pageEl);
      setBox({
        left: t.left - p.left,
        top: t.top - p.top,
        width: t.width,
        height: t.height,
      });
    }
    measure();
    editor.on("selectionUpdate", measure);
    editor.on("update", measure);
    window.addEventListener("resize", measure);
    return () => {
      editor.off("selectionUpdate", measure);
      editor.off("update", measure);
      window.removeEventListener("resize", measure);
    };
  }, [editor]);

  if (!box || !page) return null;

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const start = box!;
    const sx = e.clientX;
    const sy = e.clientY;
    let w = start.width;
    let h = start.height;
    function onMove(ev: MouseEvent) {
      w = Math.max(120, start.width + ev.clientX - sx);
      h = Math.max(40, start.height + ev.clientY - sy);
      setBox({ ...start, width: w, height: h });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      applyTableSize(editor, w / start.width, h / start.height);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const handle: React.CSSProperties = {
    position: "absolute",
    width: 11,
    height: 11,
    background: "#fff",
    border: "2px solid #4b3f72",
    borderRadius: 3,
    pointerEvents: "auto",
  };

  return createPortal(
    <div
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        outline: "2px solid #4b3f72",
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      <span
        style={{ ...handle, right: -6, bottom: -6, cursor: "nwse-resize" }}
        onMouseDown={startResize}
      />
      <button
        style={{
          position: "absolute",
          right: -10,
          top: -10,
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "2px solid #fff",
          background: "#a13d3d",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().deleteTable().run()}
        aria-label="Supprimer le tableau"
        title="Supprimer le tableau"
      >
        <X size={12} />
      </button>
    </div>,
    page,
  );
}
