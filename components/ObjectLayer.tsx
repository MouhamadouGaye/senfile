"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
} from "lucide-react";
import {
  PageObject,
  ShapeObj,
  uid,
  PAGE_W,
  clampToPage,
  settle,
} from "@/lib/objets";
import styles from "./Objects-layer.module.css";

type Corner = "tl" | "tr" | "bl" | "br";
const SX: Record<Corner, number> = { tl: -1, tr: 1, bl: -1, br: 1 };
const SY: Record<Corner, number> = { tl: -1, tr: -1, bl: 1, br: 1 };
const CURSORS: Record<Corner, string> = {
  tl: "nwse-resize",
  tr: "nesw-resize",
  bl: "nesw-resize",
  br: "nwse-resize",
};
const MIN = 24;
const SNAP = 6;
const ACCENT = "#4b3f72";

type Gesture =
  | { mode: "move"; sx: number; sy: number; orig: PageObject }
  | {
      mode: "resize";
      corner: Corner;
      orig: PageObject;
      anchor: { x: number; y: number };
    }
  | { mode: "rotate"; orig: PageObject; cx: number; cy: number; a0: number }
  | { mode: "pinch"; orig: PageObject; d0: number; a0: number };

type Guide = { v: boolean; pos: number };
export type Ghost = { x: number; y: number; w: number; h: number };

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

function useCoarse() {
  const [c, setC] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const u = () => setC(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);
  return c;
}

function handleStyle(c: Corner, hs: number, z: number): CSSProperties {
  const off = -hs / 2;
  return {
    position: "absolute",
    zIndex: 5,
    width: hs,
    height: hs,
    background: "#fff",
    borderRadius: "50%",
    boxShadow: "0 1px 4px rgba(0,0,0,.25)",
    touchAction: "none",
    boxSizing: "border-box",
    border: `${2 / z}px solid ${ACCENT}`,
    cursor: CURSORS[c],
    ...(c[0] === "t" ? { top: off } : { bottom: off }),
    ...(c[1] === "l" ? { left: off } : { right: off }),
  };
}

type Props = {
  objects: PageObject[];
  onChange: (next: PageObject[]) => void;
  onSnapshot?: () => void;
  editable?: boolean;
  zoom?: number;
  ghost?: Ghost | null;
};

