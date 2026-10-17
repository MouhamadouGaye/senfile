"use client";
import { useEffect, useMemo, useState } from "react";
import { api, post, fmt, letter, COLORS } from "./lib";
import type { Meta, Res, Data, Rule, Op } from "./lib";

export function MenuList({ items, close }: { items: any[]; close: () => void }) {
  return <div className="menu" role="menu">{items.map((it, i) => it.sep ? <hr key={i} /> :
    <button key={i} role="menuitem" onClick={() => { close(); it.run(); }}><span>{it.label}</span><kbd>{it.hint}</kbd></button>)}</div>;
}

export type Kind = "bar" | "line" | "pie" | "scatter";
const PAL = ["oklch(60% .17 262)", "oklch(68% .16 150)", "oklch(72% .16 60)", "oklch(62% .2 20)", "oklch(62% .16 310)", "oklch(70% .12 200)"];

export function Chart({ d, kind }: { d: Data; kind: Kind }) {
  const W = 720, H = 380, m = { l: 60, r: 16, t: 16, b: 60 }, iw = W - m.l - m.r, ih = H - m.t - m.b, n = d.labels.length;
  const all = d.series.flatMap(s => s.values), lo = Math.min(0, ...all), hi = Math.max(0, ...all);
  const span = hi - lo || 1, raw = span / 5, pw = 10 ** Math.floor(Math.log10(raw)), st = ([1, 2, 5, 10].find(k => k * pw >= raw) ?? 10) * pw;
  const ticks: number[] = []; for (let v = Math.floor(lo / st) * st; v <= Math.ceil(hi / st) * st + 1e-9; v += st) ticks.push(+v.toFixed(10));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1], Y = (v: number) => m.t + ih - ((v - y0) / (y1 - y0 || 1)) * ih;
  const xs = d.labels.map(Number), numX = kind === "scatter" && xs.every(Number.isFinite), xmin = Math.min(...xs), xmax = Math.max(...xs);
  const X = (i: number) => numX ? m.l + ((xs[i] - xmin) / (xmax - xmin || 1)) * iw : m.l + (i + .5) * (iw / n);
  const every = Math.ceil(n / 12), txt = { fill: "#778", fontSize: 11 };
  if (kind === "pie") {
    const s = d.series[0], tot = s.values.reduce((a, b) => a + Math.max(b, 0), 0) || 1; let a0 = -Math.PI / 2;
    return <svg id="chart-svg" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">{d.labels.slice(0, 12).map((l, i) => {
      const v = Math.max(s.values[i], 0), a1 = a0 + (v / tot) * 2 * Math.PI, R = 160, cx = 200, cy = 190;
      const p = `M${cx},${cy}L${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)}A${R},${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)}Z`; a0 = a1;
      return <g key={i}><path d={p} fill={PAL[i % 6]} className="pie-a" style={{ animationDelay: `${i * 60}ms` }} stroke="#fff" strokeWidth={1.5}><title>{`${l} : ${v} (${Math.round((v / tot) * 100)} %)`}</title></path>
        <rect x={400} y={30 + i * 26} width={12} height={12} rx={3} fill={PAL[i % 6]} /><text x={420} y={41 + i * 26} {...txt} fontSize={13}>{`${l.slice(0, 22)} · ${Math.round((v / tot) * 100)} %`}</text></g>;
    })}</svg>;
  }
  return (
    <svg id="chart-svg" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      {ticks.map(v => <g key={v}><line x1={m.l} x2={W - m.r} y1={Y(v)} y2={Y(v)} stroke="#8884" /><text x={m.l - 8} y={Y(v) + 4} textAnchor="end" {...txt}>{new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(v)}</text></g>)}
      {d.labels.map((l, i) => i % every === 0 && <text key={i} x={X(i)} y={H - m.b + 18} textAnchor="end" transform={`rotate(-30 ${X(i)} ${H - m.b + 18})`} {...txt}>{l.slice(0, 16)}</text>)}
      {d.series.map((s, k) => kind === "bar" ? s.values.map((v, i) => { const gw = iw / n, bw = (gw * .8) / d.series.length;
          return <rect key={`${k}-${i}`} x={m.l + i * gw + gw * .1 + k * bw} y={Math.min(Y(v), Y(0))} width={Math.max(bw - 1, 1)} height={Math.abs(Y(v) - Y(0))} rx={2} fill={PAL[k % 6]} className="bar-a" style={{ animationDelay: `${Math.min(i * 25, 400)}ms` }}><title>{`${d.labels[i]} · ${s.name} : ${v}`}</title></rect>; })
        : kind === "line" ? <g key={k}><polyline fill="none" pathLength={1} className="line-a" stroke={PAL[k % 6]} strokeWidth={2.2} points={s.values.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} />
            {n <= 60 && s.values.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r={3.2} className="dot-a" fill={PAL[k % 6]}><title>{`${d.labels[i]} · ${s.name} : ${v}`}</title></circle>)}</g>
        : s.values.map((v, i) => <circle key={`${k}-${i}`} cx={X(i)} cy={Y(v)} r={4} fill={PAL[k % 6]} className="dot-a" fillOpacity={.7}><title>{`${d.labels[i]} · ${s.name} : ${v}`}</title></circle>))}
    </svg>
  );
}

