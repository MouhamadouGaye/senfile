// "use client";

// import { useEffect, useRef, useState } from "react";
// import {
//   Copy,
//   Trash2,
//   Lock,
//   Unlock,
//   BringToFront,
//   SendToBack,
// } from "lucide-react";
// import { PageObject, ShapeObj, uid } from "@/lib/objets";
// import styles from "./Objects-layer.module.css";

// type Corner = "tl" | "tr" | "bl" | "br";
// const SX: Record<Corner, number> = { tl: -1, tr: 1, bl: -1, br: 1 };
// const SY: Record<Corner, number> = { tl: -1, tr: -1, bl: 1, br: 1 };
// const MIN = 24;
// const SNAP = 6;

// type Gesture =
//   | { mode: "move"; sx: number; sy: number; orig: PageObject }
//   | {
//       mode: "resize";
//       corner: Corner;
//       orig: PageObject;
//       anchor: { x: number; y: number };
//     }
//   | { mode: "rotate"; orig: PageObject; cx: number; cy: number; a0: number };

// type Guide = { v: boolean; pos: number };

// const rad = (d: number) => (d * Math.PI) / 180;
// function rot(x: number, y: number, deg: number) {
//   const c = Math.cos(rad(deg));
//   const s = Math.sin(rad(deg));
//   return { x: x * c - y * s, y: x * s + y * c };
// }

// function snapAxis(pos: number, size: number, targets: number[]) {
//   const pts = [pos, pos + size / 2, pos + size];
//   let best: { d: number; delta: number; line: number } | null = null;
//   for (const t of targets)
//     for (const q of pts) {
//       const d = Math.abs(t - q);
//       if (d <= SNAP && (!best || d < best.d))
//         best = { d, delta: t - q, line: t };
//     }
//   return best;
// }

// type Props = {
//   objects: PageObject[];
//   onChange: (next: PageObject[]) => void;
//   editable?: boolean;
//   zoom?: number;
// };

// export default function ObjectsLayer({
//   objects,
//   onChange,
//   editable = true,
//   zoom = 1,
// }: Props) {
//   const layerRef = useRef<HTMLDivElement>(null);
//   const objRef = useRef(objects);
//   objRef.current = objects;
//   const onChangeRef = useRef(onChange);
//   onChangeRef.current = onChange;
//   const zoomRef = useRef(zoom);
//   zoomRef.current = zoom;
//   const gesture = useRef<Gesture | null>(null);
//   const stopRef = useRef<(() => void) | null>(null);
//   const prevLen = useRef(objects.length);

//   const [selectedId, setSelectedId] = useState<string | null>(null);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [guides, setGuides] = useState<Guide[]>([]);

//   // Auto-select the object that was just added / duplicated (always appended).
//   useEffect(() => {
//     if (objects.length > prevLen.current)
//       setSelectedId(objects[objects.length - 1].id);
//     prevLen.current = objects.length;
//   }, [objects]);

//   const patch = (id: string, p: Partial<PageObject>) =>
//     onChangeRef.current(
//       objRef.current.map((o) =>
//         o.id === id ? ({ ...o, ...p } as PageObject) : o,
//       ),
//     );

//   const maxZ = () => objRef.current.reduce((m, o) => Math.max(m, o.z), 0);
//   const minZ = () => objRef.current.reduce((m, o) => Math.min(m, o.z), 0);

//   function duplicate(id: string) {
//     const o = objRef.current.find((x) => x.id === id);
//     if (!o) return;
//     onChangeRef.current([
//       ...objRef.current,
//       { ...o, id: uid(), x: o.x + 20, y: o.y + 20, z: maxZ() + 1 },
//     ]);
//   }
//   function remove(id: string) {
//     onChangeRef.current(objRef.current.filter((o) => o.id !== id));
//     setSelectedId(null);
//   }

//   function toPage(ev: { clientX: number; clientY: number }) {
//     const r = layerRef.current!.getBoundingClientRect();
//     const z = zoomRef.current;
//     return { x: (ev.clientX - r.left) / z, y: (ev.clientY - r.top) / z };
//   }

//   /* ----------------------------- gestures ----------------------------- */

//   function endGesture() {
//     stopRef.current?.();
//     stopRef.current = null;
//     gesture.current = null;
//     setGuides([]);
//   }

//   function begin(e: React.PointerEvent, g: Gesture) {
//     e.preventDefault();
//     e.stopPropagation();
//     (document.activeElement as HTMLElement | null)?.blur?.();
//     endGesture();
//     gesture.current = g;
//     const move = (ev: PointerEvent) => handleMove(ev);
//     const up = () => endGesture();
//     window.addEventListener("pointermove", move);
//     window.addEventListener("pointerup", up);
//     window.addEventListener("pointercancel", up);
//     stopRef.current = () => {
//       window.removeEventListener("pointermove", move);
//       window.removeEventListener("pointerup", up);
//       window.removeEventListener("pointercancel", up);
//     };
//   }

//   useEffect(() => () => stopRef.current?.(), []);

//   function handleMove(ev: PointerEvent) {
//     const g = gesture.current;
//     const layer = layerRef.current;
//     if (!g || !layer) return;
//     const p = toPage(ev);
//     const o = g.orig;
//     const W = layer.offsetWidth;
//     const H = layer.offsetHeight;

