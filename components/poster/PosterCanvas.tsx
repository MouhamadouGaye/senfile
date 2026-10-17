"use client";

import { forwardRef } from "react";
import { PosterElement } from "@/lib/api";
import ElementRenderer from "./ElementRenderer";
import styles from "./poster-canvas.module.css";

type Props = {
  width: number;
  height: number;
  scale: number;
  background: string;
  elements: PosterElement[];
  selectedId: string | null;
  siblings?: PosterElement[]; // ← ajoute cette ligne

  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<PosterElement>) => void;
  onDelete: (id: string) => void;
};

const PosterCanvas = forwardRef<HTMLDivElement, Props>(
  (
    {
      width,
      height,
      scale,
      background,
      elements,
      selectedId,
      siblings = [], // ← et cette ligne
      onSelect,
      onChange,
      onDelete,
    },
    ref,
  ) => {
    const hasCustomBackground = !!background && background !== "transparent";
    const canvasStyle: React.CSSProperties = hasCustomBackground
      ? {
          width,
          height,
          transform: `scale(${scale})`,
          backgroundColor: background,
        }
      : {
          width,
          height,
          transform: `scale(${scale})`,
          backgroundColor: "#ffffff",
          backgroundImage:
            "linear-gradient(45deg, #f0eee9 25%, transparent 25%), linear-gradient(-45deg, #f0eee9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0eee9 75%), linear-gradient(-45deg, transparent 75%, #f0eee9 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        };

    return (
      <div className={styles.wrap}>
        {/* Réserve la place réellement occupée à l'écran (dimensions mises à
            l'échelle), pour que la mise en page ne déborde pas sur mobile. */}
        <div
          className={styles.scaleContainer}
          style={{ width: width * scale, height: height * scale }}
        >
          <div
            ref={ref}
            className={styles.canvas}
            style={canvasStyle}
            onClick={() => onSelect(null)}
          >
            {[...elements]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => (
                // <ElementRenderer
                //   key={el.id}
                //   element={el}
                //   selected={el.id === selectedId}
                //   canvasWidth={width}
                //   canvasHeight={height}
                //   scale={scale}
                //   onSelect={() => onSelect(el.id)}
                //   onChange={(patch) => onChange(el.id, patch)}
                //   onDelete={() => onDelete(el.id)}
                // />
                <ElementRenderer
                  key={el.id}
                  element={el}
                  selected={el.id === selectedId}
                  canvasWidth={width}
                  canvasHeight={height}
                  scale={scale}
                  siblings={elements} /*  ←  nouvelle ligne  */
                  onSelect={() => onSelect(el.id)}
                  onChange={(patch) => onChange(el.id, patch)}
                  onDelete={() => onDelete(el.id)}
                />
              ))}
          </div>
        </div>
      </div>
    );
  },
);

PosterCanvas.displayName = "PosterCanvas";

export default PosterCanvas;
