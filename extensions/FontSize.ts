import { Extension } from "@tiptap/core";

/**
 * Ajoute un attribut `fontSize` à la marque `textStyle` (fournie par
 * @tiptap/extension-text-style, déjà utilisée pour la couleur du texte).
 * Fournit les commandes setFontSize / unsetFontSize, pilotées par les
 * boutons A−/A+ et le sélecteur de taille dans la barre d'outils.
 */
export const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});
