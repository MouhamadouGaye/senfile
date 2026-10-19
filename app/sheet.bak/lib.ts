export const API =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `https://${window.location.hostname}:8000`
    : "http://localhost:8000");
export let RH = 28;
export const setRH = (n: number) => {
  RH = n;
};
export const CH = 200,
  OVER = 8,
  MINC = 26;
export type Meta = {
  id: string;
  name: string;
  columns: string[];
  total: number;
  real_total: number;
  filters: Record<string, any>;
  can_undo: boolean;
};
export type Op = { id: string; kind: string; cat: string; label: string };
export type Res = { columns: string[]; rows: any[][] } | null;
export type Sel = { a: [number, number]; b: [number, number] };
export type Data = {
  labels: string[];
  series: { name: string; values: number[] }[];
};
export async function api(path: string, init?: RequestInit) {
  const r = await fetch(API + path, init);
  if (!r.ok)
    throw new Error((await r.json().catch(() => ({}))).detail ?? r.statusText);
  return r.json();
}
export const send = (method: string, p: string, body: unknown) =>
  api(p, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
export const post = (p: string, b: unknown) => send("POST", p, b);
export const fmt = (v: any) =>
  v === null || v === undefined
    ? ""
    : typeof v === "number"
      ? String(+v.toFixed(6)).replace(".", DEC)
      : String(v);
export const letter = (i: number) => {
  let s = "",
    n = i + 1;
  while (n) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};
export const nf = (v: number | null) =>
  v === null
    ? "–"
    : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 }).format(v);
export type Rule = {
  col: string;
  op: string;
  a: string;
  b: string;
  color: string;
};
export const COLORS = [
  "oklch(62% .22 25)",
  "oklch(75% .17 65)",
  "oklch(85% .17 95)",
  "oklch(70% .18 150)",
  "oklch(62% .17 262)",
  "oklch(60% .02 260)",
];
export function matchRule(r: Rule, v: any): boolean {
  const e = v === null || v === undefined || v === "";
  if (r.op === "empty") return e;
  if (e) return false;
  const s = String(v).toLowerCase(),
    a = r.a.toLowerCase(),
    n = typeof v === "number" ? v : Number(String(v).replace(",", ".")),
    isN = !Number.isNaN(n) && s.trim() !== "";
  switch (r.op) {
    case "gt":
      return isN && n > +r.a;
    case "lt":
      return isN && n < +r.a;
    case "eq":
      return isN && r.a !== "" && !Number.isNaN(+r.a) ? n === +r.a : s === a;
    case "ne":
      return !(isN && r.a !== "" && !Number.isNaN(+r.a) ? n === +r.a : s === a);
    case "between":
      return isN && n >= +r.a && n <= +r.b;
    case "contains":
      return s.includes(a);
    case "starts":
      return s.startsWith(a);
    case "neg":
      return isN && n < 0;
    case "err":
      return s.startsWith("#");
    default:
      return false;
  }
}
const DEC =
  typeof navigator !== "undefined"
    ? (1.1).toLocaleString(navigator.language).charAt(1)
    : ",";
export type Style = {
  b?: boolean;
  i?: boolean;
  u?: boolean;
  s?: boolean;
  color?: string;
  bg?: string;
  align?: "left" | "center" | "right";
  fs?: number;
  ff?: string;
  wrap?: boolean;
  bd?: boolean;
  nf?: string;
  dec?: number;
};
export const FONTS: Record<string, string> = {
  Système: "inherit",
  Arial: "Arial, Helvetica, sans-serif",
  Georgia: "Georgia, serif",
  Times: "'Times New Roman', serif",
  Verdana: "Verdana, sans-serif",
  Mono: "ui-monospace, Menlo, Consolas, monospace",
};
export function fmtStyled(v: any, s: Style): string {
  if (typeof v !== "number" || !s.nf) return fmt(v);
  const loc = typeof navigator !== "undefined" ? navigator.language : "fr-FR",
    d = s.nf === "int" ? 0 : (s.dec ?? 2),
    o = { minimumFractionDigits: d, maximumFractionDigits: d };
  switch (s.nf) {
    case "num":
      return v.toLocaleString(loc, { ...o, useGrouping: false });
    case "int":
      return Math.round(v).toLocaleString(loc, { useGrouping: false });
    case "thou":
      return v.toLocaleString(loc, o);
    case "pct":
      return (v * 100).toLocaleString(loc, o) + " %";
    case "eur":
      return v.toLocaleString(loc, {
        ...o,
        style: "currency",
        currency: "EUR",
      });
    case "usd":
      return v.toLocaleString(loc, {
        ...o,
        style: "currency",
        currency: "USD",
      });
    default:
      return fmt(v);
  }
}
export function cssOf(s: Style) {
  const o: Record<string, any> = {},
    td = [s.u && "underline", s.s && "line-through"].filter(Boolean).join(" ");
  if (s.b) o.fontWeight = 700;
  if (s.i) o.fontStyle = "italic";
  if (td) o.textDecoration = td;
  if (s.color) o.color = s.color;
  if (s.bg) o.background = s.bg;
  if (s.align) o.textAlign = s.align;
  if (s.fs) o.fontSize = s.fs;
  if (s.ff && FONTS[s.ff]) o.fontFamily = FONTS[s.ff];
  if (s.wrap) {
    o.whiteSpace = "normal";
    o.lineHeight = 1.25;
  }
  if (s.bd) {
    o.outline = "1px solid #7a859a";
    o.outlineOffset = "-1px";
  }
  return o;
}
