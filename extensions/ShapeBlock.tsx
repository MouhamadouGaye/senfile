// "use client";

// import { Node, mergeAttributes } from "@tiptap/core";
// import {
//   NodeViewWrapper,
//   NodeViewContent,
//   ReactNodeViewRenderer,
//   NodeViewProps,
// } from "@tiptap/react";
// import { useRef } from "react";
// import { Move, RotateCw, X } from "lucide-react";
// import { clampToContainer, findPositionedAncestor } from "@/lib/utils";
// import styles from "./shape-block.module.css";

// export type ShapeType = "rectangle" | "square" | "circle";

// /**
//  * Position libre par défaut, avec un léger décalage aléatoire pour que deux
//  * formes insérées à la suite ne se superposent pas exactement.
//  */
// export function defaultShapeAttrs(
//   shapeType: ShapeType,
//   x?: number,
//   y?: number,
// ) {
//   const posX = x ?? 60 + Math.round(Math.random() * 100);
//   const posY = y ?? 60 + Math.round(Math.random() * 100);
//   if (shapeType === "rectangle") {
//     return {
//       shapeType,
//       x: posX,
//       y: posY,
//       width: 220,
//       height: null, // grandit automatiquement avec le texte
//       rotation: 0,
//       fill: "transparent",
//       borderColor: "#4b3f72",
//     };
//   }
//   const size = 130;
//   return {
//     shapeType,
//     x: posX,
//     y: posY,
//     width: size,
//     height: size,
//     rotation: 0,
//     fill: "transparent",
//     borderColor: "#4b3f72",
//   };
// }

// /**
//  * Nœud "forme" en position LIBRE sur la page (comme un autocollant).
//  *
//  * Interaction, calquée sur les outils de design (Figma/Canva/PowerPoint) :
//  *  - Un premier clic n'importe où sur la forme (même sur le texte) la
//  *    sélectionne ET permet de la glisser immédiatement.
//  *  - Une fois sélectionnée, cliquer à nouveau sur le texte place le
//  *    curseur pour écrire (le déplacement se fait alors via la poignée ⠿
//  *    dédiée, toujours disponible, pour ne jamais entrer en conflit avec
//  *    l'écriture).
//  * Le déplacement/redimensionnement/rotation manipule directement le style
//  * DOM pendant le geste (aucune transaction ProseMirror par pixel), pour un
//  * glissement très léger ; la position finale n'est enregistrée qu'au
//  * relâchement de la souris.
//  */
// export const ShapeBlock = Node.create({
//   name: "shapeBlock",
//   group: "block",
//   content: "inline*",
//   selectable: true,

//   addAttributes() {
//     return {
//       shapeType: { default: "rectangle" },
//       x: { default: 80 },
//       y: { default: 80 },
//       width: { default: 220 },
//       height: { default: null },
//       rotation: { default: 0 },
//       fill: { default: "transparent" },
//       borderColor: { default: "#4b3f72" },
//     };
//   },

//   parseHTML() {
//     return [{ tag: 'div[data-type="shape-block"]' }];
//   },

//   renderHTML({ HTMLAttributes }) {
//     return [
//       "div",
//       mergeAttributes(HTMLAttributes, { "data-type": "shape-block" }),
//       0,
//     ];
//   },

//   addNodeView() {
//     return ReactNodeViewRenderer(ShapeBlockView);
//   },

//   addKeyboardShortcuts() {
//     const insertLineBreak = () => {
//       if (this.editor.isActive(this.name)) {
//         return this.editor.commands.insertContent({ type: "hardBreak" });
//       }
//       return false;
//     };
//     return {
//       Enter: insertLineBreak,
//       "Shift-Enter": insertLineBreak,
//     };
//   },
// });

// type Corner = "nw" | "ne" | "sw" | "se";

// function ShapeBlockView({
//   node,
//   updateAttributes,
//   selected,
//   deleteNode,
//   editor,
//   getPos,
// }: NodeViewProps) {
//   const wrapperRef = useRef<HTMLDivElement>(null);
//   const boxRef = useRef<HTMLDivElement>(null);
//   const rafRef = useRef<number | null>(null);