export function ChartDialog({ t, box, data, onClose, kind: k0 }: { t: Meta; box?: { r0: number; r1: number; c0: number; c1: number }; data?: Data; onClose: () => void; kind?: Kind }) {
  const [kind, setKind] = useState<Kind>(k0 ?? "bar"), [raw, setRaw] = useState<any[][] | null>(null), [group, setGroup] = useState(true), [err, setErr] = useState("");
  useEffect(() => { if (!data && box) api(`/tables/${t.id}/rows?off=${box.r0}&lim=${Math.min(Math.max(box.r1 - box.r0 + 1, 1), 20000)}`).then(setRaw).catch(e => setErr(e.message)); }, []);
  const d = useMemo<Data | null>(() => {
    if (data) return data; if (!raw || !box) return null;
    const sl = raw.map(r => r.slice(box.c0, box.c1 + 1)), names = Array.from({ length: box.c1 - box.c0 + 1 }, (_, k) => t.columns[box.c0 + k] ?? letter(box.c0 + k)), multi = names.length > 1;
    let labels = sl.map((r, i) => (multi ? fmt(r[0]) : String(box.r0 + i + 1)));
    const ser = (multi ? names.slice(1) : names).map((name, k) => ({ name, values: sl.map(r => Number(r[multi ? k + 1 : k]) || 0) }));
    if (group && multi) {
      const g = new Map<string, number[]>(); labels.forEach((l, i) => { const a = g.get(l) ?? ser.map(() => 0); ser.forEach((s, k) => (a[k] += s.values[i])); g.set(l, a); });
      labels = [...g.keys()]; const vs = [...g.values()]; ser.forEach((s, k) => (s.values = vs.map(a => a[k])));
    }
    return { labels: labels.slice(0, 500), series: ser.map(s => ({ ...s, values: s.values.slice(0, 500) })) };
  }, [raw, group, data]);
  const download = () => { const el = document.getElementById("chart-svg"); if (!el) return; const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(el)], { type: "image/svg+xml" })); a.download = "graphique.svg"; a.click(); };
  return (
    <div className="modal" onClick={onClose}><div className="card wide" onClick={e => e.stopPropagation()}>
      <h2>Graphique</h2>
      <div className="row">{(["bar", "line", "pie", "scatter"] as Kind[]).map(k => <button key={k} className={kind === k ? "primary" : ""} onClick={() => setKind(k)}>{{ bar: "Barres", line: "Courbes", pie: "Secteurs", scatter: "Nuage de points" }[k]}</button>)}
        {!data && <label><input type="checkbox" checked={group} onChange={e => setGroup(e.target.checked)} /> Regrouper les étiquettes identiques (somme)</label>}</div>
      {err ? <p>{err}</p> : d ? <Chart d={d} kind={kind} /> : <p>Chargement…</p>}
      {d && d.series.length > 1 && kind !== "pie" && <div className="row">{d.series.map((s, k) => <span key={k} className="chip"><b style={{ color: PAL[k % 6] }}>●</b> {s.name}</span>)}</div>}
      <p>{data ? "" : "La première colonne sélectionnée sert d’étiquettes, les suivantes de séries. 500 points au maximum."}</p>
      <div className="row end"><button onClick={download}>Télécharger (SVG)</button><button className="primary" onClick={onClose}>Fermer</button></div>
    </div></div>
  );
}

