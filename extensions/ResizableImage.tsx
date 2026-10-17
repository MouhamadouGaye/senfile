"use client";

import Image from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  NodeViewProps,
} from "@tiptap/react";
import { useRef, useState } from "react";
import { X } from "lucide-react";
import styles from "./resizable-image.module.css";

export const ResizableImage = Image.extend({
  inline: false,
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),

      /**
       * Largeur réelle de l'image en pixels.
       *
       * IMPORTANT :
       * On stocke un nombre et non "63.4%" ou "500px".
       * Le backend PDF peut ainsi faire directement des calculs
       * numériques avec cette valeur.
       */
      width: {
        default: null,

        parseHTML: (el) => {
          const dataWidth = el.getAttribute("data-width");

          if (dataWidth) {
            const numeric = parseFloat(dataWidth);

            if (Number.isFinite(numeric)) {
              return numeric;
            }
          }

          const style = el.getAttribute("style") || "";
          const match = style.match(/width\s*:\s*([^;]+)/i);

          if (!match) {
            return null;
          }

          const numeric = parseFloat(match[1]);

          return Number.isFinite(numeric) ? numeric : null;
        },

        renderHTML: (attrs) => {
          if (
            attrs.width === null ||
            attrs.width === undefined ||
            !Number.isFinite(Number(attrs.width))
          ) {
            return {};
          }

          const width = Math.round(Number(attrs.width));

          return {
            "data-width": String(width),
            style: `width: ${width}px; max-width: 100%; height: auto;`,
          };
        },
      },

      /**
       * Alignement de l'image lorsqu'elle est flottante.
       */
      align: {
        default: null,

        parseHTML: (el) => {
          return el.getAttribute("data-align") || null;
        },

        renderHTML: (attrs) => {
          return attrs.align
            ? {
                "data-align": attrs.align,
              }
            : {};
        },
      },

      /**
       * Hauteur optionnelle.
       *
       * On ne l'utilise pas obligatoirement pendant le resize,
       * mais on la garde numérique pour éviter les mêmes problèmes
       * côté backend.
       */
      height: {
        default: null,

        parseHTML: (el) => {
          const dataHeight = el.getAttribute("data-height");

          if (!dataHeight) {
            return null;
          }

          const numeric = parseFloat(dataHeight);

          return Number.isFinite(numeric) ? numeric : null;
        },

        renderHTML: (attrs) => {
          if (
            attrs.height === null ||
            attrs.height === undefined ||
            !Number.isFinite(Number(attrs.height))
          ) {
            return {};
          }

          const height = Math.round(Number(attrs.height));

          return {
            "data-height": String(height),
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

type Corner = "tl" | "tr" | "bl" | "br";

function ResizableImageView({
  node,
  updateAttributes,
  selected,
  deleteNode,
}: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const rafRef = useRef<number | null>(null);

  const resizeCleanupRef = useRef<(() => void) | null>(null);

  const [resizing, setResizing] = useState(false);

  /**
   * Nettoyage du requestAnimationFrame précédent.
   */
  function cancelScheduledUpdate() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  /**
   * Met à jour uniquement le DOM pendant le resize.
   *
   * On évite de faire updateAttributes() à chaque mouvement de souris,
   * ce qui provoquerait énormément de transactions ProseMirror.
   */
  function scheduleVisualUpdate(width: number) {
    cancelScheduledUpdate();

    rafRef.current = requestAnimationFrame(() => {
      const wrapper = wrapperRef.current;

      if (wrapper) {
        wrapper.style.width = `${width}px`;
      }

      rafRef.current = null;
    });
  }

  /**
   * Arrête proprement un éventuel resize en cours.
   */
  function cleanupResize() {
    if (resizeCleanupRef.current) {
      resizeCleanupRef.current();
      resizeCleanupRef.current = null;
    }

    cancelScheduledUpdate();

    document.body.style.userSelect = "";
    document.body.style.cursor = "";

    setResizing(false);
  }

  /**
   * Démarre le redimensionnement depuis une poignée.
   */
  function startResize(e: React.MouseEvent<HTMLSpanElement>, corner: Corner) {
    e.preventDefault();
    e.stopPropagation();

    /**
     * Sécurité supplémentaire :
     * on empêche explicitement le drag de l'éditeur de commencer.
     */
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation?.();
    }

    cleanupResize();

    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    setResizing(true);

    /**
     * ------------------------------------------------------------
     * 1. Détermination de l'alignement
     * ------------------------------------------------------------
     *
     * Coins gauche :
     *   → l'image est ancrée à droite
     *
     * Coins droit :
     *   → l'image est ancrée à gauche
     */
    const isLeftCorner = corner === "tl" || corner === "bl";
    const isRightCorner = corner === "tr" || corner === "br";

    const wantedAlign: "left" | "right" = isLeftCorner ? "right" : "left";

    if (node.attrs.align !== wantedAlign) {
      updateAttributes({
        align: wantedAlign,
      });
    }

    /**
     * On attend deux frames pour laisser TipTap/React appliquer
     * le changement d'alignement avant de mesurer le DOM.
     */
    const measure = () => {
      const currentWrapper = wrapperRef.current;

      if (!currentWrapper) {
        cleanupResize();
        return;
      }

      const startX = e.clientX;

      /**
       * Largeur actuelle en pixels.
       */
      const startWidth = currentWrapper.offsetWidth;

      /**
       * Parent dans lequel l'image est contenue.
       */
      const parent = currentWrapper.parentElement;

      /**
       * Largeur maximale disponible.
       *
       * clientWidth évite de compter les bordures.
       */
      const parentWidth = parent?.clientWidth || startWidth;

      /**
       * Limites du resize.
       */
      const MIN_WIDTH = 40;
      const MAX_WIDTH = Math.max(MIN_WIDTH, parentWidth);

      /**
       * Sens du resize.
       *
       * Coin droit :
       *   souris vers droite = agrandir
       *   souris vers gauche = réduire
       *
       * Coin gauche :
       *   souris vers gauche = agrandir
       *   souris vers droite = réduire
       */
      const signX = isRightCorner ? 1 : -1;

      let finalWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth));

      /**
       * Curseur correspondant au coin.
       */
      const cursor =
        corner === "tl" || corner === "br" ? "nwse-resize" : "nesw-resize";

      document.body.style.userSelect = "none";
      document.body.style.cursor = cursor;

      /**
       * ------------------------------------------------------------
       * Mouse move
       * ------------------------------------------------------------
       */
      function onMove(ev: MouseEvent) {
        ev.preventDefault();

        const deltaX = (ev.clientX - startX) * signX;

        finalWidth = Math.max(
          MIN_WIDTH,
          Math.min(MAX_WIDTH, startWidth + deltaX),
        );

        scheduleVisualUpdate(finalWidth);
      }

      /**
       * ------------------------------------------------------------
       * Mouse up
       * ------------------------------------------------------------
       *
       * On fait UNE SEULE transaction TipTap à la fin.
       */
      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);

        resizeCleanupRef.current = null;

        cancelScheduledUpdate();

        document.body.style.userSelect = "";
        document.body.style.cursor = "";

        setResizing(false);

        /**
         * Stockage numérique en pixels.
         *
         * IMPORTANT :
         * surtout pas `${finalWidth}%`.
         */
        updateAttributes({
          width: Math.round(finalWidth),
        });
      }

      window.addEventListener("mousemove", onMove, {
        passive: false,
      });

      window.addEventListener("mouseup", onUp);

      /**
       * Permet de supprimer les listeners si React démonte
       * le NodeView pendant le resize.
       */
      resizeCleanupRef.current = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(measure);
    });
  }

  /**
   * Remet l'image dans le flux normal.
   */
  function clearAlign() {
    updateAttributes({
      align: null,
    });
  }

  /**
   * ------------------------------------------------------------
   * Largeur affichée
   * ------------------------------------------------------------
   *
   * Ancien comportement :
   *   width = "63.4%"
   *
   * Nouveau comportement :
   *   width = 634
   *
   * On transforme donc le nombre en "634px".
   */
  const numericWidth = Number(node.attrs.width);

  const width =
    Number.isFinite(numericWidth) && numericWidth > 0
      ? `${numericWidth}px`
      : node.attrs.align
        ? "40%"
        : "100%";

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`${styles.wrapper} ${
        selected ? styles.selected : ""
      } ${resizing ? styles.resizing : ""}`}
      style={{
        width,
      }}
      data-type="resizable-image"
      data-align={node.attrs.align || undefined}
      data-drag-handle
      /**
       * IMPORTANT :
       *
       * On intercepte uniquement les poignées.
       *
       * Le wrapper lui-même ne possède PAS
       * data-resize-handle.
       */
      onMouseDownCapture={(e: React.MouseEvent<HTMLDivElement>) => {
        const target: HTMLElement = e.target as HTMLElement;

        const handle: HTMLElement | null = target.closest(
          "[data-resize-handle='true']",
        ) as HTMLElement | null;

        if (!handle) {
          return;
        }

        const corner: Corner | null = handle.getAttribute(
          "data-handle",
        ) as Corner | null;

        if (!corner) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        e.nativeEvent.stopImmediatePropagation?.();

        startResize(e as React.MouseEvent<HTMLSpanElement>, corner);
      }}
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        className={styles.img}
        draggable={false}
      />

      {selected && (
        <>
          {/* -------------------------------------------------- */}
          {/* Bouton suppression                                  */}
          {/* -------------------------------------------------- */}

          <button
            type="button"
            className={styles.deleteBtn}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNode();
            }}
            aria-label="Supprimer"
            title="Supprimer"
          >
            <X size={13} />
          </button>

          {/* -------------------------------------------------- */}
          {/* Bouton alignement                                   */}
          {/* -------------------------------------------------- */}

          {node.attrs.align && (
            <button
              type="button"
              className={styles.floatBtn}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearAlign();
              }}
              title="Remettre dans le flux"
            >
              ⏺
            </button>
          )}

          {/* -------------------------------------------------- */}
          {/* Poignée TOP LEFT                                    */}
          {/* -------------------------------------------------- */}

          <span
            className={`${styles.handle} ${styles.handleTL}`}
            data-handle="tl"
            data-resize-handle="true"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize(e, "tl");
            }}
          />

          {/* -------------------------------------------------- */}
          {/* Poignée TOP RIGHT                                   */}
          {/* -------------------------------------------------- */}

          <span
            className={`${styles.handle} ${styles.handleTR}`}
            data-handle="tr"
            data-resize-handle="true"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize(e, "tr");
            }}
          />

          {/* -------------------------------------------------- */}
          {/* Poignée BOTTOM LEFT                                 */}
          {/* -------------------------------------------------- */}

          <span
            className={`${styles.handle} ${styles.handleBL}`}
            data-handle="bl"
            data-resize-handle="true"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize(e, "bl");
            }}
          />

          {/* -------------------------------------------------- */}
          {/* Poignée BOTTOM RIGHT                                */}
          {/* -------------------------------------------------- */}

          <span
            className={`${styles.handle} ${styles.handleBR}`}
            data-handle="br"
            data-resize-handle="true"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize(e, "br");
            }}
          />
        </>
      )}
    </NodeViewWrapper>
  );
}
