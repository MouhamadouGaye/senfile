import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import FontFamily from "@tiptap/extension-font-family";
import { ColoredTableCell } from "@/extensions/ColoredTableCell";
import { ColoredTableHeader } from "@/extensions/ColoredTableHeader";
import { TableRowResize } from "@/extensions/TableRowResize";
import { FontSize } from "@/extensions/FontSize";
import { CommentMark } from "@/extensions/CommentMark";

export function getExtensions(withPlaceholder = false) {
  return [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Table.configure({ resizable: true }),
    TableRow,
    ColoredTableHeader,
    ColoredTableCell,
    TableRowResize,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Underline,
    TextStyle,
    Color,
    FontSize,
    FontFamily,
    CommentMark,
    Link.configure({ openOnClick: false }),
    ...(withPlaceholder
      ? [Placeholder.configure({ placeholder: "Commencez à écrire…" })]
      : []),
  ];
}
