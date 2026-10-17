// "use client";

// import { useRef, useState } from "react";
// import styles from "./margin-ruler.module.css";

// const PAGE_W = 794;
// const CM = 96 / 2.54;
// const MIN_TEXT = 240; // the text column can never be narrower than this

// export type Margins = { left: number; right: number };
// type Side = "left" | "right";

// type Props = {
//   margins: Margins;
//   onChange: (m: Margins) => void;
//   editable?: boolean;
//   scale?: number;
// };

// export default function MarginRuler({
//   margins,
//   onChange,
//   editable = true,
//   scale = 1,
// }: Props) {
//   const ref = useRef<HTMLDivElement>(null);
//   const [drag, setDrag] = useState<Side | null>(null);

//   function down(side: Side, e: React.PointerEvent) {
//     if (!editable) return;
//     e.preventDefault();
//     e.currentTarget.setPointerCapture(e.pointerId);
//     setDrag(side);
//   }

//   function move(side: Side, e: React.PointerEvent) {
//     if (drag !== side || !ref.current) return;
//     const r = ref.current.getBoundingClientRect();
//     // const x = e.clientX - r.left;
//     const x = (e.clientX - r.left) / scale;
//     let v = side === "left" ? x : PAGE_W - x;
//     if (!e.altKey) {
//       const s = Math.round(v / (CM / 2)) * (CM / 2); // snap every 0.5 cm
//       if (Math.abs(s - v) < 4) v = s;
//     }
//     const other = side === "left" ? margins.right : margins.left;
//     v = Math.max(0, Math.min(v, PAGE_W - other - MIN_TEXT));
//     onChange({ ...margins, [side]: Math.round(v) });
//   }

//   const cm = (px: number) => (px / CM).toFixed(1).replace(".", ",") + " cm";

//   return (
//     <div ref={ref} className={styles.ruler} data-obj-ui>
//       <div className={styles.zone} style={{ left: 0, width: margins.left }} />
//       <div className={styles.zone} style={{ right: 0, width: margins.right }} />

//       <div className={styles.ticks}>
//         {Array.from({ length: 22 }, (_, i) => (
//           <span key={i} className={styles.num} style={{ left: i * CM }}>
//             {i > 0 ? i : ""}
//           </span>
//         ))}
//       </div>

//       {(["left", "right"] as Side[]).map((side) => {
//         const pos = side === "left" ? margins.left : PAGE_W - margins.right;
//         return (
//           <div
//             key={side}
//             className={`${styles.marker} ${drag === side ? styles.active : ""}`}
//             style={{ left: pos }}
//             data-editable={editable}
//             title={`Marge ${side === "left" ? "gauche" : "droite"} — Alt : libre · double-clic : réinitialiser`}
//             onPointerDown={(e) => down(side, e)}
//             onPointerMove={(e) => move(side, e)}
//             onPointerUp={() => setDrag(null)}
//             onPointerCancel={() => setDrag(null)}
//             onDoubleClick={() =>
//               editable && onChange({ ...margins, [side]: 72 })
//             }
//           >
//             {drag === side && (
//               <>
//                 <span className={styles.tip}>{cm(margins[side])}</span>
//                 <span className={styles.guide} />
//               </>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }
"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./margin-ruler.module.css";

const PAGE_W = 794;
const CM = 96 / 2.54;
const MIN_TEXT = 240;
const H = 30;

export type Margins = { left: number; right: number };
type Side = "left" | "right";

type Props = {
  margins: Margins;
  onChange: (m: Margins) => void;
  editable?: boolean;
  scale?: number;
};

const cm = (px: number) => (px / CM).toFixed(1).replace(".", ",");

