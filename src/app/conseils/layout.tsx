import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Conseils auto : entretien, pneus, freins, voyants | Garago",
  description: "Guides pratiques pour entretenir votre véhicule au Québec : voyants du tableau de bord, pneus d'hiver, freins, batterie, vidange et plus.",
  alternates: { canonical: `${BASE_URL}/conseils` },
  openGraph: { title: "Conseils auto : entretien, pneus, freins, voyants | Garago", description: "Guides pratiques pour entretenir votre véhicule au Québec : voyants du tableau de bord, pneus d'hiver, freins, batterie, vidange et plus.", url: `${BASE_URL}/conseils`, siteName: "Garago", locale: "fr_CA", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
