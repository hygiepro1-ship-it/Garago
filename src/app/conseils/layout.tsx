import { pageMetadata } from "@/lib/alternates";

export const metadata = pageMetadata({
  path: "/conseils",
  lang: "fr",
  type: "website",
  title: "Conseils auto au Québec : entretien, pneus, voyants | Garago",
  description: "Voyant check engine, voiture qui ne démarre pas, pneus d'hiver, changement d'huile, vérification SAAQ : des conseils auto clairs et sourcés pour le Québec.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
