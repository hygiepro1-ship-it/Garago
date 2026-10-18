import HomeContent from "@/components/HomeContent";
import { pageMetadata } from "@/lib/alternates";
import { quebecMonth } from "@/lib/season";

// Régénérée chaque jour : le bloc de saison (pneus d'hiver, pneus d'été) suit le mois en cours.
export const revalidate = 86400;

export const metadata = pageMetadata({
  path: "/",
  lang: "fr",
  type: "website",
  title: "Garago | Trouver un garage et réserver en ligne au Québec",
  description:
    "Trouvez un garage près de chez vous au Québec : avis de conducteurs, vidange, pneus d'hiver, freins. Filtrez par marque et service, puis réservez en ligne.",
});

export default function Page() {
  return <HomeContent seasonMonth={quebecMonth()} />;
}
