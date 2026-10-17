"use client";
import { Icon } from "./icons";
import { Drop } from "./drop";
import type { Meta } from "./lib";
import { nf } from "./lib";

type H = Record<string, (x?: any) => void>;
const R = ({ i, l, k, on, dis, act }: { i: string; l: string; k: string; on: H; dis?: boolean; act?: boolean }) =>
  <button className="rb" data-on={act} disabled={dis} title={l} onClick={() => on[k]()}><Icon n={i} /><span>{l}</span></button>;
const G = ({ title, children, cls }: { title: string; children: React.ReactNode; cls?: string }) => <section className={"rg " + (cls ?? "")} aria-label={title}><div className="rgb">{children}</div><h4>{title}</h4></section>;

export function Ribbon(p: { t: Meta | null; list: Meta[]; view: string; hasSel: boolean; find: string; setFind: (s: string) => void; onFind: () => void; hits: number; hi: number; stat: any; selMode: boolean; opts: any; setOpts: (o: any) => void; merged: boolean; panel: boolean; on: H }) {
  const { t, on, hasSel } = p, d = !t, filtered = !!t && Object.keys(t.filters ?? {}).length > 0;
  return (
    <header className="ribbon">
      <div className="rtop">
        <span className="logo"><Icon n="grid" s={18} /></span><strong className="brand">Sheetly</strong>
        <select value={t?.id ?? ""} onChange={e => on.open(e.target.value)} aria-label="Tableau">{p.list.map(m => <option key={m.id} value={m.id}>{m.name} ({m.real_total})</option>)}</select>
        <div className="tabs">
          <button data-on={p.view === "sheet"} onClick={() => on.view("sheet")}><Icon n="grid" s={16} />Tableur</button>
          <button data-on={p.view === "dash"} onClick={() => on.view("dash")}><Icon n="dashboard" s={16} />Tableau de bord</button>
        </div>
        <span className="sp" />
        <button className="cmd" onClick={() => on.palette()}><Icon n="search" s={16} /><span>Que voulez-vous faire ?</span><kbd>Ctrl K</kbd></button>
        <button className="ib" disabled={!t?.can_undo} onClick={() => on.undo()} title="Annuler (Ctrl+Z)"><Icon n="undo" /></button>
        <button className="ib" disabled={d} onClick={() => on.remove()} title="Supprimer ce tableau"><Icon n="trash" /></button>
      </div>
      <div className="rbar">
        <G title="Fichier">
          <R i="plus" l="Nouveau" k="new" on={on} />
          <label className="rb" title="Importer CSV, Excel, JSON"><Icon n="upload" /><span>Importer</span><input type="file" hidden accept=".csv,.tsv,.xlsx,.xls,.json,.parquet" onChange={e => on.upload(e.target.files?.[0])} /></label>
          <R i="database" l="Base" k="sql" on={on} /><R i="download" l="CSV" k="csv" on={on} dis={d} /><R i="sheet" l="Excel" k="xlsx" on={on} dis={d} />
        </G>
        <G title="Presse-papiers"><R i="paste" l="Coller" k="paste" on={on} dis={d} /><R i="cut" l="Couper" k="cut" on={on} dis={!hasSel} /><R i="copy" l="Copier" k="copy" on={on} dis={!hasSel} /><R i="eraser" l="Effacer" k="clear" on={on} dis={!hasSel} /></G>
        <G title="Données">
          <R i="sort" l="Trier" k="sort" on={on} dis={!hasSel} /><R i="filter" l="Filtrer" k="filter" on={on} dis={!hasSel} /><R i="sparkles" l="Nettoyer" k="clean" on={on} dis={d} />
          <R i="layers" l="Doublons" k="dedupe" on={on} dis={!hasSel} /><R i="arrowdown" l="Remplir" k="fill" on={on} dis={!hasSel} /><R i="link" l="Associer" k="lookup" on={on} dis={p.list.length < 2} />
        </G>
        <G title="Calculs"><R i="sigma" l="Somme auto" k="sum" on={on} dis={!hasSel} /><R i="fx" l="Fonctions" k="fx" on={on} /><R i="calc" l="Colonne calculée" k="calc" on={on} dis={d} /></G>
        <G title="Analyse"><R i="chart" l="Graphique" k="chart" on={on} dis={!hasSel} /><R i="pivot" l="Croisé" k="pivot" on={on} dis={d} /><R i="palette" l="Conditions" k="rules" on={on} dis={d} /></G>
        <G title="Rechercher">
          <div className="rfind"><Icon n="search" s={16} /><input value={p.find} placeholder="Chercher…" onChange={e => p.setFind(e.target.value)} onKeyDown={e => e.key === "Enter" && p.onFind()} />
            {p.hits > 0 && <><span className="chip">{p.hi + 1}/{p.hits}</span><button className="ib sm" onClick={() => on.prev()}><Icon n="up" s={16} /></button><button className="ib sm" onClick={() => on.next()}><Icon n="down" s={16} /></button></>}</div>
        </G>
        <G title="Insertion">
          <label className="rb" title="Insérer une image (ou collez-la, ou glissez-la)"><Icon n="image" /><span>Image</span><input type="file" hidden accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) on.image(f); e.target.value = ""; }} /></label>
          <R i="merge" l={p.merged ? "Séparer" : "Fusionner"} k="merge" on={on} dis={!hasSel} act={p.merged} />
        </G>
        <G title="Affichage">
          <Drop cls="rb" title="Lignes de la grille" trigger={<><Icon n="gridlines" /><span>Grille</span></>}>
            <b>Lignes</b>{[["soft", "Discrètes"], ["full", "Complètes"], ["h", "Horizontales seulement"], ["none", "Aucune"]].map(([k, l]) => <label key={k}><input type="radio" name="gl" checked={p.opts.grid === k} onChange={() => p.setOpts({ ...p.opts, grid: k })} /> {l}</label>)}
            <hr /><label><input type="checkbox" checked={p.opts.band} onChange={e => p.setOpts({ ...p.opts, band: e.target.checked })} /> Lignes alternées</label>
            <label><input type="checkbox" checked={p.opts.cross} onChange={e => p.setOpts({ ...p.opts, cross: e.target.checked })} /> Repère de la cellule active</label>
            <label>Séparateurs de groupes <select value={p.opts.grp} onChange={e => p.setOpts({ ...p.opts, grp: e.target.value })}><option value="off">Aucun</option><option value="first">1re colonne</option><option value="sel">Colonne sélectionnée</option></select></label>
          </Drop>
          <R i="sidebar" l={p.panel ? "Masquer le panneau" : "Panneau"} k="panel" on={on} act={!p.panel} />
          <span className="only-m rgb"><R i="menu" l="Fonctions" k="sheet" on={on} /><R i="pointer" l="Sélection" k="sel" on={on} act={p.selMode} /></span>
        </G>
        {(filtered || p.stat) && <G title="Résultat">
          {filtered && <><span className="chip">{t!.total} lignes sur {t!.real_total}</span><R i="filter" l="Tout afficher" k="clearFilters" on={on} /></>}
          {p.stat && <span className="chip">Nb {p.stat.n} · Σ {nf(p.stat.sum)} · Moy. {nf(p.stat.mean)}</span>}
        </G>}
      </div>
    </header>
  );
}
