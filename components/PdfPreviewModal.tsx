// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { createPortal } from "react-dom";
// import { generateHTML } from "@tiptap/html";
// import type { JSONContent } from "@tiptap/core";
// import { X, Printer } from "lucide-react";
// import { getExtensions } from "@/lib/extensions";
// import type { PageObject } from "@/lib/objets";
// import type { Margins } from "./MarginRuler";
// import editorStyles from "./editor.module.css";
// import styles from "./pdfpreview.module.css";
// import { StaticObjects } from "./ObjectLayer";

// const PW = 794;
// const PH = 1323;
// const SAFE = 30; // minimum free space at the top and bottom of every page
// const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

// /* The print rules live HERE so they never depend on globals.css. */
// const PRINT_CSS = `
// @media print {
//   @page { size: A4; margin: 0; }
//   html, body {
//     margin: 0 !important; padding: 0 !important; background: #fff !important;
//     width: auto !important; height: auto !important; overflow: visible !important;
//     display: block !important;
//   }
//   body > *:not([data-print-root]) { display: none !important; }
//   [data-print-root] {
//     position: static !important; display: block !important; background: none !important;
//     backdrop-filter: none !important; width: auto !important; height: auto !important;
//   }
//   [data-print-modal] {
//     display: block !important; width: auto !important; height: auto !important;
//     max-width: none !important; background: none !important; box-shadow: none !important;
//     border-radius: 0 !important; overflow: visible !important;
//   }
//   [data-print-hide] { display: none !important; }
//   [data-print-scroll] { display: block !important; overflow: visible !important; padding: 0 !important; }
//   [data-print-pages] { display: block !important; zoom: 1 !important; gap: 0 !important; }
//   [data-print-page] {
//     width: 210mm !important; height: 296.5mm !important; margin: 0 !important;
//     box-shadow: none !important; overflow: hidden !important;
//     break-after: page; page-break-after: always; break-inside: avoid;
//   }
//   [data-print-page]:last-child { break-after: auto; page-break-after: auto; }
//   [data-print-root] * {
//     animation: none !important; transition: none !important;
//     -webkit-print-color-adjust: exact; print-color-adjust: exact;
//   }
// }`;

// // type Props = {
// //   title: string;
// //   doc: JSONContent | null;
// //   objects: PageObject[];
// //   margins: Margins;
// //   autoPrint?: boolean;
// //   onClose: () => void;
// // };

// /* ---------------- objects: keep them inside the safe zones ---------------- */

// function bounds(o: PageObject) {
//   const r = (o.rotation * Math.PI) / 180;
//   const h = Math.abs(o.w * Math.sin(r)) + Math.abs(o.h * Math.cos(r));
//   const cy = o.y + o.h / 2;
//   return { top: cy - h / 2, bottom: cy + h / 2, h };
// }

// /** Preview/print only: the stored positions are never modified. */
// function safeObjects(list: PageObject[]): PageObject[] {
//   return list.map((o) => {
//     const { top, bottom, h } = bounds(o);
//     if (h > PH - 2 * SAFE) return o;
//     const start = Math.floor(Math.max(0, top) / PH) * PH;
//     let dy = 0;
//     if (bottom > start + PH - SAFE) dy = start + PH + SAFE - top;
//     else if (top < start + SAFE) dy = start + SAFE - top;
//     return dy ? { ...o, y: Math.round(o.y + dy) } : o;
//   });
// }

// /* ---------------- text: push blocks that touch the safe zones ---------------- */

// const CONTAINERS = new Set([
//   "UL",
//   "OL",
//   "LI",
//   "BLOCKQUOTE",
//   "TABLE",
//   "TBODY",
//   "THEAD",
// ]);

// /** Returns the bottom (px from the top of the sheet) of the last text block. */
// function paginate(root: HTMLElement): number {
//   const sheet = root.parentElement as HTMLElement;
//   const base = () => sheet.getBoundingClientRect().top;

