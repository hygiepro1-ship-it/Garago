import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";
import VisitorTracker from "@/components/VisitorTracker";
import LabelLinker from "@/components/LabelLinker";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://garagopro.ca"),
  title: "Garago | Trouver un garage et prendre rendez-vous en ligne au Québec",
  description:
    "Trouvez un garage près de chez vous au Québec : avis de conducteurs, pneus d'hiver, vidange, freins et mécanique. Filtrez par marque, service et disponibilité, puis réservez en ligne.",
  keywords: ["garage Québec", "garage Montréal", "rendez-vous garage en ligne", "pneus d'hiver", "changement de pneus", "vidange d'huile", "mécanicien", "réparation auto", "freins", "garage près de moi"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
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
            "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          backgroundColor: "#f8fafc",
        }}
      >
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Garago",
              legalName: "Garago Technologies Inc.",
              url: "https://garagopro.ca",
              logo: "https://garagopro.ca/logo-garago-700.webp",
              email: "info@garagopro.ca",
              areaServed: "CA",
              sameAs: ["https://www.linkedin.com/company/garago-canada/", "https://www.instagram.com/garago.ca"],
            },
            { "@type": "WebSite", name: "Garago", url: "https://garagopro.ca", inLanguage: "fr-CA" },
          ],
        }} />
        <Providers>
          <VisitorTracker />
          <LabelLinker />
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
