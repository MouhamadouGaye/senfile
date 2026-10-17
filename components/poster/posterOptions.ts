import type { CSSProperties } from "react";

export const FONT_SIZES = Array.from({ length: 17 }, (_, i) => 8 + i * 4); // 8…72

export const FONTS = [
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "DM Serif Display", value: "'DM Serif Display', serif" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { label: "Source Serif 4", value: "'Source Serif 4', serif" },
  { label: "Merriweather", value: "'Merriweather', serif" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', serif" },
];

export const BULLETS = ["•", "–", "▪", "→", "›", "✦", "◆", "★", "❖", "○"];

export const TEXT_PRESETS = {
  Titre: {
    fontSize: 48,
    fontWeight: 700,
    letterSpacing: -1,
    lineHeight: 1.1,
    textTransform: "none",
  },
  "Sous-titre": {
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: 0,
    lineHeight: 1.2,
    textTransform: "none",
  },
  Corps: {
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.5,
    textTransform: "none",
  },
  Légende: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 2,
    lineHeight: 1.3,
    textTransform: "uppercase",
  },
} as const;

export function textStyleOf(el: {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: string;
  textDecoration?: string;
  textTransform?: string;
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  align?: string;
}): CSSProperties {
  return {
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    fontStyle: el.fontStyle as CSSProperties["fontStyle"],
    textDecoration: el.textDecoration,
    textTransform: el.textTransform as CSSProperties["textTransform"],
    letterSpacing: el.letterSpacing,
    lineHeight: el.lineHeight ?? 1.25,
    color: el.color,
    textAlign: el.align as CSSProperties["textAlign"],
    whiteSpace: "pre-wrap",
  };
}

/** Ajoute / retire une puce au début de chaque ligne. */
export function toggleBullet(text: string, bullet: string) {
  const lines = text.split("\n");
  const allHave = lines.every((l) => l.startsWith(bullet + " "));
  return lines
    .map((l) => {
      if (allHave) return l.slice(bullet.length + 1);
      const other = BULLETS.find((b) => l.startsWith(b + " "));
      return bullet + " " + (other ? l.slice(other.length + 1) : l);
    })
    .join("\n");
}
