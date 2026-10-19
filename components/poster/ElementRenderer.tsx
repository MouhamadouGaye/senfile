"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Move,
  RotateCw,
  X,
  FlipHorizontal2,
  FlipVertical2,
  Maximize2,
} from "lucide-react";
import { PosterElement } from "@/lib/api";
import styles from "./element-renderer.module.css";

type Props = {
  element: PosterElement;
  selected: boolean;
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  /** Tous les éléments du canvas, pour l'aimantation croisée. */
  siblings?: PosterElement[];
  onSelect: () => void;
  onChange: (patch: Partial<PosterElement>) => void;
  onDelete: () => void;
};

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
type GuidesHandle = {
  show: (x: number[], y: number[]) => void;
  hide: () => void;
};

const MIN_SIZE = 24;
const SNAP_PX = 6; // tolérance d'aimantation, en pixels écran
const ROT_SNAP_TOL = 3; // tolérance de snap 0/90/180/270, en degrés
const FIT_CYCLE: Array<"cover" | "contain" | "fill" | "none"> = [
  "cover",
  "contain",
  "fill",
  "none",
];

/* -------------------------------------------------------------------------- */
/*  Guides (lignes rouges) : rendues dans un portal pour ne pas re-render     */
/* -------------------------------------------------------------------------- */

const GuidesOverlay = forwardRef<GuidesHandle>(function GuidesOverlay(_, ref) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });

  useEffect(() => setMounted(true), []);

  useImperativeHandle(
    ref,
    () => ({
      show(x, y) {
        setPos({ x, y });
      },
      hide() {
        setPos({ x: [], y: [] });
      },
    }),
    [],
  );

  if (!mounted || (pos.x.length === 0 && pos.y.length === 0)) return null;

  return createPortal(
    <div className={styles.guides}>
      {pos.x.map((gx, i) => (
        <div key={`v${i}`} className={styles.guideV} style={{ left: gx }} />
      ))}
      {pos.y.map((gy, i) => (
        <div key={`h${i}`} className={styles.guideH} style={{ top: gy }} />
      ))}
    </div>,
    document.body,
  );
});

/* -------------------------------------------------------------------------- */

