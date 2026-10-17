"use client";

import { useState } from "react";
import styles from "./chartmodal.module.css";

type Row = { label: string; value: string };

type Props = {
  onInsert: (svgDataUrl: string) => void;
  onClose: () => void;
};

const COLORS = ["#4b3f72", "#b8902e", "#a13d3d", "#2e6b52", "#3a5a78"];

export default function ChartModal({ onInsert, onClose }: Props) {
  const [title, setTitle] = useState("Répartition");
  const [rows, setRows] = useState<Row[]>([
    { label: "Janvier", value: "40" },
    { label: "Février", value: "65" },
    { label: "Mars", value: "50" },
  ]);

  function updateRow(i: number, field: keyof Row, val: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { label: "", value: "0" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function buildSvg(): string {
    const width = 560;
    const height = 320;
    const padding = 48;
    const chartHeight = height - padding * 2;
    const values = rows.map((r) => Math.max(0, parseFloat(r.value) || 0));
    const max = Math.max(1, ...values);
    const barWidth = (width - padding * 2) / rows.length - 16;

    const bars = rows
      .map((r, i) => {
        const v = values[i];
        const barHeight = (v / max) * chartHeight;
        const x = padding + i * ((width - padding * 2) / rows.length) + 8;
        const y = height - padding - barHeight;
        const color = COLORS[i % COLORS.length];
        return `
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="3"/>
          <text x="${x + barWidth / 2}" y="${height - padding + 18}" font-size="12" font-family="Inter, sans-serif" fill="#4a4852" text-anchor="middle">${escapeXml(r.label)}</text>
          <text x="${x + barWidth / 2}" y="${y - 8}" font-size="12" font-family="Inter, sans-serif" fill="#1c1b22" text-anchor="middle">${escapeXml(r.value)}</text>
        `;
      })
      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      <text x="${padding}" y="28" font-size="16" font-family="'Source Serif 4', serif" fill="#1c1b22" font-weight="600">${escapeXml(title)}</text>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#dedad2"/>
      ${bars}
    </svg>`;

    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  function escapeXml(s: string) {
    return s.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        default: return "&quot;";
      }
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.heading}>Insérer un graphique</h3>

        <div className={styles.field}>
          <label>Titre</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className={styles.rows}>
          {rows.map((r, i) => (
            <div key={i} className={styles.row}>
              <input
                placeholder="Étiquette"
                value={r.label}
                onChange={(e) => updateRow(i, "label", e.target.value)}
              />
              <input
                placeholder="Valeur"
                type="number"
                value={r.value}
                onChange={(e) => updateRow(i, "value", e.target.value)}
              />
              <button className={styles.removeBtn} onClick={() => removeRow(i)} aria-label="Retirer">
                ×
              </button>
            </div>
          ))}
        </div>

        <button className={styles.addBtn} onClick={addRow}>
          + Ajouter une ligne
        </button>

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose}>
            Annuler
          </button>
          <button className={styles.confirm} onClick={() => onInsert(buildSvg())}>
            Insérer
          </button>
        </div>
      </div>
    </div>
  );
}
