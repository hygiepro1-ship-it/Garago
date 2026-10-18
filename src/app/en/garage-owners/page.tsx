import GaragistesContent from "@/app/garagistes/GaragistesContent";
import { pageMetadata } from "@/lib/alternates";
import JsonLd from "@/components/JsonLd";
import { VIDEOS, videoJsonLd } from "@/content/videos";
import { softwareJsonLd } from "@/lib/software-jsonld";
import "@/app/garagistes/garagistes.css";

export const metadata = pageMetadata({
  path: "/en/garage-owners",
  lang: "en",
  type: "website",
  title: "Online booking for auto repair shops in Quebec | Garago",
  description:
    "Online booking for auto repair shops: customers book 24/7, get a confirmation and a reminder, and missed appointments drop. 30-day free trial.",
});

export default function GarageOwnersPage() {
  return (
    <>
      {/* La vidéo de présentation, décrite pour Google ; sa page de lecture est /en/videos/online-booking-for-auto-repair-shops */}
      <JsonLd data={videoJsonLd(VIDEOS.garagistes.en, "en", process.env.NEXTAUTH_URL ?? "https://garagopro.ca")} />
      <JsonLd data={softwareJsonLd("en")} />
      <GaragistesContent />
    </>
  );
}