//   function selectSelf() {
//     if (typeof getPos === "function") {
//       const pos = getPos();
//       if (typeof pos === "number") editor.commands.setNodeSelection(pos);
//     }
//   }

//   function scheduleVisualUpdate(apply: () => void) {
//     if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
//     rafRef.current = requestAnimationFrame(() => {
//       apply();
//       rafRef.current = null;
//     });
//   }

//   function runDrag(e: React.MouseEvent) {
//     e.preventDefault();
//     e.stopPropagation();
//     selectSelf();

//     const startX = e.clientX;
//     const startY = e.clientY;
//     const startLeft = node.attrs.x ?? 0;
//     const startTop = node.attrs.y ?? 0;
//     const pageEl = findPositionedAncestor(wrapperRef.current);
//     let finalX = startLeft;
//     let finalY = startTop;

//     document.body.style.cursor = "grabbing";
//     document.body.style.userSelect = "none";

//     function onMove(ev: MouseEvent) {
//       let x = Math.round(startLeft + (ev.clientX - startX));
//       let y = Math.round(startTop + (ev.clientY - startY));
//       if (pageEl && boxRef.current) {
//         const clamped = clampToContainer(
//           x,
//           y,
//           boxRef.current.offsetWidth,
//           boxRef.current.offsetHeight,
//           pageEl,
//           {
//             growableHeight: true,
//           },
//         );
//         x = clamped.x;
//         y = clamped.y;
//       }
//       finalX = x;
//       finalY = y;
//       scheduleVisualUpdate(() => {
//         if (wrapperRef.current) {
//           wrapperRef.current.style.left = `${finalX}px`;
//           wrapperRef.current.style.top = `${finalY}px`;
//         }
//       });
//     }
//     function onUp() {
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseup", onUp);
//       document.body.style.cursor = "";
//       document.body.style.userSelect = "";
//       updateAttributes({ x: finalX, y: finalY });
//     }
//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseup", onUp);
//   }

//   function startBoxMouseDown(e: React.MouseEvent) {
//     const clickedContent = !!(e.target as HTMLElement).closest(
//       "[data-shape-content]",
//     );
//     // Déjà sélectionnée + clic sur le texte : on laisse le curseur se
//     // placer pour écrire (pas de déplacement). Dans tous les autres cas
//     // (première sélection, ou clic sur le cadre), on glisse.
//     if (clickedContent && selected) return;
//     runDrag(e);
//   }

//   function startResize(e: React.MouseEvent, corner: Corner) {
//     e.preventDefault();
//     e.stopPropagation();
//     const { shapeType } = node.attrs;
//     const startX = e.clientX;
//     const startY = e.clientY;
//     const rect = boxRef.current?.getBoundingClientRect();
//     const startW = node.attrs.width ?? rect?.width ?? 120;
//     const startH = node.attrs.height ?? rect?.height ?? 48;
//     const startLeft = node.attrs.x ?? 0;
//     const startTop = node.attrs.y ?? 0;

//     let finalW = startW;
//     let finalH = startH;
//     let finalX = startLeft;
//     let finalY = startTop;

//     document.body.style.userSelect = "none";

//     function onMove(ev: MouseEvent) {
//       const dx = ev.clientX - startX;
//       const dy = ev.clientY - startY;
//       let nextW = startW;
//       let nextH = startH;
//       let nextX = startLeft;
//       let nextY = startTop;
//       if (corner === "se") {
//         nextW = startW + dx;
//         nextH = startH + dy;
//       } else if (corner === "sw") {
//         nextW = startW - dx;
//         nextH = startH + dy;
//         nextX = startLeft + dx;
//       } else if (corner === "ne") {
//         nextW = startW + dx;
//         nextH = startH - dy;
//         nextY = startTop + dy;
//       } else {
//         nextW = startW - dx;
//         nextH = startH - dy;
//         nextX = startLeft + dx;
//         nextY = startTop + dy;
//       }
//       nextW = Math.max(48, nextW);
//       nextH = Math.max(48, nextH);
//       if (shapeType !== "rectangle") {
//         const size = Math.max(nextW, nextH);
//         nextW = size;
//         nextH = size;
//       }

