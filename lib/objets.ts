// export type ShapeKind =
//   | "rectangle"
//   | "ellipse"
//   | "triangle"
//   | "diamond"
//   | "star"
//   | "arrow"
//   | "bubble";

// type Base = {
//   id: string;
//   x: number; // px, relative to the page's top-left corner (96dpi)
//   y: number;
//   w: number;
//   h: number;
//   rotation: number; // degrees, around the centre
//   z: number;
//   locked?: boolean;
//   opacity?: number; // 0..1
// };

// export type ImageObj = Base & { type: "image"; src: string };

// export type ShapeObj = Base & {
//   type: "shape";
//   shape: ShapeKind;
//   fill: string;
//   stroke: string;
//   strokeWidth: number;
//   radius: number;
//   shadow: boolean;
//   text: string;
//   textColor: string;
//   fontSize: number;
//   textAlign: "left" | "center" | "right";
// };

// export type PageObject = ImageObj | ShapeObj;

// export const uid = () => Math.random().toString(36).slice(2, 10);

// export function makeImage(
//   src: string,
//   x: number,
//   y: number,
//   w: number,
//   h: number,
//   z: number,
// ): ImageObj {
//   return { id: uid(), type: "image", src, x, y, w, h, rotation: 0, z };
// }

// export function makeShape(
//   kind: ShapeKind,
//   x: number,
//   y: number,
//   z: number,
//   square = false,
// ): ShapeObj {
//   const w = square ? 200 : 240;
//   const h = square ? 200 : kind === "arrow" ? 120 : 140;
//   return {
//     id: uid(),
//     type: "shape",
//     shape: kind,
//     x,
//     y,
//     w,
//     h,
//     rotation: 0,
//     z,
//     fill: "#e8e4fb",
//     stroke: "#4b3f72",
//     strokeWidth: 2,
//     radius: kind === "rectangle" ? 16 : 20,
//     shadow: true,
//     text: "",
//     textColor: "#2a2340",
//     fontSize: 18,
//     textAlign: "center",
//   };
// }

// function textOf(n: any): string {
//   if (!n) return "";
//   if (n.type === "text") return n.text || "";
//   const inner = (n.content || []).map(textOf).join("");
//   return n.type === "paragraph" ? inner + "\n" : inner;
// }

// /**
//  * Splits stored content into { TipTap doc, objects } and migrates legacy
//  * `image` / `shapeBlock` nodes (best effort) into free objects.
//  */
// export function splitContent(raw: any): { doc: any; objects: PageObject[] } {
//   const empty = { type: "doc", content: [{ type: "paragraph" }] };
//   if (!raw) return { doc: empty, objects: [] };

//   const objects: PageObject[] = Array.isArray(raw.objects)
//     ? [...raw.objects]
//     : [];
//   let z = objects.reduce((m, o) => Math.max(m, o.z), 0);

//   const walk = (node: any): any => {
//     if (!node?.content) return node;
//     const kept: any[] = [];
//     for (const c of node.content) {
//       const a = c.attrs || {};
//       if (c.type === "image" && a.src) {
//         const w = Number(a.width) || 320;
//         const h = Number(a.height) || w * 0.66;
//         objects.push(
//           makeImage(a.src, Number(a.x) || 80, Number(a.y) || 80, w, h, ++z),
//         );
//       } else if (c.type === "shapeBlock") {
//         const kind: ShapeKind =
//           a.shapeType === "circle" ? "ellipse" : "rectangle";
//         const s = makeShape(kind, Number(a.x) || 80, Number(a.y) || 80, ++z);
//         s.w = Number(a.width) || s.w;
//         s.h = Number(a.height) || s.h;
//         if (a.fill && a.fill !== "transparent") s.fill = a.fill;
//         if (a.borderColor) s.stroke = a.borderColor;
//         s.text = textOf(c).trim();
//         objects.push(s);
//       } else kept.push(walk(c));
//     }
//     return { ...node, content: kept };
//   };

