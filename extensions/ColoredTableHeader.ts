import TableHeader from "@tiptap/extension-table-header";

/** Même principe que ColoredTableCell, pour les cellules d'en-tête. */
export const ColoredTableHeader = TableHeader.extend({
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
