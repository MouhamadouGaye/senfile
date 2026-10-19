"use client";
import { Icon } from "./icons";
import { Drop } from "./drop";
import { FONTS } from "./lib";
import type { Style } from "./lib";

const SW = ["#000000", "#5f6b7a", "#c0392b", "#e67e22", "#d4a017", "#27ae60", "#2980b9", "#8e44ad", "#ffffff", "#e5e8ec", "#f8d7da", "#fde3c8", "#fff3b0", "#d4efdf", "#cfe3f5", "#e8d9f3"];
function Pick({ icon, label, value, disabled, onPick, seam, onSeam }: { icon: string; label: string; value?: string; disabled: boolean; onPick: (c: string | null) => void; seam?: boolean; onSeam?: (b: boolean) => void }) {
  return (
    <Drop cls="fb2" title={label} disabled={disabled} trigger={<><Icon n={icon} /><i className="cbar" style={{ background: value ?? "transparent", boxShadow: value ? "none" : "inset 0 0 0 1px var(--line)" }} /></>}>
      {close => <><div className="sw16">{SW.map(c => <button key={c} style={{ background: c }} aria-label={c} onClick={() => { onPick(c); close(); }} />)}</div>
        <label className="cust">Personnalisée<input type="color" value={value?.startsWith("#") ? value : "#2980b9"} onChange={e => onPick(e.target.value)} /></label><button onClick={() => { onPick(null); close(); }}>Aucune couleur</button>{onSeam && <label className="cust"><input type="checkbox" checked={!!seam} onChange={e => onSeam(e.target.checked)} />Aplat : sans bordures</label>}</>}
    </Drop>
  );
}
const BORDERS = [["all", "Toutes les bordures", "lignes fines"], ["tight", "Tableau serré", "contour épais + lignes fines"], ["header", "En-tête marqué", "trait épais sous la 1re ligne"], ["outline", "Contour fin", ""], ["outline_thick", "Contour épais", ""], ["horizontal", "Lignes horizontales", "fines"], ["top", "Bordure haute", ""], ["bottom", "Bordure basse", ""], ["left", "Bordure gauche", ""], ["right", "Bordure droite", ""], ["none", "Aucune bordure", ""]];
export function FormatBar({ st, disabled, apply, clear, border }: { st: Style; disabled: boolean; apply: (p: Record<string, any>) => void; clear: () => void; border: (p: string) => void }) {
  const T = (k: keyof Style, icon: string, label: string) => <button className="fb2" data-on={!!st[k]} disabled={disabled} title={label} aria-pressed={!!st[k]} onClick={() => apply({ [k]: !st[k] })}><Icon n={icon} /></button>;
  const A = (v: "left" | "center" | "right", label: string) => <button className="fb2" data-on={st.align === v} disabled={disabled} title={label} aria-pressed={st.align === v} onClick={() => apply({ align: st.align === v ? null : v })}><Icon n={"align" + v} /></button>;
  return (
    <div className="fbar tools" role="toolbar" aria-label="Mise en forme des cellules">
      <div className="fg"><select disabled={disabled} value={st.ff ?? "Système"} onChange={e => apply({ ff: e.target.value === "Système" ? null : e.target.value })} aria-label="Police">{Object.keys(FONTS).map(f => <option key={f}>{f}</option>)}</select>
        <select disabled={disabled} className="sz" value={st.fs ?? 13} onChange={e => apply({ fs: +e.target.value === 13 ? null : +e.target.value })} aria-label="Taille">{[9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 36].map(s => <option key={s}>{s}</option>)}</select></div><i className="vs" />
      <div className="fg">{T("b", "bold", "Gras (Ctrl+B)")}{T("i", "italic", "Italique (Ctrl+I)")}{T("u", "underline", "Souligné (Ctrl+U)")}{T("s", "strike", "Barré")}</div><i className="vs" />
      <div className="fg"><Pick icon="textcolor" label="Couleur du texte" value={st.color} disabled={disabled} onPick={c => apply({ color: c })} /><Pick icon="fill" label="Couleur de remplissage" value={st.bg} disabled={disabled} onPick={c => apply({ bg: c })} seam={st.nb} onSeam={b => apply({ nb: b ? true : null })} />{T("nb", "seam", "Aplat : couleur sans bordures de cellule")}</div><i className="vs" />
      <div className="fg">{A("left", "Aligner à gauche")}{A("center", "Centrer")}{A("right", "Aligner à droite")}{T("wrap", "wrap", "Renvoyer à la ligne")}<Drop cls="fb2" title="Bordures" disabled={disabled} trigger={<Icon n="border" />}>
        {close => <div className="bmenu">{BORDERS.map(([k, l, h]) => <button key={k} onClick={() => { border(k); close(); }}><b>{l}</b><span>{h}</span></button>)}</div>}</Drop></div><i className="vs" />
      <div className="fg"><select disabled={disabled} value={st.nf ?? ""} onChange={e => apply(e.target.value ? { nf: e.target.value } : { nf: null, dec: null })} aria-label="Format des nombres">
        {[["", "Standard"], ["num", "Nombre"], ["int", "Entier"], ["thou", "Milliers"], ["pct", "Pourcentage"], ["eur", "Euro"], ["usd", "Dollar"]].map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <button className="fb2 txt" disabled={disabled} title="Ajouter une décimale" onClick={() => apply({ nf: st.nf || "num", dec: Math.min(8, (st.dec ?? 2) + 1) })}>.0+</button>
        <button className="fb2 txt" disabled={disabled} title="Retirer une décimale" onClick={() => apply({ nf: st.nf || "num", dec: Math.max(0, (st.dec ?? 2) - 1) })}>.0−</button></div><i className="vs" />
      <button className="fb2" disabled={disabled} title="Effacer la mise en forme" onClick={clear}><Icon n="clearfmt" /></button>
    </div>
  );
}
