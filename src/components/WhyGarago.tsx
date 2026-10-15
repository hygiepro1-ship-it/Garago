import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import CoutAbsences from "@/components/CoutAbsences";
import type { PageLang } from "@/lib/alternates";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

interface Theme { href: string; title: string; text: string }
// Chiffres : seulement des données sourcées, avec leur pays et leur nature (étude, estimation d'éditeur).
interface Fait { chiffre: string; texte: string; porte: string; source: string; href: string }

const MARCHEX_2026 = "https://www.marchex.com/up-to-21-percent-of-automotive-service-customer-calls-go-unanswered-creating-significant-revenue-leakage/";
const MARCHEX_2019 = "https://investors.marchex.com/news-releases/news-release-details/new-data-shows-auto-services-stores-fail-capture-millions-sales";
const CAR_SPOT = "https://car-spot.io/fr/guides/how-to-manage-garage-appointments";
const BRIGHTLOCAL = "https://www.brightlocal.com/research/local-consumer-review-survey-2020/";
const COX = "https://www.coxautoinc.com/?p=2809";

const CONTENT = {
  fr: {
    name: "Pourquoi Garago", path: "/pourquoi-garago",
    h1: "Pourquoi Garago ?",
    intro: "Les garages perdent des heures au téléphone et des créneaux à cause des rendez-vous manqués. Les conducteurs, eux, ont du mal à trouver un garage disponible, surtout à la saison des pneus. Garago relie les deux.",
    imGarage: "Je suis garagiste", imDriver: "Je suis conducteur", garagesId: "garagistes", driversId: "conducteurs",
    garagesH2: "Pour les garages", garagesSub: "Moins d'appels, moins d'absences, un agenda qui comprend votre atelier.",
    driversH2: "Pour les conducteurs", driversSub: "Trouver un garage près de chez vous et réserver, sans passer une heure au téléphone.",
    read: "Lire →", source: "Source :",
    garages: [
      { href: "/garagistes/prise-de-rendez-vous-en-ligne", title: "Prise de rendez-vous en ligne : le guide complet", text: "Services, durées, portes, confirmation et lien de réservation, étape par étape." },
      { href: "/garagistes/rendez-vous-manques", title: "Réduire les rendez-vous manqués", text: "Confirmation, rappel la veille, annulation facile : 7 moyens concrets de limiter les absences." },
      { href: "/garagistes/rappel-rendez-vous-sms", title: "Rappel de rendez-vous par texto", text: "Quand l'envoyer, quoi écrire, et ce que dit la Loi canadienne anti-pourriel." },
      { href: "/garagistes/agenda-en-ligne", title: "Choisir un agenda en ligne pour son garage", text: "Durée par service, nombre de portes, rendez-vous au téléphone : les critères à vérifier." },
      { href: "/garagistes/logiciel-garage-automobile", title: "Logiciel de garage automobile au Québec", text: "Facturation TPS/TVQ, évaluation écrite exigée par la loi, rendez-vous : comment choisir." },
      { href: "/garagistes/modele-facture-garage", title: "Modèle de facture de garage gratuit", text: "Facture, évaluation écrite et bon de travail en Excel, avec TPS et TVQ calculées." },
      { href: "/garagistes/attirer-clients-garage", title: "Attirer plus de clients dans son garage", text: "Fiche Google, avis, réservation en ligne, fidélisation : 8 actions concrètes." },
      { href: "/garagistes/saison-pneus-hiver", title: "Traverser la saison des pneus d'hiver", text: "Gérer la ruée d'octobre à décembre sans saturer le téléphone ni l'atelier." },
      { href: "/garagistes/ouvrir-un-garage-quebec", title: "Ouvrir un garage automobile au Québec", text: "NEQ, taxes, zonage, protection du consommateur, environnement : les étapes." },
      { href: "/garagistes", title: "Garago pour les garages : fonctionnement et tarifs", text: "Ce qui est inclus, le prix, et comment démarrer l'essai gratuit de 30 jours." },
    ] as Theme[],
    drivers: [
      { href: "/conducteurs/reserver-garage-en-ligne", title: "Réserver son garage en ligne, sans appeler", text: "Choisir le service, la date et l'heure parmi les vraies disponibilités du garage." },
      { href: "/conseils/quand-passer-pneus-hiver-quebec", title: "Quand passer aux pneus d'hiver au Québec", text: "La date limite, la bonne température et pourquoi prendre rendez-vous tôt." },
      { href: "/garages", title: "Trouver un garage par ville ou arrondissement", text: "Les garages de votre secteur, leurs avis et leurs coordonnées." },
      { href: "/conseils", title: "Tous les conseils auto", text: "Voyants, freins, batterie, vidange : des guides pratiques pour le Québec." },
    ] as Theme[],
    factsH2: "Les chiffres, avec leurs sources",
    factsSub: "Chaque donnée indique d'où elle vient. Quand elle n'est pas québécoise ou qu'il s'agit d'une estimation d'éditeur de logiciel, nous le disons.",
    factsGarages: [
      { chiffre: "jusqu'à 21 %", texte: "Des appels reçus par les services automobiles restent sans réponse ou échouent. Un taux sain se situe à 10 % ou moins. Chaque appel manqué est un client qui appelle le garage suivant.", porte: "Amérique du Nord, grands réseaux d'ateliers (analyse de données d'appels, 2026)", source: "Marchex", href: MARCHEX_2026 },
      { chiffre: "≈ 30 %", texte: "Des appels entrants aux centres de services automobiles représentent une occasion de revenu manquée. Une fois sur trois, le rendez-vous n'est pas pris, même quand le client voulait réserver.", porte: "États-Unis, 8,7 millions d'appels analysés (rapport 2019)", source: "Marchex (étude 2019)", href: MARCHEX_2019 },
      { chiffre: "10 à 15 %", texte: "Des rendez-vous ne sont pas honorés dans les garages indépendants qui n'envoient ni rappel ni confirmation. Une demande de confirmation et un rappel sont les moyens les plus simples de les réduire.", porte: "Estimation d'un éditeur de logiciel (France). Aucune statistique indépendante québécoise à notre connaissance.", source: "Car Spot", href: CAR_SPOT },
      { chiffre: "Plus de postes vacants que de travailleurs", texte: "C'est le constat du gouvernement fédéral pour les mécaniciens de véhicules automobiles de la région de Montréal en 2023-2025. Quand l'équipe est rare, chaque heure passée au téléphone est une heure de moins à l'atelier.", porte: "Région de Montréal, métier CNP 72410", source: "Guichet-emplois (Gouvernement du Canada)", href: "https://www.guichetemplois.gc.ca/rapportmarche/perspectives-profession/14857/geo25154" },
    ] as Fait[],
    factsDrivers: [
      { chiffre: "87 %", texte: "Des consommateurs lisent les avis en ligne avant de choisir une entreprise locale. Sur Garago, chaque avis vient d'un conducteur qui a réellement eu un rendez-vous dans le garage.", porte: "Sondage de consommateurs, 2020", source: "BrightLocal, Local Consumer Review Survey", href: BRIGHTLOCAL },
      { chiffre: "76 %", texte: "Des clients d'un service automobile qui ont réservé en ligne disent qu'ils le referaient. La réservation en ligne convainc ceux qui l'essaient.", porte: "États-Unis, clients de services de concessionnaires (2017)", source: "Cox Automotive", href: COX },
      { chiffre: "45 %", texte: "Des clients qui n'avaient pas réservé en ligne ignoraient que l'option existait. Un endroit où l'on voit d'un coup d'œil quels garages prennent les rendez-vous en ligne règle ce problème.", porte: "États-Unis, clients de services de concessionnaires (2017)", source: "Cox Automotive", href: COX },
    ] as Fait[],
    readyH2: "Prêt à essayer ?", readyText: "Garagistes : 30 jours gratuits, annulable en tout temps. Conducteurs : Garago est gratuit.",
    register: "Inscrire mon garage", find: "Trouver un garage",
  },
  en: {
    name: "Why Garago", path: "/en/why-garago",
    h1: "Why Garago?",
    intro: "Auto repair shops lose hours on the phone and slots to missed appointments. Drivers struggle to find an available garage, especially in tire season. Garago connects the two.",
    imGarage: "I own a garage", imDriver: "I'm a driver", garagesId: "garages", driversId: "drivers",
    garagesH2: "For garages", garagesSub: "Fewer calls, fewer no-shows, a calendar that understands your shop.",
    driversH2: "For drivers", driversSub: "Find a garage near you and book, without spending an hour on the phone.",
    read: "Read →", source: "Source:",
    garages: [
      { href: "/en/garage-owners/online-booking", title: "Online booking: the complete guide", text: "Services, times, bays, confirmation and booking link, step by step." },
      { href: "/en/garage-owners/missed-appointments", title: "Reduce missed appointments", text: "Confirmation, day-before reminder, easy cancellation: 7 practical ways to cut no-shows." },
      { href: "/en/garage-owners/sms-appointment-reminders", title: "SMS appointment reminders", text: "When to send them, what to write, and what Canada's anti-spam law says." },
      { href: "/en/garage-owners/online-scheduling-calendar", title: "Choose an online calendar for your shop", text: "Time per service, number of bays, phone bookings: the criteria to check." },
      { href: "/en/garage-owners/auto-repair-shop-software", title: "Auto repair shop software in Quebec", text: "GST/QST invoicing, legally required written estimates, booking: how to choose." },
      { href: "/en/garage-owners/auto-repair-invoice-template", title: "Free auto repair invoice template", text: "Invoice, written estimate and work order in Excel, with GST and QST calculated." },
      { href: "/en/garage-owners/get-more-customers", title: "Get more customers for your shop", text: "Google profile, reviews, online booking, retention: 8 practical actions." },
      { href: "/en/garage-owners/winter-tire-season", title: "Get through winter tire season", text: "Handle the October-to-December rush without overloading the phone or the shop." },
      { href: "/en/garage-owners/open-auto-repair-shop-quebec", title: "Open an auto repair shop in Quebec", text: "NEQ, taxes, zoning, consumer protection, environment: the steps." },
      { href: "/en/garage-owners", title: "Garago for garages: how it works and pricing", text: "What's included, the price, and how to start the 30-day free trial." },
    ] as Theme[],
    drivers: [
      { href: "/en/drivers/book-garage-online", title: "Book your garage online, without calling", text: "Choose the service, date and time from the garage's real availability." },
      { href: "/garages", title: "Find a garage by city or borough", text: "Garages in your area, their reviews and contact details." },
      { href: "/conseils", title: "All car tips", text: "Warning lights, brakes, battery, oil changes: practical guides for Quebec." },
    ] as Theme[],
    factsH2: "The numbers, with their sources",
    factsSub: "Every figure says where it comes from. When it isn't from Quebec or is a software publisher's estimate, we say so.",
    factsGarages: [
      { chiffre: "up to 21%", texte: "Of calls to automotive service departments go unanswered or fail. A healthy rate is 10% or less. Every missed call is a customer who calls the next shop.", porte: "North America, large shop networks (call data analysis, 2026)", source: "Marchex", href: MARCHEX_2026 },
      { chiffre: "≈ 30%", texte: "Of inbound calls to auto service centers are a missed revenue opportunity. One time in three, no appointment is booked, even when the caller wanted to book.", porte: "United States, 8.7 million calls analyzed (2019 report)", source: "Marchex (2019 study)", href: MARCHEX_2019 },
      { chiffre: "10 to 15%", texte: "Of appointments are missed at independent shops that send no reminder or confirmation. A confirmation request and a reminder are the simplest ways to reduce them.", porte: "Software publisher's estimate (France). No independent Quebec statistic to our knowledge.", source: "Car Spot", href: CAR_SPOT },
      { chiffre: "More job openings than workers", texte: "That's the federal government's finding for automotive service technicians in the Montreal region for 2023-2025. When staff is scarce, every hour on the phone is an hour less in the shop.", porte: "Montreal region, NOC 72410", source: "Job Bank (Government of Canada)", href: "https://www.jobbank.gc.ca/marketreport/outlook-occupation/14857/geo25154" },
    ] as Fait[],
    factsDrivers: [
      { chiffre: "87%", texte: "Of consumers read online reviews before choosing a local business. On Garago, every review comes from a driver who actually had an appointment at the garage.", porte: "Consumer survey, 2020", source: "BrightLocal, Local Consumer Review Survey", href: BRIGHTLOCAL },
      { chiffre: "76%", texte: "Of automotive service customers who booked online say they would do it again. Online booking wins over those who try it.", porte: "United States, dealership service customers (2017)", source: "Cox Automotive", href: COX },
      { chiffre: "45%", texte: "Of customers who hadn't booked online didn't know the option existed. A place where you can see at a glance which garages take online bookings solves that.", porte: "United States, dealership service customers (2017)", source: "Cox Automotive", href: COX },
    ] as Fait[],
    readyH2: "Ready to try?", readyText: "Garages: 30 days free, cancel anytime. Drivers: Garago is free.",
    register: "Register my garage", find: "Find a garage",
  },
};

