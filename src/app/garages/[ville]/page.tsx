import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import JsonLd from "@/components/JsonLd";
import { getCities, publicGarageWhere, MIN_GARAGES_FOR_INDEX } from "@/lib/city-pages";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

// Régénérée une fois par jour : la liste suit les inscriptions sans reconstruire tout le site.
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((c) => ({ ville: c.slug }));
}

async function load(slug: string) {
  const cities = await getCities();
  const info = cities.find((c) => c.slug === slug);
  if (!info) return null;
  const garages = await prisma.garage.findMany({
    where: { ...publicGarageWhere(), city: info.city },
    select: {
      name: true, slug: true, address: true, postalCode: true, phone: true, claimStatus: true,
      reviews: { select: { rating: true } },
    },
    orderBy: { name: "asc" },
  });
  return { info, garages, others: cities.filter((c) => c.slug !== slug && c.count >= MIN_GARAGES_FOR_INDEX).slice(0, 12) };
}

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const data = await load(ville);
  if (!data) return { title: "Ville introuvable | Garago", robots: { index: false, follow: false } };
  const { city, count } = data.info;
  const title = `Garages à ${city} : avis, services et rendez-vous en ligne | Garago`;
  const description = `${count} garage${count > 1 ? "s" : ""} à ${city} (Québec) : adresses, avis de conducteurs et prise de rendez-vous en ligne pour vidange, pneus d'hiver, freins et mécanique générale.`;
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/garages/${ville}` },
    robots: count < MIN_GARAGES_FOR_INDEX ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: `${BASE_URL}/garages/${ville}`, siteName: "Garago", locale: "fr_CA", type: "website" },
  };
}

export default async function CityPage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const data = await load(ville);
  if (!data) notFound();
  const { info, garages, others } = data;
  const city = info.city;
  const rated = garages.map((g) => ({
    ...g,
    avg: g.reviews.length ? g.reviews.reduce((s, r) => s + r.rating, 0) / g.reviews.length : null,
  }));

  const faq = [
    {
      q: `Comment trouver un bon garage à ${city} ?`,
      a: `Comparez les garages de ${city} selon leurs avis de conducteurs, leurs services et la marque de votre véhicule, puis réservez en ligne chez ceux qui offrent la prise de rendez-vous. Sur Garago, chaque avis vient d'un compte de conducteur réel.`,
    },
    {
      q: `Puis-je prendre rendez-vous en ligne dans un garage de ${city} ?`,
      a: `Oui, chez les garages de ${city} qui ont activé la réservation en ligne : vous choisissez le service, la date et l'heure parmi les disponibilités réelles du garage, sans appeler.`,
    },
    {
      q: `Quand faire installer ses pneus d'hiver à ${city} ?`,
      a: `Au Québec, les pneus d'hiver sont obligatoires du 1er décembre au 15 mars. Prenez rendez-vous dès octobre ou novembre : les garages de ${city} se remplissent vite au premier gel.`,
    },
  ];

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
              { "@type": "ListItem", position: 2, name: "Garages par ville", item: `${BASE_URL}/garages` },
              { "@type": "ListItem", position: 3, name: city, item: `${BASE_URL}/garages/${ville}` },
            ],
          },
          {
            "@type": "ItemList",
            name: `Garages à ${city}`,
            numberOfItems: garages.length,
            itemListElement: garages.slice(0, 50).map((g, i) => ({
              "@type": "ListItem", position: i + 1, url: `${BASE_URL}/garage/${g.slug}`, name: g.name,
            })),
          },
          {
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ],
      }} />

      <section style={{ background: "linear-gradient(135deg,#071428 0%,#0b1f3a 60%,#1a3a6b 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <nav aria-label="Fil d'Ariane" className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            <Link href="/" className="hover:underline">Accueil</Link> › <Link href="/garages" className="hover:underline">Garages par ville</Link> › <span aria-current="page">{city}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">Garages à {city}</h1>
          <p className="mt-3 max-w-2xl text-base" style={{ color: "rgba(255,255,255,0.8)" }}>
            {garages.length} garage{garages.length > 1 ? "s" : ""} à {city}, au Québec. Consultez les adresses et les avis de
            conducteurs, puis réservez en ligne votre vidange, vos pneus d&apos;hiver, vos freins ou votre entretien.
          </p>
          <Link href="/rechercher"
            className="inline-flex items-center mt-6 px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>
            Chercher par service ou par marque
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-black mb-4" style={{ color: "#0b1f3a" }}>Tous les garages de {city}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {rated.map((g) => (
            <li key={g.slug}>
              <Link href={`/garage/${g.slug}`}
                className="block h-full rounded-2xl border border-gray-200 bg-white p-4 hover:border-orange-300 hover:shadow-sm transition">
                <span className="block font-bold text-gray-900">{g.name}</span>
                <span className="block text-sm text-gray-600 mt-0.5">{g.address}, {city}{g.postalCode ? ` ${g.postalCode}` : ""}</span>
                <span className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                  {g.avg !== null
                    ? <span className="font-semibold">★ {g.avg.toFixed(1)} · {g.reviews.length} avis</span>
                    : <span>Aucun avis pour l&apos;instant</span>}
                  {g.claimStatus === "activee" && <span className="font-semibold" style={{ color: "#c2410c" }}>Réservation en ligne</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-12">
          <h2 className="text-xl font-black mb-4" style={{ color: "#0b1f3a" }}>Questions fréquentes sur les garages à {city}</h2>
          <div className="space-y-3">
            {faq.map((f) => (
              <details key={f.q} className="rounded-xl border border-gray-200 bg-white p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">{f.q}</summary>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl p-6" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
          <h2 className="text-lg font-black" style={{ color: "#0b1f3a" }}>Vous tenez un garage à {city} ?</h2>
          <p className="mt-1 text-sm text-gray-700">
            Recevez les réservations en ligne 24 h sur 24 et réduisez les rendez-vous manqués grâce à la confirmation automatique.
            Essai gratuit de 30 jours.
          </p>
          <Link href="/garagistes" className="inline-flex items-center min-h-[44px] sm:min-h-0 mt-3 text-sm font-bold underline" style={{ color: "#c2410c" }}>
            Voir comment Garago aide les garages
          </Link>
        </section>

        {others.length > 0 && (
          <nav aria-label="Autres villes" className="mt-12">
            <h2 className="text-base font-black mb-3" style={{ color: "#0b1f3a" }}>Garages dans les secteurs voisins</h2>
            <ul className="flex flex-wrap gap-2">
              {others.map((c) => (
                <li key={c.slug}>
                  <Link href={`/garages/${c.slug}`} className="inline-flex items-center min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-orange-300">
                    {c.city} <span className="ml-1 text-gray-500">({c.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </>
  );
}
