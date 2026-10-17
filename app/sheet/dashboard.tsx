"use client";
import { useEffect, useState } from "react";
function CountUp({ v }: { v: number | null }) {
  const [x, setX] = useState(0);
  useEffect(() => { if (v === null) return; if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setX(v); return; } const s = performance.now(); let f = 0; const tk = (n: number) => { const p = Math.min(1, (n - s) / 800); setX(v * (1 - Math.pow(1 - p, 3))); if (p < 1) f = requestAnimationFrame(tk); }; f = requestAnimationFrame(tk); return () => cancelAnimationFrame(f); }, [v]);
  return <>{nf(v === null ? null : x)}</>;
}
import { api, post, send, nf } from "./lib";
import type { Meta } from "./lib";
import { Chart } from "./dialogs";

type W = { type: string; title: string; value?: number | null; chart?: string; labels?: string[]; series?: { name: string; values: number[] }[]; cfg?: any };
export function DashboardView({ t, ver }: { t: Meta; ver: number }) {
  const [d, setD] = useState<{ auto: W[]; custom: W[] } | null>(null), [err, setErr] = useState("");
  const [f, setF] = useState({ kind: "chart", by: t.columns[0] ?? "", col: t.columns[1] ?? "", agg: "sum", chart: "bar" });
  const load = () => api(`/tables/${t.id}/dashboard`).then(x => { setD(x); setErr(""); }).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [t.id, ver]);
  const pin = async (cfg: any) => { await post(`/tables/${t.id}/widgets`, cfg); load(); };
  const del = async (i: number) => { await send("DELETE", `/tables/${t.id}/widgets/${i}`, {}); load(); };
  const S = ({ k, opts }: { k: "by" | "col" | "agg" | "chart" | "kind"; opts: string[][] }) => <select value={(f as any)[k]} onChange={e => setF({ ...f, [k]: e.target.value })}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
  const cols = t.columns.map(c => [c, c]);
  const card = (w: W, i: number, custom: boolean) => (
    <article key={(custom ? "c" : "a") + i} className={"wd " + w.type}>
      <header><b>{w.title}</b><button onClick={() => (custom ? del(i) : pin(w.cfg))}>{custom ? "Retirer" : "Épingler"}</button></header>
      {w.type === "kpi" ? <div className="big"><CountUp v={w.value ?? null} /></div> : w.type === "chart" && w.labels ? <Chart d={{ labels: w.labels, series: w.series! }} kind={w.chart as any} /> : <p>{w.title}</p>}
    </article>);
  return (
    <section className="dash">
      <div className="row add"><b>Ajouter</b><S k="kind" opts={[["kpi", "un indicateur"], ["chart", "un graphique"]]} />
        {f.kind === "chart" && <>par <S k="by" opts={cols} /></>}de <S k="col" opts={[["", "(nombre de lignes)"], ...cols]} /><S k="agg" opts={[["sum", "somme"], ["mean", "moyenne"], ["count", "nombre"], ["min", "minimum"], ["max", "maximum"], ["median", "médiane"]]} />
        {f.kind === "chart" && <S k="chart" opts={[["bar", "barres"], ["line", "courbe"], ["pie", "secteurs"]]} />}<button className="primary" onClick={() => pin(f)}>Ajouter</button>
        {Object.keys(t.filters ?? {}).length > 0 && <span className="chip">Filtres appliqués : {t.total} lignes</span>}</div>
      {err && <p>{err}</p>}
      <div className="wgrid">{d?.custom.map((w, i) => card(w, i, true))}{d?.auto.map((w, i) => card(w, i, false))}</div>
    </section>
  );
}
