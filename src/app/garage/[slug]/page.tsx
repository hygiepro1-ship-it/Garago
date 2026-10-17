import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGarageProfile } from "@/lib/garage-profile";
import { slugify } from "@/lib/utils";
import L from "@/components/L";
import GarageProfileClient from "./GarageProfileClient";

export default async function GarageProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const garage = await getGarageProfile(slug, async () => {
    const session = await getServerSession(authOptions);
    return session?.user ? { id: session.user.id, role: (session.user as any).role } : null;
  });
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
