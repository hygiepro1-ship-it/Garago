import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";
import VisitorTracker from "@/components/VisitorTracker";
import LabelLinker from "@/components/LabelLinker";
import JsonLd from "@/components/JsonLd";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://garagopro.ca"),
  // Propriété vérifiée dans Google Search Console (balise meta, en plus du fichier public/google…html)
  verification: { google: "D7KBP9yglJHPcnj83H6aZJbrwXQFqAaRrRxRLr4_u6g" },
  title: "Garago | Trouver un garage et réserver en ligne au Québec",
  description:
    "Trouvez un garage près de chez vous au Québec : avis de conducteurs, vidange, pneus d'hiver, freins. Filtrez par marque et service, puis réservez en ligne.",
  keywords: ["garage Québec", "garage Montréal", "rendez-vous garage en ligne", "pneus d'hiver", "changement de pneus", "vidange d'huile", "mécanicien", "réparation auto", "freins", "garage près de moi"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Langue de la page dès le premier affichage : les pages /en sont en anglais (le HTML commun dit « fr »).
            Exécuté avant le rendu du corps, pour les lecteurs d'écran, la traduction automatique et les robots qui exécutent le JS. */}
        <Script id="langue-page" strategy="beforeInteractive">
          {"var p=location.pathname;if(p==='/en'||p.indexOf('/en/')===0)document.documentElement.lang='en-CA'"}
        </Script>
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
              "@id": "https://garagopro.ca/#organization",
              name: "Garago",
              legalName: "Garago Technologies Inc.",
              url: "https://garagopro.ca",
              logo: "https://garagopro.ca/logo-garago-700.webp",
              email: "info@garagopro.ca",
              areaServed: { "@type": "AdministrativeArea", name: "Québec", containedInPlace: { "@type": "Country", name: "Canada" } },
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "info@garagopro.ca",
                areaServed: "CA-QC",
                availableLanguage: ["French", "English"],
              },
              sameAs: [
                // Fiche Google Business de Garago (même fiche que le lien d'avis g.page/r/Cf9X0C3Mdh_UEBM)
                "https://maps.google.com/?cid=15285066279632787455",
                "https://www.linkedin.com/company/garago-canada/",
                "https://www.instagram.com/garago.ca",
              ],
            },
            {
              "@type": "WebSite",
              "@id": "https://garagopro.ca/#website",
              name: "Garago",
              url: "https://garagopro.ca",
              // Site bilingue : français (/) et anglais (/en)
              inLanguage: ["fr-CA", "en-CA"],
              publisher: { "@id": "https://garagopro.ca/#organization" },
            },
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
