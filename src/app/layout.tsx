import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Garago — Comparez les garages, réservez au meilleur prix",
  description:
    "Trouvez le meilleur garage pour votre véhicule exact au Canada. Filtrez par marque, modèle, finition, service et disponibilité. Avis vérifiés, prix transparents.",
  keywords: ["garage", "mécanique", "Québec", "pneus", "entretien", "réparation auto", "vidange", "freins"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Viewport mobile — viewport-fit=cover pour les encoches iOS/Android */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* PWA / Add to Home Screen */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Garago" />
        <meta name="theme-color" content="#0b1f3a" />
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
