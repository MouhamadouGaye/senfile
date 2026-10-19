"use client";
import { useRef, useState } from "react";
import type { Meta } from "./lib";

export function SheetTabs({ list, id, onOpen, onAdd, onRename, onDelete }: { list: Meta[]; id: string; onOpen: (id: string) => void; onAdd: () => void; onRename: (id: string, name: string) => void; onDelete: () => void }) {
  const [ed, setEd] = useState(""), [v, setV] = useState(""), esc = useRef(false);
  return (
    <nav className="sheetbar" aria-label="Feuilles">
      {list.map(m => ed === m.id
        ? <input key={m.id} className="tabin" autoFocus value={v} onChange={e => setV(e.target.value)} onFocus={e => e.target.select()}
            onBlur={() => { setEd(""); if (esc.current) { esc.current = false; return; } if (v.trim() && v.trim() !== m.name) onRename(m.id, v.trim()); }}
            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { esc.current = true; (e.target as HTMLInputElement).blur(); } }} />
        : <button key={m.id} className="tab" data-on={m.id === id} title="Double-clic pour renommer" onClick={() => onOpen(m.id)} onDoubleClick={() => { setEd(m.id); setV(m.name); }}>
            {m.name}{m.id === id && list.length > 1 && <i className="tab-x" role="button" aria-label="Supprimer la feuille" onClick={e => { e.stopPropagation(); onDelete(); }}>×</i>}</button>)}
      <button className="tab add" onClick={onAdd} aria-label="Nouvelle feuille" title="Nouvelle feuille">+</button>
    </nav>
  );
}
