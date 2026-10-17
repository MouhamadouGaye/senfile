"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import styles from "./outline-panel.module.css";

type OutlineItem = { id: string; level: number; text: string; pos: number };

function buildOutline(editor: Editor): OutlineItem[] {
  const items: OutlineItem[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      items.push({
        id: `heading-${pos}`,
        level: node.attrs.level,
        text: node.textContent || "Sans titre",
        pos,
      });
    }
  });
  return items;
}

// Distance depuis le haut de la fenêtre en dessous de laquelle un titre est
// considéré comme "la section en cours" — juste sous la barre du haut et la
// barre d'outils, toutes deux fixes.
const SCROLL_SPY_THRESHOLD = 140;

export default function OutlinePanel({ editor, visible }: { editor: Editor; visible: boolean }) {
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [activePos, setActivePos] = useState<number | null>(null);

  useEffect(() => {
    function refresh() {
      setItems(buildOutline(editor));
    }
    refresh();
    editor.on("update", refresh);
    return () => {
      editor.off("update", refresh);
    };
  }, [editor]);

  // Suit la position de lecture : au défilement, on met en évidence le
  // dernier titre passé sous la barre du haut, comme une table des matières
  // qui accompagne la page en cours.
  useEffect(() => {
    if (!visible || items.length === 0) return;

    let ticking = false;

    function computeActive() {
      let current: number | null = null;
      for (const item of items) {
        const dom = editor.view.nodeDOM(item.pos) as HTMLElement | null;
        if (!dom || typeof dom.getBoundingClientRect !== "function") continue;
        const top = dom.getBoundingClientRect().top;
        if (top - SCROLL_SPY_THRESHOLD <= 0) {
          current = item.pos;
        } else {
          break;
        }
      }
      if (current === null) current = items[0].pos;
      setActivePos(current);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        computeActive();
        ticking = false;
      });
    }

    computeActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [editor, items, visible]);

  function goTo(pos: number) {
    setActivePos(pos);
    editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
  }

  if (!visible) return null;

  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>Structure</h2>
      {items.length === 0 ? (
        <p className={styles.empty}>Ajoutez des titres (Titre 1, 2, 3) pour voir apparaître le plan du document.</p>
      ) : (
        <nav className={styles.list}>
          {items.map((item) => (
            <button
              key={item.id}
              className={styles.item}
              data-level={item.level}
              data-active={activePos === item.pos || undefined}
              onClick={() => goTo(item.pos)}
              title={item.text}
            >
              {item.text}
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
