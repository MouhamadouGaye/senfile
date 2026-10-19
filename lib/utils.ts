export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Remonte le DOM jusqu'au premier ancêtre en `position: relative` — c'est
 * le référentiel de coordonnées des éléments flottants (la page de
 * l'éditeur, ou le canvas d'une affiche). Utilisé pour calculer une
 * position d'insertion sensée et pour confiner le glissement au cadre.
 */
export function findPositionedAncestor(start: Element | null): HTMLElement | null {
  let node = start as HTMLElement | null;
  while (node) {
    if (window.getComputedStyle(node).position === "relative") return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Empêche un élément flottant de sortir visuellement de son conteneur
 * (page du document ou canvas d'affiche) pendant qu'on le glisse : la
 * position reste bornée à la zone de contenu, dans les deux sens
 * horizontal et vertical, tout en restant libre de se déplacer partout à
 * l'intérieur de ce cadre.
 */
export function clampToContainer(
  x: number,
  y: number,
  elWidth: number,
  elHeight: number,
  container: HTMLElement,
  options: { growableHeight?: boolean } = {}
): { x: number; y: number } {
  const rect = container.getBoundingClientRect();
  const style = window.getComputedStyle(container);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingBottom = parseFloat(style.paddingBottom) || 0;
  const contentWidth = rect.width - paddingLeft - paddingRight;
  const contentHeight = rect.height - paddingTop - paddingBottom;

  const maxX = Math.max(0, contentWidth - elWidth);
  // Document : la page grandit avec le texte déjà présent, on laisse donc
  // une marge basse généreuse plutôt que de bloquer pile à la hauteur
  // actuelle (qui varie sans cesse). Affiche : le canvas a une taille
  // fixe, on borne strictement pour que rien ne sorte du cadre.
  const maxY = options.growableHeight
    ? Math.max(0, contentHeight - elHeight + 4000)
    : Math.max(0, contentHeight - elHeight);

  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}
