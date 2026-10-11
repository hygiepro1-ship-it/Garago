"use client";

import { useEffect, useRef, useState } from "react";

const TEXT = {
  fr: { label: "Vidéo : comment un client réserve en ligne, jusqu'à sa confirmation", soundOn: "Activer le son" },
  en: { label: "Video: how a customer books online, all the way to confirmation", soundOn: "Turn sound on" },
} as const;

/**
 * Vidéo de présentation, dans la langue de la page. Elle démarre seule, avec le son
 * quand le navigateur le permet. Les navigateurs refusent souvent le son tant que le
 * visiteur n'a pas cliqué quelque part : dans ce cas elle démarre en silence et un
 * bouton « Activer le son » la relance du début avec le son.
 */
export default function PresentationVideo({ lang }: { lang: "fr" | "en" }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [silenced, setSilenced] = useState(false);
  const t = TEXT[lang];

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
  }, [lang]);

  const turnSoundOn = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.currentTime = 0;
    setSilenced(false);
    v.play().catch(() => {});
  };

  return (
    <div className="film">
      <video
        key={lang}
        ref={ref}
        src={`/videos/garago-reservation-${lang}.mp4`}
        poster={`/videos/garago-reservation-${lang}.jpg`}
        controls
        playsInline
        preload="auto"
        aria-label={t.label}
        onVolumeChange={(e) => { if (!e.currentTarget.muted) setSilenced(false); }}
      />
      {silenced && (
        <button type="button" className="film-sound" onClick={turnSoundOn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5L6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
          </svg>
          {t.soundOn}
        </button>
      )}
    </div>
  );
}