//     if (g.mode === "move") {
//       let nx = o.x + (p.x - g.sx);
//       let ny = o.y + (p.y - g.sy);
//       const gs: Guide[] = [];
//       if (!ev.altKey) {
//         const others = objRef.current.filter((x) => x.id !== o.id);
//         const tx = [
//           0,
//           W / 2,
//           W,
//           ...others.flatMap((x) => [x.x, x.x + x.w / 2, x.x + x.w]),
//         ];
//         const ty = [
//           0,
//           H / 2,
//           H,
//           ...others.flatMap((x) => [x.y, x.y + x.h / 2, x.y + x.h]),
//         ];
//         const sx = snapAxis(nx, o.w, tx);
//         const sy = snapAxis(ny, o.h, ty);
//         if (sx) {
//           nx += sx.delta;
//           gs.push({ v: true, pos: sx.line });
//         }
//         if (sy) {
//           ny += sy.delta;
//           gs.push({ v: false, pos: sy.line });
//         }
//       }
//       nx = Math.min(Math.max(nx, -o.w + 40), W - 40);
//       ny = Math.max(ny, -o.h + 40); // no lower bound: the document can grow
//       setGuides(gs);
//       patch(o.id, { x: Math.round(nx), y: Math.round(ny) });
//     }

//     if (g.mode === "resize") {
//       const sx = SX[g.corner];
//       const sy = SY[g.corner];
//       const d = rot(p.x - g.anchor.x, p.y - g.anchor.y, -o.rotation);
//       let w = Math.max(MIN, sx * d.x);
//       let h = Math.max(MIN, sy * d.y);
//       const lock = (o.type === "image") !== ev.shiftKey; // images keep ratio by default
//       if (lock) {
//         const r = o.w / o.h;
//         if (w / r > h) h = w / r;
//         else w = h * r;
//       }
//       const c = rot((sx * w) / 2, (sy * h) / 2, o.rotation);
//       const cx = g.anchor.x + c.x;
//       const cy = g.anchor.y + c.y;
//       patch(o.id, {
//         w: Math.round(w),
//         h: Math.round(h),
//         x: Math.round(cx - w / 2),
//         y: Math.round(cy - h / 2),
//       });
//     }

//     if (g.mode === "rotate") {
//       const a = Math.atan2(p.y - g.cy, p.x - g.cx);
//       let deg = o.rotation + ((a - g.a0) * 180) / Math.PI;
//       if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
//       else {
//         const near = Math.round(deg / 45) * 45;
//         if (Math.abs(deg - near) < 4) deg = near;
//       }
//       patch(o.id, { rotation: Math.round(deg * 10) / 10 });
//     }
//   }

//   function onObjDown(e: React.PointerEvent, o: PageObject) {
//     if (!editable || editingId === o.id) return;
//     setSelectedId(o.id);
//     if (o.locked) {
//       e.stopPropagation();
//       return;
//     }
//     const p = toPage(e);
//     begin(e, { mode: "move", sx: p.x, sy: p.y, orig: o });
//   }

//   function onHandleDown(e: React.PointerEvent, o: PageObject, corner: Corner) {
//     const cx = o.x + o.w / 2;
//     const cy = o.y + o.h / 2;
//     const a = rot(-SX[corner] * (o.w / 2), -SY[corner] * (o.h / 2), o.rotation);
//     begin(e, {
//       mode: "resize",
//       corner,
//       orig: o,
//       anchor: { x: cx + a.x, y: cy + a.y },
//     });
//   }

//   function onRotateDown(e: React.PointerEvent, o: PageObject) {
//     const cx = o.x + o.w / 2;
//     const cy = o.y + o.h / 2;
//     const p = toPage(e);
//     begin(e, {
//       mode: "rotate",
//       orig: o,
//       cx,
//       cy,
//       a0: Math.atan2(p.y - cy, p.x - cx),
//     });
//   }

//   /* ---------------------- selection / keyboard ---------------------- */

//   useEffect(() => {
//     const h = (e: PointerEvent) => {
//       if (!(e.target as HTMLElement).closest("[data-obj],[data-obj-ui]")) {
//         setSelectedId(null);
//         setEditingId(null);
//       }
//     };
//     window.addEventListener("pointerdown", h);
//     return () => window.removeEventListener("pointerdown", h);
//   }, []);

//   useEffect(() => {
//     if (!editable) return;
//     const h = (e: KeyboardEvent) => {
//       if (!selectedId || editingId) return;
//       if (
//         (e.target as HTMLElement).closest?.(
//           "input,textarea,select,[contenteditable='true']",
//         )
//       )
//         return;
//       const o = objRef.current.find((x) => x.id === selectedId);
//       if (!o) return;
//       const step = e.shiftKey ? 10 : 1;
//       const arrows: Record<string, [number, number]> = {
//         ArrowLeft: [-step, 0],
//         ArrowRight: [step, 0],
//         ArrowUp: [0, -step],
//         ArrowDown: [0, step],
//       };
//       if (arrows[e.key]) {
//         e.preventDefault();
//         patch(o.id, { x: o.x + arrows[e.key][0], y: o.y + arrows[e.key][1] });
//       } else if (e.key === "Delete" || e.key === "Backspace") {
//         e.preventDefault();
//         remove(o.id);
//       } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
//         e.preventDefault();
//         duplicate(o.id);
//       } else if (e.key === "]") patch(o.id, { z: maxZ() + 1 });
//       else if (e.key === "[") patch(o.id, { z: minZ() - 1 });
//       else if (e.key === "Escape") setSelectedId(null);
//     };
//     window.addEventListener("keydown", h);
//     return () => window.removeEventListener("keydown", h);
//   }, [selectedId, editingId, editable]); // eslint-disable-line

