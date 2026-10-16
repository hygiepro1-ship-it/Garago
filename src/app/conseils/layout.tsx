import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Conseils auto au Québec : check engine, pneus d'hiver, changement d'huile, freins | Garago",
  description: "Voyant check engine, voiture qui ne démarre pas, pneus 4 saisons et pneus d'hiver, changement d'huile, inspection pré-achat, vérification SAAQ et garantie des réparations : des réponses claires pour les conducteurs du Québec.",
  alternates: { canonical: `${BASE_URL}/conseils` },
  openGraph: { title: "Conseils auto au Québec : check engine, pneus d'hiver, changement d'huile, freins | Garago", description: "Voyant check engine, voiture qui ne démarre pas, pneus 4 saisons et pneus d'hiver, changement d'huile, inspection pré-achat, vérification SAAQ et garantie des réparations : des réponses claires pour les conducteurs du Québec.", url: `${BASE_URL}/conseils`, siteName: "Garago", locale: "fr_CA", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
