import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const key = new PluginKey("tableRowResize");

/**
 * Le redimensionnement des colonnes est géré nativement par
 * @tiptap/extension-table (resizable: true). Cette extension ajoute
 * l'équivalent pour la hauteur des lignes : un attribut `rowHeight` sur
 * `tableRow`, ajusté en approchant la souris du bas d'une ligne (le
 * curseur devient ↕) puis en glissant.
 */
export const TableRowResize = Extension.create({
  name: "tableRowResize",

  addGlobalAttributes() {
    return [
      {
        types: ["tableRow"],
        attributes: {
          rowHeight: {
            default: null,
            parseHTML: (el) => {
              const h = (el as HTMLElement).style.height;
              return h ? parseInt(h, 10) : null;
            },
            renderHTML: (attrs) => (attrs.rowHeight ? { style: `height: ${attrs.rowHeight}px` } : {}),
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    let dragging: { rowEl: HTMLElement; startY: number; startHeight: number; pos: number } | null = null;

    return [
      new Plugin({
        key,
        props: {
          handleDOMEvents: {
            mousemove(_view, event) {
              if (dragging) return false;
              const target = (event.target as HTMLElement).closest("tr");
              if (!target) return false;
              const rect = target.getBoundingClientRect();
              const nearBottom = event.clientY > rect.bottom - 6 && event.clientY < rect.bottom + 6;
              (target as HTMLElement).style.cursor = nearBottom ? "row-resize" : "";
              (target as any)._nearBottom = nearBottom;
              return false;
            },
            mousedown(view, event) {
              const target = (event.target as HTMLElement).closest("tr") as HTMLElement | null;
              if (!target || !(target as any)._nearBottom) return false;
              event.preventDefault();

              const rect = target.getBoundingClientRect();
              const domPos = view.posAtDOM(target, 0);
              const $pos = view.state.doc.resolve(domPos);
              let rowPos: number | null = null;
              for (let d = $pos.depth; d > 0; d--) {
                if ($pos.node(d).type.name === "tableRow") {
                  rowPos = $pos.before(d);
                  break;
                }
              }
              if (rowPos === null) return false;

              dragging = { rowEl: target, startY: event.clientY, startHeight: rect.height, pos: rowPos };

              function onMove(ev: MouseEvent) {
                if (!dragging) return;
                const newHeight = Math.max(28, dragging.startHeight + (ev.clientY - dragging.startY));
                dragging.rowEl.style.height = `${newHeight}px`;
              }
              function onUp(ev: MouseEvent) {
                if (!dragging) return;
                const newHeight = Math.max(28, dragging.startHeight + (ev.clientY - dragging.startY));
                const { state, dispatch } = editor.view;
                const node = state.doc.nodeAt(dragging.pos);
                if (node) {
                  const tr = state.tr.setNodeMarkup(dragging.pos, undefined, {
                    ...node.attrs,
                    rowHeight: Math.round(newHeight),
                  });
                  dispatch(tr);
                }
                dragging = null;
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              }
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
              return true;
            },
          },
        },
      }),
    ];
  },
});