//   useEffect(() => {
//     if (!editingId) return;
//     const el = layerRef.current?.querySelector<HTMLElement>(
//       `[data-text-id="${editingId}"]`,
//     );
//     if (el) {
//       el.focus();
//       const r = document.createRange();
//       r.selectNodeContents(el);
//       const s = window.getSelection();
//       s?.removeAllRanges();
//       s?.addRange(r);
//     }
//   }, [editingId]);

//   const selected = objects.find((o) => o.id === selectedId) || null;
//   const sorted = [...objects].sort((a, b) => a.z - b.z);

//   return (
//     <div ref={layerRef} className={styles.layer} data-objects-layer>
//       {sorted.map((o) => {
//         const isSel = editable && o.id === selectedId;
//         return (
//           <div
//             key={o.id}
//             data-obj
//             className={`${styles.obj} ${isSel ? styles.selected : ""} ${o.locked ? styles.locked : ""}`}
//             style={{
//               left: o.x,
//               top: o.y,
//               width: o.w,
//               height: o.h,
//               transform: `rotate(${o.rotation}deg)`,
//               zIndex: o.z,
//               opacity: o.opacity ?? 1,
//             }}
//             onPointerDown={(e) => onObjDown(e, o)}
//             onDoubleClick={() =>
//               editable && o.type === "shape" && !o.locked && setEditingId(o.id)
//             }
//           >
//             <ObjectBody
//               o={o}
//               editing={editingId === o.id}
//               onCommit={(text) => {
//                 patch(o.id, { text } as Partial<PageObject>);
//                 setEditingId(null);
//               }}
//             />

//             {isSel && !o.locked && (
//               <>
//                 {(["tl", "tr", "bl", "br"] as Corner[]).map((c) => (
//                   <span
//                     key={c}
//                     className={`${styles.handle} ${styles[c]}`}
//                     onPointerDown={(e) => onHandleDown(e, o, c)}
//                   />
//                 ))}
//                 <span className={styles.stem} />
//                 <span
//                   className={styles.rotate}
//                   onPointerDown={(e) => onRotateDown(e, o)}
//                 />
//               </>
//             )}
//           </div>
//         );
//       })}

//       {guides.map((g, i) => (
//         <div
//           key={i}
//           className={styles.guide}
//           style={
//             g.v
//               ? { left: g.pos, top: 0, bottom: 0, width: 1 }
//               : { top: g.pos, left: 0, right: 0, height: 1 }
//           }
//         />
//       ))}

//       {editable && selected && !editingId && (
//         <FloatingBar
//           o={selected}
//           onPatch={(p) => patch(selected.id, p)}
//           onDuplicate={() => duplicate(selected.id)}
//           onDelete={() => remove(selected.id)}
//           onFront={() => patch(selected.id, { z: maxZ() + 1 })}
//           onBack={() => patch(selected.id, { z: minZ() - 1 })}
//         />
//       )}
//     </div>
//   );
// }

// /* ------------------------- Rendering (shared) ------------------------- */
// /* Inline styles only: the preview / PDF must not depend on any CSS module. */

// function ObjectBody({
//   o,
//   editing = false,
//   onCommit = () => {},
// }: {
//   o: PageObject;
//   editing?: boolean;
//   onCommit?: (t: string) => void;
// }) {
//   if (o.type === "image") {
//     return (
//       <img
//         src={o.src}
//         alt=""
//         draggable={false}
//         style={{
//           display: "block",
//           width: "100%",
//           height: "100%",
//           objectFit: "fill",
//           pointerEvents: "none",
//           userSelect: "none",
//           margin: 0,
//         }}
//       />
//     );
//   }
//   return <ShapeView o={o} editing={editing} onCommit={onCommit} />;
// }

// export function ShapeView({
//   o,
//   editing,
//   onCommit,
// }: {
//   o: ShapeObj;
//   editing: boolean;
//   onCommit: (t: string) => void;
// }) {
//   const { w, h, strokeWidth: sw } = o;
//   const i = sw / 2;
//   const common = {
//     fill: o.fill,
//     stroke: sw ? o.stroke : "none",
//     strokeWidth: sw,
//     strokeLinejoin: "round" as const,
//   };

