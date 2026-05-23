import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "GarageQC — Comparez les garages, réservez au meilleur prix",
  description:
    "Trouvez le meilleur garage pour votre véhicule exact au Québec. Filtrez par marque, modèle, finition, service et disponibilité. Avis vérifiés, prix transparents.",
  keywords: ["garage", "mécanique", "Québec", "pneus", "entretien", "réparation auto", "vidange", "freins"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
          backgroundColor: "#f8fafc",
        }}
      >
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
