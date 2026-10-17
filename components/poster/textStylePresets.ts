export type TextStylePreset = {
  id: string;
  label: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  letterSpacing?: number;
};

// 20 styles couvrant des registres variés (éditorial, affiche, minimaliste,
// élégant, impact, technique…) à partir des polices déjà chargées dans
// l'application — chaque style applique famille + taille + graisse +
// espacement + couleur en un clic.
export const TEXT_STYLE_PRESETS: TextStylePreset[] = [
  { id: "impact-noir", label: "Impact", fontFamily: "Poppins, sans-serif", fontSize: 56, fontWeight: 700, color: "#1c1b22" },
  { id: "editorial-serif", label: "Éditorial", fontFamily: "'Source Serif 4', serif", fontSize: 40, fontWeight: 600, color: "#1c1b22" },
  { id: "elegant-italique", label: "Élégant", fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 600, color: "#4b3f72" },
  { id: "minimal-fin", label: "Minimaliste", fontFamily: "Inter, sans-serif", fontSize: 28, fontWeight: 400, color: "#1c1b22", letterSpacing: 1 },
  { id: "classique-livre", label: "Classique", fontFamily: "Merriweather, serif", fontSize: 32, fontWeight: 400, color: "#1c1b22" },
  { id: "moderne-gras", label: "Moderne", fontFamily: "Montserrat, sans-serif", fontSize: 44, fontWeight: 600, color: "#1c1b22" },
  { id: "doux-rond", label: "Doux", fontFamily: "Nunito, sans-serif", fontSize: 30, fontWeight: 600, color: "#4a4852" },
  { id: "affiche-large", label: "Affiche", fontFamily: "Poppins, sans-serif", fontSize: 72, fontWeight: 700, color: "#1c1b22", letterSpacing: -1 },
  { id: "technique-mono", label: "Technique", fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 600, color: "#1c1b22" },
  { id: "sobre-gris", label: "Sobre", fontFamily: "Roboto, sans-serif", fontSize: 26, fontWeight: 400, color: "#4a4852" },
  { id: "chaleureux", label: "Chaleureux", fontFamily: "Lato, sans-serif", fontSize: 34, fontWeight: 700, color: "#b8902e" },
  { id: "litteraire", label: "Littéraire", fontFamily: "'Libre Baskerville', serif", fontSize: 36, fontWeight: 400, color: "#1c1b22" },
  { id: "titre-dore", label: "Doré", fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 700, color: "#b8902e" },
  { id: "sous-titre", label: "Sous-titre", fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 500, color: "#4a4852", letterSpacing: 2 },
  { id: "citation", label: "Citation", fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 600, color: "#4b3f72" },
  { id: "prune-fort", label: "Prune", fontFamily: "Montserrat, sans-serif", fontSize: 38, fontWeight: 700, color: "#4b3f72" },
  { id: "vert-nature", label: "Nature", fontFamily: "Nunito, sans-serif", fontSize: 32, fontWeight: 700, color: "#2e6b52" },
  { id: "rouge-alerte", label: "Alerte", fontFamily: "Poppins, sans-serif", fontSize: 34, fontWeight: 700, color: "#a13d3d" },
  { id: "fine-majuscule", label: "Majuscules", fontFamily: "Lato, sans-serif", fontSize: 24, fontWeight: 700, color: "#1c1b22", letterSpacing: 3 },
  { id: "corps-lecture", label: "Lecture", fontFamily: "Merriweather, serif", fontSize: 18, fontWeight: 400, color: "#1c1b22" },
];

// Palette de couleurs de texte, claire → foncée, cohérente avec
// l'identité visuelle du reste de l'application.
export const TEXT_COLOR_PALETTE: string[] = (() => {
  const hues = [
    { h: 250, s: 15 }, // encre
    { h: 262, s: 38 }, // prune
    { h: 42, s: 60 }, // or
    { h: 6, s: 50 }, // rouge
    { h: 152, s: 32 }, // vert
    { h: 212, s: 48 }, // bleu
  ];
  const lightness = [82, 65, 50, 35, 20];
  const colors: string[] = ["#ffffff", "#000000"];
  for (const hue of hues) {
    for (const l of lightness) {
      colors.push(`hsl(${hue.h} ${hue.s}% ${l}%)`);
    }
  }
  return colors;
})();
