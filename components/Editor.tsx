"use client";

import {
  useEditor,
  EditorContent,
  Editor as TiptapEditor,
} from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { getExtensions } from "@/lib/extensions";
import { PAGE_W, PAGE_H } from "@/lib/objets";
import MarginRuler, { Margins } from "./MarginRuler";
import styles from "./editor.module.css";

type Props = {
  content: any;
  onReady: (editor: TiptapEditor) => void;
  onUpdate: (json: any) => void;
  editable?: boolean;
  margins: Margins;
  onMarginsChange: (m: Margins) => void;
  minHeight?: number;
  zoom?: number;
  children?: React.ReactNode | ((scale: number) => React.ReactNode);
};

export default function Editor({
  content,
  onReady,
  onUpdate,
  editable = true,
  margins,
  onMarginsChange,
  minHeight = PAGE_H,
  zoom = 1,
  children,
}: Props) {
  const editor = useEditor({
    editable,
    extensions: getExtensions(true),
    content: content || { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: { attributes: { class: styles.proseArea } },
    onUpdate: ({ editor }) => onUpdate(editor.getJSON()),
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) onReady(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerH, setInnerH] = useState(PAGE_H + 60);

  // The sheet is always a true A4 of 794px, scaled to the width of the screen.
  useEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner) return;
    const measure = () => {
      const fit = Math.min(1, (box.clientWidth - 12) / PAGE_W);
      setScale(Math.max(0.25, Math.min(2.5, fit * zoom)));
      setInnerH(inner.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [zoom]);

  return (
    <div ref={boxRef} style={{ width: "100%" }}>
      <div style={{ minWidth: "100%", width: "max-content" }}>
        {editable && (
          <MarginRuler
            margins={margins}
            onChange={onMarginsChange}
            editable={editable}
            scale={scale}
          />
        )}
        <div
          style={{
            position: "relative",
            width: PAGE_W * scale,
            height: innerH * scale,
            margin: "0 auto",
          }}
        >
          <div
            ref={innerRef}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: PAGE_W,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              className={styles.page}
              data-page-surface
              data-scale={scale}
              style={
                {
                  position: "relative",
                  width: PAGE_W,
                  minHeight,
                  margin: "0 0 32px",
                  boxSizing: "border-box",
                  overflow: "visible",
                  "--ml": `${margins.left}px`,
                  "--mr": `${margins.right}px`,
                } as React.CSSProperties
              }
            >
              <EditorContent editor={editor} />
              {typeof children === "function" ? children(scale) : children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
