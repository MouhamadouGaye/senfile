"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import dropdownStyles from "./dropdown.module.css";
import styles from "./fontsize.module.css";

const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
const BASE_SIZE = 17; // taille par défaut du corps de texte (voir editor.module.css)

export default function FontSizeControl({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function currentSize(): number {
    const attrs = editor.getAttributes("textStyle");
    return attrs.fontSize ? parseInt(attrs.fontSize, 10) : BASE_SIZE;
  }

  function setSize(size: number) {
    editor.chain().focus().setFontSize(`${size}px`).run();
    setOpen(false);
  }

  function step(delta: number) {
    const next = Math.max(8, Math.min(96, currentSize() + delta));
    setSize(next);
  }

  return (
    <div className={styles.group} ref={ref}>
      <button className={styles.stepBtn} onClick={() => step(-1)} title="Réduire la police" aria-label="Réduire la police">
        A−
      </button>

      <div className={dropdownStyles.dropdown}>
        <button className={styles.sizeTrigger} onClick={() => setOpen((o) => !o)}>
          {currentSize()}
        </button>
        {open && (
          <div className={dropdownStyles.menu}>
            {SIZES.map((s) => (
              <button key={s} className={dropdownStyles.menuItem} onClick={() => setSize(s)}>
                {s} px
              </button>
            ))}
          </div>
        )}
      </div>

      <button className={styles.stepBtn} onClick={() => step(1)} title="Augmenter la police" aria-label="Augmenter la police">
        A+
      </button>
    </div>
  );
}
