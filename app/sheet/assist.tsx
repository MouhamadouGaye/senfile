"use client";
import { useEffect, useState } from "react";
import { post, nf } from "./lib";
import type { Meta } from "./lib";

export type FDoc = { name: string; sig: string; desc: string; ex?: string; tip?: string };
export function callCtx(s: string): { name: string; arg: number } | null {
  const st: { name: string; arg: number }[] = []; let q = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]; if (ch === '"') q = !q; if (q) continue;
    if (ch === "(") st.push({ name: /([A-Za-zÀ-ÿ_.]+)$/.exec(s.slice(0, i))?.[1] ?? "", arg: 0 }); else if (ch === ")") st.pop(); else if (ch === ";" && st.length) st[st.length - 1].arg++;
  }
  const top = st[st.length - 1]; return top && top.name ? top : null;
}
export function lint(s: string): string[] {
  if (!s.startsWith("=")) return []; const w: string[] = [], up = s.toUpperCase();
  if ((s.match(/\(/g) ?? []).length > (s.match(/\)/g) ?? []).length) w.push("Il manque une parenthèse fermante.");
  if (/RECHERCHEV\(|VLOOKUP\(/.test(up)) w.push("Meilleure pratique : RECHERCHE(valeur; colonne_clé; colonne_résultat) évite de compter les colonnes.");
  if (/\b[A-Z]{1,3}\d+:[A-Z]{1,3}\d+/.test(s) && /SOMME|MOYENNE|NB|MIN|MAX/.test(up)) w.push("Astuce : [nom de colonne] suit vos données quand elles grandissent, contrairement à A1:A20.");
  if ((up.match(/(?<![A-Z.])SI\(/g) ?? []).length >= 3) w.push("Beaucoup de SI imbriqués : SOMME.SI ou NB.SI sont souvent plus simples.");
  if (s.includes("/") && !/SIERREUR|IFERROR/.test(up)) w.push("Pensez à SIERREUR(calcul; 0) pour éviter #DIV/0!.");
  return w.slice(0, 3);
}
function Sig({ sig, arg }: { sig: string; arg: number }) {
  const m = /^([^(]+)\((.*)\)$/.exec(sig); if (!m) return <code>{sig}</code>;
  const a = m[2].split(";").map(x => x.trim()).filter(Boolean), cur = Math.min(arg, a.length - 1);
  return <code>{m[1]}({a.map((x, i) => <span key={i}>{i > 0 && "; "}<b className={i === cur ? "on" : ""}>{x}</b></span>)})</code>;
}
export function FormulaAssist({ t, text, anchor, sugg, ai, nb, fdoc, onPick, onUse }: { t: Meta; text: string; anchor: { x: number; y: number }; sugg: FDoc[]; ai: number; nb: [string, string][]; fdoc: FDoc[]; onPick: (f: FDoc) => void; onUse: (f: string) => void }) {
  const [res, setRes] = useState("");
  useEffect(() => {
    if (!text.startsWith("=") || text.length < 2) { setRes(""); return; }
    const id = setTimeout(() => post(`/tables/${t.id}/eval`, { formula: text }).then(r => setRes(r.value === null ? "(vide)" : typeof r.value === "number" ? nf(r.value) : typeof r.value === "boolean" ? (r.value ? "VRAI" : "FAUX") : String(r.value))).catch(() => setRes("…")), 150);
    return () => clearTimeout(id);
  }, [text, t.id]);
  const c = callCtx(text), doc = c ? fdoc.find(f => f.name.toUpperCase() === c.name.toUpperCase()) : undefined, warns = lint(text), cur = sugg[ai];
  if (!res && !doc && !sugg.length && !nb.length && !warns.length) return null;
  return (
    <div className="fa" style={{ left: anchor.x, top: anchor.y }} onMouseDown={e => e.preventDefault()} role="status">
      {res && <div className="fa-res"><span>Résultat</span><b>{res}</b></div>}
      {doc && <div className="fa-sig"><Sig sig={doc.sig} arg={c!.arg} /></div>}
      {doc?.tip && <p className="fa-tip"><b>Astuce</b> {doc.tip}</p>}
      {sugg.length > 0 && <ul className="fa-list">{sugg.map((f, i) => <li key={f.name} data-on={i === ai} onClick={() => onPick(f)}><b>{f.sig}</b><span>{f.desc}</span></li>)}</ul>}
      {cur?.ex && <p className="fa-ex">Exemple : <code>{cur.ex}</code></p>}
      {warns.map(w => <p className="fa-warn" key={w}>{w}</p>)}
      {nb.length > 0 && <div className="fa-nb"><span>Suggestions</span>{nb.map(([l, f]) => <button key={l} onClick={() => onUse(f)}>{l}</button>)}</div>}
      {text === "" && <p className="fa-hint">Tapez <b>=</b> pour calculer · <b>[colonne]</b> pour citer une colonne · Tab pour compléter</p>}
    </div>
  );
}