//   const units: HTMLElement[] = [];
//   const collect = (el: HTMLElement) => {
//     for (const c of Array.from(el.children) as HTMLElement[]) {
//       if (c.tagName === "COLGROUP") continue;
//       const h = c.getBoundingClientRect().height;
//       if (h > PH - 2 * SAFE && CONTAINERS.has(c.tagName)) collect(c);
//       else units.push(c);
//     }
//   };
//   collect(root);

//   const pushTo = (el: HTMLElement, targetTop: number) => {
//     if (el.tagName === "TR") {
//       const d = targetTop - (el.getBoundingClientRect().top - base());
//       const sp = document.createElement("tr");
//       sp.setAttribute("data-spacer", "");
//       sp.style.height = `${Math.ceil(d)}px`;
//       sp.innerHTML = `<td colspan="99" style="border:0;padding:0;background:none"></td>`;
//       el.parentElement!.insertBefore(sp, el);
//       return;
//     }
//     for (let k = 0; k < 4; k++) {
//       const cur = el.getBoundingClientRect().top - base();
//       const d = targetTop - cur;
//       if (Math.abs(d) < 0.5) break;
//       const mt = parseFloat(getComputedStyle(el).marginTop) || 0;
//       el.style.marginTop = `${Math.max(0, mt + d)}px`;
//     }
//   };

//   for (const el of units) {
//     const r = el.getBoundingClientRect();
//     const top = r.top - base();
//     const bottom = r.bottom - base();
//     if (r.height <= 0 || r.height > PH - 2 * SAFE) continue;
//     const start = Math.floor(top / PH) * PH;
//     if (bottom > start + PH - SAFE) pushTo(el, start + PH + SAFE);
//     else if (start > 0 && top < start + SAFE) pushTo(el, start + SAFE);
//   }

//   let last = 0;
//   for (const el of units)
//     last = Math.max(last, el.getBoundingClientRect().bottom - base());
//   return last;
// }

// /* ---------------- rendering ---------------- */

// // function Sheet({
// //   html,
// //   objects,
// //   margins,
// // }: {
// //   html: string;
// //   objects: PageObject[];
// //   margins: Margins;
// // }) {
// //   return (
// //     <div
// //       style={{ position: "relative", width: PW, background: "#fff" }}
// //       className={styles.sheet}
// //     >
// //       <div
// //         data-prose
// //         className={`ProseMirror ${editorStyles.proseArea}`}
// //         style={{
// //           paddingLeft: margins.left,
// //           paddingRight: margins.right,
// //           minHeight: PH,
// //         }}
// //         dangerouslySetInnerHTML={{ __html: html }}
// //       />
// //       <StaticObjects objects={objects} />
// //     </div>
// //   );
// // }
// function Sheet({
//   html,
//   objects,
//   margins,
// }: {
//   html: string;
//   objects: PageObject[];
//   margins: Margins;
// }) {
//   return (
//     <div
//       style={
//         {
//           position: "relative",
//           width: PW,
//           background: "#fff",
//           "--ml": `${margins.left}px`,
//           "--mr": `${margins.right}px`,
//         } as React.CSSProperties
//       }
//       className={styles.sheet}
//     >
//       <div
//         data-prose
//         className={`ProseMirror ${editorStyles.proseArea}`}
//         style={{
//           paddingLeft: margins.left,
//           paddingRight: margins.right,
//           minHeight: PH,
//           whiteSpace: "pre-wrap",
//           wordWrap: "break-word",
//           fontFamily: "inherit",
//         }}
//         dangerouslySetInnerHTML={{ __html: html }}
//       />
//       <StaticObjects objects={objects} />
//     </div>
//   );
// }

// type Props = {
//   title: string;
//   html: string;
//   objects: PageObject[] | null;
//   margins: Margins;
//   autoPrint?: boolean;
//   onClose: () => void;
// };

