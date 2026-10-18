import { pageMetadata } from "@/lib/alternates";
import JsonLd from "@/components/JsonLd";
import { VIDEOS, videoJsonLd } from "@/content/videos";
import { softwareJsonLd } from "@/lib/software-jsonld";
import GaragistesContent from "./GaragistesContent";
import "./garagistes.css";

export const metadata = pageMetadata({
  path: "/garagistes",
  lang: "fr",
  type: "website",
  title: "Rendez-vous en ligne pour garage au Québec | Garago",
  description:
    "Réservation en ligne pour garage : vos clients réservent 24 h sur 24, reçoivent confirmation et rappel, et les absences diminuent. Essai de 30 jours.",
});

export default function GaragistesPage() {
  return (
    <>
      {/* La vidéo de présentation, décrite pour Google ; sa page de lecture est /videos/prise-de-rendez-vous-en-ligne-garage */}
      <JsonLd data={videoJsonLd(VIDEOS.garagistes.fr, "fr", process.env.NEXTAUTH_URL ?? "https://garagopro.ca")} />
      <JsonLd data={softwareJsonLd("fr")} />
      <GaragistesContent />
    </>
  );
}
