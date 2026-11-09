import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

/**
 * La fiche publique /garage/[slug] est en cache (ISR, une heure). Après toute modification de ce qu'elle
 * affiche (profil, services, horaires, photos, avis, vérification, abonnement…), on la fait régénérer tout
 * de suite pour que le garage voie son changement sans attendre. Ne fait jamais échouer la requête appelante.
 */
export async function revalidateGarage(ref: { id?: string | null; slug?: string | null }) {
  try {
    let slug = ref.slug ?? null;
    if (!slug && ref.id) {
      const g = await prisma.garage.findUnique({ where: { id: ref.id }, select: { slug: true } });
      slug = g?.slug ?? null;
    }
    if (slug) revalidatePath(`/garage/${slug}`);
  } catch (err) {
    console.error("revalidateGarage", err);
  }
}

/** Toutes les fiches d'un coup (modifications en lot : cron, synchronisation Stripe). */
export function revalidateAllGarages() {
  try {
    revalidatePath("/garage/[slug]", "page");
  } catch (err) {
    console.error("revalidateAllGarages", err);
  }
}
