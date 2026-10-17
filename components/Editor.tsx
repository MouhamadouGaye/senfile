"use client";
import { useEffect, useRef, useState } from "react";

import {
  useEditor,
  EditorContent,
  Editor as TiptapEditor,
} from "@tiptap/react";
import { getExtensions } from "@/lib/extensions";
import MarginRuler, { Margins } from "./MarginRuler";
import styles from "./editor.module.css";

type Props = {
  content: any;
  onReady: (editor: TiptapEditor) => void;
  onUpdate: (json: any) => void;
  editable?: boolean;
  margins: Margins;
  onMarginsChange: (m: Margins) => void;
  children?: React.ReactNode;
};

export default function Editor({
  content,
  onReady,
  onUpdate,
  editable = true,
  margins,
  onMarginsChange,
  children,
}: Props) {
  const editor = useEditor({
    editable,
    extensions: getExtensions(true), // single source of truth
    content: content || { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: { attributes: { class: styles.proseArea } },
    onUpdate: ({ editor }) => onUpdate(editor.getJSON()),
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) onReady(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // À l'intérieur du composant Editor :
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pageScale, setPageScale] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const availableWidth = viewport.clientWidth;
      setPageScale(Math.min(1, availableWidth / 794));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    updateScale();

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={viewportRef} className={styles.pageViewport}>
      <div
        className={styles.pageScale}
        style={
          {
            "--page-scale": pageScale,
            height: `${1123 * pageScale}px`,
          } as React.CSSProperties
        }
      >
        <MarginRuler
          margins={margins}
          onChange={onMarginsChange}
          editable={editable}
        />

        <div
          className={styles.page}
          data-page-surface
          style={
            {
              "--ml": `${margins.left}px`,
              "--mr": `${margins.right}px`,
            } as React.CSSProperties
          }
        >
          <EditorContent editor={editor} />
          {children}
        </div>
      </div>
    </div>
  );
}