// export default function PdfPreviewModal({
//   title,
//   html: doc,
//   objects,
//   margins,
//   autoPrint,
//   onClose,
// }: Props) {
//   // export default function PdfPreviewModal({
//   //   title,
//   //   doc,
//   //   objects,
//   //   margins,
//   //   autoPrint,
//   //   onClose,
//   // }: Props) {
//   // const html = useMemo(() => {
//   //   try {
//   //     return generateHTML(doc || EMPTY, getExtensions());
//   //   } catch (err) {
//   //     console.error("Preview: generateHTML failed", err);
//   //     return "";
//   //   }
//   // }, [doc]);

//   const html = useMemo(() => {
//     try {
//       const raw = generateHTML(doc || EMPTY, getExtensions());
//       // Same as the editor: an empty block keeps its height thanks to a <br>
//       return raw.replace(
//         /<(p|h[1-3])([^>]*)><\/\1>/g,
//         '<$1$2><br class="ProseMirror-trailingBreak"></$1>',
//       );
//     } catch (err) {
//       console.error("Preview: generateHTML failed", err);
//       return "";
//     }
//   }, [doc]);

//   const safe = useMemo(() => safeObjects(objects), [objects]);

//   const rootRef = useRef<HTMLDivElement>(null);
//   const measureRef = useRef<HTMLDivElement>(null);
//   const [laidHtml, setLaidHtml] = useState("");
//   const [pages, setPages] = useState(1);
//   const [zoom, setZoom] = useState(1);
//   const [ready, setReady] = useState(false);

//   // Inject the print stylesheet while the modal is mounted.
//   useEffect(() => {
//     const el = document.createElement("style");
//     el.setAttribute("data-print-style", "");
//     el.textContent = PRINT_CSS;
//     document.head.appendChild(el);
//     return () => el.remove();
//   }, []);

//   // Layout pass in a hidden copy that lives OUTSIDE the modal (no transforms),
//   // then reuse the resulting HTML on every page.
//   useEffect(() => {
//     let alive = true;
//     setReady(false);
//     (async () => {
//       const root =
//         measureRef.current?.querySelector<HTMLElement>("[data-prose]");
//       if (!root) return;
//       root.innerHTML = html; // always start from a clean copy
//       try {
//         await (document as any).fonts?.ready;
//       } catch {}
//       await Promise.all(
//         Array.from(root.querySelectorAll("img")).map((i) =>
//           i.complete
//             ? null
//             : new Promise((r) => {
//                 i.onload = i.onerror = r;
//               }),
//         ),
//       );
//       if (!alive) return;
//       const textBottom = paginate(root);
//       const textH = textBottom > 0 ? textBottom + SAFE : 0;
//       const objH = safe.reduce(
//         (m, o) => Math.max(m, bounds(o).bottom + SAFE),
//         0,
//       );
//       setLaidHtml(root.innerHTML);
//       setPages(Math.max(1, Math.ceil(Math.max(textH, objH) / PH)));
//       setReady(true);
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [html, safe, margins]);

//   useEffect(() => {
//     const fit = () =>
//       setZoom(Math.min(1, (window.innerWidth * 0.92 - 64) / PW));
//     fit();
//     window.addEventListener("resize", fit);
//     return () => window.removeEventListener("resize", fit);
//   }, []);

//   useEffect(() => {
//     const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
//     window.addEventListener("keydown", h);
//     return () => window.removeEventListener("keydown", h);
//   }, [onClose]);

//   async function print() {
//     const imgs = Array.from(rootRef.current?.querySelectorAll("img") ?? []);
//     await Promise.all(
//       imgs.map((i) =>
//         i.complete
//           ? null
//           : new Promise((r) => {
//               i.onload = i.onerror = r;
//             }),
//       ),
//     );
//     const prev = document.title;
//     document.title = title || "document"; // becomes the PDF file name
//     const restore = () => {
//       document.title = prev;
//       window.removeEventListener("afterprint", restore);
//     };
//     window.addEventListener("afterprint", restore);
//     window.print();
//   }

//   const printed = useRef(false);
//   useEffect(() => {
//     if (ready && autoPrint && !printed.current) {
//       printed.current = true;
//       print();
//     }
//   }, [ready]); // eslint-disable-line

