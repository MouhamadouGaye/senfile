"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import styles from "./dropdown.module.css";

const OPTIONS = [
  { key: "paragraph", label: "Texte" },
  { key: "h1", label: "Titre 1" },
  { key: "h2", label: "Titre 2" },
  { key: "h3", label: "Titre 3" },
  { key: "blockquote", label: "Citation" },
];

export default function StyleDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function current() {
    if (editor.isActive("heading", { level: 1 })) return "Titre 1";
    if (editor.isActive("heading", { level: 2 })) return "Titre 2";
    if (editor.isActive("heading", { level: 3 })) return "Titre 3";
    if (editor.isActive("blockquote")) return "Citation";
    return "Texte";
  }

  function apply(key: string) {
    // On retire d'abord toute taille de police personnalisée sur la sélection :
    // sinon un <span style="font-size:...px"> hérité reste plus prioritaire
    // que la taille définie par le CSS du titre (h1/h2/h3), et seul l'espacement
    // du bloc semble changer sans que le texte ne grossisse réellement.
    const chain = editor.chain().focus().unsetFontSize();
    if (key === "paragraph") chain.setParagraph().run();
    else if (key === "blockquote") chain.toggleBlockquote().run();
    else chain.toggleHeading({ level: Number(key.replace("h", "")) as 1 | 2 | 3 }).run();
    setOpen(false);
  }

  return (
    <div className={styles.dropdown} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        <span className={styles.triggerLabel}>{current()}</span>
        <span className={styles.chevron}>▾</span>
      </button>
      {open && (
        <div className={styles.menu}>
          {OPTIONS.map((o) => (
            <button key={o.key} className={styles.menuItem} onClick={() => apply(o.key)}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