//   let node: JSX.Element;
//   switch (o.shape) {
//     case "ellipse":
//       node = (
//         <ellipse
//           cx={w / 2}
//           cy={h / 2}
//           rx={Math.max(1, (w - sw) / 2)}
//           ry={Math.max(1, (h - sw) / 2)}
//           {...common}
//         />
//       );
//       break;
//     case "triangle":
//       node = (
//         <polygon
//           points={`${w / 2},${i} ${w - i},${h - i} ${i},${h - i}`}
//           {...common}
//         />
//       );
//       break;
//     case "diamond":
//       node = (
//         <polygon
//           points={`${w / 2},${i} ${w - i},${h / 2} ${w / 2},${h - i} ${i},${h / 2}`}
//           {...common}
//         />
//       );
//       break;
//     case "star": {
//       const rx = (w - sw) / 2;
//       const ry = (h - sw) / 2;
//       const pts = Array.from({ length: 10 }, (_, k) => {
//         const a = -Math.PI / 2 + (k * Math.PI) / 5;
//         const r = k % 2 ? 0.45 : 1;
//         return `${w / 2 + rx * r * Math.cos(a)},${h / 2 + ry * r * Math.sin(a)}`;
//       }).join(" ");
//       node = <polygon points={pts} {...common} />;
//       break;
//     }
//     case "arrow":
//       node = (
//         <polygon
//           points={`${i},${h * 0.3} ${w * 0.6},${h * 0.3} ${w * 0.6},${i} ${w - i},${h / 2} ${w * 0.6},${h - i} ${w * 0.6},${h * 0.7} ${i},${h * 0.7}`}
//           {...common}
//         />
//       );
//       break;
//     case "bubble": {
//       const bh = h * 0.82;
//       const r = Math.max(0, Math.min(o.radius, bh / 2, w / 2));
//       const d = `M${r + i},${i} H${w - r - i} Q${w - i},${i} ${w - i},${r + i} V${bh - r} Q${w - i},${bh - i} ${w - r - i},${bh - i} H${w * 0.38} L${w * 0.2},${h - i} L${w * 0.22},${bh - i} H${r + i} Q${i},${bh - i} ${i},${bh - r} V${r + i} Q${i},${i} ${r + i},${i} Z`;
//       node = <path d={d} {...common} />;
//       break;
//     }
//     default: {
//       const r = Math.max(0, Math.min(o.radius, (w - sw) / 2, (h - sw) / 2));
//       node = (
//         <rect x={i} y={i} width={w - sw} height={h - sw} rx={r} {...common} />
//       );
//     }
//   }

//   const just =
//     o.textAlign === "left"
//       ? "flex-start"
//       : o.textAlign === "right"
//         ? "flex-end"
//         : "center";

//   return (
//     <>
//       <svg
//         width={w}
//         height={h}
//         viewBox={`0 0 ${w} ${h}`}
//         style={{
//           position: "absolute",
//           inset: 0,
//           overflow: "visible",
//           pointerEvents: "none",
//           filter: o.shadow
//             ? "drop-shadow(0 6px 14px rgba(40,30,80,.22))"
//             : undefined,
//         }}
//       >
//         {node}
//       </svg>
//       <div
//         data-text-id={o.id}
//         contentEditable={editing}
//         suppressContentEditableWarning
//         onPointerDown={(e) => editing && e.stopPropagation()}
//         onKeyDown={(e) => {
//           if (editing && e.key === "Escape") e.currentTarget.blur();
//         }}
//         onBlur={(e) => editing && onCommit(e.currentTarget.innerText)}
//         style={{
//           position: "absolute",
//           inset: 0,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: just,
//           padding: "10px 14px",
//           outline: "none",
//           whiteSpace: "pre-wrap",
//           wordBreak: "break-word",
//           overflow: "hidden",
//           lineHeight: 1.25,
//           fontFamily: "inherit",
//           color: o.textColor,
//           fontSize: o.fontSize,
//           textAlign: o.textAlign,
//           cursor: editing ? "text" : undefined,
//         }}
//       >
//         {o.text}
//       </div>
//     </>
//   );
// }

// /** Read-only render used by the PDF preview / print. Inline styles only. */
// export function StaticObjects({ objects }: { objects: PageObject[] }) {
//   return (
//     <div
//       style={{
//         position: "absolute",
//         inset: 0,
//         pointerEvents: "none",
//         zIndex: 30,
//       }}
//     >
//       {[...objects]
//         .sort((a, b) => a.z - b.z)
//         .map((o) => (
//           <div
//             key={o.id}
//             style={{
//               position: "absolute",
//               left: o.x,
//               top: o.y,
//               width: o.w,
//               height: o.h,
//               transform: `rotate(${o.rotation}deg)`,
//               transformOrigin: "center center",
//               zIndex: o.z,
//               opacity: o.opacity ?? 1,
//             }}
//           >
//             <ObjectBody o={o} />
//           </div>
//         ))}
//     </div>
//   );
// }

// /* --------------------------- Floating toolbar --------------------------- */

