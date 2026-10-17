// Vidéos de Garago : une page de lecture par vidéo et par langue (la vidéo y est le contenu principal,
// ce que Google exige pour l'indexer comme vidéo). La transcription reprend la voix de la vidéo.

import type { PageLang } from "@/lib/alternates";

export interface VideoPage {
  path: string;
  title: string;
  h1: string;
  description: string;
  file: string;       // /videos/xxx.mp4
  poster: string;     // /videos/xxx.jpg
  duration: string;   // ISO 8601
  uploadDate: string;
  transcript: string[];
  cta: { label: string; href: string };
  related: { label: string; href: string };
}

export const VIDEOS: Record<"reserver" | "garagistes", Record<PageLang, VideoPage>> = {
  reserver: {
    fr: {
      path: "/videos/reserver-son-garage-en-ligne",
      title: "Vidéo : réserver son garage en ligne, sans appeler | Garago",
      h1: "Réserver son garage en ligne, sans appeler",
      description: "En moins d'une minute : pourquoi trouver un garage au téléphone est un casse-tête, et comment Garago montre les garages proches, disponibles bientôt et qui s'occupent de votre auto, puis la réservation en quatre étapes.",
      file: "/videos/garago-reserver-fr.mp4",
      poster: "/videos/garago-reserver-fr.jpg",
      duration: "PT54S",
      uploadDate: "2026-10-14",
      transcript: [
        "Trouver un garage… un vrai casse-tête.",
        "Vous appelez. Vous attendez. Et personne ne répond.",
        "Quand ça répond enfin : c'est complet pour trois semaines.",
        "Et parfois, le garage ne travaille même pas sur votre marque.",
        "Il y a plus simple.",
        "Avec Garago, plus besoin d'appeler.",
        "Garago vous montre les garages les plus proches, disponibles bientôt, et qui s'occupent de votre auto.",
        "Entrez votre auto et votre position.",
        "Comparez les garages et leurs avis.",
        "Choisissez l'heure qui vous convient.",
        "Quarante-huit heures avant, vous confirmez d'un seul geste.",
        "Garago. Trouvez votre garage, sans appeler.",
      ],
      cta: { label: "Trouver un garage", href: "/rechercher" },
      related: { label: "Lire le guide : réserver son garage en ligne", href: "/conducteurs/reserver-garage-en-ligne" },
    },
    en: {
      path: "/en/videos/book-your-garage-online",
      title: "Video: book your garage online, without calling | Garago",
      h1: "Book your garage online, without calling",
      description: "In under a minute: why finding a garage by phone is a headache, and how Garago shows nearby garages, available soon, that work on your car, then booking in four steps.",
      file: "/videos/garago-reserver-en.mp4",
      poster: "/videos/garago-reserver-en.jpg",
      duration: "PT54S",
      uploadDate: "2026-10-14",
      transcript: [
        "Finding a garage? A real headache.",
        "You call. You wait. And nobody picks up.",
        "When they finally answer: fully booked for three weeks.",
        "And sometimes, the garage doesn't even work on your model.",
        "There's an easier way.",
        "With Garago, no more phone calls.",
        "Garago shows you the closest garages, available soon, that work on your car.",
        "Enter your car and your location.",
        "Compare garages and their reviews.",
        "Pick the time that suits you.",
        "Forty-eight hours before, you confirm in a single tap.",
        "Garago. Find your garage, without calling.",
      ],
      cta: { label: "Find a garage", href: "/rechercher" },
      related: { label: "Read the guide: book your garage online", href: "/en/drivers/book-garage-online" },
    },
  },
  garagistes: {
    fr: {
      path: "/videos/prise-de-rendez-vous-en-ligne-garage",
      title: "Vidéo : la prise de rendez-vous en ligne pour garage, de la réservation à la confirmation | Garago",
      h1: "Prise de rendez-vous en ligne pour garage : la démonstration",
      description: "Un client réserve un lundi soir, garage fermé : service, jour, heure et coordonnées en moins d'une minute. Deux jours avant, Garago lui demande de confirmer, et le rendez-vous passe au vert dans votre agenda.",
      file: "/videos/garago-reservation-fr.mp4",
      poster: "/videos/garago-reservation-fr.jpg",
      duration: "PT51S",
      uploadDate: "2026-10-14",
      transcript: [
        "Fini les rendez-vous pris au téléphone.",
        "Lundi soir, votre garage est fermé. Paul ouvre votre fiche et choisit son service.",
        "Il choisit le jour qui lui convient.",
        "Puis une heure, parmi vos heures libres.",
        "Il laisse son nom, son numéro, son courriel et son véhicule.",
        "C'est fait, en moins d'une minute. Le rendez-vous est dans votre agenda, et le téléphone n'a pas sonné.",
        "Deux jours avant, Garago lui écrit pour vous. Il confirme d'un seul geste.",
        "Le rendez-vous passe au vert. Vous savez qui vient.",
        "Moins d'une minute pour réserver. Et moins de rendez-vous manqués, parce que chaque client confirme avant de venir.",
        "Avec Garago, vos rendez-vous ne tombent plus à l'eau.",
      ],
      cta: { label: "Essayer Garago 30 jours gratuitement", href: "/inscription/garage" },
      related: { label: "Voir Garago pour les garages : fonctionnement et tarifs", href: "/garagistes" },
    },
    en: {
      path: "/en/videos/online-booking-for-auto-repair-shops",
      title: "Video: online booking for auto repair shops, from booking to confirmation | Garago",
      h1: "Online booking for auto repair shops: the demo",
      description: "A customer books on a Monday night while the shop is closed: service, day, time and details in under a minute. Two days before, Garago asks them to confirm, and the appointment turns green in your calendar.",
      file: "/videos/garago-reservation-en.mp4",
      poster: "/videos/garago-reservation-en.jpg",
      duration: "PT51S",
      uploadDate: "2026-10-14",
      transcript: [
        "No more appointments booked over the phone.",
        "Monday night, your garage is closed. Paul opens your page and picks his service.",
        "He picks the day that suits him.",
        "Then a time, from your open slots.",
        "He leaves his name, his number, his email and his vehicle.",
        "Done, in under a minute. The appointment is in your calendar, and the phone never rang.",
        "Two days before, Garago writes to him for you. He confirms with one tap.",
        "The appointment turns green. You know who's coming.",
        "Under a minute to book. And fewer missed appointments, because every customer confirms before coming in.",
        "With Garago, your appointments no longer fall through.",
      ],
      cta: { label: "Try Garago free for 30 days", href: "/inscription/garage" },
      related: { label: "See Garago for garages: how it works and pricing", href: "/en/garage-owners" },
    },
  },
};

/** Données structurées d'une vidéo (VideoObject), pour sa page de lecture et les pages qui l'intègrent. */
export function videoJsonLd(v: VideoPage, lang: PageLang, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.h1,
    description: v.description,
    thumbnailUrl: `${baseUrl}${v.poster}`,
    contentUrl: `${baseUrl}${v.file}`,
    embedUrl: `${baseUrl}${v.path}`,
    uploadDate: v.uploadDate,
    duration: v.duration,
    inLanguage: lang === "en" ? "en-CA" : "fr-CA",
    transcript: v.transcript.join(" "),
    publisher: { "@type": "Organization", "@id": "https://garagopro.ca/#organization", name: "Garago", logo: { "@type": "ImageObject", url: `${baseUrl}/logo-garago-700${lang === "en" ? "-en" : ""}.webp` } },
  };
}
