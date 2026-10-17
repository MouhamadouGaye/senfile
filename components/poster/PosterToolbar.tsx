"use client";

import { useEffect, useRef, useState } from "react";
import {
  Type,
  Diamond,
  RectangleHorizontal,
  Circle,
  Minus,
  ImageIcon,
  Scissors,
  Loader2,
  ImagePlus,
  Eye,
  Copy,
  Trash2,
  PaintBucket,
  MoreHorizontal,
} from "lucide-react";
import { PosterElement } from "@/lib/api";
import TextStylesMenu from "./TextStylesMenu";
import TextFormatBar from "./TextFormatBar";
import styles from "./poster-toolbar.module.css";

const FILL_COLORS = [
  "transparent",
  "#4b3f72",
  "#b8902e",
  "#a13d3d",
  "#2e6b52",
  "#3a5a78",
  "#1c1b22",
  "#ffffff",
];
const CANVAS_BG_COLORS = [
  "#ffffff",
  "#f3f2ef",
  "#1c1b22",
  "#4b3f72",
  "#b8902e",
  "#eaf3ee",
  "#eef4f8",
  "#fdf8f0",
];
const ICON_SIZE = 16;

type Props = {
  selected: PosterElement | null;
  backgroundColor: string;
  onBackgroundChange: (color: string) => void;
  onAddText: () => void;
  onAddShape: (shapeType: "rectangle" | "circle" | "line") => void;
  onAddImage: (file: File) => void;
  onUpdateSelected: (patch: Partial<PosterElement>) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onRemoveBackground: () => void;
  removingBackground: boolean;
  onFillShapeImage: (file: File) => void;
  onPreview: () => void;
};

function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
}

