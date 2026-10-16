import GuidePage from "@/components/GuidePage";
import GuideVideo from "@/components/GuideVideo";
import JsonLd from "@/components/JsonLd";
import type { PageLang } from "@/lib/alternates";
import * as guide from "@/content/guides/reserver-garage-en-ligne";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

const VIDEO = {
  fr: { name: "Réserver son garage en ligne, sans appeler", description: "Trouver un garage proche, disponible bientôt et qui s'occupe de votre véhicule, puis réserver en ligne en quatre étapes avec Garago." },
  en: { name: "Book your garage online, without calling", description: "Find a nearby garage that's available soon and works on your vehicle, then book online in four steps with Garago." },
};

/** Guide conducteurs « réserver son garage en ligne », avec sa vidéo, dans une langue. */
export default function DriverBookingGuide({ lang }: { lang: PageLang }) {
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "VideoObject",
        ...VIDEO[lang],
        thumbnailUrl: `${BASE_URL}/videos/garago-reserver-${lang}.jpg`,
        contentUrl: `${BASE_URL}/videos/garago-reserver-${lang}.mp4`,
        uploadDate: "2026-10-14",
        duration: "PT54S",
        inLanguage: lang === "en" ? "en-CA" : "fr-CA",
      }} />
      <GuidePage
        {...guide[lang]}
        lang={lang}
        media={<GuideVideo name="garago-reserver" label={{ fr: "Vidéo : réserver son garage en ligne, sans appeler", en: "Video: book your garage online, without calling" }} />}
      />
    </>
  );
}