function FaitCard({ f, source }: { f: Fait; source: string }) {
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5">
      <span className="block text-2xl sm:text-3xl font-black leading-tight" style={{ color: "#c2410c" }}>{f.chiffre}</span>
      <span className="block mt-2 text-sm leading-relaxed text-gray-700">{f.texte}</span>
      <span className="block mt-2 text-xs text-gray-500">{f.porte}</span>
      <a href={f.href} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center min-h-[44px] sm:min-h-0 mt-1 text-xs font-semibold underline text-gray-600">
        {source} {f.source}
      </a>
    </li>
  );
}

function ThemeCard({ t, read }: { t: Theme; read: string }) {
  return (
    <li>
      <Link href={t.href}
        className="group block h-full rounded-2xl border border-gray-200 bg-white p-5 hover:border-orange-300 hover:shadow-sm transition">
        <span className="block font-black text-gray-900 group-hover:underline">{t.title}</span>
        <span className="block mt-1.5 text-sm leading-relaxed text-gray-600">{t.text}</span>
        <span className="block mt-3 text-sm font-bold" style={{ color: "#c2410c" }}>{read}</span>
      </Link>
    </li>
  );
}

/** Page « Pourquoi Garago » : guides pour garagistes et conducteurs, calculateur et chiffres sourcés. */
export default function WhyGarago({ lang }: { lang: PageLang }) {
  const c = CONTENT[lang];
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: c.name,
        url: `${BASE_URL}${c.path}`,
        inLanguage: lang === "en" ? "en-CA" : "fr-CA",
        hasPart: [...c.garages, ...c.drivers].map((t) => ({ "@type": "WebPage", name: t.title, url: `${BASE_URL}${t.href}` })),
      }} />

      <section style={{ background: "linear-gradient(135deg,#071428 0%,#0b1f3a 60%,#1a3a6b 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20">
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight" style={{ textWrap: "balance" }}>{c.h1}</h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{c.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`#${c.garagesId}`} className="inline-flex items-center min-h-[44px] px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>{c.imGarage}</a>
            <a href={`#${c.driversId}`} className="inline-flex items-center min-h-[44px] px-5 py-3 rounded-xl text-sm font-bold text-white border border-white/40">{c.imDriver}</a>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-14">
        <section id={c.garagesId} aria-labelledby="h-garagistes">
          <h2 id="h-garagistes" className="text-2xl font-black" style={{ color: "#0b1f3a" }}>{c.garagesH2}</h2>
          <p className="mt-1 text-gray-600">{c.garagesSub}</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {c.garages.map((t) => <ThemeCard key={t.href} t={t} read={c.read} />)}
          </ul>
          <div className="mt-6"><CoutAbsences lang={lang} /></div>
        </section>

        <section id={c.driversId} aria-labelledby="h-conducteurs">
          <h2 id="h-conducteurs" className="text-2xl font-black" style={{ color: "#0b1f3a" }}>{c.driversH2}</h2>
          <p className="mt-1 text-gray-600">{c.driversSub}</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {c.drivers.map((t) => <ThemeCard key={t.href} t={t} read={c.read} />)}
          </ul>
        </section>

        <section aria-labelledby="h-chiffres">
          <h2 id="h-chiffres" className="text-2xl font-black" style={{ color: "#0b1f3a" }}>{c.factsH2}</h2>
          <p className="mt-1 text-gray-600">{c.factsSub}</p>
          <h3 className="mt-6 text-lg font-black" style={{ color: "#0b1f3a" }}>{c.garagesH2}</h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {c.factsGarages.map((f) => <FaitCard key={f.chiffre} f={f} source={c.source} />)}
          </ul>
          <h3 className="mt-8 text-lg font-black" style={{ color: "#0b1f3a" }}>{c.driversH2}</h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {c.factsDrivers.map((f) => <FaitCard key={f.chiffre + f.source} f={f} source={c.source} />)}
          </ul>
        </section>

        <section className="rounded-2xl p-6 sm:p-8" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
          <h2 className="text-xl font-black" style={{ color: "#0b1f3a" }}>{c.readyH2}</h2>
          <p className="mt-1 text-sm text-gray-700">{c.readyText}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/inscription/garage" className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>{c.register}</Link>
            <Link href="/rechercher" className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold border border-gray-300 bg-white text-gray-800">{c.find}</Link>
          </div>
        </section>
      </div>
    </>
  );
}