//       // Empêche la forme de dépasser horizontalement le cadre de la page,
//       // quel que soit le coin tiré.
//       const pageEl = findPositionedAncestor(wrapperRef.current);
//       if (pageEl) {
//         const pageRect = pageEl.getBoundingClientRect();
//         const style = window.getComputedStyle(pageEl);
//         const paddingLeft = parseFloat(style.paddingLeft) || 0;
//         const paddingRight = parseFloat(style.paddingRight) || 0;
//         const contentWidth = pageRect.width - paddingLeft - paddingRight;
//         if (nextX < 0) {
//           nextW += nextX; // le bord gauche a été contraint, on réduit la largeur d'autant
//           nextX = 0;
//         }
//         if (nextX + nextW > contentWidth) {
//           nextW = Math.max(48, contentWidth - nextX);
//         }
//         nextY = Math.max(0, nextY);
//       }

//       finalW = Math.round(nextW);
//       finalH = Math.round(nextH);
//       finalX = Math.round(nextX);
//       finalY = Math.round(nextY);

//       scheduleVisualUpdate(() => {
//         if (boxRef.current) {
//           boxRef.current.style.width = `${finalW}px`;
//           boxRef.current.style.height = `${finalH}px`;
//         }
//         if (wrapperRef.current) {
//           wrapperRef.current.style.left = `${finalX}px`;
//           wrapperRef.current.style.top = `${finalY}px`;
//         }
//       });
//     }
//     function onUp() {
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseup", onUp);
//       document.body.style.userSelect = "";
//       updateAttributes({ width: finalW, height: finalH, x: finalX, y: finalY });
//     }
//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseup", onUp);
//   }

//   function startRotate(e: React.MouseEvent) {
//     e.preventDefault();
//     e.stopPropagation();
//     const box = boxRef.current;
//     if (!box) return;
//     const rect = box.getBoundingClientRect();
//     const centerX = rect.left + rect.width / 2;
//     const centerY = rect.top + rect.height / 2;
//     let finalRotation = node.attrs.rotation ?? 0;

//     document.body.style.userSelect = "none";

//     function angleFromEvent(ev: MouseEvent) {
//       const dx = ev.clientX - centerX;
//       const dy = ev.clientY - centerY;
//       return Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90);
//     }
//     function onMove(ev: MouseEvent) {
//       finalRotation = angleFromEvent(ev);
//       scheduleVisualUpdate(() => {
//         if (boxRef.current)
//           boxRef.current.style.transform = `rotate(${finalRotation}deg)`;
//       });
//     }
//     function onUp() {
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseup", onUp);
//       document.body.style.userSelect = "";
//       updateAttributes({ rotation: finalRotation });
//     }
//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseup", onUp);
//   }

//   const { shapeType, width, height, rotation, fill, borderColor, x, y } =
//     node.attrs;
//   const counterRotate = `rotate(${-rotation}deg)`;

//   return (
//     <NodeViewWrapper
//       ref={wrapperRef}
//       className={styles.wrapper}
//       style={{ left: x ?? 0, top: y ?? 0, zIndex: selected ? 50 : 1 }}
//     >
//       <div
//         ref={boxRef}
//         className={styles.box}
//         data-shape={shapeType}
//         data-selected={selected || undefined}
//         style={{
//           width: width ?? undefined,
//           height: height ?? undefined,
//           background: fill,
//           borderColor,
//           transform: `rotate(${rotation}deg)`,
//         }}
//         onMouseDown={startBoxMouseDown}
//       >
//         <NodeViewContent data-shape-content className={styles.content} />