//   const shown = laidHtml || html;

//   return (
//     <>
//       {createPortal(
//         <div
//           ref={rootRef}
//           className={styles.overlay}
//           data-print-root
//           onClick={onClose}
//         >
//           <div
//             className={styles.modal}
//             data-print-modal
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className={styles.header} data-print-hide>
//               <span className={styles.title}>
//                 Aperçu avant impression — {title}
//               </span>
//               <span className={styles.meta}>
//                 {pages} page{pages > 1 ? "s" : ""} · A4 · {objects.length} objet
//                 {objects.length > 1 ? "s" : ""}
//               </span>
//               <div className={styles.actions}>
//                 <button
//                   className={styles.downloadBtn}
//                   onClick={print}
//                   disabled={!ready}
//                 >
//                   <Printer size={14} /> Télécharger le PDF
//                 </button>
//                 <button
//                   className={styles.closeBtn}
//                   onClick={onClose}
//                   aria-label="Fermer l'aperçu"
//                 >
//                   <X size={16} />
//                 </button>
//               </div>
//             </div>

//             <div className={styles.scroll} data-print-scroll>
//               {!ready && (
//                 <div className={styles.loading} data-print-hide>
//                   <span className={styles.spinner} />
//                   Préparation de l'aperçu…
//                 </div>
//               )}
//               <div className={styles.pages} data-print-pages style={{ zoom }}>
//                 {Array.from({ length: pages }, (_, i) => (
//                   <div key={i} className={styles.page} data-print-page>
//                     <div className={styles.slice} style={{ top: -i * PH }}>
//                       <Sheet html={shown} objects={safe} margins={margins} />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>,
//         document.body,
//       )}

//       {/* hidden measuring pass, separate portal: no animation, no transform */}
//       {createPortal(
//         <div
//           ref={measureRef}
//           data-print-hide
//           style={{
//             position: "fixed",
//             left: -99999,
//             top: 0,
//             width: PW,
//             visibility: "hidden",
//             pointerEvents: "none",
//           }}
//         >
//           <Sheet html={html} objects={[]} margins={margins} />
//         </div>,
//         document.body,
//       )}
//     </>
//   );
// }
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Printer } from "lucide-react";
import type { PageObject } from "@/lib/objets";
import type { Margins } from "./MarginRuler";
import editorStyles from "./editor.module.css";
import styles from "./pdfpreview.module.css";
import { StaticObjects } from "./ObjectLayer";