// function FloatingBar(props: {
//   o: PageObject;
//   onPatch: (p: Partial<PageObject>) => void;
//   onDuplicate: () => void;
//   onDelete: () => void;
//   onFront: () => void;
//   onBack: () => void;
// }) {
//   const { o, onPatch } = props;
//   const shape = o.type === "shape" ? o : null;
//   const set = (p: Record<string, unknown>) => onPatch(p as Partial<PageObject>);
//   return (
//     <div
//       data-obj-ui
//       className={styles.bar}
//       style={{ left: o.x + o.w / 2, top: Math.max(4, o.y - 56) }}
//     >
//       {shape && (
//         <>
//           <label title="Remplissage">
//             <input
//               type="color"
//               value={shape.fill}
//               onChange={(e) => set({ fill: e.target.value })}
//             />
//           </label>
//           <label title="Contour">
//             <input
//               type="color"
//               value={shape.stroke}
//               onChange={(e) => set({ stroke: e.target.value })}
//             />
//           </label>
//           <input
//             type="range"
//             min={0}
//             max={12}
//             value={shape.strokeWidth}
//             title="Épaisseur du contour"
//             onChange={(e) => set({ strokeWidth: +e.target.value })}
//           />
//           {(shape.shape === "rectangle" || shape.shape === "bubble") && (
//             <input
//               type="range"
//               min={0}
//               max={80}
//               value={shape.radius}
//               title="Arrondi"
//               onChange={(e) => set({ radius: +e.target.value })}
//             />
//           )}
//           <label title="Couleur du texte">
//             <input
//               type="color"
//               value={shape.textColor}
//               onChange={(e) => set({ textColor: e.target.value })}
//             />
//           </label>
//           <button
//             title="Ombre"
//             data-on={shape.shadow}
//             onClick={() => set({ shadow: !shape.shadow })}
//           >
//             Ombre
//           </button>
//           <span className={styles.sep} />
//         </>
//       )}
//       <input
//         type="range"
//         min={10}
//         max={100}
//         value={Math.round((o.opacity ?? 1) * 100)}
//         title="Opacité"
//         onChange={(e) => onPatch({ opacity: +e.target.value / 100 })}
//       />
//       <span className={styles.sep} />
//       <button title="Premier plan  ]" onClick={props.onFront}>
//         <BringToFront size={15} />
//       </button>
//       <button title="Arrière-plan  [" onClick={props.onBack}>
//         <SendToBack size={15} />
//       </button>
//       <button title="Dupliquer  Ctrl+D" onClick={props.onDuplicate}>
//         <Copy size={15} />
//       </button>
//       <button
//         title="Verrouiller"
//         onClick={() => onPatch({ locked: !o.locked })}
//       >
//         {o.locked ? <Lock size={15} /> : <Unlock size={15} />}
//       </button>
//       <button
//         title="Supprimer  Del"
//         className={styles.danger}
//         onClick={props.onDelete}
//       >
//         <Trash2 size={15} />
//       </button>
//     </div>
//   );
// }
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
} from "lucide-react";
import { PageObject, ShapeObj, uid } from "@/lib/objets";
import styles from "./Objects-layer.module.css";

type Corner = "tl" | "tr" | "bl" | "br";
const SX: Record<Corner, number> = { tl: -1, tr: 1, bl: -1, br: 1 };
const SY: Record<Corner, number> = { tl: -1, tr: -1, bl: 1, br: 1 };
const MIN = 24;
const SNAP = 6;

type Gesture =
  | { mode: "move"; sx: number; sy: number; orig: PageObject; scale: number }
  | {
      mode: "resize";
      corner: Corner;
      orig: PageObject;
      anchor: { x: number; y: number };
      scale: number;
    }
  | {
      mode: "rotate";
      orig: PageObject;
      cx: number;
      cy: number;
      a0: number;
      scale: number;
    };

type Guide = { v: boolean; pos: number };

const rad = (d: number) => (d * Math.PI) / 180;
function rot(x: number, y: number, deg: number) {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return { x: x * c - y * s, y: x * s + y * c };
}

function snapAxis(pos: number, size: number, targets: number[]) {
  const pts = [pos, pos + size / 2, pos + size];
  let best: { d: number; delta: number; line: number } | null = null;
  for (const t of targets)
    for (const q of pts) {
      const d = Math.abs(t - q);
      if (d <= SNAP && (!best || d < best.d))
        best = { d, delta: t - q, line: t };
    }
  return best;
}

/**
 * Read the visual scale applied to the page. The page surface is the
 * element marked with [data-page-surface]; it holds `data-scale` so that
 * every gesture (drag / resize / rotate) can convert visual pointer
 * pixels into logical page coordinates. Falls back to the prop and then
 * to 1 if nothing else is available.
 */
