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

// Chiffres : seulement des données sourcées, avec leur pays et leur nature (étude, estimation d'éditeur).
interface Fait { chiffre: string; texte: string; porte: string; source: string; href: string }

const FAITS_GARAGES: Fait[] = [
  {
    chiffre: "jusqu'à 21 %",
    texte: "Des appels reçus par les services automobiles restent sans réponse ou échouent. Un taux sain se situe à 10 % ou moins. Chaque appel manqué est un client qui appelle le garage suivant.",
    porte: "Amérique du Nord, grands réseaux d'ateliers (analyse de données d'appels, 2026)",
    source: "Marchex",
    href: "https://www.marchex.com/up-to-21-percent-of-automotive-service-customer-calls-go-unanswered-creating-significant-revenue-leakage/",
  },
  {
    chiffre: "≈ 30 %",
    texte: "Des appels entrants aux services automobiles représentent une occasion de revenu manquée : 13 % ne se connectent pas et 17 % n'aboutissent pas à un rendez-vous malgré l'intention du client.",
    porte: "États-Unis, 8,7 millions d'appels analysés (rapport 2019)",
    source: "Marchex, 2019 Auto Services Industry Report",
    href: "https://www.marchex.com/wp-content/uploads/2019/11/2019-Auto-Services-Industry-Report.pdf",
  },
  {
    chiffre: "10 à 15 %",
    texte: "Des rendez-vous ne sont pas honorés dans les garages indépendants qui n'envoient ni rappel ni confirmation. Une demande de confirmation et un rappel sont les moyens les plus simples de les réduire.",
    porte: "Estimation d'un éditeur de logiciel (France). Aucune statistique indépendante québécoise à notre connaissance.",
    source: "Car Spot",
    href: "https://car-spot.io/fr/guides/how-to-manage-garage-appointments",
  },
  {
    chiffre: "Plus de postes vacants que de travailleurs",
    texte: "C'est le constat du gouvernement fédéral pour les mécaniciens de véhicules automobiles de la région de Montréal en 2023-2025. Quand l'équipe est rare, chaque heure passée au téléphone est une heure de moins à l'atelier.",
    porte: "Région de Montréal, métier CNP 72410",
    source: "Guichet-emplois (Gouvernement du Canada)",
    href: "https://www.guichetemplois.gc.ca/rapportmarche/perspectives-profession/14857/geo25154",
  },
];

const FAITS_CONDUCTEURS: Fait[] = [
  {
    chiffre: "87 %",
    texte: "Des consommateurs lisent les avis en ligne avant de choisir une entreprise locale. Sur Garago, chaque avis vient d'un conducteur qui a réellement eu un rendez-vous dans le garage.",
    porte: "Sondage de consommateurs, 2020",
    source: "BrightLocal, Local Consumer Review Survey",
    href: "https://www.brightlocal.com/research/local-consumer-review-survey-2020/",
  },
  {
    chiffre: "76 %",
    texte: "Des clients d'un service automobile qui ont réservé en ligne disent qu'ils le referaient. La réservation en ligne convainc ceux qui l'essaient.",
    porte: "États-Unis, clients de services de concessionnaires (2017)",
    source: "Cox Automotive",
    href: "https://www.coxautoinc.com/?p=2809",
  },
  {
    chiffre: "45 %",
    texte: "Des clients qui n'avaient pas réservé en ligne ignoraient que l'option existait. Un endroit où l'on voit d'un coup d'œil quels garages prennent les rendez-vous en ligne règle ce problème.",
    porte: "États-Unis, clients de services de concessionnaires (2017)",
    source: "Cox Automotive",
    href: "https://www.coxautoinc.com/?p=2809",
  },
];

function FaitCard({ f }: { f: Fait }) {
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5">
      <span className="block text-2xl sm:text-3xl font-black leading-tight" style={{ color: "#c2410c" }}>{f.chiffre}</span>
      <span className="block mt-2 text-sm leading-relaxed text-gray-700">{f.texte}</span>
      <span className="block mt-2 text-xs text-gray-500">{f.porte}</span>
      <a href={f.href} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center min-h-[44px] sm:min-h-0 mt-1 text-xs font-semibold underline text-gray-600">
        Source : {f.source}
      </a>
    </li>
  );
}

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
            Chaque donnée indique d&apos;où elle vient. Quand elle n&apos;est pas québécoise ou qu&apos;il s&apos;agit d&apos;une estimation
            d&apos;éditeur de logiciel, nous le disons.
          </p>
          <h3 className="mt-6 text-lg font-black" style={{ color: "#0b1f3a" }}>Pour les garages</h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {FAITS_GARAGES.map((f) => <FaitCard key={f.chiffre} f={f} />)}
          </ul>
          <h3 className="mt-8 text-lg font-black" style={{ color: "#0b1f3a" }}>Pour les conducteurs</h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {FAITS_CONDUCTEURS.map((f) => <FaitCard key={f.chiffre + f.source} f={f} />)}
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