export default function ObjectsLayer({
  objects,
  onChange,
  onSnapshot,
  editable = true,
  zoom = 1,
  ghost = null,
}: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const objRef = useRef(objects);
  objRef.current = objects;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSnapRef = useRef(onSnapshot);
  onSnapRef.current = onSnapshot;
  const gesture = useRef<Gesture | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const lastSnap = useRef(0);
  const prevLen = useRef(objects.length);
  const coarse = useCoarse();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [settling, setSettling] = useState<string | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);

  const hs = (coarse ? 34 : 14) / zoom;
  const stem = (coarse ? 48 : 26) / zoom;
  const knob = (coarse ? 32 : 16) / zoom;

  useEffect(() => {
    if (objects.length > prevLen.current)
      setSelectedId(objects[objects.length - 1].id);
    prevLen.current = objects.length;
  }, [objects]);

  const snapshot = (force = false) => {
    const n = Date.now();
    if (force || n - lastSnap.current > 700) {
      onSnapRef.current?.();
      lastSnap.current = n;
    }
  };

  const patch = (id: string, p: Record<string, unknown>) =>
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
    snapshot(true);
    onChangeRef.current([
      ...objRef.current,
      settle({ ...o, id: uid(), x: o.x + 20, y: o.y + 20, z: maxZ() + 1 }),
    ]);
  }
  function remove(id: string) {
    snapshot(true);
    onChangeRef.current(objRef.current.filter((o) => o.id !== id));
    setSelectedId(null);
  }

  /** Viewport px -> page px, using the real rendered scale of the layer. */
  function toPage(ev: { clientX: number; clientY: number }) {
    const l = layerRef.current!;
    const r = l.getBoundingClientRect();
    const s = l.offsetWidth ? r.width / l.offsetWidth : 1;
    return { x: (ev.clientX - r.left) / s, y: (ev.clientY - r.top) / s };
  }

  /* ------------------------------ gestures ------------------------------ */

  function endGesture() {
    const g = gesture.current;
    stopRef.current?.();
    stopRef.current = null;
    gesture.current = null;
    pts.current.clear();
    setGuides([]);
    if (g) {
      const o = objRef.current.find((x) => x.id === g.orig.id);
      if (o) {
        const s = settle(o);
        if (s.x !== o.x || s.y !== o.y) {
          setSettling(o.id);
          patch(o.id, { x: s.x, y: s.y });
          setTimeout(() => setSettling(null), 280);
        }
      }
    }
  }

  function begin(e: React.PointerEvent, g: Gesture) {
    e.preventDefault();
    e.stopPropagation();
    if (gesture.current && !pts.current.has(e.pointerId)) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    endGesture();
    snapshot(true);
    gesture.current = g;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Second finger on the screen -> pinch (resize + rotate)
    const down = (ev: PointerEvent) => {
      pts.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      const cur = gesture.current;
      if (pts.current.size === 2 && cur) {
        const [a, b] = [...pts.current.values()];
        const o = objRef.current.find((x) => x.id === cur.orig.id);
        if (!o) return;
        gesture.current = {
          mode: "pinch",
          orig: o,
          d0: Math.hypot(b.x - a.x, b.y - a.y) || 1,
          a0: Math.atan2(b.y - a.y, b.x - a.x),
        };
      }
    };
    const move = (ev: PointerEvent) => {
      if (pts.current.has(ev.pointerId))
        pts.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      handleMove(ev);
    };
    const up = (ev: PointerEvent) => {
      pts.current.delete(ev.pointerId);
      endGesture();
    };
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    stopRef.current = () => {
      window.removeEventListener("pointerdown", down, true);
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
    const o = g.orig;

    if (g.mode === "pinch") {
      const v = [...pts.current.values()];
      if (v.length < 2) return;
      const [a, b] = v;
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const w = Math.min(PAGE_W, Math.max(MIN, o.w * (d / g.d0)));
      const h = Math.max(MIN, o.h * (w / o.w));
      const cx = o.x + o.w / 2;
      const cy = o.y + o.h / 2;
      const next = clampToPage({
        ...o,
        w: Math.round(w),
        h: Math.round(h),
        x: Math.round(cx - w / 2),
        y: Math.round(cy - h / 2),
        rotation:
          Math.round((o.rotation + ((ang - g.a0) * 180) / Math.PI) * 10) / 10,
      });
      patch(o.id, {
        w: next.w,
        h: next.h,
        x: next.x,
        y: next.y,
        rotation: next.rotation,
      });
      return;
    }

    const p = toPage(ev);
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
      const cl = clampToPage({ ...o, x: nx, y: ny });
      setGuides(gs);
      patch(o.id, { x: cl.x, y: cl.y });
    }

    if (g.mode === "resize") {
      const sx = SX[g.corner];
      const sy = SY[g.corner];
      const d = rot(p.x - g.anchor.x, p.y - g.anchor.y, -o.rotation);
      let w = Math.max(MIN, sx * d.x);
      let h = Math.max(MIN, sy * d.y);
      if ((o.type === "image") !== ev.shiftKey) {
        const r = o.w / o.h;
        if (w / r > h) h = w / r;
        else w = h * r;
      }
      w = Math.min(w, PAGE_W);
      const c = rot((sx * w) / 2, (sy * h) / 2, o.rotation);
      const next = clampToPage({
        ...o,
        w: Math.round(w),
        h: Math.round(h),
        x: Math.round(g.anchor.x + c.x - w / 2),
        y: Math.round(g.anchor.y + c.y - h / 2),
      });
      patch(o.id, { w: next.w, h: next.h, x: next.x, y: next.y });
    }

    if (g.mode === "rotate") {
      const a = Math.atan2(p.y - g.cy, p.x - g.cx);
      let deg = o.rotation + ((a - g.a0) * 180) / Math.PI;
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
      else {
        const near = Math.round(deg / 45) * 45;
        if (Math.abs(deg - near) < 4) deg = near;
      }
      const r = Math.round(deg * 10) / 10;
      const next = clampToPage({ ...o, rotation: r });
      patch(o.id, { rotation: r, x: next.x, y: next.y });
    }
  }

  function onObjDown(e: React.PointerEvent, o: PageObject) {
    if (!editable || editingId === o.id) return;
    setSelectedId(o.id);
    if (o.locked) {
      e.stopPropagation();
      return;
    }
    const p = toPage(e);
    begin(e, { mode: "move", sx: p.x, sy: p.y, orig: o });
  }

  function onHandleDown(e: React.PointerEvent, o: PageObject, corner: Corner) {
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    const a = rot(-SX[corner] * (o.w / 2), -SY[corner] * (o.h / 2), o.rotation);
    begin(e, {
      mode: "resize",
      corner,
      orig: o,
      anchor: { x: cx + a.x, y: cy + a.y },
    });
  }

  function onRotateDown(e: React.PointerEvent, o: PageObject) {
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    const p = toPage(e);
    begin(e, {
      mode: "rotate",
      orig: o,
      cx,
      cy,
      a0: Math.atan2(p.y - cy, p.x - cx),
    });
  }

  /* ------------------------ selection / keyboard ------------------------ */

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
        snapshot();
        const cl = clampToPage({
          ...o,
          x: o.x + arrows[e.key][0],
          y: o.y + arrows[e.key][1],
        });
        patch(o.id, { x: cl.x, y: cl.y });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove(o.id);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate(o.id);
      } else if (e.key === "]") {
        snapshot(true);
        patch(o.id, { z: maxZ() + 1 });
      } else if (e.key === "[") {
        snapshot(true);
        patch(o.id, { z: minZ() - 1 });
      } else if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selectedId, editingId, editable]); // eslint-disable-line

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
    <div
      ref={layerRef}
      data-objects-layer
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: PAGE_W,
        height: "100%",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      {sorted.map((o) => {
        const isSel = editable && o.id === selectedId;
        const isHover = editable && !isSel && o.id === hoverId;
        return (
          <div
            key={o.id}
            data-obj
            data-obj-id={o.id}
            data-selected={isSel}
            data-hover={isHover}
            className={styles.obj}
            onPointerEnter={() => setHoverId(o.id)}
            onPointerLeave={() => setHoverId(null)}
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
              pointerEvents: editable ? "auto" : "none",
              touchAction: "none",
              userSelect: "none",
              cursor: !editable || o.locked ? "default" : "grab",
              boxSizing: "border-box",
              transition:
                settling === o.id
                  ? "left .26s cubic-bezier(.2,1.2,.4,1), top .26s cubic-bezier(.2,1.2,.4,1), box-shadow .2s"
                  : undefined,
              outline: isSel
                ? `${1.5 / zoom}px solid ${ACCENT}`
                : isHover
                  ? `${1.5 / zoom}px solid rgba(75,63,114,.45)`
                  : "none",
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
                snapshot(true);
                patch(o.id, { text });
                setEditingId(null);
              }}
            />

            {isSel && !o.locked && (
              <>
                {(["tl", "tr", "bl", "br"] as Corner[]).map((c) => (
                  <span
                    key={c}
                    className={styles.handle}
                    style={handleStyle(c, hs, zoom)}
                    onPointerDown={(e) => onHandleDown(e, o, c)}
                  />
                ))}
                <span
                  className={styles.stem}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: -stem,
                    width: 2 / zoom,
                    height: stem,
                    marginLeft: -1 / zoom,
                    background: ACCENT,
                    pointerEvents: "none",
                  }}
                />
                <span
                  className={styles.knob}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: -stem - knob / 2,
                    width: knob,
                    height: knob,
                    marginLeft: -knob / 2,
                    background: ACCENT,
                    border: `${2 / zoom}px solid #fff`,
                    borderRadius: "50%",
                    cursor: "grab",
                    zIndex: 5,
                    touchAction: "none",
                    boxSizing: "border-box",
                    boxShadow: "0 1px 4px rgba(0,0,0,.3)",
                  }}
                  onPointerDown={(e) => onRotateDown(e, o)}
                />
              </>
            )}
          </div>
        );
      })}

      {ghost && (
        <div
          className={styles.ghost}
          style={{
            left: ghost.x,
            top: ghost.y,
            width: ghost.w,
            height: ghost.h,
          }}
        />
      )}

      {guides.map((g, i) => (
        <div
          key={i}
          className={styles.guide}
          style={
            g.v
              ? { left: g.pos, top: 0, bottom: 0, width: 1 / zoom }
              : { top: g.pos, left: 0, right: 0, height: 1 / zoom }
          }
        />
      ))}

      {editable && selected && !editingId && (
        <FloatingBar
          o={selected}
          coarse={coarse}
          onPatch={(p) => {
            snapshot();
            patch(selected.id, p);
          }}
          onDuplicate={() => duplicate(selected.id)}
          onDelete={() => remove(selected.id)}
          onFront={() => {
            snapshot(true);
            patch(selected.id, { z: maxZ() + 1 });
          }}
          onBack={() => {
            snapshot(true);
            patch(selected.id, { z: minZ() - 1 });
          }}
          onEdit={() => setEditingId(selected.id)}
        />
      )}
    </div>
  );
}