function readScale(el: HTMLElement | null, fallback: number): number {
  const root =
    (el?.closest("[data-page-surface]") as HTMLElement | null) ??
    (document.querySelector("[data-page-surface]") as HTMLElement | null);
  const v = root?.dataset.scale;
  if (v) {
    const n = parseFloat(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return fallback > 0 ? fallback : 1;
}

type Props = {
  objects: PageObject[];
  onChange: (next: PageObject[]) => void;
  editable?: boolean;
  zoom?: number;
};

export default function ObjectsLayer({
  objects,
  onChange,
  editable = true,
  zoom = 1,
}: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const objRef = useRef(objects);
  objRef.current = objects;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const gesture = useRef<Gesture | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const prevLen = useRef(objects.length);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);

  // Auto-select the object that was just added / duplicated (always appended).
  useEffect(() => {
    if (objects.length > prevLen.current)
      setSelectedId(objects[objects.length - 1].id);
    prevLen.current = objects.length;
  }, [objects]);

  const patch = (id: string, p: Partial<PageObject>) =>
    onChangeRef.current(
      objRef.current.map((o) =>
        o.id === id ? ({ ...o, ...p } as PageObject) : o,
      ),
    );

  const maxZ = () => objRef.current.reduce((m, o) => Math.max(m, o.z), 0);
  const minZ = () => objRef.current.reduce((m, o) => Math.min(m, o.z), 0);

  function duplicate(id: string) {
    const o = objRef.current.find((x) => x.id === id);
    if (!o) return;
    onChangeRef.current([
      ...objRef.current,
      { ...o, id: uid(), x: o.x + 20, y: o.y + 20, z: maxZ() + 1 },
    ]);
  }
  function remove(id: string) {
    onChangeRef.current(objRef.current.filter((o) => o.id !== id));
    setSelectedId(null);
  }

  function toPage(ev: { clientX: number; clientY: number }, scale: number) {
    const r = layerRef.current!.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) / scale,
      y: (ev.clientY - r.top) / scale,
    };
  }

  /* ----------------------------- gestures ----------------------------- */

  function endGesture() {
    stopRef.current?.();
    stopRef.current = null;
    gesture.current = null;
    setGuides([]);
  }

  function begin(e: React.PointerEvent, g: Gesture) {
    e.preventDefault();
    e.stopPropagation();
    (document.activeElement as HTMLElement | null)?.blur?.();
    endGesture();
    gesture.current = g;
    const move = (ev: PointerEvent) => handleMove(ev);
    const up = () => endGesture();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    stopRef.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }

  useEffect(() => () => stopRef.current?.(), []);

  function handleMove(ev: PointerEvent) {
    const g = gesture.current;
    const layer = layerRef.current;
    if (!g || !layer) return;
    const p = toPage(ev, g.scale);
    const o = g.orig;
    const W = layer.offsetWidth;
    const H = layer.offsetHeight;

    if (g.mode === "move") {
      let nx = o.x + (p.x - g.sx);
      let ny = o.y + (p.y - g.sy);
      const gs: Guide[] = [];
      if (!ev.altKey) {
        const others = objRef.current.filter((x) => x.id !== o.id);
        const tx = [
          0,
          W / 2,
          W,
          ...others.flatMap((x) => [x.x, x.x + x.w / 2, x.x + x.w]),
        ];
        const ty = [
          0,
          H / 2,
          H,
          ...others.flatMap((x) => [x.y, x.y + x.h / 2, x.y + x.h]),
        ];
        const sx = snapAxis(nx, o.w, tx);
        const sy = snapAxis(ny, o.h, ty);
        if (sx) {
          nx += sx.delta;
          gs.push({ v: true, pos: sx.line });
        }
        if (sy) {
          ny += sy.delta;
          gs.push({ v: false, pos: sy.line });
        }
      }
      nx = Math.min(Math.max(nx, -o.w + 40), W - 40);
      ny = Math.max(ny, -o.h + 40); // no lower bound: the document can grow
      setGuides(gs);
      patch(o.id, { x: Math.round(nx), y: Math.round(ny) });
    }

    if (g.mode === "resize") {
      const sx = SX[g.corner];
      const sy = SY[g.corner];
      const d = rot(p.x - g.anchor.x, p.y - g.anchor.y, -o.rotation);
      let w = Math.max(MIN, sx * d.x);
      let h = Math.max(MIN, sy * d.y);
      const lock = (o.type === "image") !== ev.shiftKey; // images keep ratio by default
      if (lock) {
        const r = o.w / o.h;
        if (w / r > h) h = w / r;
        else w = h * r;
      }
      const c = rot((sx * w) / 2, (sy * h) / 2, o.rotation);
      const cx = g.anchor.x + c.x;
      const cy = g.anchor.y + c.y;
      patch(o.id, {
        w: Math.round(w),
        h: Math.round(h),
        x: Math.round(cx - w / 2),
        y: Math.round(cy - h / 2),
      });
    }

    if (g.mode === "rotate") {
      const a = Math.atan2(p.y - g.cy, p.x - g.cx);
      let deg = o.rotation + ((a - g.a0) * 180) / Math.PI;
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
      else {
        const near = Math.round(deg / 45) * 45;
        if (Math.abs(deg - near) < 4) deg = near;
      }
      patch(o.id, { rotation: Math.round(deg * 10) / 10 });
    }
  }

  function onObjDown(e: React.PointerEvent, o: PageObject) {
    if (!editable || editingId === o.id) return;
    setSelectedId(o.id);
    if (o.locked) {
      e.stopPropagation();
      return;
    }
    const scale = readScale(layerRef.current, zoomRef.current);
    const p = toPage(e, scale);
    begin(e, { mode: "move", sx: p.x, sy: p.y, orig: o, scale });
  }

  function onHandleDown(e: React.PointerEvent, o: PageObject, corner: Corner) {
    const scale = readScale(layerRef.current, zoomRef.current);
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    const a = rot(-SX[corner] * (o.w / 2), -SY[corner] * (o.h / 2), o.rotation);
    begin(e, {
      mode: "resize",
      corner,
      orig: o,
      anchor: { x: cx + a.x, y: cy + a.y },
      scale,
    });
  }

  function onRotateDown(e: React.PointerEvent, o: PageObject) {
    const scale = readScale(layerRef.current, zoomRef.current);
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    const p = toPage(e, scale);
    begin(e, {
      mode: "rotate",
      orig: o,
      cx,
      cy,
      a0: Math.atan2(p.y - cy, p.x - cx),
      scale,
    });
  }

  /* ---------------------- selection / keyboard ---------------------- */

  useEffect(() => {
    const h = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest("[data-obj],[data-obj-ui]")) {
        setSelectedId(null);
        setEditingId(null);
      }
    };
    window.addEventListener("pointerdown", h);
    return () => window.removeEventListener("pointerdown", h);
  }, []);

  useEffect(() => {
    if (!editable) return;
    const h = (e: KeyboardEvent) => {
      if (!selectedId || editingId) return;
      if (
        (e.target as HTMLElement).closest?.(
          "input,textarea,select,[contenteditable='true']",
        )
      )
        return;
      const o = objRef.current.find((x) => x.id === selectedId);
      if (!o) return;
      const step = e.shiftKey ? 10 : 1;
      const arrows: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      if (arrows[e.key]) {
        e.preventDefault();
        patch(o.id, { x: o.x + arrows[e.key][0], y: o.y + arrows[e.key][1] });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove(o.id);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate(o.id);
      } else if (e.key === "]") patch(o.id, { z: maxZ() + 1 });
      else if (e.key === "[") patch(o.id, { z: minZ() - 1 });
      else if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, editingId, editable]);

  useEffect(() => {
    if (!editingId) return;
    const el = layerRef.current?.querySelector<HTMLElement>(
      `[data-text-id="${editingId}"]`,
    );
    if (el) {
      el.focus();
      const r = document.createRange();
      r.selectNodeContents(el);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
  }, [editingId]);

  const selected = objects.find((o) => o.id === selectedId) || null;
  const sorted = [...objects].sort((a, b) => a.z - b.z);

  return (
    <div ref={layerRef} className={styles.layer} data-objects-layer>
      {sorted.map((o) => {
        const isSel = editable && o.id === selectedId;
        return (
          <div
            key={o.id}
            data-obj
            className={`${styles.obj} ${isSel ? styles.selected : ""} ${o.locked ? styles.locked : ""}`}
            style={{
              left: o.x,
              top: o.y,
              width: o.w,
              height: o.h,
              transform: `rotate(${o.rotation}deg)`,
              zIndex: o.z,
              opacity: o.opacity ?? 1,
            }}
            onPointerDown={(e) => onObjDown(e, o)}
            onDoubleClick={() =>
              editable && o.type === "shape" && !o.locked && setEditingId(o.id)
            }
          >
            <ObjectBody
              o={o}
              editing={editingId === o.id}
              onCommit={(text) => {
                patch(o.id, { text } as Partial<PageObject>);
                setEditingId(null);
              }}
            />

            {isSel && !o.locked && (
              <>
                {(["tl", "tr", "bl", "br"] as Corner[]).map((c) => (
                  <span
                    key={c}
                    className={`${styles.handle} ${styles[c]}`}
                    onPointerDown={(e) => onHandleDown(e, o, c)}
                  />
                ))}
                <span className={styles.stem} />
                <span
                  className={styles.rotate}
                  onPointerDown={(e) => onRotateDown(e, o)}
                />
              </>
            )}
          </div>
        );
      })}

      {guides.map((g, i) => (
        <div
          key={i}
          className={styles.guide}
          style={
            g.v
              ? { left: g.pos, top: 0, bottom: 0, width: 1 }
              : { top: g.pos, left: 0, right: 0, height: 1 }
          }
        />
      ))}

      {editable && selected && !editingId && (
        <FloatingBar
          o={selected}
          onPatch={(p) => patch(selected.id, p)}
          onDuplicate={() => duplicate(selected.id)}
          onDelete={() => remove(selected.id)}
          onFront={() => patch(selected.id, { z: maxZ() + 1 })}
          onBack={() => patch(selected.id, { z: minZ() - 1 })}
        />
      )}
    </div>
  );
}

/* ------------------------- Rendering (shared) ------------------------- */
/* Inline styles only: the preview / PDF must not depend on any CSS module. */

function ObjectBody({
  o,
  editing = false,
  onCommit = () => {},
}: {
  o: PageObject;
  editing?: boolean;
  onCommit?: (t: string) => void;
}) {
  if (o.type === "image") {
    return (
      <img
        src={o.src}
        alt=""
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "fill",
          pointerEvents: "none",
          userSelect: "none",
          margin: 0,
        }}
      />
    );
  }
  return <ShapeView o={o} editing={editing} onCommit={onCommit} />;
}

