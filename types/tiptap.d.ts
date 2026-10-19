import "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      /** Applique une taille de police (ex: "18px") à la sélection */
      setFontSize: (size: string) => ReturnType;
      /** Retire la taille de police personnalisée de la sélection */
      unsetFontSize: () => ReturnType;
    };
  }
}
