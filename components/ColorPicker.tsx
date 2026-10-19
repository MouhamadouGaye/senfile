"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import styles from "./colorpicker.module.css";

// Six teintes cohérentes avec l'identité visuelle (encre/prune/or…), chacune
// déclinée du clair au foncé — plutôt que 5 couleurs isolées.
const HUES = [
  { name: "Encre", h: 250, s: 15 },
  { name: "Prune", h: 262, s: 38 },
  { name: "Or", h: 42, s: 60 },
  { name: "Rouge", h: 6, s: 50 },
  { name: "Vert", h: 152, s: 32 },
  { name: "Bleu", h: 212, s: 48 },
];
const LIGHTNESS = [82, 65, 50, 35, 20]; // clair → foncé

const PALETTE = HUES.map((hue) => ({
  name: hue.name,
  shades: LIGHTNESS.map((l) => `hsl(${hue.h} ${hue.s}% ${l}%)`),
}));

export default function ColorPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("#1c1b22");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function apply(color: string) {
    editor.chain().focus().setColor(color).run();
    setLast(color);
    setOpen(false);
  }

  function reset() {
    editor.chain().focus().unsetColor().run();
    setOpen(false);
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)} title="Couleur du texte" aria-label="Couleur du texte">
        <span className={styles.swatch} style={{ background: last }} />
      </button>
      {open && (
        <div className={styles.popover}>
          {PALETTE.map((row) => (
            <div key={row.name} className={styles.row}>
              {row.shades.map((c, i) => (
                <button
                  key={i}
                  className={styles.cell}
                  style={{ background: c }}
                  onClick={() => apply(c)}
                  title={`${row.name} ${i + 1}/${row.shades.length}`}
                  aria-label={`${row.name} nuance ${i + 1}`}
                />
              ))}
            </div>
          ))}
          <button className={styles.reset} onClick={reset}>
            Réinitialiser la couleur
          </button>
        </div>
      )}
    </div>
  );
}
