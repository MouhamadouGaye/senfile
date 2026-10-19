"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import styles from "./dropdown.module.css";

const FONTS = [
  { label: "Source Serif (défaut)", value: "" }, // vide = hérite du style du document
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Merriweather", value: "Merriweather, serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  // Polices les plus utilisées / lisibles en petite taille, ajoutées ensuite
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Nunito", value: "Nunito, sans-serif" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', serif" },
];

export default function FontFamilyControl({ editor }: { editor: Editor }) {
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
    const attrs = editor.getAttributes("textStyle");
    const match = FONTS.find((f) => f.value && f.value === attrs.fontFamily);
    return match ? match.label : "Police";
  }

  function apply(value: string) {
    if (value) editor.chain().focus().setFontFamily(value).run();
    else editor.chain().focus().unsetFontFamily().run();
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
          {FONTS.map((f) => (
            <button
              key={f.label}
              className={styles.menuItem}
              style={{ fontFamily: f.value || "var(--font-display)" }}
              onClick={() => apply(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