const PW = 794;
const PH = 1123;
const SAFE = 30;
const GAP = 24;

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 0; }
  html, body { margin:0 !important; padding:0 !important; background:#fff !important;
    width:auto !important; height:auto !important; overflow:visible !important; display:block !important; }
  body > *:not([data-print-root]) { display: none !important; }
  [data-print-root] { position:static !important; display:block !important; background:none !important;
    backdrop-filter:none !important; width:auto !important; height:auto !important; }
  [data-print-modal] { display:block !important; width:auto !important; height:auto !important;
    max-width:none !important; background:none !important; box-shadow:none !important;
    border-radius:0 !important; overflow:visible !important; }
  [data-print-hide] { display: none !important; }
  [data-print-scroll] { display:block !important; overflow:visible !important; padding:0 !important; }
  [data-print-outer] { width:auto !important; height:auto !important; margin:0 !important; position:static !important; }
  [data-print-pages] { display:block !important; transform:none !important; position:static !important;
    width:auto !important; gap:0 !important; }
  [data-print-page] { width:210mm !important; height:296.5mm !important; margin:0 !important;
    box-shadow:none !important; overflow:hidden !important;
    break-after:page; page-break-after:always; break-inside:avoid; }
  [data-print-page]:last-child { break-after:auto; page-break-after:auto; }
  [data-print-root] * { animation:none !important; transition:none !important;
    -webkit-print-color-adjust:exact; print-color-adjust:exact; }
}`;

/* ---------- objects: safe zones (render only) ---------- */
function bounds(o: PageObject) {
  const r = (o.rotation * Math.PI) / 180;
  const h = Math.abs(o.w * Math.sin(r)) + Math.abs(o.h * Math.cos(r));
  const cy = o.y + o.h / 2;
  return { top: cy - h / 2, bottom: cy + h / 2, h };
}
function safeObjects(list: PageObject[]): PageObject[] {
  return list.map((o) => {
    const { top, bottom, h } = bounds(o);
    if (h > PH - 2 * SAFE) return o;
    const start = Math.floor(Math.max(0, top) / PH) * PH;
    let dy = 0;
    if (bottom > start + PH - SAFE) dy = start + PH + SAFE - top;
    else if (top < start + SAFE) dy = start + SAFE - top;
    return dy ? { ...o, y: Math.round(o.y + dy) } : o;
  });
}

/* ---------- text: push blocks touching the safe zones ---------- */
const CONTAINERS = new Set([
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "TABLE",
  "TBODY",
  "THEAD",
]);

function paginate(root: HTMLElement): number {
  const sheet = root.parentElement as HTMLElement;
  const base = () => sheet.getBoundingClientRect().top;

  const units: HTMLElement[] = [];
  const collect = (el: HTMLElement) => {
    for (const c of Array.from(el.children) as HTMLElement[]) {
      if (c.tagName === "COLGROUP") continue;
      const h = c.getBoundingClientRect().height;
      if (h > PH - 2 * SAFE && CONTAINERS.has(c.tagName)) collect(c);
      else units.push(c);
    }
  };
  collect(root);

  const pushTo = (el: HTMLElement, targetTop: number) => {
    if (el.tagName === "TR") {
      const d = targetTop - (el.getBoundingClientRect().top - base());
      const sp = document.createElement("tr");
      sp.style.height = `${Math.ceil(d)}px`;
      sp.innerHTML = `<td colspan="99" style="border:0;padding:0;background:none"></td>`;
      el.parentElement!.insertBefore(sp, el);
      return;
    }
    for (let k = 0; k < 4; k++) {
      const d = targetTop - (el.getBoundingClientRect().top - base());
      if (Math.abs(d) < 0.5) break;
      const mt = parseFloat(getComputedStyle(el).marginTop) || 0;
      el.style.marginTop = `${Math.max(0, mt + d)}px`;
    }
  };

  for (const el of units) {
    const r = el.getBoundingClientRect();
    const top = r.top - base();
    const bottom = r.bottom - base();
    if (r.height <= 0 || r.height > PH - 2 * SAFE) continue;
    const start = Math.floor(top / PH) * PH;
    if (bottom > start + PH - SAFE) pushTo(el, start + PH + SAFE);
    else if (start > 0 && top < start + SAFE) pushTo(el, start + SAFE);
  }

  let last = 0;
  for (const el of units)
    last = Math.max(last, el.getBoundingClientRect().bottom - base());
  return last;
}

/* ---------- rendering ---------- */
function Sheet({
  html,
  objects,
  margins,
}: {
  html: string;
  objects: PageObject[];
  margins: Margins;
}) {
  return (
    <div
      className={styles.sheet}
      style={
        {
          position: "relative",
          width: PW,
          background: "#fff",
          "--ml": `${margins.left}px`,
          "--mr": `${margins.right}px`,
        } as React.CSSProperties
      }
    >
      <div
        data-prose
        className={`ProseMirror ${editorStyles.proseArea}`}
        style={{
          paddingLeft: margins.left,
          paddingRight: margins.right,
          minHeight: PH,
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          fontFamily: "inherit",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <StaticObjects objects={objects} />
    </div>
  );
}

type Props = {
  title: string;
  html: string; // snapshot of the editor DOM (a string, never JSON)
  objects: PageObject[];
  margins: Margins;
  autoPrint?: boolean;
  onClose: () => void;
};

export default function PdfPreviewModal({
  title,
  html,
  objects,
  margins,
  autoPrint,
  onClose,
}: Props) {
  const list = objects ?? [];
  const [safe, setSafe] = useState<PageObject[]>(() => safeObjects(list));
  useEffect(() => setSafe(safeObjects(list)), [objects]); // eslint-disable-line

  const rootRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [laidHtml, setLaidHtml] = useState("");
  const [pages, setPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = PRINT_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  useEffect(() => {
    let alive = true;
    setReady(false);
    (async () => {
      const root =
        measureRef.current?.querySelector<HTMLElement>("[data-prose]");
      if (!root) return;
      root.innerHTML = html;
      try {
        await (document as any).fonts?.ready;
      } catch {}
      await Promise.all(
        Array.from(root.querySelectorAll("img")).map((i) =>
          i.complete
            ? null
            : new Promise((r) => {
                i.onload = i.onerror = r;
              }),
        ),
      );
      if (!alive) return;
      const textBottom = paginate(root);
      const textH = textBottom > 0 ? textBottom + SAFE : 0;
      const objH = safe.reduce(
        (m, o) => Math.max(m, bounds(o).bottom + SAFE),
        0,
      );
      setLaidHtml(root.innerHTML);
      setPages(Math.max(1, Math.ceil(Math.max(textH, objH) / PH)));
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [html, safe, margins]);

  useEffect(() => {
    const fit = () =>
      setZoom(Math.min(1, (Math.min(window.innerWidth * 0.96, 960) - 32) / PW));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function print() {
    const imgs = Array.from(rootRef.current?.querySelectorAll("img") ?? []);
    await Promise.all(
      imgs.map((i) =>
        i.complete
          ? null
          : new Promise((r) => {
              i.onload = i.onerror = r;
            }),
      ),
    );
    const prev = document.title;
    document.title = title || "document";
    const restore = () => {
      document.title = prev;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  const printed = useRef(false);
  useEffect(() => {
    if (ready && autoPrint && !printed.current) {
      printed.current = true;
      print();
    }
  }, [ready]); // eslint-disable-line

  const shown = laidHtml || html;
  const totalH = pages * PH + (pages - 1) * GAP;

  return (
    <>
      {createPortal(
        <div
          ref={rootRef}
          className={styles.overlay}
          data-print-root
          onClick={onClose}
        >
          <div
            className={styles.modal}
            data-print-modal
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header} data-print-hide>
              <span className={styles.title}>Aperçu — {title}</span>
              <span className={styles.meta}>
                {pages} page{pages > 1 ? "s" : ""} · {list.length} objet
                {list.length > 1 ? "s" : ""}
              </span>
              <div className={styles.actions}>
                <button
                  className={styles.downloadBtn}
                  onClick={print}
                  disabled={!ready}
                >
                  <Printer size={14} /> PDF
                </button>
                <button
                  className={styles.closeBtn}
                  onClick={onClose}
                  aria-label="Fermer l'aperçu"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className={styles.scroll} data-print-scroll>
              {!ready && (
                <div className={styles.loading} data-print-hide>
                  <span className={styles.spinner} /> Préparation de l'aperçu…
                </div>
              )}
              <div
                data-print-outer
                style={{
                  position: "relative",
                  width: PW * zoom,
                  height: totalH * zoom,
                  margin: "0 auto",
                }}
              >
                <div
                  className={styles.pages}
                  data-print-pages
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: PW,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                >
                  {Array.from({ length: pages }, (_, i) => (
                    <div key={i} className={styles.page} data-print-page>
                      <div className={styles.slice} style={{ top: -i * PH }}>
                        <Sheet html={shown} objects={safe} margins={margins} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {createPortal(
        <div
          ref={measureRef}
          data-print-hide
          style={{
            position: "fixed",
            left: -99999,
            top: 0,
            width: PW,
            visibility: "hidden",
            pointerEvents: "none",
          }}
        >
          <Sheet html={html} objects={[]} margins={margins} />
        </div>,
        document.body,
      )}
    </>
  );
}
