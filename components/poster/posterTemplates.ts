import { PosterElement } from "@/lib/api";

export type PosterTemplate = {
  id: string;
  name: string;
  category: string;
  accent: string;
  elements: PosterElement[];
};

let uidCounter = 0;
function uid() {
  uidCounter += 1;
  return `tpl-${uidCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

// Images de secours aléatoires mais modifiables (l'utilisateur peut
// remplacer chaque image via le panneau de calques / la barre d'outils).
// picsum.photos sert de vraies photos, avec une graine stable par modèle.
function seedImage(seed: string, w = 500, h = 650) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

function el(partial: Partial<PosterElement> & Pick<PosterElement, "type" | "x" | "y" | "width" | "height">): PosterElement {
  return {
    id: uid(),
    rotation: 0,
    zIndex: 1,
    ...partial,
  } as PosterElement;
}

export const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: "evenement-moderne",
    name: "Événement moderne",
    category: "Événement",
    accent: "#4b3f72",
    elements: [
      el({ type: "image", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, src: seedImage("event-1", 800, 1100) }),
      el({ type: "shape", x: 0, y: 780, width: 800, height: 320, zIndex: 2, shapeType: "rectangle", fill: "rgba(28,27,34,0.72)", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 60, y: 820, width: 680, height: 90, zIndex: 3, text: "SOIRÉE DE LANCEMENT", fontFamily: "Poppins, sans-serif", fontSize: 46, fontWeight: 700, color: "#ffffff", align: "left" }),
      el({ type: "text", x: 60, y: 920, width: 680, height: 60, zIndex: 3, text: "Vendredi 12 juin · 20h · Paris", fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 500, color: "#e8e4fb", align: "left" }),
    ],
  },
  {
    id: "promo-vente",
    name: "Grande vente",
    category: "Promotion",
    accent: "#a13d3d",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#a13d3d", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 80, y: 380, width: 640, height: 220, zIndex: 2, text: "-50%", fontFamily: "Poppins, sans-serif", fontSize: 160, fontWeight: 700, color: "#ffffff", align: "center" }),
      el({ type: "text", x: 80, y: 600, width: 640, height: 60, zIndex: 2, text: "SUR TOUTE LA COLLECTION", fontFamily: "Montserrat, sans-serif", fontSize: 28, fontWeight: 600, color: "#ffffff", align: "center", letterSpacing: 2 }),
      el({ type: "shape", x: 300, y: 700, width: 200, height: 60, zIndex: 2, shapeType: "rectangle", fill: "#ffffff", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 300, y: 712, width: 200, height: 36, zIndex: 3, text: "J'EN PROFITE", fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 700, color: "#a13d3d", align: "center" }),
    ],
  },
  {
    id: "citation-motivante",
    name: "Citation inspirante",
    category: "Motivation",
    accent: "#b8902e",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#f6ecd6", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 100, y: 420, width: 600, height: 220, zIndex: 2, text: "« Le succès, c'est se lever un peu plus souvent qu'on ne tombe. »", fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 600, color: "#4b3f72", align: "center" }),
      el({ type: "text", x: 100, y: 660, width: 600, height: 40, zIndex: 2, text: "— Anonyme", fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 400, color: "#b8902e", align: "center" }),
    ],
  },
  {
    id: "lancement-produit",
    name: "Lancement produit",
    category: "Produit",
    accent: "#2e6b52",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#eaf3ee", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "image", x: 150, y: 120, width: 500, height: 500, zIndex: 2, src: seedImage("product-1", 500, 500) }),
      el({ type: "text", x: 80, y: 680, width: 640, height: 70, zIndex: 3, text: "NOUVEAU", fontFamily: "Poppins, sans-serif", fontSize: 24, fontWeight: 700, color: "#2e6b52", align: "center", letterSpacing: 3 }),
      el({ type: "text", x: 80, y: 740, width: 640, height: 80, zIndex: 3, text: "Découvrez notre dernière création", fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 600, color: "#1c1b22", align: "center" }),
    ],
  },
  {
    id: "anniversaire-fete",
    name: "Fête d'anniversaire",
    category: "Fête",
    accent: "#4b3f72",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#ece9f6", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "shape", x: 250, y: 150, width: 300, height: 300, zIndex: 2, shapeType: "circle", fill: "#b8902e", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 100, y: 500, width: 600, height: 80, zIndex: 3, text: "JOYEUX ANNIVERSAIRE", fontFamily: "Poppins, sans-serif", fontSize: 40, fontWeight: 700, color: "#4b3f72", align: "center" }),
      el({ type: "text", x: 100, y: 590, width: 600, height: 50, zIndex: 3, text: "Samedi 20 juillet · 18h", fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 500, color: "#1c1b22", align: "center" }),
      el({ type: "shape", x: 380, y: 700, width: 40, height: 40, zIndex: 2, shapeType: "circle", fill: "#a13d3d", borderColor: "transparent", borderWidth: 0 }),
    ],
  },
  {
    id: "webinaire-pro",
    name: "Webinaire professionnel",
    category: "Business",
    accent: "#3a5a78",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#1c1b22", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 80, y: 150, width: 640, height: 40, zIndex: 2, text: "WEBINAIRE GRATUIT", fontFamily: "Montserrat, sans-serif", fontSize: 18, fontWeight: 700, color: "#b8902e", align: "left", letterSpacing: 3 }),
      el({ type: "text", x: 80, y: 220, width: 640, height: 200, zIndex: 2, text: "Construire une marque qui dure", fontFamily: "'Playfair Display', serif", fontSize: 46, fontWeight: 700, color: "#ffffff", align: "left" }),
      el({ type: "image", x: 80, y: 480, width: 640, height: 380, zIndex: 2, src: seedImage("webinar-1", 640, 380) }),
      el({ type: "text", x: 80, y: 900, width: 640, height: 40, zIndex: 2, text: "Mardi 15 octobre · 14h · En ligne", fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 500, color: "#e8e4fb", align: "left" }),
    ],
  },
  {
    id: "menu-restaurant",
    name: "Menu du jour",
    category: "Restaurant",
    accent: "#a13d3d",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#fbf8f3", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 80, y: 90, width: 640, height: 60, zIndex: 2, text: "MENU DU JOUR", fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: "#1c1b22", align: "center" }),
      el({ type: "shape", x: 320, y: 170, width: 160, height: 3, zIndex: 2, shapeType: "line", borderColor: "#a13d3d", borderWidth: 3, fill: "transparent" }),
      el({ type: "image", x: 200, y: 220, width: 400, height: 300, zIndex: 2, src: seedImage("food-1", 400, 300) }),
      el({ type: "text", x: 100, y: 570, width: 600, height: 240, zIndex: 2, text: "Entrée · Velouté de saison\nPlat · Poisson grillé, légumes rôtis\nDessert · Tarte fine aux fruits", fontFamily: "Merriweather, serif", fontSize: 20, fontWeight: 400, color: "#1c1b22", align: "center" }),
    ],
  },
  {
    id: "immobilier-annonce",
    name: "Annonce immobilière",
    category: "Immobilier",
    accent: "#2e6b52",
    elements: [
      el({ type: "image", x: 0, y: 0, width: 800, height: 650, zIndex: 1, src: seedImage("realestate-1", 800, 650) }),
      el({ type: "shape", x: 0, y: 650, width: 800, height: 450, zIndex: 1, shapeType: "rectangle", fill: "#ffffff", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 60, y: 690, width: 680, height: 60, zIndex: 2, text: "MAISON À VENDRE", fontFamily: "Montserrat, sans-serif", fontSize: 30, fontWeight: 700, color: "#2e6b52", align: "left" }),
      el({ type: "text", x: 60, y: 750, width: 680, height: 100, zIndex: 2, text: "4 pièces · 120m² · Jardin · Proche centre-ville", fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 400, color: "#1c1b22", align: "left" }),
      el({ type: "text", x: 60, y: 900, width: 680, height: 60, zIndex: 2, text: "285 000 €", fontFamily: "Poppins, sans-serif", fontSize: 38, fontWeight: 700, color: "#1c1b22", align: "left" }),
    ],
  },
  {
    id: "cours-fitness",
    name: "Cours de fitness",
    category: "Sport",
    accent: "#1c1b22",
    elements: [
      el({ type: "image", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, src: seedImage("fitness-1", 800, 1100) }),
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 2, shapeType: "rectangle", fill: "rgba(28,27,34,0.45)", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 60, y: 850, width: 680, height: 90, zIndex: 3, text: "BOOTCAMP INTENSIF", fontFamily: "Poppins, sans-serif", fontSize: 44, fontWeight: 700, color: "#ffffff", align: "left" }),
      el({ type: "text", x: 60, y: 950, width: 680, height: 50, zIndex: 3, text: "6 semaines · Tous niveaux", fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 500, color: "#ffffff", align: "left" }),
    ],
  },
  {
    id: "concert-musique",
    name: "Concert live",
    category: "Musique",
    accent: "#4b3f72",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#14131a", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "image", x: 100, y: 100, width: 600, height: 600, zIndex: 2, src: seedImage("concert-1", 600, 600) }),
      el({ type: "text", x: 60, y: 740, width: 680, height: 90, zIndex: 3, text: "LIVE ON STAGE", fontFamily: "Poppins, sans-serif", fontSize: 48, fontWeight: 700, color: "#ffffff", align: "center", letterSpacing: -1 }),
      el({ type: "text", x: 60, y: 850, width: 680, height: 50, zIndex: 3, text: "23 novembre · Zénith · 20h30", fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 500, color: "#b8902e", align: "center" }),
    ],
  },
  {
    id: "faire-part-mariage",
    name: "Faire-part de mariage",
    category: "Mariage",
    accent: "#b8902e",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#fdf8f0", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 100, y: 380, width: 600, height: 60, zIndex: 2, text: "Emma & Lucas", fontFamily: "'Playfair Display', serif", fontSize: 46, fontWeight: 600, color: "#1c1b22", align: "center" }),
      el({ type: "shape", x: 340, y: 460, width: 120, height: 2, zIndex: 2, shapeType: "line", borderColor: "#b8902e", borderWidth: 2, fill: "transparent" }),
      el({ type: "text", x: 100, y: 500, width: 600, height: 40, zIndex: 2, text: "SE DISENT OUI", fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 600, color: "#b8902e", align: "center", letterSpacing: 4 }),
      el({ type: "text", x: 100, y: 600, width: 600, height: 50, zIndex: 2, text: "14 septembre 2027 · Château de Vaux", fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 400, color: "#1c1b22", align: "center" }),
    ],
  },
  {
    id: "offre-emploi",
    name: "Offre d'emploi",
    category: "Recrutement",
    accent: "#3a5a78",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#eef4f8", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 80, y: 140, width: 640, height: 40, zIndex: 2, text: "ON RECRUTE", fontFamily: "Montserrat, sans-serif", fontSize: 18, fontWeight: 700, color: "#3a5a78", align: "left", letterSpacing: 3 }),
      el({ type: "text", x: 80, y: 200, width: 640, height: 130, zIndex: 2, text: "Développeur Frontend Senior", fontFamily: "Poppins, sans-serif", fontSize: 40, fontWeight: 700, color: "#1c1b22", align: "left" }),
      el({ type: "image", x: 80, y: 400, width: 640, height: 380, zIndex: 2, src: seedImage("job-1", 640, 380) }),
      el({ type: "text", x: 80, y: 820, width: 640, height: 40, zIndex: 2, text: "CDI · Paris ou télétravail · Envoyez-nous votre CV", fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 500, color: "#1c1b22", align: "left" }),
    ],
  },
  {
    id: "atelier-formation",
    name: "Atelier / formation",
    category: "Formation",
    accent: "#2e6b52",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#2e6b52", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "shape", x: 60, y: 60, width: 680, height: 980, zIndex: 2, shapeType: "rectangle", fill: "transparent", borderColor: "#ffffff", borderWidth: 2 }),
      el({ type: "text", x: 120, y: 420, width: 560, height: 130, zIndex: 3, text: "ATELIER CRÉATIF", fontFamily: "Poppins, sans-serif", fontSize: 42, fontWeight: 700, color: "#ffffff", align: "center" }),
      el({ type: "text", x: 120, y: 560, width: 560, height: 60, zIndex: 3, text: "Apprenez à créer vos propres affiches", fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 400, color: "#eaf3ee", align: "center" }),
      el({ type: "text", x: 120, y: 660, width: 560, height: 40, zIndex: 3, text: "5 mai · 10h-16h · 12 places", fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 500, color: "#ffffff", align: "center" }),
    ],
  },
  {
    id: "nouvel-an",
    name: "Vœux du nouvel an",
    category: "Saisonnier",
    accent: "#4b3f72",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#1c1b22", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "shape", x: 300, y: 200, width: 200, height: 200, zIndex: 2, shapeType: "circle", fill: "#b8902e", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 100, y: 500, width: 600, height: 150, zIndex: 3, text: "2027", fontFamily: "'Playfair Display', serif", fontSize: 100, fontWeight: 700, color: "#ffffff", align: "center" }),
      el({ type: "text", x: 100, y: 660, width: 600, height: 50, zIndex: 3, text: "Belle et heureuse année", fontFamily: "Inter, sans-serif", fontSize: 22, fontWeight: 400, color: "#e8e4fb", align: "center" }),
    ],
  },
  {
    id: "minimaliste-typo",
    name: "Typographie minimaliste",
    category: "Minimaliste",
    accent: "#1c1b22",
    elements: [
      el({ type: "shape", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, shapeType: "rectangle", fill: "#ffffff", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 60, y: 460, width: 680, height: 200, zIndex: 2, text: "MOINS.\nMAIS MIEUX.", fontFamily: "Inter, sans-serif", fontSize: 64, fontWeight: 700, color: "#1c1b22", align: "left", letterSpacing: -1 }),
      el({ type: "shape", x: 60, y: 700, width: 80, height: 4, zIndex: 2, shapeType: "line", borderColor: "#1c1b22", borderWidth: 4, fill: "transparent" }),
    ],
  },
  {
    id: "portfolio-photo",
    name: "Couverture portfolio",
    category: "Photographie",
    accent: "#1c1b22",
    elements: [
      el({ type: "image", x: 0, y: 0, width: 800, height: 1100, zIndex: 1, src: seedImage("portfolio-1", 800, 1100) }),
      el({ type: "shape", x: 0, y: 900, width: 800, height: 200, zIndex: 2, shapeType: "rectangle", fill: "rgba(255,255,255,0.9)", borderColor: "transparent", borderWidth: 0 }),
      el({ type: "text", x: 60, y: 940, width: 680, height: 60, zIndex: 3, text: "PORTFOLIO 2027", fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 600, color: "#1c1b22", align: "left" }),
      el({ type: "text", x: 60, y: 1010, width: 680, height: 40, zIndex: 3, text: "Photographe indépendant", fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 400, color: "#4a4852", align: "left" }),
    ],
  },
];