export function ShapeView({
  o,
  editing,
  onCommit,
}: {
  o: ShapeObj;
  editing: boolean;
  onCommit: (t: string) => void;
}) {
  const { w, h, strokeWidth: sw } = o;
  const i = sw / 2;
  const common = {
    fill: o.fill,
    stroke: sw ? o.stroke : "none",
    strokeWidth: sw,
    strokeLinejoin: "round" as const,
  };

  let node: JSX.Element;
  switch (o.shape) {
    case "ellipse":
      node = (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(1, (w - sw) / 2)}
          ry={Math.max(1, (h - sw) / 2)}
          {...common}
        />
      );
      break;
    case "triangle":
      node = (
        <polygon
          points={`${w / 2},${i} ${w - i},${h - i} ${i},${h - i}`}
          {...common}
        />
      );
      break;
    case "diamond":
      node = (
        <polygon
          points={`${w / 2},${i} ${w - i},${h / 2} ${w / 2},${h - i} ${i},${h / 2}`}
          {...common}
        />
      );
      break;
    case "star": {
      const rx = (w - sw) / 2;
      const ry = (h - sw) / 2;
      const pts = Array.from({ length: 10 }, (_, k) => {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const r = k % 2 ? 0.45 : 1;
        return `${w / 2 + rx * r * Math.cos(a)},${h / 2 + ry * r * Math.sin(a)}`;
      }).join(" ");
      node = <polygon points={pts} {...common} />;
      break;
    }
    case "arrow":
      node = (
        <polygon
          points={`${i},${h * 0.3} ${w * 0.6},${h * 0.3} ${w * 0.6},${i} ${w - i},${h / 2} ${w * 0.6},${h - i} ${w * 0.6},${h * 0.7} ${i},${h * 0.7}`}
          {...common}
        />
      );
      break;
    case "bubble": {
      const bh = h * 0.82;
      const r = Math.max(0, Math.min(o.radius, bh / 2, w / 2));
      const d = `M${r + i},${i} H${w - r - i} Q${w - i},${i} ${w - i},${r + i} V${bh - r} Q${w - i},${bh - i} ${w - r - i},${bh - i} H${w * 0.38} L${w * 0.2},${h - i} L${w * 0.22},${bh - i} H${r + i} Q${i},${bh - i} ${i},${bh - r} V${r + i} Q${i},${i} ${r + i},${i} Z`;
      node = <path d={d} {...common} />;
      break;
    }
    default: {
      const r = Math.max(0, Math.min(o.radius, (w - sw) / 2, (h - sw) / 2));
      node = (
        <rect x={i} y={i} width={w - sw} height={h - sw} rx={r} {...common} />
      );
    }
  }

  const just =
    o.textAlign === "left"
      ? "flex-start"
      : o.textAlign === "right"
        ? "flex-end"
        : "center";

  return (
    <>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          pointerEvents: "none",
          filter: o.shadow
            ? "drop-shadow(0 6px 14px rgba(40,30,80,.22))"
            : undefined,
        }}
      >
        {node}
      </svg>
      <div
        data-text-id={o.id}
        contentEditable={editing}
        suppressContentEditableWarning
        onPointerDown={(e) => editing && e.stopPropagation()}
        onKeyDown={(e) => {
          if (editing && e.key === "Escape") e.currentTarget.blur();
        }}
        onBlur={(e) => editing && onCommit(e.currentTarget.innerText)}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: just,
          padding: "10px 14px",
          outline: "none",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflow: "hidden",
          lineHeight: 1.25,
          fontFamily: "inherit",
          color: o.textColor,
          fontSize: o.fontSize,
          textAlign: o.textAlign,
          cursor: editing ? "text" : undefined,
        }}
      >
        {o.text}
      </div>
    </>
  );
}

