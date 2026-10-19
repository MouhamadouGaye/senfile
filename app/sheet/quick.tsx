"use client";
import { useState } from "react";
import { Chart } from "./dialogs";
import { Icon } from "./icons";
import { useChartData, recommend } from "./chartdata";
import type { Box } from "./chartdata";
import { nf, COLORS } from "./lib";
import type { Meta, Rule } from "./lib";

const LABEL: Record<string, string> = { bar: "Barres", line: "Courbe", pie: "Secteurs", scatter: "Nuage de points" };
export function QuickAnalysis({ t, box, ver, stat, onClose, on }: { t: Meta; box: Box; ver: number; stat: any; onClose: () => void; on: { open: (k: string) => void; insert: (k: string) => void; fn: (f: string) => void; rule: (r: Rule) => void; pivot: () => void } }) {
  const [tab, setTab] = useState("g"), d = useChartData(t, box, true, ver), kinds = d ? recommend(d) : [], nm = box.c0 === box.c1 ? t.columns[box.c0] ?? "" : "";
  const rule = (label: string, op: string, a: string, i: number, off = false) => <button key={label} disabled={off} onClick={() => on.rule({ col: nm, op, a, b: "", color: COLORS[i] })}><i className="sw" style={{ background: COLORS[i] }} />{label}</button>;
  const tot: [string, string, number | null][] = [["SOMME", "Somme", stat?.sum ?? null], ["MOYENNE", "Moyenne", stat?.mean ?? null], ["NB", "Nombre", stat?.n ?? null], ["MIN", "Minimum", stat?.min ?? null], ["MAX", "Maximum", stat?.max ?? null]];
  return (
    <div className="qa" role="dialog" aria-label="Analyse rapide">
      <header><b>Analyse rapide</b><button className="ib sm" onClick={onClose} aria-label="Fermer">×</button></header>
      <nav>{[["g", "Graphiques", "chart"], ["t", "Totaux", "sigma"], ["c", "Couleurs", "palette"]].map(([k, l, i]) => <button key={k} data-on={tab === k} onClick={() => setTab(k)}><Icon n={i} s={16} />{l}</button>)}</nav>
      {tab === "g" && <div className="qg">{d ? kinds.map(k => <figure key={k}><div className="thumb" onClick={() => on.open(k)}><Chart d={d} kind={k} /></div><figcaption><span>{LABEL[k]}</span><button onClick={() => on.insert(k)}>Insérer</button></figcaption></figure>) : <p>Analyse en cours…</p>}
        <button className="wide" onClick={on.pivot}><Icon n="pivot" s={16} />Résumer avec un tableau croisé</button></div>}
      {tab === "t" && <div className="qt">{tot.map(([f, l, v]) => <button key={f} onClick={() => on.fn(f)}><span>{l}</span><b>{nf(v)}</b></button>)}<p>Cliquez pour insérer le calcul sous la sélection.</p></div>}
      {tab === "c" && <div className="qt">{rule("Au-dessus de la moyenne", "gt", String(stat?.mean ?? 0), 3, !stat)}{rule("Sous la moyenne", "lt", String(stat?.mean ?? 0), 0, !stat)}{rule("Valeurs négatives", "neg", "", 0)}{rule("Cellules vides", "empty", "", 2)}{rule("Erreurs", "err", "", 1)}</div>}
    </div>
  );
}