//   const doc = walk({ type: "doc", content: raw.content || [] });
//   if (!doc.content.length) doc.content = [{ type: "paragraph" }];
//   return { doc, objects };
// }
export type ShapeKind =
  | "rectangle"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "star"
  | "arrow"
  | "bubble";

type Base = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  z: number;
  locked?: boolean;
  opacity?: number;
};

export type ImageObj = Base & { type: "image"; src: string };

export type ShapeObj = Base & {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
  shadow: boolean;
  text: string;
  textColor: string;
  fontSize: number;
  textAlign: "left" | "center" | "right";
};

export type PageObject = ImageObj | ShapeObj;

export const PAGE_W = 794;
export const PAGE_H = 1123;
export const SAFE = 30;
export const SHAPE_MIME = "application/x-atelier-shape";

export type DropSpec =
  | { kind: "shape"; shape: ShapeKind; square?: boolean }
  | { kind: "image"; src: string; w: number; h: number };

export const uid = () => Math.random().toString(36).slice(2, 10);

/* ------------------------------ factories ------------------------------ */

export function makeImage(
  src: string,
  x: number,
  y: number,
  w: number,
  h: number,
  z: number,
): ImageObj {
  return { id: uid(), type: "image", src, x, y, w, h, rotation: 0, z };
}

export function makeShape(
  kind: ShapeKind,
  x: number,
  y: number,
  z: number,
  square = false,
): ShapeObj {
  const w = square ? 200 : 240;
  const h = square ? 200 : kind === "arrow" ? 120 : 140;
  return {
    id: uid(),
    type: "shape",
    shape: kind,
    x,
    y,
    w,
    h,
    rotation: 0,
    z,
    fill: "#e8e4fb",
    stroke: "#4b3f72",
    strokeWidth: 2,
    radius: kind === "rectangle" ? 16 : 20,
    shadow: true,
    text: "",
    textColor: "#2a2340",
    fontSize: 18,
    textAlign: "center",
  };
}

