"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/contexts/LanguageContext";

/**
 * Vidéo d'une page-guide, dans la langue choisie par le visiteur. Elle démarre seule, avec le son
 * quand le navigateur le permet ; sinon elle démarre en silence et un bouton « Activer le son »
 * la relance du début avec le son (même comportement que la vidéo de la page des garages).
 * Fichiers attendus : /videos/<name>-fr.mp4, -en.mp4 et leurs affiches .jpg.
 */
export default function GuideVideo({ name, label, watch }: { name: string; label: { fr: string; en: string }; watch?: { fr: string; en: string } }) {
  const { lang } = useLang();
  const l = lang === "en" ? "en" : "fr";
  const ref = useRef<HTMLVideoElement>(null);
  const [silenced, setSilenced] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Pas de lecture automatique pour qui a demandé moins d'animations : la vidéo reste à lancer à la main.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    v.muted = false;
    v.play().catch(() => {
      if (cancelled) return;
      v.muted = true;
      setSilenced(true);
      v.play().catch(() => {});
    });
    return () => { cancelled = true; };
  }, [l]);

  const turnSoundOn = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.currentTime = 0;
    setSilenced(false);
    v.play().catch(() => {});
  };

  return (
    <>
      <div className="relative mt-8 overflow-hidden rounded-xl bg-[#0b1f3a]" style={{ aspectRatio: "16 / 9", boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}>
        <video
          key={l}
          ref={ref}
          src={`/videos/${name}-${l}.mp4`}
          poster={`/videos/${name}-${l}.jpg`}
          controls
          playsInline
          preload="auto"
          aria-label={label[l]}
          className="block h-full w-full"
          onVolumeChange={(e) => { if (!e.currentTarget.muted) setSilenced(false); }}
        />
        {silenced && (
          <button type="button" onClick={turnSoundOn}
            className="absolute left-3 top-3 inline-flex items-center gap-2 min-h-[44px] rounded-lg px-4 text-sm font-extrabold"
            style={{ background: "#e0600c", color: "#fff", boxShadow: "0 6px 20px rgba(0,0,0,.35)" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5L6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
            </svg>
            {l === "en" ? "Turn sound on" : "Activer le son"}
          </button>
        )}
      </div>
      {watch && (
        <Link href={watch[l]} className="inline-block mt-3 text-sm font-semibold underline" style={{ color: "rgba(255,255,255,0.85)" }}>
          {l === "en" ? "Watch the video full size, with its transcript" : "Voir la vidéo en grand, avec sa transcription"}
        </Link>
      )}
    </>
  );
}
