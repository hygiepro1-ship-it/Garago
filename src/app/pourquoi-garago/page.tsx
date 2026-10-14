import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import CoutAbsences from "./CoutAbsences";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Pourquoi Garago : rendez-vous en ligne pour les garages et les conducteurs du Québec",
  description:
    "Pourquoi choisir Garago : moins de rendez-vous manqués et un agenda en ligne pour les garages, des garages trouvés et réservés facilement pour les conducteurs du Québec.",
  alternates: { canonical: `${BASE_URL}/pourquoi-garago` },
};

interface Theme { href: string; title: string; text: string }

const GARAGISTES: Theme[] = [
  { href: "/garagistes/rendez-vous-manques", title: "Réduire les rendez-vous manqués", text: "Confirmation, rappel la veille, annulation facile : 7 moyens concrets de limiter les absences." },
  { href: "/garagistes/agenda-en-ligne", title: "Choisir un agenda en ligne pour son garage", text: "Durée par service, nombre de portes, rendez-vous au téléphone : les critères à vérifier." },
  { href: "/garagistes/saison-pneus-hiver", title: "Traverser la saison des pneus d'hiver", text: "Gérer la ruée d'octobre à décembre sans saturer le téléphone ni l'atelier." },
  { href: "/garagistes", title: "Garago pour les garages : fonctionnement et tarifs", text: "Ce qui est inclus, le prix, et comment démarrer l'essai gratuit de 30 jours." },
];

const CONDUCTEURS: Theme[] = [
  { href: "/conducteurs/reserver-garage-en-ligne", title: "Réserver son garage en ligne, sans appeler", text: "Choisir le service, la date et l'heure parmi les vraies disponibilités du garage." },
  { href: "/conseils/quand-passer-pneus-hiver-quebec", title: "Quand passer aux pneus d'hiver au Québec", text: "La date limite, la bonne température et pourquoi prendre rendez-vous tôt." },
  { href: "/garages", title: "Trouver un garage par ville ou arrondissement", text: "Les garages de votre secteur, leurs avis et leurs coordonnées." },
  { href: "/conseils", title: "Tous les conseils auto", text: "Voyants, freins, batterie, vidange : des guides pratiques pour le Québec." },
];

// Chiffres : seulement des faits sourcés. Les estimations d'éditeurs de logiciels sont présentées comme telles.
const FAITS = [
  {
    chiffre: "1er décembre",
    texte: "Date à partir de laquelle les pneus d'hiver sont obligatoires au Québec. L'amende va de 200 $ à 300 $, plus les frais.",
    source: "CAA-Québec, communiqué du 8 octobre 2024",
    href: "https://www.caaquebec.com/fr/salle-de-presse/communiques-de-presse/pneus-d-hiver-vous-n-etes-pas-aussi-tot-que-vous-le-croyez",
  },
  {
    chiffre: "≈ 7 °C",
    texte: "Température à partir de laquelle CAA-Québec recommande de passer aux pneus d'hiver, quand elle se maintient plusieurs jours : parfois dès octobre.",
    source: "CAA-Québec, communiqué du 8 octobre 2024",
    href: "https://www.caaquebec.com/fr/salle-de-presse/communiques-de-presse/pneus-d-hiver-vous-n-etes-pas-aussi-tot-que-vous-le-croyez",
  },
  {
    chiffre: "10 à 15 %",
    texte: "Part des rendez-vous qui ne sont pas honorés dans les garages indépendants qui n'envoient ni rappel ni confirmation, selon une estimation d'un éditeur de logiciel (France). Aucune étude indépendante québécoise n'existe à notre connaissance.",
    source: "Car Spot, guide de gestion des rendez-vous de garage (estimation d'éditeur)",
    href: "https://car-spot.io/fr/guides/how-to-manage-garage-appointments",
  },
  {
    chiffre: "10 à 25 %",
    texte: "Fourchette de taux d'absence en atelier de réparation relevée dans des sources américaines d'éditeurs de logiciels. Elle varie beaucoup d'un atelier à l'autre : le plus fiable est de mesurer le vôtre.",
    source: "Synthèse de sources d'éditeurs (Koalendar, Autodots, Klipboard)",
    href: "https://www.klipboard.com/blog/why-nearly-1-in-10-of-garage-appointments-are-no-shows-and-how-to-fix-it",
  },
];