/** Read-only render used by the PDF preview / print. Inline styles only. */
export function StaticObjects({ objects }: { objects: PageObject[] }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      {[...objects]
        .sort((a, b) => a.z - b.z)
        .map((o) => (
          <div
            key={o.id}
            style={{
              position: "absolute",
              left: o.x,
              top: o.y,
              width: o.w,
              height: o.h,
              transform: `rotate(${o.rotation}deg)`,
              transformOrigin: "center center",
              zIndex: o.z,
              opacity: o.opacity ?? 1,
            }}
          >
            <ObjectBody o={o} />
          </div>
        ))}
    </div>
  );
}

/* --------------------------- Floating toolbar --------------------------- */

function FloatingBar(props: {
  o: PageObject;
  onPatch: (p: Partial<PageObject>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFront: () => void;
  onBack: () => void;
}) {
  const { o, onPatch } = props;
  const shape = o.type === "shape" ? o : null;
  const set = (p: Record<string, unknown>) => onPatch(p as Partial<PageObject>);
  return (
    <div
      data-obj-ui
      className={styles.bar}
      style={{ left: o.x + o.w / 2, top: Math.max(4, o.y - 56) }}
    >
      {shape && (
        <>
          <label title="Remplissage">
            <input
              type="color"
              value={shape.fill}
              onChange={(e) => set({ fill: e.target.value })}
            />
          </label>
          <label title="Contour">
            <input
              type="color"
              value={shape.stroke}
              onChange={(e) => set({ stroke: e.target.value })}
            />
          </label>
          <input
            type="range"
            min={0}
            max={12}
            value={shape.strokeWidth}
            title="Épaisseur du contour"
            onChange={(e) => set({ strokeWidth: +e.target.value })}
          />
          {(shape.shape === "rectangle" || shape.shape === "bubble") && (
            <input
              type="range"
              min={0}
              max={80}
              value={shape.radius}
              title="Arrondi"
              onChange={(e) => set({ radius: +e.target.value })}
            />
          )}
          <label title="Couleur du texte">
            <input
              type="color"
              value={shape.textColor}
              onChange={(e) => set({ textColor: e.target.value })}
            />
          </label>
          <button
            title="Ombre"
            data-on={shape.shadow}
            onClick={() => set({ shadow: !shape.shadow })}
          >
            Ombre
          </button>
          <span className={styles.sep} />
        </>
      )}
      <input
        type="range"
        min={10}
        max={100}
        value={Math.round((o.opacity ?? 1) * 100)}
        title="Opacité"
        onChange={(e) => onPatch({ opacity: +e.target.value / 100 })}
      />
      <span className={styles.sep} />
      <button title="Premier plan  ]" onClick={props.onFront}>
        <BringToFront size={15} />
      </button>
      <button title="Arrière-plan  [" onClick={props.onBack}>
        <SendToBack size={15} />
      </button>
      <button title="Dupliquer  Ctrl+D" onClick={props.onDuplicate}>
        <Copy size={15} />
      </button>
      <button
        title="Verrouiller"
        onClick={() => onPatch({ locked: !o.locked })}
      >
        {o.locked ? <Lock size={15} /> : <Unlock size={15} />}
      </button>
      <button
        title="Supprimer  Del"
        className={styles.danger}
        onClick={props.onDelete}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
