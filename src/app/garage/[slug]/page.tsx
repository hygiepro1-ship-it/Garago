import Link from "next/link";
import { notFound } from "next/navigation";
import { getGarageProfile } from "@/lib/garage-profile";
import { slugify } from "@/lib/utils";
import L from "@/components/L";
import GarageProfileClient from "./GarageProfileClient";

// Fiche mise en cache (ISR) : avant, chaque visite (robots compris) relançait un rendu serveur complet avec
// la base de données, ce qui épuisait le temps de calcul Vercel. La fiche est régénérée au plus une fois par
// heure, et tout de suite après une modification par le garage ou un admin (revalidateGarage).
export const revalidate = 3600;
// Aucune fiche générée au build : chacune est rendue à sa première visite, puis servie depuis le cache.
export function generateStaticParams() {
  return [];
}

export default async function GarageProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Pas de session lue ici (elle rendrait la page dynamique) : une fiche non vérifiée renvoie un 404 public,
  // et son propriétaire ou un admin la voit quand même grâce à not-found.tsx, qui passe par l'API avec sa session.
  const garage = await getGarageProfile(slug, async () => null);
  // Garage inexistant, masqué ou non vérifié : vraie page 404 (pas une page « introuvable » en 200).
  if (!garage) notFound();

  const villeSlug = garage.city ? slugify(garage.city) : "";
  return (
    <>
      {/* Fil d'Ariane : relie la fiche à la page des garages de sa ville */}
      <nav aria-label="Fil d'Ariane" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 -mb-2 text-xs text-gray-500">
        <Link href="/" className="hover:underline"><L fr="Accueil" en="Home" /></Link>
        {" › "}
        <Link href="/garages" className="hover:underline"><L fr="Garages" en="Garages" /></Link>
        {villeSlug && (
          <>
            {" › "}
            <Link href={`/garages/${villeSlug}`} className="hover:underline">{garage.city}</Link>
          </>
        )}
        {" › "}
        <span className="text-gray-700">{garage.name}</span>
      </nav>
      <GarageProfileClient initialGarage={garage} />
    </>
  );
}
