import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Conseils auto au Québec : entretien, pneus, voyants | Garago",
  description: "Voyant check engine, voiture qui ne démarre pas, pneus d'hiver, changement d'huile, vérification SAAQ : des conseils auto clairs et sourcés pour le Québec.",
  alternates: { canonical: `${BASE_URL}/conseils` },
  openGraph: { title: "Conseils auto au Québec : entretien, pneus, voyants | Garago", description: "Voyant check engine, voiture qui ne démarre pas, pneus d'hiver, changement d'huile, vérification SAAQ : des conseils auto clairs et sourcés pour le Québec.", url: `${BASE_URL}/conseils`, siteName: "Garago", locale: "fr_CA", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