//         {selected && (
//           <>
//             <span
//               className={styles.moveHandle}
//               style={{ transform: counterRotate }}
//               onMouseDown={runDrag}
//               role="separator"
//               aria-label="Déplacer la forme"
//               title="Déplacer"
//             >
//               <Move size={12} />
//             </span>
//             <span
//               className={styles.rotateHandle}
//               style={{ transform: `translateX(-50%) ${counterRotate}` }}
//               onMouseDown={startRotate}
//               role="separator"
//               aria-label="Faire pivoter la forme"
//               title="Faire pivoter"
//             >
//               <RotateCw size={12} />
//             </span>
//             <button
//               className={styles.deleteBtn}
//               style={{ transform: counterRotate }}
//               onMouseDown={(e) => e.stopPropagation()}
//               onClick={() => deleteNode()}
//               aria-label="Supprimer la forme"
//               title="Supprimer"
//             >
//               <X size={13} />
//             </button>
//             {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
//               <span
//                 key={corner}
//                 className={styles.resize}
//                 data-corner={corner}
//                 style={{ transform: counterRotate }}
//                 onMouseDown={(e) => startResize(e, corner)}
//                 role="separator"
//                 aria-label="Redimensionner la forme"
//               />
//             ))}
//           </>
//         )}
//       </div>
//     </NodeViewWrapper>
//   );
// }
"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewRenderer,
  NodeViewProps,
} from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Move, RotateCw, X, BoxSelect } from "lucide-react";
import { clampToContainer, findPositionedAncestor } from "@/lib/utils";
import styles from "./shape-block.module.css";

export type ShapeType = "rectangle" | "square" | "circle";

export function defaultShapeAttrs(
  shapeType: ShapeType,
  x?: number,
  y?: number,
) {
  const posX = x ?? 60 + Math.round(Math.random() * 100);
  const posY = y ?? 60 + Math.round(Math.random() * 100);
  const common = {
    shapeType,
    x: posX,
    y: posY,
    rotation: 0,
    fill: "transparent",
    borderColor: "#4b3f72",
    textAlign: "center",
    hideBorder: false,
    radius: null as number | null,
  };
  if (shapeType === "rectangle") {
    return { ...common, width: 220, height: null };
  }
  return { ...common, width: 130, height: 130 };
}

/**
 * Forme à position libre sur la page.
 *  - 1er clic : sélectionne ET glisse. Clic suivant sur le texte : curseur.
 *  - Double-clic sur le cadre : masque / affiche la bordure pointillée.
 *  - Coins (rectangle / carré) : poignées d'arrondi ; Alt = redimensionner.
 *  - Cercle : les coins redimensionnent toujours.
 */
