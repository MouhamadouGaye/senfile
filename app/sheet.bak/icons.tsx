const P: Record<string, string> = {
  grid: "M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 10h18M9 10v11", plus: "M12 5v14M5 12h14", upload: "M12 16V4M7 9l5-5 5 5M4 20h16", download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  database: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3", sheet: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",
  paste: "M9 4h6v3H9zM8 5.5H6a1 1 0 00-1 1V20a1 1 0 001 1h12a1 1 0 001-1V6.5a1 1 0 00-1-1h-2", cut: "M7 8a3 3 0 100-6 3 3 0 000 6zM7 22a3 3 0 100-6 3 3 0 000 6zM9 7l11 11M9 17L20 6",
  copy: "M9 9h11v11H9zM5 15V4h11", eraser: "M13 4l7 7-8 8H7l-4-4zM8 9l7 7M12 19h8", sort: "M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3", filter: "M3 5h18l-7 8v6l-4 2v-8z",
  sparkles: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z", layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5",
  arrowdown: "M12 3v14M6 11l6 6 6-6M5 21h14", link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1", sigma: "M18 5H6l6.5 7L6 19h12",
  fx: "M17 4c-3 0-4 1-4.5 4L11 17c-.5 3-1.5 4-4 4M8 11h8", calc: "M5 3h14v18H5zM8 7h8M8 12h2M12 12h2M8 16h2M12 16h2", chart: "M3 21h18M6 21v-8M11 21V4M16 21v-11", pivot: "M3 4h18v16H3zM3 9h18M9 9v11M14 14h7",
  palette: "M12 3a9 9 0 100 18c1.4 0 2-1 1.5-2-.6-1.2 0-2.5 1.5-2.5h2.2a3.3 3.3 0 003.3-3.3C20.5 7 16.8 3 12 3zM7.5 11h.01M10 7.5h.01M15 7.5h.01", dashboard: "M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5", undo: "M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3", trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3", menu: "M4 6h16M4 12h16M4 18h16",
  pointer: "M5 3l14 7-6 2-2 6zM13 12l6 6", up: "M6 15l6-6 6 6", down: "M6 9l6 6 6-6", bold: "M7 4h6a4 4 0 010 8H7zM7 12h7a4 4 0 010 8H7z", italic: "M19 4h-9M14 20H5M15 4L9 20", underline: "M6 4v7a6 6 0 0012 0V4M4 21h16",
  strike: "M4 12h16M16 7a4 4 0 00-4-3c-2.5 0-4 1.3-4 3s1.5 2.5 4 3M8 17a4 4 0 004 3c2.5 0 4-1.3 4-3", alignleft: "M4 6h16M4 10h10M4 14h16M4 18h10", aligncenter: "M4 6h16M7 10h10M4 14h16M7 18h10", alignright: "M4 6h16M10 10h10M4 14h16M10 18h10",
  wrap: "M4 6h16M4 12h12a3 3 0 010 6h-3M15 15l-2 3 2 3M4 18h5", border: "M3 3h18v18H3zM12 3v18M3 12h18", fill: "M5 11l6-6 8 8-6 6a2 2 0 01-3 0zM5 11h14M20 16s2 2 2 3.5a2 2 0 01-4 0C18 18 20 16 20 16z",
  textcolor: "M6 18l6-14 6 14M8.5 12h7", clearfmt: "M4 5h12M10 5l-3 14M17 11l5 5M22 11l-5 5",
};
export function Icon({ n, s = 20 }: { n: string; s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n] ?? ""} /></svg>;
}
const X: Record<string, string> = {
  merge: "M3 4h18v16H3zM3 12h5M16 12h5M8 9l3 3-3 3M16 9l-3 3 3 3", image: "M3 4h18v16H3zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 16l-5-5-8 9", sidebar: "M3 4h18v16H3zM15 4v16",
  gridlines: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18", bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
};
Object.assign(P, X);
