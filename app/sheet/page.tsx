"use client";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  API,
  RH,
  setRH,
  CH,
  OVER,
  MINC,
  api,
  send,
  post,
  fmt,
  fmtStyled,
  cssOf,
  letter,
  nf,
} from "./lib";
import { Ribbon } from "./ribbon";
import { FormatBar } from "./formatbar";
import { Icon } from "./icons";
import { FloatObj } from "./objects";
import type { Obj } from "./objects";
import { QuickAnalysis } from "./quick";
import type { Kind } from "./dialogs";
import { FormulaAssist } from "./assist";
import type { FDoc } from "./assist";
import { SheetTabs } from "./tabs";
import { DashboardView } from "./dashboard";
import type { Meta, Op, Res, Sel, Rule, Style } from "./lib";
import { matchRule } from "./lib";
import {
  ChartDialog,
  PivotDialog,
  MenuList,
  RulesDialog,
  FilterMenu,
  FormulaHelp,
  CalcDialog,
  Palette,
} from "./dialogs";

const AGL: Record<string, string> = {
  sum: "Σ",
  mean: "Moy.",
  min: "Min",
  max: "Max",
  count: "Nb",
  median: "Méd.",
};

export default function Page() {
  const [list, setList] = useState<Meta[]>([]);
  const [t, setT] = useState<Meta | null>(null);
  const [ops, setOps] = useState<Op[]>([]);
  const [q, setQ] = useState("");
  const [arg, setArg] = useState("");
  const [inplace, setInplace] = useState(false);
  const [sel, setSel] = useState<Sel | null>(null);
  const [drag, setDrag] = useState(false);
  const [edit, setEdit] = useState<{
    r: number;
    c: number;
    init?: string;
  } | null>(null);
  const [res, setRes] = useState<Res>(null);
  const [msg, setMsg] = useState("");
  const [top, setTop] = useState(0);
  const [vh, setVh] = useState(600);
  const [extra, setExtra] = useState(100);
  const [ver, setVer] = useState(0);
  const [, tick] = useState(0);
  const [widths, setWidths] = useState<number[]>([]);
  const [find, setFind] = useState("");
  const [hits, setHits] = useState<[number, number][]>([]);
  const [hi, setHi] = useState(0);
  const [stat, setStat] = useState<any>(null);
  const [lk, setLk] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const cache = useRef(
    new Map<
      number,
      {
        v: number;
        rows: any[][];
        idx?: number[];
        f?: Record<string, string>;
        s?: Record<string, Style>;
        cs?: Record<string, Style>;
        m?: { r: number; c: number; rs: number; cs: number }[];
      }
    >(),
  );
  const pend = useRef(new Set<string>());
  const idRef = useRef("");
  const rz = useRef<{ c: number; x: number; w: number } | null>(null);
  const skip = useRef(false),
    skipH = useRef(false);
  const [rh, setRh] = useState<Record<number, number>>({});
  const rzr = useRef<{ r: number; y: number; h: number } | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [dlg, setDlg] = useState<"chart" | "pivot" | "rules" | null>(null);
  const [fm, setFm] = useState<{ c: number; x: number; y: number } | null>(
    null,
  );
  const [rules, setRules] = useState<Rule[]>([]);
  const [help, setHelp] = useState(false);
  const verRef = useRef(0);
  verRef.current = ver;
  const [fz, setFz] = useState({ r: 0, c: 0 });
  const [et, setEt] = useState("");
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [ai, setAi] = useState(0);
  const [fdoc, setFdoc] = useState<FDoc[]>([]);
  const inRef = useRef<HTMLInputElement>(null);
  const [qa, setQa] = useState(false);
  const [objs, setObjs] = useState<Obj[]>([]);
  const [osel, setOsel] = useState("");
  const [ckind, setCkind] = useState<Kind | undefined>();
  const [opts, setOpts] = useState({
    grid: "soft",
    band: false,
    cross: true,
    grp: "off",
    pad: false,
  });
  const [panel, setPanel] = useState(true);
  const [sw, setSw] = useState(384);
  const [view, setView] = useState<"sheet" | "dash">("sheet");
  const [sheet, setSheet] = useState(false);
  const [selMode, setSelMode] = useState(false);
  const [calc, setCalc] = useState(false);
  const [pal, setPal] = useState(false);
  const [aggs, setAggs] = useState<Record<string, string>>({});
  const [sums, setSums] = useState<Record<string, number | null>>({});
  const lp = useRef(0),
    tapOk = useRef(true),
    lastType = useRef("mouse"),
    menuAt = useRef(0);
  const [hdr, setHdr] = useState<number | null>(null);

  const queue = useRef<Promise<void>>(Promise.resolve());
  const guard = (fn: () => Promise<void>) => {
    const p = queue.current.then(async () => {
      try {
        await fn();
      } catch (e: any) {
        setMsg("Erreur : " + e.message);
      }
    });
    queue.current = p;
    return p;
  };
  const apply = (m: Meta) => {
    setT(m);
    setVer((v) => v + 1);
    setList((l) =>
      l.some((x) => x.id === m.id)
        ? l.map((x) => (x.id === m.id ? m : x))
        : [m, ...l],
    );
  };
  const openTable = (m: Meta) => {
    idRef.current = m.id;
    cache.current.clear();
    pend.current.clear();
    setSel(null);
    setHits([]);
    setRes(null);
    setExtra(100);
    setTop(0);
    wrap.current?.scrollTo(0, 0);
    try {
      setWidths(JSON.parse(localStorage.getItem("sheetly.w." + m.id) ?? "[]"));
    } catch {
      setWidths([]);
    }
    localStorage.setItem("sheetly.cur", m.id);
    try {
      setRules(JSON.parse(localStorage.getItem("sheetly.r." + m.id) ?? "[]"));
    } catch {
      setRules([]);
    }
    try {
      setAggs(JSON.parse(localStorage.getItem("sheetly.s." + m.id) ?? "{}"));
    } catch {
      setAggs({});
    }
    try {
      setFz(
        JSON.parse(
          localStorage.getItem("sheetly.z." + m.id) ?? '{"r":0,"c":0}',
        ),
      );
    } catch {
      setFz({ r: 0, c: 0 });
    }
    try {
      setRh(JSON.parse(localStorage.getItem("sheetly.h." + m.id) ?? "{}"));
    } catch {
      setRh({});
    }
    setVer((v) => v + 1);
    setT(m);
  };
  const adopt = (m: Meta) => {
    setList((l) => [...l.filter((x) => x.id !== m.id), m]);
    openTable(m);
  };

  useEffect(() => {
    guard(async () => {
      setOps(await api("/ops"));
      const l: Meta[] = await api("/tables");
      setList(l);
      const m =
        l.find((x) => x.id === localStorage.getItem("sheetly.cur")) ?? l[0];
      m ? openTable(m) : adopt(await post("/tables/new", {}));
    });
    if (window.matchMedia("(pointer: coarse)").matches) {
      setRH(40);
      tick((x) => x + 1);
    }
    const onSize = () => setVh(wrap.current?.clientHeight || 600);
    onSize();
    const mv = (e: MouseEvent) => {
      const rr = rzr.current;
      if (rr)
        setRh((h) => ({
          ...h,
          [rr.r]: Math.max(18, Math.round(rr.h + e.clientY - rr.y)),
        }));
      const r = rz.current;
      if (r)
        setWidths((w) => {
          const n = [...w];
          n[r.c] = Math.max(48, r.w + e.clientX - r.x);
          return n;
        });
    };
    const up = () => {
      rz.current = null;
      rzr.current = null;
      setDrag(false);
      window.clearTimeout(lp.current);
    };
    window.addEventListener("resize", onSize);
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("resize", onSize);
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);
  useEffect(() => {
    if (t) localStorage.setItem("sheetly.w." + t.id, JSON.stringify(widths));
  }, [widths]);
  useEffect(() => {
    if (t) localStorage.setItem("sheetly.h." + t.id, JSON.stringify(rh));
  }, [rh]);
  useEffect(() => {
    if (t) localStorage.setItem("sheetly.r." + t.id, JSON.stringify(rules));
  }, [rules]);
  useEffect(() => {
    if (t) localStorage.setItem("sheetly.s." + t.id, JSON.stringify(aggs));
  }, [aggs]);
  useEffect(() => {
    if (t) localStorage.setItem("sheetly.z." + t.id, JSON.stringify(fz));
  }, [fz]);
  useEffect(() => {
    if (!t || !Object.keys(aggs).length) {
      setSums({});
      return;
    }
    post(`/tables/${t.id}/summary`, { aggs })
      .then(setSums)
      .catch(() => {});
  }, [t?.id, ver, aggs]);
  useEffect(() => {
    setVh(wrap.current?.clientHeight || 600);
  }, [view]);
  useEffect(() => {
    api("/formulas")
      .then(setFdoc)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!edit) {
      setAnchor(null);
      return;
    }
    setEt(edit.init ?? fx(edit.r, edit.c) ?? fmt(cell(edit.r, edit.c)));
    setAi(0);
    const el = document.querySelector(
      `td[data-r="${edit.r}"][data-c="${edit.c}"]`,
    );
    if (el) {
      const b = el.getBoundingClientRect();
      setAnchor({
        x: Math.max(8, Math.min(b.left, window.innerWidth - 400)),
        y: Math.min(b.bottom + 6, window.innerHeight - 140),
      });
    }
  }, [edit?.r, edit?.c, edit?.init]);
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("sheetly.ui") ?? "{}");
      if (u.opts) setOpts(u.opts);
      if (u.sw) setSw(u.sw);
      if (u.panel === false) setPanel(false);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("sheetly.ui", JSON.stringify({ opts, sw, panel }));
  }, [opts, sw, panel]);
  useEffect(() => {
    setObjs([]);
    setOsel("");
    if (t)
      api(`/tables/${t.id}/objects`)
        .then(setObjs)
        .catch(() => {});
  }, [t?.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPal(true);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => {
    const c = () => {
      if (Date.now() > menuAt.current) setMenu(null);
    };
    window.addEventListener("click", c);
    return () => window.removeEventListener("click", c);
  }, []);

  const total = t?.total ?? 0,
    nRows = total + extra,
    nCols = Math.max(MINC, t?.columns.length ?? 0);
  const ov = useMemo(
    () => Object.entries(rh).map(([k, v]) => [+k, v - RH] as [number, number]),
    [rh],
  );
  const rowTop = (r: number) =>
    r * RH + ov.reduce((s, [k, d]) => (k < r ? s + d : s), 0);
  const rowH = (r: number) => rh[r] ?? RH;
  const rowAt = (y: number) => {
    let lo = 0,
      hi = nRows;
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1;
      if (rowTop(m) <= y) lo = m;
      else hi = m - 1;
    }
    return lo;
  };
  const first = Math.max(0, rowAt(top) - OVER),
    last = Math.min(nRows - 1, rowAt(top + vh) + OVER);
  const cols = useMemo(
    () => Array.from({ length: nCols }, (_, i) => i),
    [nCols],
  );
  const W = (c: number) => widths[c] ?? 120;
  const tw = 56 + cols.reduce((s, c) => s + W(c), 0);

  useEffect(() => {
    if (!t || total === 0) return;
    const tid = t.id;
    const want: number[] = [];
    for (
      let c2 = Math.floor(first / CH);
      c2 <= Math.floor(Math.min(last, total - 1) / CH);
      c2++
    )
      want.push(c2);
    if (fz.r > 0 && !want.includes(0)) want.push(0);
    for (const ch of want) {
      const e = cache.current.get(ch),
        k = `${tid}:${ch}:${ver}`;
      if ((e && e.v === ver) || pend.current.has(k)) continue;
      pend.current.add(k);
      api(`/tables/${tid}/rows?off=${ch * CH}&lim=${CH}&idx=1`)
        .then((o) => {
          if (idRef.current === tid && ver === verRef.current) {
            cache.current.set(ch, {
              v: ver,
              rows: o.rows,
              idx: o.idx,
              f: o.f,
              s: o.s,
              cs: o.cs,
              m: o.m,
            });
            tick((x) => x + 1);
          }
        })
        .catch(() => {})
        .finally(() => pend.current.delete(k));
    }
  }, [t?.id, first, last, total, ver, fz.r]);

  const box = useMemo(
    () =>
      sel && {
        r0: Math.min(sel.a[0], sel.b[0]),
        r1: Math.max(sel.a[0], sel.b[0]),
        c0: Math.min(sel.a[1], sel.b[1]),
        c1: Math.max(sel.a[1], sel.b[1]),
      },
    [sel],
  );
  const inSel = (r: number, c: number) =>
    !!box && r >= box.r0 && r <= box.r1 && c >= box.c0 && c <= box.c1;
  const hitSet = useMemo(() => new Set(hits.map((h) => h.join(":"))), [hits]);
  const cell = (r: number, c: number) =>
    r >= total
      ? null
      : (cache.current.get(Math.floor(r / CH))?.rows[r % CH]?.[c] ?? null);
  const fx = (r: number, c: number) =>
    cache.current.get(Math.floor(r / CH))?.f?.[`${r}:${c}`];
  const rowNo = (r: number) =>
    r >= total
      ? (t?.real_total ?? total) + (r - total) + 1
      : (cache.current.get(Math.floor(r / CH))?.idx?.[r % CH] ?? r) + 1;
  const sty = (r: number, c: number): Style => {
    const e = cache.current.get(Math.floor(r / CH));
    return { ...(e?.cs?.[c] ?? {}), ...(e?.s?.[`${r}:${c}`] ?? {}) };
  };
  const tint = (v: any, c: number) => {
    const nm = t?.columns[c] ?? "";
    for (const ru of rules)
      if ((!ru.col || ru.col === nm) && matchRule(ru, v))
        return {
          background: `color-mix(in oklch, ${ru.color} 34%, transparent)`,
        };
    return undefined;
  };

  useEffect(() => {
    setStat(null);
    if (!t || !box || (box.r0 === box.r1 && box.c0 === box.c1)) return;
    const id = setTimeout(
      () =>
        post(`/tables/${t.id}/quick`, {
          r0: box.r0,
          r1: Math.min(box.r1, total - 1),
          c0: box.c0,
          c1: box.c1,
        })
          .then(setStat)
          .catch(() => {}),
      150,
    );
    return () => clearTimeout(id);
  }, [box, t?.id, ver]);

  const exec = (
    id: string,
    o: {
      arg?: string;
      b?: { r0: number; r1: number; c0: number; c1: number } | null;
    } = {},
  ) =>
    guard(async () => {
      if (!t) return;
      const b = o.b === undefined ? box : o.b;
      const label = ops.find((x) => x.id === id)?.label ?? id;
      const out = await post(`/tables/${t.id}/ops`, {
        op: id,
        arg: o.arg ?? arg,
        inplace,
        sel: {
          cols: [],
          c0: b?.c0,
          c1: b?.c1,
          r0: b?.r0,
          r1: b ? Math.min(b.r1, total - 1) : undefined,
        },
      });
      apply(out.table);
      setRes(out.result);
      setMsg(`${label} : fait`);
    });
  const runOp = (o: Op) => exec(o.id);
  const runId = (id: string) => exec(id);
  const undo = () =>
    t && guard(async () => apply(await post(`/tables/${t.id}/undo`, {})));
  const upload = (f?: File) =>
    f &&
    guard(async () => {
      const fd = new FormData();
      fd.append("file", f);
      adopt(await api("/tables/upload", { method: "POST", body: fd }));
    });
  const importSql = () =>
    guard(async () => {
      const url = prompt(
        "URL de la base (ex. sqlite:///data.db ou postgresql://user:mdp@hote/base)",
      );
      if (!url) return;
      const query = prompt("Requête SQL", "SELECT * FROM ma_table");
      if (!query) return;
      adopt(await post("/import/sql", { url, query }));
    });
  const removeTable = () =>
    t &&
    confirm(`Supprimer « ${t.name} » ?`) &&
    guard(async () => {
      await api(`/tables/${t.id}`, { method: "DELETE" });
      const rest = list.filter((x) => x.id !== t.id);
      setList(rest);
      rest[0] ? openTable(rest[0]) : adopt(await post("/tables/new", {}));
    });
  const commitEdit = (r: number, c: number, value: string) => {
    setEdit(null);
    wrap.current?.focus();
    if (skip.current) {
      skip.current = false;
      return;
    }
    if (!t || value === (fx(r, c) ?? fmt(cell(r, c)))) return;
    const ent = cache.current.get(Math.floor(r / CH)),
      row = ent?.rows[r % CH],
      prev = row?.[c],
      txt = value.trim();
    const shown = /^-?\d+([.,]\d+)?$/.test(txt)
      ? Number(txt.replace(",", "."))
      : txt === ""
        ? null
        : value;
    const optimistic = !!row && r < total && !txt.startsWith("=");
    if (optimistic) {
      row![c] = shown;
      tick((x) => x + 1);
    }
    guard(async () => {
      try {
        apply(await post(`/tables/${t.id}/cell`, { row: r, col: c, value }));
      } catch (err) {
        if (optimistic) {
          row![c] = prev;
          tick((x) => x + 1);
        }
        throw err;
      }
    });
  };
  const goTo = (r: number) => {
    const el = wrap.current;
    if (!el) return;
    const y = rowTop(r);
    if (y < el.scrollTop + RH) el.scrollTop = Math.max(0, y - RH * 2);
    else if (y + RH * 2 > el.scrollTop + el.clientHeight)
      el.scrollTop = y + RH * 3 - el.clientHeight;
  };

  const pasteText = (txt: string) => {
    if (!t || !txt) return;
    const lines = txt.replace(/\r/g, "").replace(/\n$/, "").split("\n"),
      cnt = (l: string, c: string) => l.split(c).length - 1;
    const sep =
      ["\t", ";", ","].find(
        (c) =>
          cnt(lines[0], c) > 0 &&
          lines.slice(0, 50).every((l) => cnt(l, c) === cnt(lines[0], c)),
      ) ?? "\t";
    const data = lines.map((l) =>
      sep === "\t"
        ? l.split("\t")
        : l.split(sep).map((x) => x.replace(/^"|"$/g, "")),
    );
    guard(async () => {
      const m = await post(`/tables/${t.id}/paste`, {
        row: box?.r0 ?? 0,
        col: box?.c0 ?? 0,
        data,
      });
      apply(m);
      setMsg(
        m.promoted
          ? "Première ligne utilisée comme en-têtes (Ctrl+Z pour annuler)"
          : `${data.length} lignes collées`,
      );
    });
  };
  const onPaste = (e: React.ClipboardEvent) => {
    if (edit || !t) return;
    const im = Array.from(e.clipboardData.files ?? []).find((x: any) =>
      x.type.startsWith("image/"),
    );
    if (im && !e.clipboardData.getData("text/plain")) {
      e.preventDefault();
      addImage(im as File);
      return;
    }
    const txt = e.clipboardData.getData("text/plain");
    if (!txt) return;
    e.preventDefault();
    pasteText(txt);
  };
  const onCopy = (e: React.ClipboardEvent) => {
    if (edit || !box || !t) return;
    e.preventDefault();
    const r1 = Math.min(box.r1, total - 1),
      out: string[] = [];
    let ok = true;
    for (let r = box.r0; r <= r1 && ok; r++) {
      const en = cache.current.get(Math.floor(r / CH));
      if (!en) {
        ok = false;
        break;
      }
      out.push(
        Array.from({ length: box.c1 - box.c0 + 1 }, (_, k) =>
          fmt(en.rows[r % CH]?.[box.c0 + k]),
        ).join("\t"),
      );
    }
    if (ok) {
      e.clipboardData.setData("text/plain", out.join("\n"));
      setMsg("Copié");
      return;
    }
    guard(async () => {
      const rows: any[][] = await api(
        `/tables/${t.id}/rows?off=${box.r0}&lim=${r1 - box.r0 + 1}`,
      );
      await navigator.clipboard.writeText(
        rows
          .map((r) =>
            r
              .slice(box.c0, box.c1 + 1)
              .map(fmt)
              .join("\t"),
          )
          .join("\n"),
      );
      setMsg("Copié");
    });
  };
  const curSt: Style = box ? sty(box.r0, box.c0) : {};
  const applyBorder = (preset: string) =>
    guard(async () => {
      if (!t || !box || box.r0 > total - 1) return;
      apply(
        await post(`/tables/${t.id}/borders`, {
          r0: box.r0,
          r1: Math.min(box.r1, total - 1),
          c0: box.c0,
          c1: box.c1,
          preset,
        }),
      );
    });
  const applyStyle = (patch: Record<string, any>, clear = false) =>
    guard(async () => {
      if (!t || !box || box.r0 > total - 1) return;
      apply(
        await post(`/tables/${t.id}/style`, {
          r0: box.r0,
          r1: Math.min(box.r1, total - 1),
          c0: box.c0,
          c1: box.c1,
          patch,
          clear,
        }),
      );
    });
  const down = (e: React.PointerEvent, r: number, c: number) => {
    console.log({
      row: r,
      col: c,
      x: e.clientX,
      y: e.clientY,
      target: e.target,
    });
    if (e.button) return;
    lastType.current = e.pointerType;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    if (e.pointerType === "mouse") {
      setSel(
        e.shiftKey && sel ? { a: sel.a, b: [r, c] } : { a: [r, c], b: [r, c] },
      );
      setDrag(true);
      return;
    }
    tapOk.current = true;
    if (selMode) {
      setSel({ a: [r, c], b: [r, c] });
      setDrag(true);
      return;
    }
    const x = e.clientX,
      y = e.clientY;
    window.clearTimeout(lp.current);
    lp.current = window.setTimeout(() => {
      tapOk.current = false;
      menuAt.current = Date.now() + 700;
      if (!inSel(r, c)) setSel({ a: [r, c], b: [r, c] });
      navigator.vibrate?.(15);
      setMenu({
        x: Math.max(8, Math.min(x, window.innerWidth - 270)),
        y: Math.max(8, Math.min(y, window.innerHeight - 440)),
      });
    }, 480);
  };
  const tap = (r: number, c: number) => {
    if (lastType.current === "mouse" || selMode || !tapOk.current) return;
    const one =
      sel &&
      sel.a[0] === sel.b[0] &&
      sel.a[1] === sel.b[1] &&
      sel.a[0] === r &&
      sel.a[1] === c;
    one ? setEdit({ r, c }) : setSel({ a: [r, c], b: [r, c] });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag || rz.current || rzr.current) return;
    const td = (
      document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
    )?.closest("td");
    if (td?.dataset.r && sel)
      setSel({ ...sel, b: [+td.dataset.r, +td.dataset.c!] });
  };
  const acts = [
    { label: "Tableau de bord", run: () => setView("dash") },
    { label: "Tableur", run: () => setView("sheet") },
    { label: "Graphique", run: () => setDlg("chart") },
    { label: "Tableau croisé dynamique", run: () => setDlg("pivot") },
    { label: "Mise en forme conditionnelle", run: () => setDlg("rules") },
    { label: "Colonne calculée", run: () => setCalc(true) },
    { label: "Aide sur les fonctions (formules)", run: () => setHelp(true) },
    { label: "Associer un autre tableau", run: () => setLk(true) },
    {
      label: "Nouveau tableau",
      run: () => guard(async () => adopt(await post("/tables/new", {}))),
    },
  ];
  const allM = [...cache.current.values()].flatMap((e) => e.m ?? []);
  const merged =
    !!box &&
    allM.some(
      (m) =>
        box.r0 >= m.r &&
        box.r0 < m.r + m.rs &&
        box.c0 >= m.c &&
        box.c0 < m.c + m.cs,
    );
  const gc = opts.grp === "first" ? 0 : opts.grp === "sel" && box ? box.c0 : -1,
    crossOn = opts.cross && !!box && box.r0 === box.r1 && box.c0 === box.c1;
  const colLeft = (c: number) =>
      cols.slice(0, c).reduce((s2, i) => s2 + W(i), 0),
    headH = 34 + (Object.keys(aggs).length ? 34 : 0);
  const froz = (r: number, c: number): React.CSSProperties => {
    const a = r < fz.r,
      b = c < fz.c;
    if (!a && !b) return {};
    return {
      position: "sticky",
      background: "var(--panel)",
      zIndex: a && b ? 4 : a ? 3 : 2,
      ...(a ? { top: headH + rowTop(r) } : {}),
      ...(b ? { left: 56 + colLeft(c) } : {}),
    };
  };
  const frozH = (c: number): React.CSSProperties =>
    c < fz.c ? { left: 56 + colLeft(c), zIndex: 5 } : {};
  const freeze = (m: string) =>
    setFz(
      m === "row"
        ? { r: 1, c: fz.c }
        : m === "col"
          ? { r: fz.r, c: 1 }
          : m === "sel" && box
            ? { r: Math.min(box.r0, 10), c: Math.min(box.c0, 8) }
            : { r: 0, c: 0 },
    );
  const redo = () =>
    t && guard(async () => apply(await post(`/tables/${t.id}/redo`, {})));
  const renameSheet = (id: string, name: string) =>
    guard(async () => {
      const m: Meta = await send("PATCH", `/tables/${id}`, { name });
      setList((l) => l.map((x) => (x.id === m.id ? m : x)));
      if (t?.id === m.id) setT(m);
    });
  const goToCol = (c: number) => {
    const el = wrap.current;
    if (!el) return;
    const x = 56 + colLeft(c),
      lo = el.scrollLeft + 56 + colLeft(fz.c);
    if (c >= fz.c && x < lo) el.scrollLeft = x - 56 - colLeft(fz.c);
    else if (x + W(c) > el.scrollLeft + el.clientWidth)
      el.scrollLeft = x + W(c) - el.clientWidth + 8;
  };
  const move1 = (dr: number, dc: number) => {
    const cur = sel?.b ?? [0, 0];
    const n: [number, number] = [
      Math.max(0, Math.min(nRows - 1, cur[0] + dr)),
      Math.max(0, Math.min(nCols - 1, cur[1] + dc)),
    ];
    setSel({ a: n, b: n });
    goTo(n[0]);
    goToCol(n[1]);
  };
  const jump = (dir: string, ext = false, from?: [number, number]) =>
    guard(async () => {
      if (!t) return;
      const f = from ?? sel?.b ?? [0, 0];
      const o = await api(
        `/tables/${t.id}/edge?r=${f[0]}&c=${f[1]}&dir=${dir}`,
      );
      const n: [number, number] = [o.r, o.c];
      setSel(ext && sel ? { a: sel.a, b: n } : { a: n, b: n });
      goTo(n[0]);
      goToCol(n[1]);
    });
  const dbl = (e: React.MouseEvent, r: number, c: number) => {
    const b = (e.currentTarget as HTMLElement).getBoundingClientRect(),
      x = e.clientX - b.left,
      y = e.clientY - b.top;
    if (box) {
      const d =
        r === box.r0 && y < 7
          ? "up"
          : r === box.r1 && b.height - y < 7
            ? "down"
            : c === box.c0 && x < 7
              ? "left"
              : c === box.c1 && b.width - x < 7
                ? "right"
                : "";
      if (d) {
        jump(
          d,
          false,
          d === "up" || d === "left" ? [box.r0, box.c0] : [box.r1, box.c1],
        );
        return;
      }
    }
    setEdit({ r, c });
  };
  const nbSug = (r: number, c: number): [string, string][] => {
    const out: [string, string][] = [],
      L = letter(c);
    let k = r - 1;
    while (k >= 0 && typeof cell(k, c) === "number") k--;
    if (r - 1 - k >= 2) {
      const rg = `${L}${rowNo(k + 1)}:${L}${rowNo(r - 1)}`;
      out.push(
        ["Somme de la colonne", `=SOMME(${rg})`],
        ["Moyenne", `=MOYENNE(${rg})`],
        ["Maximum", `=MAX(${rg})`],
        ["Nombre", `=NB(${rg})`],
      );
    }
    let j = c - 1;
    while (j >= 0 && typeof cell(r, j) === "number") j--;
    if (c - 1 - j >= 2) {
      const rg = `${letter(j + 1)}${rowNo(r)}:${letter(c - 1)}${rowNo(r)}`;
      out.push(
        ["Somme de la ligne", `=SOMME(${rg})`],
        ["Moyenne de la ligne", `=MOYENNE(${rg})`],
      );
    }
    return out;
  };
  const tok = /([A-Za-zÀ-ÿ_.]+)$/.exec(et)?.[1] ?? "";
  const sugg =
    et.startsWith("=") && tok
      ? fdoc
          .filter((f) => f.name.toLowerCase().startsWith(tok.toLowerCase()))
          .slice(0, 6)
      : [];
  const assistOn = !!edit && sugg.length > 0,
    nbs = edit && (et === "" || et === "=") ? nbSug(edit.r, edit.c) : [];
  const pickFn = (f?: FDoc) => {
    const el = inRef.current;
    if (!f || !el) return;
    const v = el.value,
      k = /([A-Za-zÀ-ÿ_.]+)$/.exec(v)?.[1] ?? "";
    el.value = v.slice(0, v.length - k.length) + f.name + "(";
    setEt(el.value);
    setAi(0);
    el.focus();
  };
  const useFormula = (f: string) => {
    const el = inRef.current;
    if (!el) return;
    el.value = f;
    setEt(f);
    el.focus();
  };
  const mergeSel = (un: boolean) =>
    guard(async () => {
      if (!t || !box) return;
      apply(
        await post(`/tables/${t.id}/merge`, {
          r0: box.r0,
          r1: Math.min(box.r1, total - 1),
          c0: box.c0,
          c1: box.c1,
          unmerge: un,
        }),
      );
    });
  const addObj = (o: Record<string, any>) =>
    guard(async () => {
      if (!t) return;
      const r = await post(`/tables/${t.id}/objects`, {
        x: (wrap.current?.scrollLeft ?? 0) + 90,
        y: (wrap.current?.scrollTop ?? 0) + 80,
        w: 320,
        h: 220,
        src: "",
        cfg: {},
        ...o,
      });
      setObjs((l) => [...l, r]);
      setOsel(r.id);
    });
  const addImage = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        let src = String(rd.result);
        const k = Math.min(1, 1600 / Math.max(img.width, img.height));
        if (k < 1 || f.size > 1.5e6) {
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
          src = c.toDataURL("image/jpeg", 0.85);
        }
        const w = Math.min(img.width, 360);
        addObj({
          kind: "image",
          src,
          w,
          h: Math.round((img.height / img.width) * w),
        });
      };
      img.src = String(rd.result);
    };
    rd.readAsDataURL(f);
  };
  const insertChart = (kind: string) => {
    if (box)
      addObj({
        kind: "chart",
        w: 440,
        h: 290,
        cfg: {
          kind,
          box: {
            r0: box.r0,
            r1: Math.min(box.r1, total - 1),
            c0: box.c0,
            c1: box.c1,
          },
          group: true,
        },
      });
  };
  const moveObj = (id: string, p: Partial<Obj>) =>
    setObjs((l) => l.map((o) => (o.id === id ? { ...o, ...p } : o)));
  const saveObj = (id: string) => {
    const o = objs.find((x) => x.id === id);
    if (o && t)
      send("PATCH", `/tables/${t.id}/objects/${id}`, {
        x: o.x,
        y: o.y,
        w: o.w,
        h: o.h,
      }).catch(() => {});
  };
  const delObj = (id: string) =>
    t &&
    guard(async () => {
      await send("DELETE", `/tables/${t.id}/objects/${id}`, {});
      setObjs((l) => l.filter((o) => o.id !== id));
    });
  const autoFn = (fn: string) =>
    guard(async () => {
      if (!t || !box) return;
      for (let c = box.c0; c <= box.c1; c++) {
        const L = letter(c);
        apply(
          await post(`/tables/${t.id}/cell`, {
            row: Math.min(box.r1, total - 1) + 1,
            col: c,
            value: `=${fn}(${L}${rowNo(box.r0)}:${L}${rowNo(Math.min(box.r1, total - 1))})`,
          }),
        );
      }
    });
  const autosum = () =>
    guard(async () => {
      if (!t || !box) return;
      for (let c = box.c0; c <= box.c1; c++) {
        const L = letter(c);
        apply(
          await post(`/tables/${t.id}/cell`, {
            row: Math.min(box.r1, total - 1) + 1,
            col: c,
            value: `=SOMME(${L}${rowNo(box.r0)}:${L}${rowNo(Math.min(box.r1, total - 1))})`,
          }),
        );
      }
      setMsg("Somme ajoutée sous la sélection");
    });
  const filterByCell = () =>
    guard(async () => {
      if (!t || !box) return;
      const nm = t.columns[box.c0];
      if (nm)
        apply(
          await post(`/tables/${t.id}/filter`, {
            col: nm,
            op: "eq",
            arg: fmt(cell(box.r0, box.c0)),
          }),
        );
    });
  const doCopy = (cut: boolean) =>
    guard(async () => {
      if (!t || !box) return;
      const r1 = Math.min(box.r1, total - 1);
      const rows: any[][] = await api(
        `/tables/${t.id}/rows?off=${box.r0}&lim=${Math.max(0, r1 - box.r0 + 1)}`,
      );
      await navigator.clipboard.writeText(
        rows
          .map((r) =>
            r
              .slice(box.c0, box.c1 + 1)
              .map(fmt)
              .join("\t"),
          )
          .join("\n"),
      );
      setMsg(cut ? "Coupé" : "Copié");
      if (cut) exec("clear_cells");
    });
  const renameCol = (c: number, v: string) => {
    setHdr(null);
    if (skipH.current) {
      skipH.current = false;
      return;
    }
    if (!t || !v || v === t.columns[c]) return;
    exec("rename", { arg: v, b: { r0: 0, r1: 0, c0: c, c1: c } });
  };
  const ctx = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    e.stopPropagation();
    const ns: Sel =
      r < 0
        ? { a: [0, c], b: [Math.max(total - 1, 0), c] }
        : c < 0
          ? { a: [r, 0], b: [r, nCols - 1] }
          : { a: [r, c], b: [r, c] };
    const inside =
      box &&
      (r < 0
        ? c >= box.c0 && c <= box.c1
        : c < 0
          ? r >= box.r0 && r <= box.r1
          : inSel(r, c));
    if (!inside) setSel(ns);
    setMenu({
      x: Math.min(e.clientX, window.innerWidth - 270),
      y: Math.min(e.clientY, window.innerHeight - 440),
    });
  };
  const items = () => {
    const n = box ? box.r1 - box.r0 + 1 : 1,
      m = box ? box.c1 - box.c0 + 1 : 1,
      x = (id: string) => () => exec(id);
    return [
      { label: "Couper", hint: "Ctrl+X", run: () => doCopy(true) },
      { label: "Copier", hint: "Ctrl+C", run: () => doCopy(false) },
      {
        label: "Coller",
        hint: "Ctrl+V",
        run: () =>
          guard(async () => pasteText(await navigator.clipboard.readText())),
      },
      { label: "Effacer le contenu", hint: "Suppr", run: x("clear_cells") },
      { sep: true },
      { label: `Insérer ${n} ligne(s) au-dessus`, run: x("insert_row_above") },
      { label: `Insérer ${n} ligne(s) en dessous`, run: x("insert_row_below") },
      { label: `Insérer ${m} colonne(s) à gauche`, run: x("insert_col_left") },
      { label: `Insérer ${m} colonne(s) à droite`, run: x("insert_col_right") },
      { label: "Supprimer les lignes", run: x("delete_rows") },
      { label: "Supprimer les colonnes", run: x("drop_cols") },
      { sep: true },
      { label: "Trier A→Z", run: x("sort_asc") },
      { label: "Trier Z→A", run: x("sort_desc") },
      { label: "Remplir vers le bas", hint: "Ctrl+D", run: x("fill_down") },
      { label: "Supprimer les doublons", run: x("dedupe") },
      { sep: true },
      {
        label: merged ? "Séparer les cellules" : "Fusionner les cellules",
        run: () => mergeSel(merged),
      },
      { label: "Filtrer sur la valeur de la cellule", run: filterByCell },
      { label: "Graphique…", run: () => setDlg("chart") },
      { label: "Mise en forme conditionnelle…", run: () => setDlg("rules") },
      { label: "Tableau croisé dynamique…", run: () => setDlg("pivot") },
      { label: "Associer un autre tableau…", run: () => setLk(true) },
    ];
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (edit || !t) return;
    if (e.metaKey || e.ctrlKey) {
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (k === "y" || (k === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      } else if (k.startsWith("arrow")) {
        e.preventDefault();
        jump(k.slice(5), e.shiftKey);
      } else if (k === "x") {
        e.preventDefault();
        doCopy(true);
      } else if (k === "d") {
        e.preventDefault();
        runId("fill_down");
      } else if (k === "a") {
        e.preventDefault();
        setSel({ a: [0, 0], b: [Math.max(total - 1, 0), nCols - 1] });
      } else if (k === "b") {
        e.preventDefault();
        applyStyle({ b: !curSt.b });
      } else if (k === "i") {
        e.preventDefault();
        applyStyle({ i: !curSt.i });
      } else if (k === "u") {
        e.preventDefault();
        applyStyle({ u: !curSt.u });
      }
      return;
    }
    if (e.metaKey || e.ctrlKey) return;
    const cur = sel?.b ?? [0, 0];
    const mv = (dr: number, dc: number, ext: boolean) => {
      e.preventDefault();
      const n: [number, number] = [
        Math.max(0, Math.min(nRows - 1, cur[0] + dr)),
        Math.max(0, Math.min(nCols - 1, cur[1] + dc)),
      ];
      setSel(ext && sel ? { a: sel.a, b: n } : { a: n, b: n });
      goTo(n[0]);
      goToCol(n[1]);
    };
    switch (e.key) {
      case "ArrowDown":
        return mv(1, 0, e.shiftKey);
      case "ArrowUp":
        return mv(-1, 0, e.shiftKey);
      case "ArrowLeft":
        return mv(0, -1, e.shiftKey);
      case "ArrowRight":
        return mv(0, 1, e.shiftKey);
      case "Tab":
        return mv(0, e.shiftKey ? -1 : 1, false);
      case "Enter":
      case "F2":
        e.preventDefault();
        return setEdit({ r: cur[0], c: cur[1] });
      case "Delete":
      case "Backspace":
        e.preventDefault();
        return runId("clear_cells");
      default:
        if (e.key.length === 1) {
          e.preventDefault();
          setEdit({ r: cur[0], c: cur[1], init: e.key });
          setSel({ a: [cur[0], cur[1]], b: [cur[0], cur[1]] });
        }
    }
  };
  const goHit = (h: [number, number][], i: number) => {
    const [r, c] = h[i];
    setHi(i);
    setSel({ a: [r, c], b: [r, c] });
    if (wrap.current) wrap.current.scrollTop = Math.max(0, rowTop(r) - 120);
  };
  const doFind = () =>
    guard(async () => {
      if (!t || !find) return setHits([]);
      const h: [number, number][] = await api(
        `/tables/${t.id}/search?q=${encodeURIComponent(find)}`,
      );
      setHits(h);
      h.length ? goHit(h, 0) : setMsg("Aucun résultat");
    });

  const groups = useMemo(() => {
    const m: Record<string, Op[]> = {};
    ops
      .filter((o) =>
        (o.label + o.cat + o.id).toLowerCase().includes(q.toLowerCase()),
      )
      .forEach((o) => (m[o.cat] ??= []).push(o));
    return m;
  }, [ops, q]);
  const quick: [string, string][] = [
    ["sort_asc", "Trier A→Z"],
    ["sort_desc", "Trier Z→A"],
    ["dedupe", "Doublons"],
    ["autoclean", "Nettoyer"],
    ["stat_sum", "Somme"],
    ["stat_mean", "Moyenne"],
    ["first_row_header", "En-têtes"],
  ];

  return (
    <div
      className="app"
      data-panel={panel}
      style={{ "--sw": panel ? sw + "px" : "0px" } as React.CSSProperties}
    >
      <Ribbon
        t={t}
        list={list}
        view={view}
        hasSel={!!box}
        find={find}
        setFind={setFind}
        onFind={doFind}
        hits={hits.length}
        hi={hi}
        stat={stat}
        selMode={selMode}
        opts={opts}
        setOpts={setOpts}
        merged={merged}
        panel={panel}
        on={{
          view: setView,
          open: (id: string) => {
            const m = list.find((x) => x.id === id);
            if (m) openTable(m);
          },
          new: () => guard(async () => adopt(await post("/tables/new", {}))),
          upload,
          sql: importSql,
          remove: removeTable,
          csv: () => t && window.open(`${API}/tables/${t.id}/export?fmt=csv`),
          xlsx: () => t && window.open(`${API}/tables/${t.id}/export?fmt=xlsx`),
          undo,
          cut: () => doCopy(true),
          copy: () => doCopy(false),
          paste: () =>
            guard(async () => pasteText(await navigator.clipboard.readText())),
          clear: () => runId("clear_cells"),
          sort: () => runId("sort_asc"),
          filter: filterByCell,
          clean: () => runId("autoclean"),
          dedupe: () => runId("dedupe"),
          fill: () => runId("fill_down"),
          lookup: () => setLk(true),
          calc: () => setCalc(true),
          sum: autosum,
          fx: () => setHelp(true),
          redo,
          freeze,
          chart: () => {
            setCkind(undefined);
            setDlg("chart");
          },
          merge: () => mergeSel(merged),
          image: addImage,
          panel: () => setPanel((v) => !v),
          pivot: () => setDlg("pivot"),
          rules: () => setDlg("rules"),
          palette: () => setPal(true),
          prev: () => goHit(hits, (hi + hits.length - 1) % hits.length),
          next: () => goHit(hits, (hi + 1) % hits.length),
          clearFilters: () =>
            t &&
            guard(async () =>
              apply(await post(`/tables/${t.id}/filters/clear`, {})),
            ),
          sheet: () => setSheet((v) => !v),
          sel: () => setSelMode((m) => !m),
        }}
      />
      <FormatBar
        st={curSt}
        disabled={!box}
        apply={applyStyle}
        clear={() => applyStyle({}, true)}
        border={applyBorder}
      />
      <div
        className="grid-wrap"
        ref={wrap}
        tabIndex={0}
        onKeyDown={onKey}
        onPaste={onPaste}
        onCopy={onCopy}
        onPointerMove={move}
        onClick={() => setOsel("")}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const f = e.dataTransfer.files?.[0];
          if (f?.type.startsWith("image/")) {
            e.preventDefault();
            addImage(f);
          }
        }}
        data-grid={opts.grid}
        data-band={opts.band}
        hidden={view === "dash"}
        data-selmode={selMode}
        style={{ "--rh": RH + "px" } as React.CSSProperties}
        onScroll={(e) => {
          const el = e.currentTarget;
          setTop(el.scrollTop);
          if (el.scrollTop + el.clientHeight > rowTop(Math.max(0, nRows - 15)))
            setExtra((x) => x + 200);
        }}
      >
        <div className="inner" style={{ width: tw }}>
          <table className="grid" style={{ width: tw }}>
            <colgroup>
              <col style={{ width: 56 }} />
              {cols.map((c) => (
                <col key={c} style={{ width: W(c) }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="corner" />
                {cols.map((c) => (
                  <th
                    key={c}
                    data-on={!!box && c >= box.c0 && c <= box.c1}
                    style={frozH(c)}
                    onContextMenu={(e) => ctx(e, -1, c)}
                    onClick={() =>
                      setSel({ a: [0, c], b: [Math.max(total - 1, 0), c] })
                    }
                  >
                    {hdr === c ? (
                      <input
                        className="hin"
                        autoFocus
                        defaultValue={t?.columns[c] ?? letter(c)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => renameCol(c, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") {
                            skipH.current = true;
                            (e.target as HTMLInputElement).blur();
                          }
                          e.stopPropagation();
                        }}
                      />
                    ) : (
                      <span
                        onDoubleClick={() =>
                          c < (t?.columns.length ?? 0) && setHdr(c)
                        }
                      >
                        {t?.columns[c] !== undefined ? (
                          <>
                            <b className="ltr">{letter(c)}</b>
                            {t.columns[c]}
                          </>
                        ) : (
                          letter(c)
                        )}
                      </span>
                    )}
                    {c < (t?.columns.length ?? 0) && (
                      <button
                        className="fb"
                        data-on={!!t?.filters?.[t.columns[c]]}
                        aria-label="Filtrer"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rc = e.currentTarget.getBoundingClientRect();
                          setFm({
                            c,
                            x: Math.min(rc.left, window.innerWidth - 290),
                            y: rc.bottom + 4,
                          });
                        }}
                      >
                        ▾
                      </button>
                    )}
                    <i
                      className="rz"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        rz.current = { c, x: e.clientX, w: W(c) };
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                ))}
              </tr>
              {Object.keys(aggs).length > 0 && (
                <tr className="sumrow">
                  <th className="corner">Σ</th>
                  {cols.map((c) => {
                    const nm = t?.columns[c] ?? "";
                    return (
                      <th
                        key={c}
                        style={frozH(c)}
                        onClick={() =>
                          setSel({ a: [0, c], b: [Math.max(total - 1, 0), c] })
                        }
                      >
                        {aggs[nm]
                          ? `${AGL[aggs[nm]]} ${nf(sums[nm] ?? null)}`
                          : ""}
                      </th>
                    );
                  })}
                </tr>
              )}
            </thead>
            <tbody>
              {(() => {
                const row = (r: number) => (
                  <tr
                    key={r}
                    data-odd={opts.band && r % 2 === 1}
                    style={{ height: rowH(r) }}
                  >
                    <th
                      className="rn"
                      style={
                        r < fz.r
                          ? { top: headH + rowTop(r), zIndex: 6 }
                          : undefined
                      }
                      data-on={!!box && r >= box.r0 && r <= box.r1}
                      onContextMenu={(e) => ctx(e, r, -1)}
                      onClick={() => setSel({ a: [r, 0], b: [r, nCols - 1] })}
                    >
                      {rowNo(r)}
                      <i
                        className="rzr"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          rzr.current = { r, y: e.clientY, h: rowH(r) };
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={() =>
                          setRh((h) => {
                            const n = { ...h };
                            delete n[r];
                            return n;
                          })
                        }
                      />
                    </th>
                    {cols.map((c) => {
                      const v = cell(r, c);
                      const ed = edit?.r === r && edit?.c === c;
                      return (
                        <td
                          key={c}
                          style={{
                            ...froz(r, c),
                            ...cssOf(sty(r, c)),
                            ...tint(v, c),
                          }}
                          data-x={
                            crossOn && box && (r === box.r0 || c === box.c0)
                          }
                          data-grp={
                            gc >= 0 &&
                            r > 0 &&
                            r < total &&
                            cache.current.has(Math.floor((r - 1) / CH)) &&
                            fmt(cell(r, gc)) !== fmt(cell(r - 1, gc))
                          }
                          data-fx={!!fx(r, c)}
                          data-sel={inSel(r, c)}
                          data-hit={hitSet.has(`${r}:${c}`)}
                          data-num={typeof v === "number"}
                          data-r={r}
                          data-c={c}
                          onPointerDown={(e) => down(e, r, c)}
                          onClick={() => tap(r, c)}
                          onDoubleClick={(e) => dbl(e, r, c)}
                          onContextMenu={(e) => ctx(e, r, c)}
                        >
                          {ed ? (
                            <input
                              autoFocus
                              ref={inRef}
                              onChange={(e) => setEt(e.target.value)}
                              defaultValue={edit?.init ?? fx(r, c) ?? fmt(v)}
                              onFocus={(e) => {
                                const n = e.target.value.length;
                                e.target.setSelectionRange(n, n);
                              }}
                              onBlur={(e) => commitEdit(r, c, e.target.value)}
                              onKeyDown={(e) => {
                                if (
                                  assistOn &&
                                  (e.key === "ArrowDown" || e.key === "ArrowUp")
                                ) {
                                  e.preventDefault();
                                  setAi(
                                    (i) =>
                                      (i +
                                        (e.key === "ArrowDown" ? 1 : -1) +
                                        sugg.length) %
                                      sugg.length,
                                  );
                                } else if (assistOn && e.key === "Tab") {
                                  e.preventDefault();
                                  pickFn(sugg[ai]);
                                }
                                if (e.key === "Enter") {
                                  setSel({ a: [r + 1, c], b: [r + 1, c] });
                                  (e.target as HTMLInputElement).blur();
                                }
                                if (e.key === "Escape") {
                                  skip.current = true;
                                  (e.target as HTMLInputElement).blur();
                                }
                                e.stopPropagation();
                              }}
                            />
                          ) : rowH(r) > RH ? (
                            <div
                              className="wrapc"
                              style={{ maxHeight: rowH(r) - 2 }}
                            >
                              {fmtStyled(v, sty(r, c))}
                            </div>
                          ) : (
                            fmtStyled(v, sty(r, c))
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
                const s0 = Math.max(first, fz.r),
                  fr = Math.min(fz.r, nRows);
                return [
                  ...Array.from({ length: fr }, (_, q) => row(q)),
                  ...(s0 > fr
                    ? [
                        <tr
                          key="gap0"
                          style={{ height: rowTop(s0) - rowTop(fr) }}
                        >
                          <td colSpan={nCols + 1} className="gap" />
                        </tr>,
                      ]
                    : []),
                  ...Array.from(
                    { length: Math.max(0, last - s0 + 1) },
                    (_, q) => row(s0 + q),
                  ),
                ];
              })()}
              {last < nRows - 1 && (
                <tr style={{ height: rowTop(nRows) - rowTop(last + 1) }}>
                  <td colSpan={nCols + 1} className="gap" />
                </tr>
              )}
            </tbody>
          </table>
          {allM
            .filter(
              (m) =>
                m.r <= last &&
                m.r + m.rs > first &&
                !(edit?.r === m.r && edit?.c === m.c),
            )
            .map((m) => {
              const v = cell(m.r, m.c),
                left = 56 + cols.slice(0, m.c).reduce((s, c) => s + W(c), 0),
                top = headH + rowTop(m.r);
              return (
                <div
                  key={`${m.r}:${m.c}`}
                  className="mg"
                  data-sel={inSel(m.r, m.c)}
                  style={{
                    left,
                    top,
                    width: cols
                      .slice(m.c, m.c + m.cs)
                      .reduce((s, c) => s + W(c), 0),
                    height: rowTop(m.r + m.rs) - rowTop(m.r),
                    ...cssOf(sty(m.r, m.c)),
                    ...tint(v, m.c),
                  }}
                  onPointerDown={() =>
                    setSel({
                      a: [m.r, m.c],
                      b: [m.r + m.rs - 1, m.c + m.cs - 1],
                    })
                  }
                  onDoubleClick={() => setEdit({ r: m.r, c: m.c })}
                  onContextMenu={(e) => ctx(e, m.r, m.c)}
                >
                  {fmtStyled(v, sty(m.r, m.c))}
                </div>
              );
            })}
          {box && view === "sheet" && (
            <div
              className="ring"
              data-drag={drag}
              style={{
                left: 56 + colLeft(box.c0),
                top: headH + rowTop(box.r0),
                width: colLeft(box.c1 + 1) - colLeft(box.c0),
                height: rowTop(box.r1 + 1) - rowTop(box.r0),
              }}
            >
              <b className="grip" />
            </div>
          )}
          {objs.map(
            (o) =>
              t && (
                <FloatObj
                  key={o.id}
                  o={o}
                  t={t}
                  ver={ver}
                  sel={osel === o.id}
                  onSel={() => setOsel(o.id)}
                  onMove={(p) => moveObj(o.id, p)}
                  onCommit={() => saveObj(o.id)}
                  onDelete={() => delObj(o.id)}
                />
              ),
          )}
        </div>
      </div>

      <div
        className="split"
        onPointerDown={(e) => {
          const x0 = e.clientX,
            w0 = sw;
          const mv = (ev: PointerEvent) =>
            setSw(Math.max(260, Math.min(640, w0 + x0 - ev.clientX)));
          const up = () => {
            window.removeEventListener("pointermove", mv);
            window.removeEventListener("pointerup", up);
          };
          window.addEventListener("pointermove", mv);
          window.addEventListener("pointerup", up);
        }}
        onDoubleClick={() => setPanel(false)}
        title="Glisser pour redimensionner, double-clic pour masquer"
      />
      <aside className="side" data-closed={!panel} data-open={sheet}>
        <button className="only-m grab" onClick={() => setSheet(false)}>
          Fermer ▾
        </button>
        <input
          className="search"
          placeholder={`Chercher une fonction parmi ${ops.length}`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="args">
          <input
            placeholder="Argument (si la fonction en demande un)"
            value={arg}
            onChange={(e) => setArg(e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={inplace}
              onChange={(e) => setInplace(e.target.checked)}
            />{" "}
            Remplacer la sélection au lieu de créer une colonne
          </label>
        </div>
        <div className="ops">
          {Object.entries(groups).map(([cat, l]) => (
            <details key={cat} open={!!q || cat === "Actions faciles"}>
              <summary>
                {cat} <small>{l.length}</small>
              </summary>
              {l.map((o) => (
                <button key={o.id} disabled={!t} onClick={() => runOp(o)}>
                  {o.label}
                </button>
              ))}
            </details>
          ))}
        </div>
        {res && (
          <div className="result">
            <div className="rh">
              <b>Résultat</b>
              <button onClick={() => setRes(null)}>Fermer</button>
            </div>
            <table>
              <thead>
                <tr>
                  {res.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {res.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((v, j) => (
                      <td key={j}>{fmt(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <footer className="status" role="status">
          {msg || "Collez un tableau depuis Excel, Sheets ou le web : Ctrl+V"}
        </footer>
      </aside>
      {menu && (
        <div className="ctx" style={{ left: menu.x, top: menu.y }}>
          <MenuList items={items()} close={() => setMenu(null)} />
        </div>
      )}
      {edit && anchor && t && (
        <FormulaAssist
          t={t}
          text={et}
          anchor={anchor}
          fdoc={fdoc}
          sugg={sugg}
          ai={ai}
          nb={nbs}
          onPick={pickFn}
          onUse={useFormula}
        />
      )}
      {view === "sheet" && (
        <div
          className="navpad"
          data-on={opts.pad}
          role="group"
          aria-label="Boussole de navigation"
        >
          <button
            style={{ gridArea: "u" }}
            aria-label="Haut"
            onClick={() => move1(-1, 0)}
            onDoubleClick={() => jump("up")}
          >
            ↑
          </button>
          <button
            style={{ gridArea: "l" }}
            aria-label="Gauche"
            onClick={() => move1(0, -1)}
            onDoubleClick={() => jump("left")}
          >
            ←
          </button>
          <button
            style={{ gridArea: "h" }}
            aria-label="Début"
            onClick={() => {
              setSel({ a: [0, 0], b: [0, 0] });
              goTo(0);
              goToCol(0);
            }}
          >
            ⌂
          </button>
          <button
            style={{ gridArea: "r" }}
            aria-label="Droite"
            onClick={() => move1(0, 1)}
            onDoubleClick={() => jump("right")}
          >
            →
          </button>
          <button
            style={{ gridArea: "d" }}
            aria-label="Bas"
            onClick={() => move1(1, 0)}
            onDoubleClick={() => jump("down")}
          >
            ↓
          </button>
        </div>
      )}
      <SheetTabs
        list={list}
        id={t?.id ?? ""}
        onOpen={(id) => {
          const m = list.find((x) => x.id === id);
          if (m) openTable(m);
        }}
        onAdd={() => guard(async () => adopt(await post("/tables/new", {})))}
        onRename={renameSheet}
        onDelete={removeTable}
      />
      {calc && t && (
        <CalcDialog
          t={t}
          onClose={() => setCalc(false)}
          onDone={(m) => {
            apply(m);
            setCalc(false);
          }}
        />
      )}
      {pal && (
        <Palette
          ops={ops}
          actions={acts}
          onClose={() => setPal(false)}
          onOp={(o) => {
            setPal(false);
            runOp(o);
          }}
        />
      )}
      {view === "dash" && t && <DashboardView t={t} ver={ver} />}
      {dlg === "rules" && t && (
        <RulesDialog
          t={t}
          rules={rules}
          onChange={setRules}
          onClose={() => setDlg(null)}
        />
      )}
      {fm && t && (
        <FilterMenu
          t={t}
          c={fm.c}
          x={fm.x}
          y={fm.y}
          agg={aggs[t.columns[fm.c]] ?? ""}
          onAgg={(a) => {
            const nm = t.columns[fm.c];
            setAggs((s) => {
              const n = { ...s };
              if (a) n[nm] = a;
              else delete n[nm];
              return n;
            });
            setFm(null);
          }}
          onQuick={(o) => {
            setFm(null);
            exec(o, {
              b: { r0: 0, r1: Math.max(total - 1, 0), c0: fm.c, c1: fm.c },
            });
          }}
          onClose={() => setFm(null)}
          onApply={(m) => {
            apply(m);
            setFm(null);
          }}
          onSort={(asc) => {
            setFm(null);
            exec(asc ? "sort_asc" : "sort_desc", {
              b: { r0: 0, r1: Math.max(total - 1, 0), c0: fm.c, c1: fm.c },
            });
          }}
        />
      )}
      {help && (
        <FormulaHelp
          onClose={() => setHelp(false)}
          onPick={(n) => {
            setHelp(false);
            if (box) setEdit({ r: box.r1, c: box.c1, init: `=${n}(` });
          }}
        />
      )}
      {dlg === "pivot" && t && (
        <PivotDialog
          t={t}
          onClose={() => setDlg(null)}
          onSave={(m) => {
            adopt(m);
            setDlg(null);
          }}
        />
      )}
      {dlg === "chart" && t && box && (
        <ChartDialog
          t={t}
          kind={ckind}
          box={{ ...box, r1: Math.min(box.r1, Math.max(total - 1, 0)) }}
          onClose={() => setDlg(null)}
        />
      )}
      {view === "sheet" &&
        box &&
        t &&
        (box.r0 !== box.r1 || box.c0 !== box.c1) &&
        !qa && (
          <button className="qa-fab" onClick={() => setQa(true)}>
            <Icon n="bolt" s={18} />
            Analyse rapide
          </button>
        )}
      {qa && box && t && (
        <QuickAnalysis
          t={t}
          box={{ ...box, r1: Math.min(box.r1, Math.max(total - 1, 0)) }}
          ver={ver}
          stat={stat}
          onClose={() => setQa(false)}
          on={{
            open: (k: string) => {
              setCkind(k as Kind);
              setQa(false);
              setDlg("chart");
            },
            insert: (k: string) => {
              insertChart(k);
              setQa(false);
            },
            fn: autoFn,
            rule: (r: Rule) => {
              setRules((l) => [...l, r]);
              setMsg("Règle de couleur ajoutée");
            },
            pivot: () => setDlg("pivot"),
          }}
        />
      )}
      {lk && t && (
        <LookupDialog
          t={t}
          list={list}
          onClose={() => setLk(false)}
          onDone={(m) => {
            apply(m);
            setLk(false);
            setMsg("Colonnes ajoutées");
          }}
        />
      )}
    </div>
  );
}

function LookupDialog({
  t,
  list,
  onClose,
  onDone,
}: {
  t: Meta;
  list: Meta[];
  onClose: () => void;
  onDone: (m: Meta) => void;
}) {
  const others = list.filter((x) => x.id !== t.id);
  const [oid, setOid] = useState(others[0]?.id ?? "");
  const o = others.find((x) => x.id === oid);
  const [key, setKey] = useState(t.columns[0] ?? "");
  const [okey, setOkey] = useState("");
  const [bring, setBring] = useState<string[]>([]);
  useEffect(() => {
    if (o) {
      setOkey(o.columns.includes(key) ? key : o.columns[0]);
      setBring([]);
    }
  }, [oid]);
  const go = async () => {
    try {
      onDone(
        await post(`/tables/${t.id}/lookup`, {
          other_id: oid,
          key,
          other_key: okey,
          bring,
        }),
      );
    } catch (e: any) {
      alert(e.message);
    }
  };
  const Sel = ({
    v,
    set,
    opts,
  }: {
    v: string;
    set: (s: string) => void;
    opts: string[];
  }) => (
    <select value={v} onChange={(e) => set(e.target.value)}>
      {opts.map((c) => (
        <option key={c}>{c}</option>
      ))}
    </select>
  );
  return (
    <div className="modal" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h2>Associer un autre tableau</h2>
        <p>
          Pour chaque ligne, Sheetly retrouve la ligne qui a la même valeur dans
          l’autre tableau (sans tenir compte des majuscules ni des espaces) et
          ajoute les colonnes choisies.
        </p>
        <div className="row">
          Dans ce tableau, la colonne{" "}
          <Sel v={key} set={setKey} opts={t.columns} />
        </div>
        <div className="row">
          correspond, dans{" "}
          <Sel v={oid} set={setOid} opts={others.map((x) => x.id)} /> ({o?.name}
          ), à la colonne {o && <Sel v={okey} set={setOkey} opts={o.columns} />}
        </div>
        <div className="pick">
          {o?.columns
            .filter((c) => c !== okey)
            .map((c) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={bring.includes(c)}
                  onChange={(e) =>
                    setBring((b) =>
                      e.target.checked ? [...b, c] : b.filter((x) => x !== c),
                    )
                  }
                />{" "}
                {c}
              </label>
            ))}
        </div>
        <div className="row end">
          <button onClick={onClose}>Annuler</button>
          <button className="primary" disabled={!bring.length} onClick={go}>
            Ajouter {bring.length || ""} colonne(s)
          </button>
        </div>
      </div>
    </div>
  );
}
