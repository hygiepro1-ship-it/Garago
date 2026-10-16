"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

/**
 * Vidéo d'une page-guide, dans la langue choisie par le visiteur.
 * Elle ne démarre pas seule : l'affiche reste visible jusqu'au clic, et seules les métadonnées sont préchargées.
 * Fichiers attendus : /videos/<name>-fr.mp4, -en.mp4 et leurs affiches .jpg.
 */
export default function GuideVideo({ name, label, watch }: { name: string; label: { fr: string; en: string }; watch?: { fr: string; en: string } }) {
  const { lang } = useLang();
  const l = lang === "en" ? "en" : "fr";
  return (
    <>
    <div className="mt-8 overflow-hidden rounded-xl bg-[#0b1f3a]" style={{ aspectRatio: "16 / 9", boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}>
      <video
        key={l}
        src={`/videos/${name}-${l}.mp4`}
        poster={`/videos/${name}-${l}.jpg`}
        controls
        playsInline
        preload="metadata"
        aria-label={label[l]}
        className="block h-full w-full"
      />
    </div>
    {watch && (
      <Link href={watch[l]} className="inline-block mt-3 text-sm font-semibold underline" style={{ color: "rgba(255,255,255,0.85)" }}>
        {l === "en" ? "Watch the video full size, with its transcript" : "Voir la vidéo en grand, avec sa transcription"}
      </Link>
    )}
    </>
  );
}