export function fitImage(nw: number, nh: number, maxW = 360, maxH = 640) {
  let w = Math.min(maxW, nw);
  let h = (w * nh) / nw;
  if (h > maxH) {
    h = maxH;
    w = (h * nw) / nh;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

export function objectFromSpec(spec: DropSpec, z: number): PageObject {
  if (spec.kind === "shape") return makeShape(spec.shape, 0, 0, z, spec.square);
  const { w, h } = fitImage(spec.w, spec.h);
  return makeImage(spec.src, 0, 0, w, h, z);
}

export function loadImageSize(src: string) {
  return new Promise<{ w: number; h: number }>((res) => {
    const i = new window.Image();
    i.onload = () =>
      res({ w: i.naturalWidth || 300, h: i.naturalHeight || 200 });
    i.onerror = () => res({ w: 300, h: 200 });
    i.src = src;
  });
}

/* ------------------------------- geometry ------------------------------- */

/** Real scale of a (possibly CSS-scaled) element: rendered width / layout width. */
export function pageMetrics(page: HTMLElement) {
  const rect = page.getBoundingClientRect();
  const scale = page.offsetWidth ? rect.width / page.offsetWidth : 1;
  return { rect, scale: scale || 1 };
}

/** Pointer position (viewport px) -> page coordinates (96dpi, top-left origin). */
export function clientToPage(page: HTMLElement, cx: number, cy: number) {
  const { rect, scale } = pageMetrics(page);
  return { x: (cx - rect.left) / scale, y: (cy - rect.top) / scale };
}

export function rotatedExtent(o: { w: number; h: number; rotation: number }) {
  const r = (o.rotation * Math.PI) / 180;
  return {
    hw: (Math.abs(o.w * Math.cos(r)) + Math.abs(o.h * Math.sin(r))) / 2,
    hh: (Math.abs(o.w * Math.sin(r)) + Math.abs(o.h * Math.cos(r))) / 2,
  };
}

/** Keeps the rotated box inside the sheet horizontally and below the top edge. */
export function clampToPage<T extends PageObject>(o: T): T {
  const n = (v: number, d: number) => (Number.isFinite(v) ? v : d);
  const base = {
    ...o,
    x: n(o.x, 80),
    y: n(o.y, 80),
    w: n(o.w, 200),
    h: n(o.h, 150),
    rotation: n(o.rotation, 0),
  } as T;
  const { hw, hh } = rotatedExtent(base);
  const cx0 = base.x + base.w / 2;
  const cx =
    2 * hw >= PAGE_W ? PAGE_W / 2 : Math.min(Math.max(cx0, hw), PAGE_W - hw);
  const cy = Math.max(base.y + base.h / 2, hh);
  return {
    ...base,
    x: Math.round(cx - base.w / 2),
    y: Math.round(cy - base.h / 2),
  };
}

/** clamp + keep the object inside the 30px safe bands of the page its centre is on. */
export function settle<T extends PageObject>(o: T): T {
  const c = clampToPage(o);
  const { hh } = rotatedExtent(c);
  const cy = c.y + c.h / 2;
  const idx = Math.max(0, Math.floor(cy / PAGE_H));
  const lo = idx * PAGE_H + SAFE + hh;
  const hi = (idx + 1) * PAGE_H - SAFE - hh;
  if (hi < lo) return c;
  const ncy = Math.min(Math.max(cy, lo), hi);
  return { ...c, y: Math.round(ncy - c.h / 2) };
}

/** Puts the object's centre exactly on a page point, then settles it. */
export function placeCentered<T extends PageObject>(
  o: T,
  p: { x: number; y: number },
): T {
  return settle({ ...o, x: p.x - o.w / 2, y: p.y - o.h / 2 });
}

export function pageHeightFor(objects: PageObject[]) {
  const bottom = objects.reduce((m, o) => {
    const { hh } = rotatedExtent(o);
    return Math.max(m, o.y + o.h / 2 + hh);
  }, 0);
  return Math.max(PAGE_H, Math.ceil((bottom + SAFE) / PAGE_H) * PAGE_H);
}

/* ------------------------------- migration ------------------------------ */

function textOf(n: any): string {
  if (!n) return "";
  if (n.type === "text") return n.text || "";
  const inner = (n.content || []).map(textOf).join("");
  return n.type === "paragraph" ? inner + "\n" : inner;
}

export function splitContent(raw: any): { doc: any; objects: PageObject[] } {
  const empty = { type: "doc", content: [{ type: "paragraph" }] };
  if (!raw) return { doc: empty, objects: [] };

  const objects: PageObject[] = Array.isArray(raw.objects)
    ? [...raw.objects]
    : [];
  let z = objects.reduce((m, o) => Math.max(m, o.z), 0);

  const walk = (node: any): any => {
    if (!node?.content) return node;
    const kept: any[] = [];
    for (const c of node.content) {
      const a = c.attrs || {};
      if (c.type === "image" && a.src) {
        const w = Number(a.width) || 320;
        const h = Number(a.height) || w * 0.66;
        objects.push(
          makeImage(a.src, Number(a.x) || 80, Number(a.y) || 80, w, h, ++z),
        );
      } else if (c.type === "shapeBlock") {
        const kind: ShapeKind =
          a.shapeType === "circle" ? "ellipse" : "rectangle";
        const s = makeShape(kind, Number(a.x) || 80, Number(a.y) || 80, ++z);
        s.w = Number(a.width) || s.w;
        s.h = Number(a.height) || s.h;
        if (a.fill && a.fill !== "transparent") s.fill = a.fill;
        if (a.borderColor) s.stroke = a.borderColor;
        s.text = textOf(c).trim();
        objects.push(s);
      } else kept.push(walk(c));
    }
    return { ...node, content: kept };
  };

  const doc = walk({ type: "doc", content: raw.content || [] });
  if (!doc.content.length) doc.content = [{ type: "paragraph" }];
  return { doc, objects: objects.map(clampToPage) };
}
