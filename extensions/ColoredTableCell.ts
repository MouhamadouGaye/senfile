import TableCell from "@tiptap/extension-table-cell";

/**
 * Étend la cellule de tableau standard avec une couleur de fond
 * personnalisable (appliquée via editor.commands.setCellAttribute).
 */
export const ColoredTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.backgroundColor || null,
        renderHTML: (attrs) =>
          attrs.backgroundColor
            ? { style: `background-color: ${attrs.backgroundColor}` }
            : {},
      },
    };
  },
});
