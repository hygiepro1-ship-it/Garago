import WhyGarago from "@/components/WhyGarago";
import { pageMetadata } from "@/lib/alternates";

export const metadata = pageMetadata({
  path: "/pourquoi-garago",
  lang: "fr",
  type: "website",
  title: "Pourquoi Garago : rendez-vous auto en ligne au Québec",
  description:
    "Pourquoi Garago : moins de rendez-vous manqués et un agenda en ligne pour les garages, un garage trouvé et réservé vite pour les conducteurs du Québec.",
});

export default function PourquoiGarago() {
  return <WhyGarago lang="fr" />;
}
