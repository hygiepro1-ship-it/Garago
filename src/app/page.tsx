import HomeContent from "@/components/HomeContent";
import { pageMetadata } from "@/lib/alternates";

export const metadata = pageMetadata({
  path: "/",
  lang: "fr",
  type: "website",
  title: "Garago | Trouver un garage et prendre rendez-vous en ligne au Québec",
  description:
    "Trouvez un garage près de chez vous au Québec : avis de conducteurs, pneus d'hiver, vidange, freins et mécanique. Filtrez par marque, service et disponibilité, puis réservez en ligne.",
});

export default function Page() {
  return <HomeContent />;
}
