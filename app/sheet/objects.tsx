"use client";
import { useRef } from "react";
import { Chart } from "./dialogs";
import { useChartData } from "./chartdata";
import type { Meta } from "./lib";

export type Obj = { id: string; kind: string; x: number; y: number; w: number; h: number; src: string; cfg: any };
function ChartObj({ o, t, ver }: { o: Obj; t: Meta; ver: number }) {
  const d = useChartData(t, o.cfg.box, o.cfg.group, ver);
  return d ? <Chart d={d} kind={o.cfg.kind} /> : <p className="fo-load">Chargement…</p>;
}
export function FloatObj({ o, t, ver, sel, onSel, onMove, onCommit, onDelete }: { o: Obj; t: Meta; ver: number; sel: boolean; onSel: () => void; onMove: (p: Partial<Obj>) => void; onCommit: () => void; onDelete: () => void }) {
  const drag = useRef<{ mode: "m" | "r"; x: number; y: number; o: Obj } | null>(null);
  const down = (e: React.PointerEvent, mode: "m" | "r") => { e.stopPropagation(); e.preventDefault(); onSel(); (e.currentTarget as Element).setPointerCapture(e.pointerId); drag.current = { mode, x: e.clientX, y: e.clientY, o: { ...o } }; };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y;
    onMove(d.mode === "m" ? { x: Math.max(0, d.o.x + dx), y: Math.max(0, d.o.y + dy) } : { w: Math.max(90, d.o.w + dx), h: Math.max(60, d.o.h + dy) });
  };
  const up = () => { if (drag.current) { drag.current = null; onCommit(); } };
  return (
    <div className="fo" data-sel={sel} style={{ left: o.x, top: o.y, width: o.w, height: o.h }} onPointerDown={e => down(e, "m")} onPointerMove={move} onPointerUp={up} onClick={e => e.stopPropagation()}>
      {o.kind === "image" ? <img src={o.src} alt="Image insérée" draggable={false} /> : <ChartObj o={o} t={t} ver={ver} />}
      {sel && <><button className="fo-x" aria-label="Supprimer" onPointerDown={e => e.stopPropagation()} onClick={onDelete}>×</button><i className="fo-r" onPointerDown={e => down(e, "r")} /></>}
    </div>
  );
}
