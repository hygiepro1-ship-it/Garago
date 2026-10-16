import GaragistesContent from "@/app/garagistes/GaragistesContent";
import { pageMetadata } from "@/lib/alternates";
import JsonLd from "@/components/JsonLd";
import { VIDEOS, videoJsonLd } from "@/content/videos";
import "@/app/garagistes/garagistes.css";

export const metadata = pageMetadata({
  path: "/en/garage-owners",
  lang: "en",
  type: "website",
  title: "Online booking for auto repair shops in Quebec | Fewer no-shows | Garago",
  description:
    "Online calendar and booking for auto repair shops: customers book 24/7, get a confirmation and reminder, and you cut missed appointments. 30-day free trial.",
});

export default function GarageOwnersPage() {
  return (
    <>
      {/* La vidéo de présentation, décrite pour Google ; sa page de lecture est /en/videos/online-booking-for-auto-repair-shops */}
      <JsonLd data={videoJsonLd(VIDEOS.garagistes.en, "en", process.env.NEXTAUTH_URL ?? "https://garagopro.ca")} />
      <GaragistesContent />
    </>
  );
}