export default function MarginRuler({
  margins,
  onChange,
  editable = true,
  scale = 1,
}: Props) {
  const sentinel = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [drag, setDrag] = useState<Side | null>(null);

  const W = PAGE_W * scale;

  // Detects the moment the dock reaches the top of its scroll container.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const root = el.closest("[data-canvas-scroll]") as HTMLElement | null;
    const io = new IntersectionObserver(
      ([e]) =>
        setStuck(
          !e.isIntersecting &&
            e.boundingClientRect.top < (e.rootBounds?.top ?? 0) + 1,
        ),
      { root },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function set(side: Side, raw: number, free: boolean) {
    let v = raw;
    if (!free) {
      const s = Math.round(v / (CM / 2)) * (CM / 2);
      if (Math.abs(s - v) < 5) v = s;
    }
    const other = side === "left" ? margins.right : margins.left;
    v = Math.max(0, Math.min(v, PAGE_W - other - MIN_TEXT));
    onChange({ ...margins, [side]: Math.round(v) });
  }

  function down(side: Side, e: React.PointerEvent) {
    if (!editable) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(side);
  }

  function move(side: Side, e: React.PointerEvent) {
    if (drag !== side || !strip.current) return;
    const r = strip.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / scale;
    set(side, side === "left" ? x : PAGE_W - x, e.altKey);
  }

  function key(side: Side, e: React.KeyboardEvent) {
    if (!editable) return;
    const d = e.key === "ArrowLeft" ? -4 : e.key === "ArrowRight" ? 4 : 0;
    if (!d) return;
    e.preventDefault();
    const cur = margins[side];
    set(side, cur + (side === "left" ? d : -d), true);
  }

  const labelEvery = scale >= 0.55 ? 1 : scale >= 0.38 ? 2 : 0;

  return (
    <>
      <div ref={sentinel} className={styles.sentinel} />
      <div className={styles.dock} data-stuck={stuck} data-obj-ui>
        <div
          ref={strip}
          className={styles.strip}
          style={{ width: W, height: H }}
        >
          <div
            className={styles.zone}
            style={{ left: 0, width: margins.left * scale }}
          />
          <div
            className={styles.zone}
            style={{ right: 0, width: margins.right * scale }}
          />

          <svg className={styles.ticks} width={W} height={H}>
            {Array.from({ length: 43 }, (_, i) => {
              const x = (i / 2) * CM * scale;
              if (x > W + 0.5) return null;
              const major = i % 2 === 0;
              return (
                <g key={i}>
                  <line
                    x1={x}
                    x2={x}
                    y1={H}
                    y2={H - (major ? 9 : 5)}
                    stroke={major ? "#aaa4c4" : "#cdc9de"}
                    strokeWidth={1}
                  />
                  {major &&
                    i > 0 &&
                    labelEvery > 0 &&
                    (i / 2) % labelEvery === 0 && (
                      <text
                        x={x}
                        y={11}
                        fontSize={9}
                        textAnchor="middle"
                        fill="#8a84a6"
                      >
                        {i / 2}
                      </text>
                    )}
                </g>
              );
            })}
          </svg>

          {(["left", "right"] as Side[]).map((side) => {
            const pos =
              (side === "left" ? margins.left : PAGE_W - margins.right) * scale;
            return (
              <div
                key={side}
                role="slider"
                tabIndex={editable ? 0 : -1}
                aria-label={`Marge ${side === "left" ? "gauche" : "droite"}`}
                aria-valuemin={0}
                aria-valuemax={PAGE_W}
                aria-valuenow={margins[side]}
                className={`${styles.marker} ${drag === side ? styles.active : ""}`}
                style={{ left: pos }}
                data-editable={editable}
                onPointerDown={(e) => down(side, e)}
                onPointerMove={(e) => move(side, e)}
                onPointerUp={() => setDrag(null)}
                onPointerCancel={() => setDrag(null)}
                onKeyDown={(e) => key(side, e)}
                onDoubleClick={() => editable && set(side, 72, true)}
              >
                {drag === side && (
                  <>
                    <span className={styles.tip}>{cm(margins[side])} cm</span>
                    <span className={styles.guide} />
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.readout} aria-hidden>
          <span>G {cm(margins.left)} cm</span>
          <span>D {cm(margins.right)} cm</span>
          <span>{Math.round(scale * 100)} %</span>
        </div>
      </div>
    </>
  );
}
