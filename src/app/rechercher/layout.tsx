import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Trouver un garage près de chez vous — Garago",
  description: "Comparez les garages près de chez vous selon la marque de votre véhicule, le service et les disponibilités. Avis de vrais conducteurs et réservation en ligne.",
  alternates: { canonical: `${BASE_URL}/rechercher` },
  openGraph: { title: "Trouver un garage près de chez vous — Garago", description: "Comparez les garages près de chez vous selon la marque de votre véhicule, le service et les disponibilités. Avis de vrais conducteurs et réservation en ligne.", url: `${BASE_URL}/rechercher`, siteName: "Garago", locale: "fr_CA", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
