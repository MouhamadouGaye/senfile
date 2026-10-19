import "./globals.css";
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const };
export const metadata = { title: "Sheetly", description: "Tableur et analyse de données" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
