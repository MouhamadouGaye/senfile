"use client";

import { useEffect, useRef, useState } from "react";
import { Type } from "lucide-react";
import { PosterElement } from "@/lib/api";
import { TEXT_STYLE_PRESETS, TEXT_COLOR_PALETTE } from "./textStylePresets";
import styles from "./textstyles.module.css";

type Props = {
  onApplyStyle: (patch: Partial<PosterElement>) => void;
  onApplyColor: (color: string) => void;
};

export default function TextStylesMenu({ onApplyStyle, onApplyColor }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)} title="Styles et couleurs de texte">
        <Type size={14} /> Styles
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.sectionLabel}>Couleur</div>
          <div className={styles.colorGrid}>
            {TEXT_COLOR_PALETTE.map((c) => (
              <button
                key={c}
                className={styles.swatch}
                style={{ background: c }}
                onClick={() => onApplyColor(c)}
                aria-label={`Couleur ${c}`}
              />
            ))}
          </div>

          <div className={styles.sectionLabel}>Styles (20)</div>
          <div className={styles.styleGrid}>
            {TEXT_STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={styles.styleCard}
                style={{
                  fontFamily: preset.fontFamily,
                  fontWeight: preset.fontWeight,
                  color: preset.color,
                  fontSize: 15,
                }}
                onClick={() =>
                  onApplyStyle({
                    fontFamily: preset.fontFamily,
                    fontWeight: preset.fontWeight,
                    color: preset.color,
                    letterSpacing: preset.letterSpacing,
                  })
                }
              >
                Aa
                <span className={styles.styleCardLabel}>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
