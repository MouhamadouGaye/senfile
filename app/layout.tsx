import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MGaye File — édition de documents",
  description:
    "Un éditeur de documents moderne : texte, images, tableaux, graphiques.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
