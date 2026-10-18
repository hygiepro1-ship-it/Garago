import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getCities, MIN_GARAGES_FOR_INDEX } from "@/lib/city-pages";
import NearbySearch from "./NearbySearch";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Garages à Montréal et environs, par secteur | Garago",
  description: "Les garages de Montréal et des environs, par arrondissement et par ville : adresses, téléphones et avis. Cherchez aussi autour de votre code postal.",
  alternates: { canonical: `${BASE_URL}/garages` },
};

export default async function CitiesIndex() {
  const cities = (await getCities()).filter((c) => c.count >= MIN_GARAGES_FOR_INDEX);
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Garages par ville", item: `${BASE_URL}/garages` },
        ],
      }} />
      {/* Couverture réelle : pour l'instant, Montréal et ses environs (d'autres villes s'ajouteront avec les garages) */}
      <h1 className="text-3xl font-black" style={{ color: "#0b1f3a" }}>Garages à Montréal et dans les environs</h1>
      <p className="mt-3 max-w-2xl text-gray-600">
        Cherchez les garages autour de chez vous avec votre code postal ou votre position, ou choisissez votre arrondissement ou votre ville.
      </p>
      <NearbySearch />
      <h2 className="mt-10 text-lg font-black" style={{ color: "#0b1f3a" }}>Par arrondissement et par ville</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {cities.map((c) => (
          <li key={c.slug}>
            <Link href={`/garages/${c.slug}`} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 min-h-[44px] hover:border-orange-300">
              <span className="font-semibold text-gray-900">Garages à {c.city}</span>
              <span className="text-sm text-gray-500">{c.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
