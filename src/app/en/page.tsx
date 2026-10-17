import HomeContent from "@/components/HomeContent";
import { pageMetadata } from "@/lib/alternates";
import { quebecMonth } from "@/lib/season";

// Régénérée chaque jour : le bloc de saison (pneus d'hiver, pneus d'été) suit le mois en cours.
export const revalidate = 86400;

export const metadata = pageMetadata({
  path: "/en",
  lang: "en",
  type: "website",
  title: "Garago | Find an auto repair shop and book online in Quebec",
  description:
    "Find a garage near you in Quebec: driver reviews, winter tires, oil changes, brakes and repairs. Filter by make, service and availability, then book online.",
});

export default function Page() {
  return <HomeContent seasonMonth={quebecMonth()} />;
}