export default function ElementRenderer({
  element,
  selected,
  canvasWidth,
  canvasHeight,
  scale,
  siblings = [],
  onSelect,
  onChange,
  onDelete,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const guidesRef = useRef<GuidesHandle>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback(
    (x: number, y: number, w: number, h: number) => ({
      x: Math.min(Math.max(0, x), Math.max(0, canvasWidth - w)),
      y: Math.min(Math.max(0, y), Math.max(0, canvasHeight - h)),
    }),
    [canvasWidth, canvasHeight],
  );

  /* ------- Nudge clavier quand l'élément est sélectionné et non édité ------ */
  useEffect(() => {
    if (!selected || element.locked) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.isContentEditable ||
          t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA")
      )
        return;
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;
      else return;
      e.preventDefault();
      const c = clamp(
        element.x + dx,
        element.y + dy,
        element.width,
        element.height,
      );
      onChange({ x: c.x, y: c.y });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, element, clamp, onChange]);

  if (element.visible === false) return null;

  /* ------------------------------- Helpers -------------------------------- */

  function getCanvasRect() {
    const parent = boxRef.current?.parentElement;
    return parent ? parent.getBoundingClientRect() : null;
  }

  function showGuides(linesX: number[], linesY: number[]) {
    const rect = getCanvasRect();
    if (!rect || !guidesRef.current) return;
    guidesRef.current.show(
      linesX.map((cx) => rect.left + cx * scale),
      linesY.map((cy) => rect.top + cy * scale),
    );
  }
  function hideGuides() {
    guidesRef.current?.hide();
  }

  function setBadge(text: string | null) {
    const el = badgeRef.current;
    if (!el) return;
    if (text === null) el.style.display = "none";
    else {
      el.textContent = text;
      el.style.display = "block";
    }
  }

  /** Aimante une position (x, y) à la grille du canvas et aux voisins. */
  function snapMove(x: number, y: number, w: number, h: number) {
    const t = SNAP_PX / scale;
    const tX: number[] = [0, canvasWidth / 2, canvasWidth];
    const tY: number[] = [0, canvasHeight / 2, canvasHeight];
    for (const s of siblings) {
      if (s.id === element.id || s.visible === false) continue;
      tX.push(s.x, s.x + s.width / 2, s.x + s.width);
      tY.push(s.y, s.y + s.height / 2, s.y + s.height);
    }

    const cX = [x, x + w / 2, x + w];
    const cY = [y, y + h / 2, y + h];

    let bestX: { d: number; off: number; line: number } | null = null;
    for (const tx of tX)
      for (const cx of cX) {
        const d = Math.abs(tx - cx);
        if (d <= t && (!bestX || d < bestX.d))
          bestX = { d, off: tx - cx, line: tx };
      }
    let bestY: { d: number; off: number; line: number } | null = null;
    for (const ty of tY)
      for (const cy of cY) {
        const d = Math.abs(ty - cy);
        if (d <= t && (!bestY || d < bestY.d))
          bestY = { d, off: ty - cy, line: ty };
      }

    const linesX: number[] = [];
    const linesY: number[] = [];
    let outX = x;
    let outY = y;
    if (bestX) {
      outX += bestX.off;
      linesX.push(bestX.line);
    }
    if (bestY) {
      outY += bestY.off;
      linesY.push(bestY.line);
    }
    return { x: outX, y: outY, linesX, linesY };
  }

  /* -------------------------------- Drag ---------------------------------- */

  function runDrag(e: React.PointerEvent) {
    if (element.locked) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = element.x;
    const startTop = element.y;
    let finalX = startLeft;
    let finalY = startTop;

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const onMove = (ev: PointerEvent) => {
      let nx = startLeft + (ev.clientX - startX) / scale;
      let ny = startTop + (ev.clientY - startY) / scale;
      const c0 = clamp(nx, ny, element.width, element.height);
      nx = c0.x;
      ny = c0.y;

      if (ev.ctrlKey || ev.metaKey) {
        hideGuides();
      } else {
        const s = snapMove(nx, ny, element.width, element.height);
        const c1 = clamp(s.x, s.y, element.width, element.height);
        nx = c1.x;
        ny = c1.y;
        showGuides(s.linesX, s.linesY);
      }

      finalX = Math.round(nx);
      finalY = Math.round(ny);
      if (boxRef.current) {
        boxRef.current.style.left = `${finalX}px`;
        boxRef.current.style.top = `${finalY}px`;
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      hideGuides();
      onChange({ x: finalX, y: finalY });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /* ------------------------------ Resize ---------------------------------- */

  function startResize(e: React.PointerEvent, handle: Handle) {
    if (element.locked) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = element.width;
    const startH = element.height;
    const startLeft = element.x;
    const startTop = element.y;
    const ar = startW / startH;

    const isImage = element.type === "image";
    const isCorner = handle.length === 2;
    // Image : coins = ratio verrouillé, bords = étirement libre.
    // Shift inverse le mode, Alt redimensionne depuis le centre.
    const defaultLock = isImage && isCorner;

    const mL = handle.includes("w");
    const mR = handle.includes("e");
    const mT = handle.includes("n");
    const mB = handle.includes("s");

    let final = { x: startLeft, y: startTop, w: startW, h: startH };

    document.body.style.userSelect = "none";
    document.body.style.cursor = isCorner
      ? "nwse-resize"
      : mL || mR
        ? "ew-resize"
        : "ns-resize";

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      const lockAR = ev.shiftKey ? !defaultLock : defaultLock;
      const fromCenter = ev.altKey;

      // 1) taille brute
      let w = startW;
      let h = startH;
      if (fromCenter) {
        if (mR) w = startW + 2 * dx;
        else if (mL) w = startW - 2 * dx;
        if (mB) h = startH + 2 * dy;
        else if (mT) h = startH - 2 * dy;
      } else {
        if (mR) w = startW + dx;
        else if (mL) w = startW - dx;
        if (mB) h = startH + dy;
        else if (mT) h = startH - dy;
      }
      w = Math.max(MIN_SIZE, w);
      h = Math.max(MIN_SIZE, h);

      // 2) verrouillage du ratio
      if (lockAR) {
        if (isCorner) {
          const sW = w / startW;
          const sH = h / startH;
          const s = Math.abs(sW - 1) >= Math.abs(sH - 1) ? sW : sH;
          w = Math.max(MIN_SIZE, startW * s);
          h = Math.max(MIN_SIZE, startH * s);
        } else if (mL || mR) {
          h = Math.max(MIN_SIZE, w / ar);
        } else {
          w = Math.max(MIN_SIZE, h * ar);
        }
      }

      // 3) position
      let x = startLeft;
      let y = startTop;
      if (fromCenter) {
        x = startLeft - (w - startW) / 2;
        y = startTop - (h - startH) / 2;
      } else {
        if (mL) x = startLeft + (startW - w);
        if (mT) y = startTop + (startH - h);
        if (lockAR && !isCorner) {
          // Bords verrouillés : on recentre sur l'axe perpendiculaire.
          if (mL || mR) y = startTop + (startH - h) / 2;
          if (mT || mB) x = startLeft + (startW - w) / 2;
        }
      }

      // 4) confinement au canvas
      if (x < 0) {
        w += x;
        x = 0;
      }
      if (y < 0) {
        h += y;
        y = 0;
      }
      if (x + w > canvasWidth) w = Math.max(MIN_SIZE, canvasWidth - x);
      if (y + h > canvasHeight) h = Math.max(MIN_SIZE, canvasHeight - y);

      final = {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h),
      };

      if (boxRef.current) {
        boxRef.current.style.left = `${final.x}px`;
        boxRef.current.style.top = `${final.y}px`;
        boxRef.current.style.width = `${final.w}px`;
        boxRef.current.style.height = `${final.h}px`;
      }
      setBadge(`${final.w} × ${final.h}`);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      setBadge(null);
      onChange({
        x: final.x,
        y: final.y,
        width: final.w,
        height: final.h,
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /* ------------------------------ Rotate ---------------------------------- */

  function startRotate(e: React.PointerEvent) {
    if (element.locked) return;
    e.preventDefault();
    e.stopPropagation();
    const box = boxRef.current;
    if (!box) return;

    const rect = box.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let finalRot = element.rotation;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      let a = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (ev.shiftKey) {
        a = Math.round(a / 15) * 15;
      } else {
        const snapped = Math.round(a / 45) * 45;
        if (Math.abs(a - snapped) <= ROT_SNAP_TOL) a = snapped;
      }
      finalRot = Math.round(a);
      if (boxRef.current)
        boxRef.current.style.transform = `rotate(${finalRot}deg)`;
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      onChange({ rotation: finalRot });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /* --------------------------- Box pointer down --------------------------- */

  function startBoxPointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    onSelect();
    if (element.locked) return;
    if (element.type === "text") {
      const clickedText = !!(e.target as HTMLElement).closest(
        "[data-text-content]",
      );
      if (clickedText && selected) return; // laisse éditer le texte
    }
    runDrag(e);
  }

  /* ------------------------------- Render --------------------------------- */

  const counterRotate = `rotate(${-element.rotation}deg)`;
  const hasFillImage = element.type === "shape" && !!(element as any).fillImage;
  const handleScale = Math.max(1, 1 / scale);
  const handleTransform = `${counterRotate} scale(${handleScale})`;

  const isImage = element.type === "image";
  const currentFit = ((element as any).objectFit ?? "cover") as
    | "cover"
    | "contain"
    | "fill"
    | "none";
  const flipX = !!(element as any).flipX;
  const flipY = !!(element as any).flipY;

  const fitIcon =
    currentFit === "contain" ? "⊡" : currentFit === "fill" ? "⤢" : "⛶";

  return (
    <div
      ref={boxRef}
      className={`${styles.element} ${selected ? styles.selected : ""}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        opacity: (element as any).opacity ?? 1,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: element.zIndex,
        cursor: element.locked ? "default" : "grab",
      }}
      onPointerDown={startBoxPointerDown}
      onClick={(e) => e.stopPropagation()}
    >
      {element.type === "text" && (
        <div
          data-text-content
          className={styles.textContent}
          contentEditable={!element.locked}
          suppressContentEditableWarning
          style={{
            fontSize: element.fontSize,
            color: element.color,
            fontFamily: element.fontFamily,
            textAlign: element.align,
            fontWeight: element.fontWeight,
            letterSpacing: (element as any).letterSpacing,
          }}
          onBlur={(e) => onChange({ text: e.currentTarget.textContent || "" })}
        >
          {element.text}
        </div>
      )}

      {element.type === "shape" && (
        <div
          className={styles.shapeContent}
          data-shape={element.shapeType}
          style={{
            background: hasFillImage
              ? undefined
              : element.shapeType === "line"
                ? "none"
                : element.fill,
            backgroundImage: hasFillImage
              ? `url(${(element as any).fillImage})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderColor: element.borderColor,
            borderWidth:
              element.shapeType === "line" ? 0 : (element.borderWidth ?? 2),
            borderTopWidth:
              element.shapeType === "line"
                ? (element.borderWidth ?? 3)
                : undefined,
            borderTopStyle: element.shapeType === "line" ? "solid" : undefined,
          }}
        />
      )}

      {isImage && element.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={element.src}
          alt=""
          className={styles.imageContent}
          draggable={false}
          crossOrigin="anonymous"
          style={{
            objectFit: currentFit,
            transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
          }}
        />
      )}

      {/* Badge dimensions pendant le redimensionnement */}
      <div
        ref={badgeRef}
        className={styles.sizeBadge}
        style={{
          display: "none",
          transform: `translateX(-50%) ${handleTransform}`,
        }}
      />

      {selected && !element.locked && (
        <>
          {/* Poignée ⠿ : seulement pour le texte (sinon on glisse l'élément) */}
          {element.type === "text" && (
            <span
              className={styles.moveHandle}
              style={{ transform: handleTransform }}
              onPointerDown={runDrag}
              role="separator"
              aria-label="Déplacer"
              title="Déplacer"
            >
              <Move size={12} />
            </span>
          )}

          <span
            className={styles.rotateHandle}
            style={{ transform: handleTransform }}
            onPointerDown={startRotate}
            role="separator"
            aria-label="Pivoter"
            title="Pivoter (Shift = 15°)"
          >
            <RotateCw size={12} />
          </span>

          <button
            className={styles.deleteBtn}
            style={{ transform: handleTransform }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onDelete}
            aria-label="Supprimer l'élément"
            title="Supprimer"
          >
            <X size={13} />
          </button>

          {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as Handle[]).map(
            (h) => (
              <span
                key={h}
                className={styles.resize}
                data-handle={h}
                style={{ transform: handleTransform }}
                onPointerDown={(e) => startResize(e, h)}
                role="separator"
                aria-label="Redimensionner"
              />
            ),
          )}

          {/* Outils image : miroir + ajustement */}
          {isImage && (
            <div
              className={styles.imageTools}
              style={{ transform: handleTransform }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() =>
                  onChange({ ...(element as any), flipX: !flipX } as any)
                }
                title="Miroir horizontal"
                aria-label="Miroir horizontal"
              >
                <FlipHorizontal2 size={12} />
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({ ...(element as any), flipY: !flipY } as any)
                }
                title="Miroir vertical"
                aria-label="Miroir vertical"
              >
                <FlipVertical2 size={12} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const i = FIT_CYCLE.indexOf(currentFit);
                  const next = FIT_CYCLE[(i + 1) % FIT_CYCLE.length];
                  onChange({ ...(element as any), objectFit: next } as any);
                }}
                title={`Ajustement : ${currentFit}`}
                aria-label="Changer l'ajustement de l'image"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          )}
        </>
      )}

      <GuidesOverlay ref={guidesRef} />
    </div>
  );
}