function ThemeCard({ t }: { t: Theme }) {
  return (
    <li>
      <Link href={t.href}
        className="group block h-full rounded-2xl border border-gray-200 bg-white p-5 hover:border-orange-300 hover:shadow-sm transition">
        <span className="block font-black text-gray-900 group-hover:underline">{t.title}</span>
        <span className="block mt-1.5 text-sm leading-relaxed text-gray-600">{t.text}</span>
        <span className="block mt-3 text-sm font-bold" style={{ color: "#c2410c" }}>Lire →</span>
      </Link>
    </li>
  );
}

export default function PourquoiGarago() {
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Pourquoi Garago",
        url: `${BASE_URL}/pourquoi-garago`,
        hasPart: [...GARAGISTES, ...CONDUCTEURS].map((t) => ({ "@type": "WebPage", name: t.title, url: `${BASE_URL}${t.href}` })),
      }} />

      <section style={{ background: "linear-gradient(135deg,#071428 0%,#0b1f3a 60%,#1a3a6b 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20">
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight" style={{ textWrap: "balance" }}>
            Pourquoi Garago ?
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            Les garages perdent des heures au téléphone et des créneaux à cause des rendez-vous manqués. Les conducteurs, eux,
            ont du mal à trouver un garage disponible, surtout à la saison des pneus. Garago relie les deux.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#garagistes" className="inline-flex items-center min-h-[44px] px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>Je suis garagiste</a>
            <a href="#conducteurs" className="inline-flex items-center min-h-[44px] px-5 py-3 rounded-xl text-sm font-bold text-white border border-white/40">Je suis conducteur</a>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-14">
        <section id="garagistes" aria-labelledby="h-garagistes">
          <h2 id="h-garagistes" className="text-2xl font-black" style={{ color: "#0b1f3a" }}>Pour les garages</h2>
          <p className="mt-1 text-gray-600">Moins d&apos;appels, moins d&apos;absences, un agenda qui comprend votre atelier.</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {GARAGISTES.map((t) => <ThemeCard key={t.href} t={t} />)}
          </ul>
          <div className="mt-6"><CoutAbsences /></div>
        </section>

        <section id="conducteurs" aria-labelledby="h-conducteurs">
          <h2 id="h-conducteurs" className="text-2xl font-black" style={{ color: "#0b1f3a" }}>Pour les conducteurs</h2>
          <p className="mt-1 text-gray-600">Trouver un garage près de chez vous et réserver, sans passer une heure au téléphone.</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {CONDUCTEURS.map((t) => <ThemeCard key={t.href} t={t} />)}
          </ul>
        </section>

        <section aria-labelledby="h-chiffres">
          <h2 id="h-chiffres" className="text-2xl font-black" style={{ color: "#0b1f3a" }}>Les chiffres, avec leurs sources</h2>
          <p className="mt-1 text-gray-600">
            Nous n&apos;affichons que des données sourcées. Quand il s&apos;agit d&apos;une estimation d&apos;éditeur de logiciel, nous le disons.
          </p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {FAITS.map((f) => (
              <li key={f.chiffre} className="rounded-2xl border border-gray-200 bg-white p-5">
                <span className="block text-3xl font-black" style={{ color: "#c2410c" }}>{f.chiffre}</span>
                <span className="block mt-2 text-sm leading-relaxed text-gray-700">{f.texte}</span>
                <a href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] sm:min-h-0 mt-2 text-xs font-semibold underline text-gray-600">
                  Source : {f.source}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl p-6 sm:p-8" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
          <h2 className="text-xl font-black" style={{ color: "#0b1f3a" }}>Prêt à essayer ?</h2>
          <p className="mt-1 text-sm text-gray-700">Garagistes : 30 jours gratuits, annulable en tout temps. Conducteurs : Garago est gratuit.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/inscription/garage" className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>Inscrire mon garage</Link>
            <Link href="/rechercher" className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold border border-gray-300 bg-white text-gray-800">Trouver un garage</Link>
          </div>
        </section>
      </div>
    </>
  );
}
