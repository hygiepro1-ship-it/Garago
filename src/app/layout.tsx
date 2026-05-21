import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "GarageQC — Trouvez le bon garage au Québec",
  description:
    "Trouvez le meilleur garage pour votre véhicule au Québec. Filtrez par marque, modèle, service et disponibilité. Lisez les avis vérifiés.",
  keywords: ["garage", "mécanique", "Québec", "pneus", "entretien", "réparation auto"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 font-sans">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
