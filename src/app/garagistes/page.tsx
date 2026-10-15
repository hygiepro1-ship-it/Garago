import { pageMetadata } from "@/lib/alternates";
import GaragistesContent from "./GaragistesContent";
import "./garagistes.css";

export const metadata = pageMetadata({
  path: "/garagistes",
  lang: "fr",
  type: "website",
  title: "Prise de rendez-vous en ligne pour garage au Québec | Moins d'absences | Garago",
  description:
    "Agenda et réservation en ligne pour garage : vos clients réservent 24 h sur 24, reçoivent confirmation et rappel, et vous réduisez les rendez-vous manqués. Essai gratuit de 30 jours.",
});

export default function GaragistesPage() {
  return <GaragistesContent />;
}
