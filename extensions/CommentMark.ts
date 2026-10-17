import { Mark, mergeAttributes } from "@tiptap/core";

export interface CommentMarkOptions {
  onClick?: (commentId: string) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commentMark: {
      setCommentMark: (commentId: string) => ReturnType;
      unsetCommentMarkById: (commentId: string) => ReturnType;
    };
  }
}

/**
 * Marque de texte appliquée à une portion commentée/suggérée. Rendue comme
 * un <span data-comment-id="..."> avec un léger surlignage doré ; le clic
 * ouvre/scrolle vers l'entrée correspondante dans le panneau de commentaires
 * (voir components/CommentsPanel.tsx, qui écoute un événement custom).
 */
export const CommentMark = Mark.create<CommentMarkOptions>({
  name: "commentMark",

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-comment-id"),
        renderHTML: (attrs) => (attrs.commentId ? { "data-comment-id": attrs.commentId } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: "comment-highlight" }),
      0,
    ];
  },

  addCommands() {
    return {
      setCommentMark:
        (commentId: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { commentId }).run();
        },
      unsetCommentMarkById:
        (commentId: string) =>
        ({ tr, state, dispatch }) => {
          state.doc.descendants((node, pos) => {
            node.marks.forEach((mark) => {
              if (mark.type.name === "commentMark" && mark.attrs.commentId === commentId) {
                tr.removeMark(pos, pos + node.nodeSize, mark.type);
              }
            });
          });
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});
