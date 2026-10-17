import prisma from "@/lib/prisma";
import { toPublicGarage } from "@/lib/public-garage";

type Viewer = { id?: string; role?: string } | null | undefined;

/**
 * Données publiques d'une fiche de garage, partagées par la page (rendue côté serveur) et l'API.
 * Renvoie null quand la fiche ne doit pas être montrée à ce visiteur (inexistante, masquée, ou NEQ non
 * vérifié pour quelqu'un d'autre que le propriétaire ou un admin). Le visiteur n'est lu que si nécessaire.
 */
export async function getGarageProfile(slug: string, getViewer: () => Promise<Viewer>) {
  const garage = await prisma.garage.findUnique({
    where: { slug },
    include: {
      services: {
        include: { category: true },
        where: { active: true },
      },
      brands: { orderBy: { brand: "asc" } },
      availability: { orderBy: { dayOfWeek: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        where: { isHidden: false },
        orderBy: { createdAt: "desc" as const },
        take: 20,
      },
      owner: { select: { name: true, email: true } },
      _count: { select: { reviews: true } },
    },
  });

  if (!garage) return null;

  // Fiche non activée masquée suite à une demande de retrait — en attente
  // de traitement par un admin (voir POST .../report).
  if (garage.hiddenByReport) return null;

  // Un garage non vérifié (NEQ en attente/refusé) n'est visible que pour son
  // propriétaire (aperçu) ou un admin — pas au public, même par lien direct.
  if (garage.verificationStatus !== "APPROVED") {
    const viewer = await getViewer();
    const isOwner = !!viewer?.id && viewer.id === garage.ownerId;
    const isAdmin = viewer?.role === "ADMIN";
    if (!isOwner && !isAdmin) return null;
  }

  const avgRating =
    garage.reviews.length > 0
      ? garage.reviews.reduce((s, r) => s + r.rating, 0) / garage.reviews.length
      : 0;

  // Sort services by category sortOrder in JS (avoids relation-level orderBy issues)
  const services = [...garage.services].sort(
    (a, b) => (a.category?.sortOrder ?? 0) - (b.category?.sortOrder ?? 0)
  );

  // Même forme que la réponse JSON de l'API (dates en chaînes), pour passer tel quel à un composant client.
  return JSON.parse(JSON.stringify({
    ...toPublicGarage(garage),
    services,
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount: garage._count.reviews,
  }));
}
