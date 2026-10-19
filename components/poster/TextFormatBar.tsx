"use client";

import { PosterElement } from "@/lib/api";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CaseUpper,
} from "lucide-react";
import {
  FONT_SIZES,
  FONTS,
  BULLETS,
  TEXT_PRESETS,
  toggleBullet,
} from "./posterOptions";
import styles from "./poster-toolbar.module.css";

type Props = {
  element: PosterElement;
  onChange: (patch: Partial<PosterElement>) => void;
};

export default function TextFormatBar({ element: el, onChange }: Props) {
  const size = el.fontSize ?? 28;

  return (
    <div className={styles.group}>
      <select
        className={styles.btn}
        value=""
        onChange={(e) =>
          e.target.value &&
          onChange(
            TEXT_PRESETS[e.target.value as keyof typeof TEXT_PRESETS] as any,
          )
        }
        aria-label="Style de texte"
      >
        <option value="">Style…</option>
        {Object.keys(TEXT_PRESETS).map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>

      <select
        className={styles.btn}
        value={el.fontFamily ?? ""}
        onChange={(e) => onChange({ fontFamily: e.target.value })}
        aria-label="Police"
      >
        {!FONTS.some((f) => f.value === el.fontFamily) && (
          <option value={el.fontFamily}>
            {el.fontFamily?.split(",")[0].replace(/'/g, "") ?? "Police"}
          </option>
        )}
        {FONTS.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        className={styles.btn}
        value={size}
        onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
        aria-label="Taille"
      >
        {!FONT_SIZES.includes(size) && <option value={size}>{size}</option>}
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className={styles.divider} />

      <button
        className={styles.btn}
        data-active={(el.fontWeight ?? 400) >= 600}
        onClick={() =>
          onChange({ fontWeight: (el.fontWeight ?? 400) >= 600 ? 400 : 700 })
        }
        title="Gras"
      >
        <Bold size={16} />
      </button>
      <button
        className={styles.btn}
        data-active={el.fontStyle === "italic"}
        onClick={() =>
          onChange({
            fontStyle: el.fontStyle === "italic" ? "normal" : "italic",
          })
        }
        title="Italique"
      >
        <Italic size={16} />
      </button>
      <button
        className={styles.btn}
        data-active={el.textDecoration === "underline"}
        onClick={() =>
          onChange({
            textDecoration:
              el.textDecoration === "underline" ? "none" : "underline",
          })
        }
        title="Souligné"
      >
        <Underline size={16} />
      </button>
      <button
        className={styles.btn}
        data-active={el.textTransform === "uppercase"}
        onClick={() =>
          onChange({
            textTransform:
              el.textTransform === "uppercase" ? "none" : "uppercase",
          })
        }
        title="Majuscules"
      >
        <CaseUpper size={16} />
      </button>

      <div className={styles.divider} />

      {(["left", "center", "right"] as const).map((a) => {
        const Icon =
          a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
        return (
          <button
            key={a}
            className={styles.btn}
            data-active={(el.align ?? "left") === a}
            onClick={() => onChange({ align: a })}
            title={`Aligner ${a}`}
          >
            <Icon size={16} />
          </button>
        );
      })}

      <div className={styles.divider} />

      <select
        className={styles.btn}
        value=""
        onChange={(e) =>
          e.target.value &&
          onChange({ text: toggleBullet(el.text ?? "", e.target.value) })
        }
        aria-label="Puces"
      >
        <option value="">Puces…</option>
        {BULLETS.map((b) => (
          <option key={b} value={b}>
            {b} Élément
          </option>
        ))}
      </select>

      <label className={styles.opacityControl}>
        Espacement
        <input
          type="range"
          min={-2}
          max={12}
          step={0.5}
          value={el.letterSpacing ?? 0}
          onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