export function PivotDialog({ t, onClose, onSave }: { t: Meta; onClose: () => void; onSave: (m: Meta) => void }) {
  const cols = t.columns, [rows, setRows] = useState(cols[0] ?? ""), [cc, setCc] = useState(""), [val, setVal] = useState(cols[1] ?? cols[0] ?? ""), [agg, setAgg] = useState("sum");
  const [out, setOut] = useState<Res>(null), [err, setErr] = useState(""), [chart, setChart] = useState(false);
  useEffect(() => { const id = setTimeout(() => post(`/tables/${t.id}/pivot`, { rows, cols: cc, value: val, agg }).then(r => { setOut(r); setErr(""); }).catch(e => setErr(e.message)), 200); return () => clearTimeout(id); }, [rows, cc, val, agg]);
  const S = ({ v, set, opts, none }: { v: string; set: (s: string) => void; opts: string[]; none?: string }) => <select value={v} onChange={e => set(e.target.value)}>{none && <option value="">{none}</option>}{opts.map(c => <option key={c}>{c}</option>)}</select>;
  const cd = (): Data | null => { if (!out) return null; const tc = out.columns[out.columns.length - 1] === "Total" && out.columns.length > 2, body = out.rows.filter(r => r[0] !== "Total");
    return { labels: body.map(r => fmt(r[0])), series: out.columns.slice(1, tc ? -1 : undefined).map((name, k) => ({ name, values: body.map(r => Number(r[k + 1]) || 0) })) }; };
  return (
    <div className="modal" onClick={onClose}><div className="card wide" onClick={e => e.stopPropagation()}>
      <h2>Tableau croisé dynamique</h2>
      <div className="row">Regrouper par <S v={rows} set={setRows} opts={cols} /> et séparer par <S v={cc} set={setCc} opts={cols.filter(c => c !== rows)} none="(rien)" /></div>
      <div className="row">Calculer <select value={agg} onChange={e => setAgg(e.target.value)}>{[["sum", "la somme"], ["mean", "la moyenne"], ["count", "le nombre de lignes"], ["min", "le minimum"], ["max", "le maximum"], ["median", "la médiane"]].map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        {agg !== "count" && <>de <S v={val} set={setVal} opts={cols} /></>}</div>
      {err ? <p>{err}</p> : out && <div className="tblv"><table><thead><tr>{out.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{out.rows.slice(0, 200).map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{fmt(v)}</td>)}</tr>)}</tbody></table></div>}
      <div className="row end"><button onClick={onClose}>Fermer</button><button onClick={() => setChart(true)} disabled={!out}>Graphique</button>
        <button className="primary" onClick={async () => onSave(await post(`/tables/${t.id}/pivot`, { rows, cols: cc, value: val, agg, save: true }))}>Enregistrer comme tableau</button></div>
      {chart && cd() && <ChartDialog t={t} data={cd()!} onClose={() => setChart(false)} />}
    </div></div>
  );
}