/* ------------------------- shared rendering ------------------------- */

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
          maxWidth: "none",
          objectFit: "fill",
          pointerEvents: "none",
          userSelect: "none",
          margin: 0,
          borderRadius: 0,
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
          left: 0,
          top: 0,
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
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
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

/** Read-only render used by the PDF preview, print and dashboard thumbnails. */
export function StaticObjects({ objects }: { objects: PageObject[] }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
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

/* -------------------------- floating toolbar -------------------------- */

function FloatingBar(props: {
  o: PageObject;
  coarse: boolean;
  onPatch: (p: Record<string, unknown>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFront: () => void;
  onBack: () => void;
  onEdit: () => void;
}) {
  const { o, onPatch, coarse } = props;
  const shape = o.type === "shape" ? o : null;
  const ref = useRef<HTMLDivElement>(null);
  const btn: CSSProperties = {
    minWidth: coarse ? 42 : 30,
    height: coarse ? 42 : 30,
    padding: "0 6px",
  };

  useLayoutEffect(() => {
    const place = () => {
      const el = document.querySelector<HTMLElement>(`[data-obj-id="${o.id}"]`);
      const bar = ref.current;
      if (!el || !bar) return;
      const M = 8;
      if (window.matchMedia("(pointer: coarse)").matches) {
        const vh = window.visualViewport?.height ?? window.innerHeight;
        bar.style.left = `${M}px`;
        bar.style.top = `${Math.max(M, vh - bar.offsetHeight - M)}px`;
        return;
      }
      const r = el.getBoundingClientRect();
      const bw = bar.offsetWidth;
      const bh = bar.offsetHeight;
      let top = r.top - bh - 56;
      if (top < M) top = r.bottom + 18;
      top = Math.min(top, window.innerHeight - bh - M);
      const left = Math.min(
        Math.max(r.left + r.width / 2 - bw / 2, M),
        window.innerWidth - bw - M,
      );
      bar.style.left = `${Math.round(left)}px`;
      bar.style.top = `${Math.round(Math.max(M, top))}px`;
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [o.id, o.x, o.y, o.w, o.h, o.rotation, o.type, coarse]);

  return createPortal(
    <div
      ref={ref}
      data-obj-ui
      className={styles.bar}
      style={{ left: -9999, top: 0 }}
    >
      {shape && (
        <>
          <input
            type="color"
            title="Remplissage"
            value={shape.fill}
            onChange={(e) => onPatch({ fill: e.target.value })}
          />
          <input
            type="color"
            title="Contour"
            value={shape.stroke}
            onChange={(e) => onPatch({ stroke: e.target.value })}
          />
          <input
            type="range"
            min={0}
            max={12}
            title="Épaisseur du contour"
            value={shape.strokeWidth}
            onChange={(e) => onPatch({ strokeWidth: +e.target.value })}
          />
          {(shape.shape === "rectangle" || shape.shape === "bubble") && (
            <input
              type="range"
              min={0}
              max={80}
              title="Arrondi"
              value={shape.radius}
              onChange={(e) => onPatch({ radius: +e.target.value })}
            />
          )}
          <span className={styles.sep} />
          <input
            type="color"
            title="Couleur du texte"
            value={shape.textColor}
            onChange={(e) => onPatch({ textColor: e.target.value })}
          />
          <input
            type="range"
            min={10}
            max={72}
            title="Taille du texte"
            value={shape.fontSize}
            onChange={(e) => onPatch({ fontSize: +e.target.value })}
          />
          <button
            title="Alignement du texte"
            style={btn}
            onClick={() =>
              onPatch({
                textAlign:
                  shape.textAlign === "left"
                    ? "center"
                    : shape.textAlign === "center"
                      ? "right"
                      : "left",
              })
            }
          >
            {shape.textAlign === "left"
              ? "⇤"
              : shape.textAlign === "right"
                ? "⇥"
                : "↔"}
          </button>
          <button title="Modifier le texte" style={btn} onClick={props.onEdit}>
            Aa
          </button>
          <button
            title="Ombre"
            style={{ ...btn, background: shape.shadow ? "#e8e4fb" : undefined }}
            onClick={() => onPatch({ shadow: !shape.shadow })}
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
        title="Opacité"
        value={Math.round((o.opacity ?? 1) * 100)}
        onChange={(e) => onPatch({ opacity: +e.target.value / 100 })}
      />
      <span className={styles.sep} />
      <button title="Premier plan" style={btn} onClick={props.onFront}>
        <BringToFront size={15} />
      </button>
      <button title="Arrière-plan" style={btn} onClick={props.onBack}>
        <SendToBack size={15} />
      </button>
      <button title="Dupliquer" style={btn} onClick={props.onDuplicate}>
        <Copy size={15} />
      </button>
      <button
        title="Verrouiller"
        style={btn}
        onClick={() => onPatch({ locked: !o.locked })}
      >
        {o.locked ? <Lock size={15} /> : <Unlock size={15} />}
      </button>
      <button
        title="Supprimer"
        className={styles.danger}
        style={btn}
        onClick={props.onDelete}
      >
        <Trash2 size={15} />
      </button>
    </div>,
    document.body,
  );
}
