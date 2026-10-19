import { useEffect, useMemo, useState } from "react";
import { api, fmt, letter } from "./lib";
import type { Meta, Data } from "./lib";
export type Box = { r0: number; r1: number; c0: number; c1: number };
export type K = "bar" | "line" | "pie" | "scatter";
const nv = (v: any) => (typeof v === "number" ? v : Number(String(v ?? "").replace(",", ".")) || 0);

export function useChartData(t: Meta, box: Box | null, group: boolean, ver: number): Data | null {
  const [raw, setRaw] = useState<any[][] | null>(null);
  useEffect(() => { if (!box) return; let on = true; api(`/tables/${t.id}/rows?off=${box.r0}&lim=${Math.min(Math.max(box.r1 - box.r0 + 1, 1), 20000)}`).then(r => on && setRaw(r)).catch(() => {}); return () => { on = false; }; }, [t.id, ver, box?.r0, box?.r1]);
  return useMemo(() => {
    if (!raw || !box) return null;
    const sl = raw.map(r => r.slice(box.c0, box.c1 + 1)), names = Array.from({ length: box.c1 - box.c0 + 1 }, (_, k) => t.columns[box.c0 + k] ?? letter(box.c0 + k)), multi = names.length > 1;
    let labels = sl.map((r, i) => (multi ? fmt(r[0]) : String(box.r0 + i + 1)));
    const ser = (multi ? names.slice(1) : names).map((name, k) => ({ name, values: sl.map(r => nv(r[multi ? k + 1 : k])) }));
    if (group && multi) {
      const g = new Map<string, number[]>(); labels.forEach((l, i) => { const a = g.get(l) ?? ser.map(() => 0); ser.forEach((s, k) => (a[k] += s.values[i])); g.set(l, a); });
      labels = [...g.keys()]; const vs = [...g.values()]; ser.forEach((s, k) => (s.values = vs.map(a => a[k])));
    }
    return { labels: labels.slice(0, 500), series: ser.map(s => ({ ...s, values: s.values.slice(0, 500) })) };
  }, [raw, group, box?.c0, box?.c1, box?.r0, t.columns]);
}
export function recommend(d: Data): K[] {
  const numeric = d.labels.length > 0 && d.labels.every(l => l !== "" && (!Number.isNaN(Number(l.replace(",", "."))) || /^\d{4}-\d{2}/.test(l)));
  const pos = !!d.series[0]?.values.every(v => v >= 0) && d.labels.length <= 12;
  return numeric ? ["line", "scatter", "bar"] : pos ? ["bar", "pie", "line"] : ["bar", "line"];
}