const OPS: [string, string][] = [["gt", "est supérieur à"], ["lt", "est inférieur à"], ["eq", "est égal à"], ["ne", "est différent de"], ["between", "est entre"], ["contains", "contient"], ["starts", "commence par"], ["empty", "est vide"], ["neg", "est négatif"], ["err", "est une erreur"]];
export function RulesDialog({ t, rules, onChange, onClose }: { t: Meta; rules: Rule[]; onChange: (r: Rule[]) => void; onClose: () => void }) {
  const [col, setCol] = useState(""), [op, setOp] = useState("gt"), [a, setA] = useState(""), [b, setB] = useState(""), [color, setColor] = useState(COLORS[0]);
  const label = (r: Rule) => `${r.col || "Toutes les colonnes"} ${OPS.find(o => o[0] === r.op)?.[1]} ${["empty", "neg", "err"].includes(r.op) ? "" : r.a}${r.op === "between" ? " et " + r.b : ""}`;
  return (
    <div className="modal" onClick={onClose}><div className="card wide" onClick={e => e.stopPropagation()}>
      <h2>Mise en forme conditionnelle</h2>
      <p>Colorez automatiquement les cellules selon leur valeur. Les règles sont enregistrées avec le tableau.</p>
      {rules.map((r, i) => <div className="row rule" key={i}><i className="sw" style={{ background: r.color }} /><span>{label(r)}</span><span className="sp" /><button onClick={() => onChange(rules.filter((_, k) => k !== i))}>Supprimer</button></div>)}
      <div className="row">Dans <select value={col} onChange={e => setCol(e.target.value)}><option value="">toutes les colonnes</option>{t.columns.map(c => <option key={c}>{c}</option>)}</select>
        colorer les cellules dont la valeur <select value={op} onChange={e => setOp(e.target.value)}>{OPS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        {!["empty", "neg", "err"].includes(op) && <input className="find" style={{ minWidth: 0, width: 110 }} value={a} onChange={e => setA(e.target.value)} />}
        {op === "between" && <>et <input className="find" style={{ minWidth: 0, width: 110 }} value={b} onChange={e => setB(e.target.value)} /></>}</div>
      <div className="row">{COLORS.map(c => <button key={c} className={"swb" + (c === color ? " on" : "")} style={{ background: c }} onClick={() => setColor(c)} aria-label="couleur" />)}
        <span className="sp" /><button className="primary" onClick={() => onChange([...rules, { col, op, a, b, color }])}>Ajouter la règle</button></div>
      <div className="row end"><button onClick={onClose}>Fermer</button></div>
    </div></div>
  );
}

const CONDS: [string, string][] = [["", "Pas de condition"], ["contains", "Contient"], ["eq", "Est égal à"], ["ne", "Est différent de"], ["gt", "Supérieur à"], ["lt", "Inférieur à"], ["empty", "Est vide"], ["notempty", "N'est pas vide"]];
export function FilterMenu({ t, c, x, y, onClose, onApply, onSort, agg, onAgg, onQuick }: { t: Meta; c: number; x: number; y: number; onClose: () => void; onApply: (m: Meta) => void; onSort: (asc: boolean) => void; agg: string; onAgg: (a: string) => void; onQuick: (op: string) => void }) {
  const name = t.columns[c], cur = t.filters?.[name] ?? {};
  const [op, setOp] = useState<string>(cur.op ?? ""), [arg, setArg] = useState<string>(cur.arg ?? ""), [vals, setVals] = useState<{ v: string; n: number }[]>([]);
  const [chk, setChk] = useState<Set<string>>(new Set()), [q, setQ] = useState(""), [touched, setTouched] = useState(false);
  useEffect(() => { api(`/tables/${t.id}/distinct?col=${encodeURIComponent(name)}`).then((l: { v: string; n: number }[]) => { setVals(l); setChk(new Set(cur.values ?? l.map(z => z.v))); }); }, []);
  const shown = vals.filter(z => z.v.toLowerCase().includes(q.toLowerCase()));
  const toggle = (v: string) => { setTouched(true); setChk(s => { const n = new Set(s); n.has(v) ? n.delete(v) : n.add(v); return n; }); };
  const setAll = (on: boolean) => { setTouched(true); setChk(s => { const n = new Set(s); shown.forEach(z => (on ? n.add(z.v) : n.delete(z.v))); return n; }); };
  const apply = async () => {
    const values = touched ? (chk.size === vals.length ? null : [...chk]) : cur.values ?? null;
    onApply(!op && values === null ? await post(`/tables/${t.id}/filter`, { col: name, clear: true }) : await post(`/tables/${t.id}/filter`, { col: name, op, arg, values }));
  };
  return (
    <div className="fm-back" onClick={onClose}><div className="menu fmenu" style={{ left: x, top: y }} onClick={e => e.stopPropagation()}>
      <div className="row"><button onClick={() => onSort(true)}>Trier A→Z</button><button onClick={() => onSort(false)}>Trier Z→A</button></div><hr />
      <div className="row"><span>Résumé en bas</span><select value={agg} onChange={e => onAgg(e.target.value)}>{[["", "(aucun)"], ["sum", "Somme"], ["mean", "Moyenne"], ["min", "Minimum"], ["max", "Maximum"], ["median", "Médiane"], ["count", "Nombre"]].map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      <div className="row">{[["pct_total", "% du total"], ["cumsum", "Cumul"], ["rank", "Rang"], ["zscore", "Écart type"]].map(([k, l]) => <button key={k} onClick={() => onQuick(k)}>+ {l}</button>)}</div><hr />
      <select value={op} onChange={e => setOp(e.target.value)}>{CONDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      {op && !["empty", "notempty"].includes(op) && <input className="find" style={{ minWidth: 0 }} placeholder="Valeur" value={arg} onChange={e => setArg(e.target.value)} autoFocus />}<hr />
      <input className="find" style={{ minWidth: 0 }} placeholder="Chercher une valeur" value={q} onChange={e => setQ(e.target.value)} />
      <div className="row"><button onClick={() => setAll(true)}>Tout cocher</button><button onClick={() => setAll(false)}>Tout décocher</button></div>
      <div className="pick fpick">{shown.map(z => <label key={z.v}><input type="checkbox" checked={chk.has(z.v)} onChange={() => toggle(z.v)} /> {z.v || "(vide)"} <small>{z.n}</small></label>)}</div><hr />
      <div className="row end"><button onClick={async () => onApply(await post(`/tables/${t.id}/filter`, { col: name, clear: true }))}>Effacer</button><button className="primary" onClick={apply}>Appliquer</button></div>
    </div></div>
  );
}

export function FormulaHelp({ onPick, onClose }: { onPick: (name: string) => void; onClose: () => void }) {
  const [l, setL] = useState<{ name: string; sig: string; desc: string }[]>([]), [q, setQ] = useState("");
  useEffect(() => { api("/formulas").then(setL); }, []);
  return (
    <div className="modal" onClick={onClose}><div className="card wide" onClick={e => e.stopPropagation()}>
      <h2>Fonctions</h2>
      <p>Tapez <b>=</b> dans une cellule. Références : <b>A1</b>, <b>A1:B10</b>, <b>A:A</b> ou, plus simple, <b>[nom de la colonne]</b>. Les noms anglais fonctionnent aussi (SUM, IF, VLOOKUP…). Autre feuille : <b>Ventes!B2</b>, <b>Ventes![prix]</b> ou <b>'Mon tableau'!A:A</b>.</p>
      <input className="find" style={{ minWidth: 0 }} placeholder="Chercher une fonction" value={q} onChange={e => setQ(e.target.value)} autoFocus />
      <div className="fhelp">{l.filter(f => (f.sig + f.desc).toLowerCase().includes(q.toLowerCase())).map(f => <button key={f.name} onClick={() => onPick(f.name)}><b>{f.sig}</b><span>{f.desc}</span></button>)}</div>
      <div className="row end"><button onClick={onClose}>Fermer</button></div>
    </div></div>
  );
}

export function CalcDialog({ t, onClose, onDone }: { t: Meta; onClose: () => void; onDone: (m: Meta) => void }) {
  const [txt, setTxt] = useState(""), [err, setErr] = useState("");
  const go = async () => { const i = txt.indexOf("="), name = i > 0 ? txt.slice(0, i).trim() : "Calcul", expr = i > 0 ? txt.slice(i + 1) : txt; try { onDone(await post(`/tables/${t.id}/calc`, { name, expr })); } catch (e: any) { setErr(e.message); } };
  return (
    <div className="modal" onClick={onClose}><div className="card wide" onClick={e => e.stopPropagation()}>
      <h2>Colonne calculée</h2>
      <p>Calculez avec les noms de vos colonnes, sans formule compliquée. Exemple : <b>Total = prix * qte * 1,2</b> (ou avec crochets : [prix] pour les noms avec espaces).</p>
      <input className="find" style={{ minWidth: 0, width: "100%" }} autoFocus placeholder="Nom = calcul" value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} />
      <div className="row">{t.columns.slice(0, 16).map(c => <button key={c} onClick={() => setTxt(x => x + `[${c}]`)}>{c}</button>)}</div>
      {err && <p>{err}</p>}<div className="row end"><button onClick={onClose}>Annuler</button><button className="primary" onClick={go} disabled={!txt.trim()}>Créer la colonne</button></div>
    </div></div>
  );
}

export function Palette({ ops, actions, onOp, onClose }: { ops: Op[]; actions: { label: string; run: () => void }[]; onOp: (o: Op) => void; onClose: () => void }) {
  const [q, setQ] = useState(""), words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const items = [...actions.map(a => ({ k: "a" + a.label, label: a.label, hint: "Action", run: () => { onClose(); a.run(); } })), ...ops.map(o => ({ k: o.id, label: o.label, hint: o.cat, run: () => onOp(o) }))]
    .filter(i => words.every(w => (i.label + " " + i.hint).toLowerCase().includes(w))).slice(0, 30);
  return (
    <div className="modal top" onClick={onClose}><div className="card wide" onClick={e => e.stopPropagation()}>
      <input className="find" style={{ minWidth: 0, width: "100%" }} autoFocus placeholder="Que voulez-vous faire ? (doublons, trier, majuscules…)" value={q} onChange={e => setQ(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && items[0]) items[0].run(); if (e.key === "Escape") onClose(); }} />
      <div className="fhelp">{items.map(i => <button key={i.k} onClick={i.run}><b>{i.label}</b><span>{i.hint}</span></button>)}</div>
    </div></div>
  );
}