export default function PosterToolbar({
  selected,
  backgroundColor,
  onBackgroundChange,
  onAddText,
  onAddShape,
  onAddImage,
  onUpdateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onRemoveBackground,
  removingBackground,
  onFillShapeImage,
  onPreview,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fillImageInputRef = useRef<HTMLInputElement>(null);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [fillOpen, setFillOpen] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onAddImage(file);
  }

  function pickFillImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onFillShapeImage(file);
  }

  const addButtons = (
    <>
      <button
        className={styles.btn}
        onClick={onAddText}
        title="Ajouter du texte"
      >
        <Type size={ICON_SIZE} /> {!isMobile && "Texte"}
      </button>

      <div style={{ position: "relative" }}>
        <button
          className={styles.btn}
          onClick={() => setShapeMenuOpen((o) => !o)}
          title="Ajouter une forme"
        >
          <Diamond size={ICON_SIZE} /> {!isMobile && "Forme"}
        </button>
        {shapeMenuOpen && (
          <div className={styles.popover} style={{ width: 150 }}>
            <button
              className={styles.btn}
              onClick={() => {
                onAddShape("rectangle");
                setShapeMenuOpen(false);
              }}
            >
              <RectangleHorizontal size={ICON_SIZE} /> Rectangle
            </button>
            <button
              className={styles.btn}
              onClick={() => {
                onAddShape("circle");
                setShapeMenuOpen(false);
              }}
            >
              <Circle size={ICON_SIZE} /> Cercle
            </button>
            <button
              className={styles.btn}
              onClick={() => {
                onAddShape("line");
                setShapeMenuOpen(false);
              }}
            >
              <Minus size={ICON_SIZE} /> Ligne
            </button>
          </div>
        )}
      </div>

      <button
        className={styles.btn}
        onClick={() => fileInputRef.current?.click()}
        title="Ajouter une image"
      >
        <ImageIcon size={ICON_SIZE} /> {!isMobile && "Image"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={pickImage}
      />
    </>
  );

  const backgroundControl = (
    <div style={{ position: "relative" }}>
      <button
        className={`${styles.btn} ${styles.colorSwatchBtn}`}
        onClick={() => setBgOpen((o) => !o)}
        title="Couleur du fond de l'affiche"
      >
        <PaintBucket size={ICON_SIZE} />
        <span
          className={styles.swatchDot}
          style={{ background: backgroundColor }}
        />
      </button>
      {bgOpen && (
        <div className={styles.popover}>
          {CANVAS_BG_COLORS.map((c) => (
            <button
              key={c}
              className={styles.swatch}
              style={{
                background: c,
                border: c === "#ffffff" ? "1px solid var(--line)" : undefined,
              }}
              onClick={() => {
                onBackgroundChange(c);
                setBgOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  const selectedControls = selected && (
    <>
      {selected.type === "shape" && (
        <>
          <div style={{ position: "relative" }}>
            <button
              className={`${styles.btn} ${styles.colorSwatchBtn}`}
              onClick={() => setFillOpen((o) => !o)}
              title="Couleur de remplissage"
            >
              <span
                className={styles.swatchDot}
                style={{ background: selected.fill || "transparent" }}
              />
            </button>
            {fillOpen && (
              <div className={styles.popover}>
                {FILL_COLORS.map((c) => (
                  <button
                    key={c}
                    className={styles.swatch}
                    style={{
                      background:
                        c === "transparent"
                          ? "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 8px 8px"
                          : c,
                    }}
                    onClick={() => {
                      onUpdateSelected({ fill: c, fillImage: undefined });
                      setFillOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            className={styles.btn}
            onClick={() => fillImageInputRef.current?.click()}
            title="Remplir avec une image"
          >
            <ImagePlus size={ICON_SIZE} /> {!isMobile && "Remplir d'une image"}
          </button>
          <input
            ref={fillImageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={pickFillImage}
          />
        </>
      )}

      {selected.type === "text" && (
        <>
          <TextFormatBar element={selected} onChange={onUpdateSelected} />
          <TextStylesMenu
            onApplyStyle={(patch) => onUpdateSelected(patch)}
            onApplyColor={(color) => onUpdateSelected({ color })}
          />
        </>
      )}

      {selected.type === "image" && (
        <button
          className={styles.btn}
          onClick={onRemoveBackground}
          disabled={removingBackground}
          title="Retirer l'arrière-plan"
        >
          {removingBackground ? (
            <Loader2 size={ICON_SIZE} className={styles.spin} />
          ) : (
            <Scissors size={ICON_SIZE} />
          )}
          {!isMobile &&
            (removingBackground ? "Traitement…" : "Retirer l'arrière-plan")}
        </button>
      )}

      <label className={styles.opacityControl} title="Opacité">
        <span>Opacité</span>
        <input
          type="range"
          min={10}
          max={100}
          value={Math.round((selected.opacity ?? 1) * 100)}
          onChange={(e) =>
            onUpdateSelected({ opacity: Number(e.target.value) / 100 })
          }
        />
      </label>

      <button
        className={styles.btn}
        onClick={onDuplicateSelected}
        title="Dupliquer"
      >
        <Copy size={ICON_SIZE} />
      </button>
      <button
        className={`${styles.btn} ${styles.btnDanger}`}
        onClick={onDeleteSelected}
        title="Supprimer"
      >
        <Trash2 size={ICON_SIZE} />
      </button>
    </>
  );

  if (isMobile) {
    return (
      <div className={styles.bar}>
        <div className={styles.group}>{addButtons}</div>
        <div className={styles.spacer} />
        {selected && (
          <button
            className={styles.moreBtn}
            onClick={() => setMobileMenuOpen((o) => !o)}
            title="Options de l'élément"
          >
            <MoreHorizontal size={ICON_SIZE} />
          </button>
        )}
        <button
          className={styles.btn}
          onClick={onPreview}
          title="Aperçu et téléchargement"
        >
          <Eye size={ICON_SIZE} />
        </button>

        {mobileMenuOpen && selected && (
          <div className={styles.mobilePanel}>
            <div className={styles.group} style={{ flexWrap: "wrap" }}>
              {selectedControls}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.bar}>
      <div className={styles.group}>{addButtons}</div>

      <div className={styles.divider} />
      {backgroundControl}

      {selected && (
        <>
          <div className={styles.divider} />
          <div className={styles.group} style={{ flexWrap: "wrap" }}>
            {selectedControls}
          </div>
        </>
      )}

      <div className={styles.spacer} />

      <button
        className={styles.btn}
        onClick={onPreview}
        title="Aperçu et téléchargement"
      >
        <Eye size={ICON_SIZE} /> Aperçu
      </button>
    </div>
  );
}
