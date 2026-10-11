import React from "react";
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { DURATION, FPS, type Lang } from "./Video";

// Voix : [fichier, début en secondes, durée parlée en secondes]. Les fichiers ont souvent un long silence à la fin, coupé ici.
const VOICE: Record<Lang, [string, number, number][]> = {
  fr: [
    ["v1", 0.6, 1.74],   // Fini les rendez-vous pris au téléphone.
    ["v2", 3.7, 4.97],   // Lundi soir, votre garage est fermé. Paul ouvre votre fiche et choisit son service.
    ["v3", 9.0, 1.69],   // Il choisit le jour qui lui convient.
    ["v4", 12.4, 3.0],   // Puis une heure, parmi vos heures libres.
    ["v5", 16.3, 3.86],  // Il laisse son nom, son numéro, son courriel et son véhicule.
    ["v6b", 22.2, 5.39], // C'est fait, en moins d'une minute. Le rendez-vous est dans votre agenda, et le téléphone n'a pas sonné.
    ["v7", 28.6, 4.34],  // Deux jours avant, Garago lui écrit pour vous. Il confirme d'un seul geste.
    ["v8", 35.2, 2.55],  // Le rendez-vous passe au vert. Vous savez qui vient.
    ["v10", 39.5, 6.0],  // Moins d'une minute pour réserver. Et moins de rendez-vous manqués, parce que chaque client confirme avant de venir.
    ["v9b", 47.0, 2.6],  // Avec Garago, vos rendez-vous ne tombent plus à l'eau.
  ],
  en: [
    ["e1", 0.6, 2.27],   // No more appointments booked over the phone.
    ["e2", 3.5, 5.11],   // Monday night, your garage is closed. Paul opens your page and picks his service.
    ["e3", 9.0, 1.58],   // He picks the day that suits him.
    ["e4", 12.4, 2.09],  // Then a time, from your open slots.
    ["e5", 16.3, 3.55],  // He leaves his name, his number, his email and his vehicle.
    ["e6", 22.2, 4.99],  // Done, in under a minute. The appointment is in your calendar, and the phone never rang.
    ["e7", 28.6, 4.97],  // Two days before, Garago writes to him for you. He confirms with one tap.
    ["e8", 35.2, 2.97],  // The appointment turns green. You know who's coming.
    ["e10", 39.5, 6.43], // Under a minute to book. And fewer missed appointments, because every customer confirms before coming in.
    ["e9", 47.0, 3.08],  // With Garago, your appointments no longer fall through.
  ],
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Musique légère : elle baisse encore un peu pendant que la voix parle. */
const musicVolume = (lang: Lang) => (frame: number) => {
  const t = frame / FPS;
  let duck = 0;
  for (const [, start, len] of VOICE[lang]) {
    duck = Math.max(duck, interpolate(t, [start - 0.35, start, start + len, start + len + 0.5], [0, 1, 1, 0], clamp));
  }
  const fade = interpolate(frame, [0, FPS, DURATION - 1.6 * FPS, DURATION - 1], [0, 1, 1, 0], clamp);
  return fade * interpolate(duck, [0, 1], [0.2, 0.08]);
};

export const Soundtrack: React.FC<{ lang: Lang }> = ({ lang }) => (
  <>
    <Audio src={staticFile("audio/musique2.mp3")} volume={musicVolume(lang)} />
    {VOICE[lang].map(([file, start, len]) => (
      <Sequence key={file} from={Math.round(start * FPS)} durationInFrames={Math.ceil((len + 0.2) * FPS)} layout="none">
        <Audio src={staticFile(`audio/${file}.mp3`)} volume={1} />
      </Sequence>
    ))}
  </>
);
