import WhyGarago from "@/components/WhyGarago";
import { pageMetadata } from "@/lib/alternates";

export const metadata = pageMetadata({
  path: "/pourquoi-garago",
  lang: "fr",
  type: "website",
  title: "Pourquoi Garago : rendez-vous en ligne pour les garages et les conducteurs du Québec",
  description:
    "Pourquoi choisir Garago : moins de rendez-vous manqués et un agenda en ligne pour les garages, des garages trouvés et réservés facilement pour les conducteurs du Québec.",
});

export default function PourquoiGarago() {
  return <WhyGarago lang="fr" />;
}