export const ShapeBlock = Node.create({
  name: "shapeBlock",
  group: "block",
  content: "inline*",
  selectable: true,

  addAttributes() {
    return {
      shapeType: { default: "rectangle" },
      x: { default: 80 },
      y: { default: 80 },
      width: { default: 220 },
      height: { default: null },
      rotation: { default: 0 },
      fill: { default: "transparent" },
      borderColor: { default: "#4b3f72" },
      textAlign: { default: "center" },
      hideBorder: { default: false },
      radius: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="shape-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "shape-block" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ShapeBlockView);
  },

  addKeyboardShortcuts() {
    const insertLineBreak = () => {
      if (this.editor.isActive(this.name)) {
        return this.editor.commands.insertContent({ type: "hardBreak" });
      }
      return false;
    };
    return {
      Enter: insertLineBreak,
      "Shift-Enter": insertLineBreak,
    };
  },
});

type Corner = "nw" | "ne" | "sw" | "se";

function ShapeBlockView({
  node,
  updateAttributes,
  selected,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [alt, setAlt] = useState(false);

  useEffect(() => {
    if (!selected) return;
    const down = (e: KeyboardEvent) => e.key === "Alt" && setAlt(true);
    const up = (e: KeyboardEvent) => e.key === "Alt" && setAlt(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      setAlt(false);
    };
  }, [selected]);

  const {
    shapeType,
    width,
    height,
    rotation,
    fill,
    borderColor,
    x,
    y,
    textAlign,
    hideBorder,
    radius,
  } = node.attrs;
  const radiusable = shapeType !== "circle";

  function selectSelf() {
    if (typeof getPos === "function") {
      const pos = getPos();
      if (typeof pos === "number") editor.commands.setNodeSelection(pos);
    }
  }

  function scheduleVisualUpdate(apply: () => void) {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      apply();
      rafRef.current = null;
    });
  }

  function runDrag(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    selectSelf();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = node.attrs.x ?? 0;
    const startTop = node.attrs.y ?? 0;
    const pageEl = findPositionedAncestor(wrapperRef.current);
    let finalX = startLeft;
    let finalY = startTop;
    let moved = false;

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      moved = true;
      let nx = Math.round(startLeft + (ev.clientX - startX));
      let ny = Math.round(startTop + (ev.clientY - startY));
      if (pageEl && boxRef.current) {
        const clamped = clampToContainer(
          nx,
          ny,
          boxRef.current.offsetWidth,
          boxRef.current.offsetHeight,
          pageEl,
          {
            growableHeight: true,
          },
        );
        nx = clamped.x;
        ny = clamped.y;
      }
      finalX = nx;
      finalY = ny;
      scheduleVisualUpdate(() => {
        if (wrapperRef.current) {
          wrapperRef.current.style.left = `${finalX}px`;
          wrapperRef.current.style.top = `${finalY}px`;
        }
      });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (moved) updateAttributes({ x: finalX, y: finalY });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startBoxMouseDown(e: React.MouseEvent) {
    const clickedContent = !!(e.target as HTMLElement).closest(
      "[data-shape-content]",
    );
    if (clickedContent && selected) return; // curseur dans le texte
    runDrag(e);
  }

  function onBoxDoubleClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-shape-content]")) return;
    updateAttributes({ hideBorder: !hideBorder });
  }

  function startResize(e: React.MouseEvent, corner: Corner) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = boxRef.current?.getBoundingClientRect();
    const startW = node.attrs.width ?? rect?.width ?? 120;
    const startH = node.attrs.height ?? rect?.height ?? 48;
    const startLeft = node.attrs.x ?? 0;
    const startTop = node.attrs.y ?? 0;

    let finalW = startW;
    let finalH = startH;
    let finalX = startLeft;
    let finalY = startTop;

    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let nextW = startW;
      let nextH = startH;
      let nextX = startLeft;
      let nextY = startTop;
      if (corner === "se") {
        nextW = startW + dx;
        nextH = startH + dy;
      } else if (corner === "sw") {
        nextW = startW - dx;
        nextH = startH + dy;
        nextX = startLeft + dx;
      } else if (corner === "ne") {
        nextW = startW + dx;
        nextH = startH - dy;
        nextY = startTop + dy;
      } else {
        nextW = startW - dx;
        nextH = startH - dy;
        nextX = startLeft + dx;
        nextY = startTop + dy;
      }
      nextW = Math.max(48, nextW);
      nextH = Math.max(48, nextH);
      if (shapeType === "circle" || shapeType === "square") {
        const size = Math.max(nextW, nextH);
        nextW = size;
        nextH = size;
      }

      // Bornes horizontales : celles de la page (même origine que le PDF).
      const pageEl = findPositionedAncestor(wrapperRef.current);
      if (pageEl) {
        const contentWidth = pageEl.clientWidth;
        if (nextX < 0) {
          nextW += nextX;
          nextX = 0;
        }
        if (nextX + nextW > contentWidth) {
          nextW = Math.max(48, contentWidth - nextX);
        }
        nextY = Math.max(0, nextY);
      }

      finalW = Math.round(nextW);
      finalH = Math.round(nextH);
      finalX = Math.round(nextX);
      finalY = Math.round(nextY);

      scheduleVisualUpdate(() => {
        if (boxRef.current) {
          boxRef.current.style.width = `${finalW}px`;
          boxRef.current.style.height = `${finalH}px`;
        }
        if (wrapperRef.current) {
          wrapperRef.current.style.left = `${finalX}px`;
          wrapperRef.current.style.top = `${finalY}px`;
        }
      });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      updateAttributes({ width: finalW, height: finalH, x: finalX, y: finalY });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startRadius(e: React.MouseEvent, corner: Corner) {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const start = node.attrs.radius ?? 10;
    const max =
      Math.min(
        boxRef.current?.offsetWidth ?? 100,
        boxRef.current?.offsetHeight ?? 100,
      ) / 2;
    let final = start;
    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      const d =
        corner === "nw"
          ? (dx + dy) / 2
          : corner === "ne"
            ? (-dx + dy) / 2
            : corner === "sw"
              ? (dx - dy) / 2
              : (-dx - dy) / 2;
      final = Math.round(Math.min(max, Math.max(0, start + d)));
      scheduleVisualUpdate(() => {
        if (boxRef.current) boxRef.current.style.borderRadius = `${final}px`;
      });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      updateAttributes({ radius: final });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startRotate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let finalRotation = node.attrs.rotation ?? 0;

    document.body.style.userSelect = "none";

    function angleFromEvent(ev: MouseEvent) {
      const dx = ev.clientX - centerX;
      const dy = ev.clientY - centerY;
      return Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90);
    }
    function onMove(ev: MouseEvent) {
      finalRotation = angleFromEvent(ev);
      scheduleVisualUpdate(() => {
        if (boxRef.current)
          boxRef.current.style.transform = `rotate(${finalRotation}deg)`;
      });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      updateAttributes({ rotation: finalRotation });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const counterRotate = `rotate(${-rotation}deg)`;

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={styles.wrapper}
      style={{ left: x ?? 0, top: y ?? 0, zIndex: selected ? 50 : 1 }}
    >
      <div
        ref={boxRef}
        className={styles.box}
        data-shape={shapeType}
        data-selected={selected || undefined}
        style={{
          width: width ?? undefined,
          height: height ?? undefined,
          background: fill,
          borderColor: hideBorder && !selected ? "transparent" : borderColor,
          borderRadius: radiusable && radius != null ? radius : undefined,
          transform: `rotate(${rotation}deg)`,
        }}
        onMouseDown={startBoxMouseDown}
        onDoubleClick={onBoxDoubleClick}
      >
        <NodeViewContent
          data-shape-content
          className={styles.content}
          style={{ textAlign }}
        />

        {selected && (
          <>
            <span
              className={styles.moveHandle}
              style={{ transform: counterRotate }}
              onMouseDown={runDrag}
              role="separator"
              aria-label="Déplacer la forme"
              title="Déplacer"
            >
              <Move size={12} />
            </span>
            <span
              className={styles.rotateHandle}
              style={{ transform: `translateX(-50%) ${counterRotate}` }}
              onMouseDown={startRotate}
              role="separator"
              aria-label="Faire pivoter la forme"
              title="Faire pivoter"
            >
              <RotateCw size={12} />
            </span>
            <span
              className={styles.rotateHandle}
              style={{
                left: "calc(50% + 34px)",
                transform: `translateX(-50%) ${counterRotate}`,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                updateAttributes({ hideBorder: !hideBorder });
              }}
              role="button"
              aria-label="Afficher ou masquer la bordure"
              title="Afficher / masquer la bordure"
            >
              <BoxSelect size={12} />
            </span>
            <button
              className={styles.deleteBtn}
              style={{ transform: counterRotate }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => deleteNode()}
              aria-label="Supprimer la forme"
              title="Supprimer"
            >
              <X size={13} />
            </button>
            {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => {
              const asRadius = radiusable && !alt;
              return (
                <span
                  key={corner}
                  className={asRadius ? styles.radiusHandle : styles.resize}
                  data-corner={corner}
                  style={{ transform: counterRotate }}
                  onMouseDown={(e) =>
                    radiusable && !e.altKey
                      ? startRadius(e, corner)
                      : startResize(e, corner)
                  }
                  title={
                    radiusable
                      ? "Arrondir les coins (Alt : redimensionner)"
                      : "Redimensionner"
                  }
                  role="separator"
                />
              );
            })}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
