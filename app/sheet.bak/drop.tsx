"use client";
import { useState } from "react";

export function Drop({ trigger, children, cls, title, disabled }: { trigger: React.ReactNode; children: React.ReactNode | ((close: () => void) => React.ReactNode); cls?: string; title?: string; disabled?: boolean }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <button className={cls} title={title} disabled={disabled} aria-haspopup="true" aria-expanded={!!pos}
        onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setPos(p => (p ? null : { x: Math.max(8, Math.min(r.left, window.innerWidth - 270)), y: r.bottom + 6 })); }}>{trigger}</button>
      {pos && <div className="drop-back" onClick={() => setPos(null)}><div className="pop" style={{ left: pos.x, top: pos.y }} onClick={e => e.stopPropagation()}>{typeof children === "function" ? children(() => setPos(null)) : children}</div></div>}
    </>
  );
}
