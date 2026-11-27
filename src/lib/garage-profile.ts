import prisma from "@/lib/prisma";
import { toPublicGarage } from "@/lib/public-garage";
import { VISIBLE_REVIEWS } from "@/lib/garage-rating";

/** Fiche publique d'un garage telle que la page et l'API la renvoient (dates en chaînes). */
export interface PublicGarageProfile {
  id: string; name: string; slug: string; ownerId: string | null; description: string | null;
  address: string; city: string; province: string; postalCode: string; phone: string; email: string | null;
  website: string | null; languages: string | null; yearFounded: number | null; employeeCount: number | null;
  openingHours: string | null; hourlyRate: number | null; latitude: number | null; longitude: number | null;
  logoUrl: string | null; logoPosition: string; coverUrl: string | null; coverPosition: string;
  claimStatus: string; onlineBooking: boolean; acceptsWalkIn: boolean; appointmentOnly: boolean;
  isAmbassador: boolean; emailPublic: boolean; subscriptionStatus: string;
  services: {
    id: string; categoryId: string; name: string; description: string | null;
    priceMin: number | null; priceMax: number | null; durationMin: number | null;
    category: { id: string; name: string; nameEn: string | null; icon: string | null; sortOrder: number };
  }[];
  brands: { id: string; brand: string; accepts: boolean; note: string | null }[];
  availability: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[];
  photos: { id: string; url: string; caption: string | null; sortOrder: number }[];
  reviews: {
    id: string; rating: number; title: string | null; comment: string | null; service: string | null;
    vehicleMake: string | null; vehicleModel: string | null; vehicleYear: number | null; ownerReply: string | null;
    createdAt: string; authorName: string | null; user: { name: string | null; image: string | null } | null;
  }[];
  avgRating: number;
  reviewCount: number;
  /** Présent seulement dans une réponse d'erreur de l'API. */
  error?: string;
}

type Viewer = { id?: string; role?: string } | null | undefined;

/**
 * Données publiques d'une fiche de garage, partagées par la page (rendue côté serveur) et l'API.
 * Renvoie null quand la fiche ne doit pas être montrée à ce visiteur (inexistante, masquée, ou NEQ non
 * vérifié pour quelqu'un d'autre que le propriétaire ou un admin). Le visiteur n'est lu que si nécessaire.
 */
export async function getGarageProfile(slug: string, getViewer: () => Promise<Viewer>): Promise<PublicGarageProfile | null> {
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
        where: VISIBLE_REVIEWS,
        orderBy: { createdAt: "desc" as const },
        take: 20,
      },
      owner: { select: { name: true, email: true } },
      _count: { select: { reviews: { where: VISIBLE_REVIEWS } } },
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

  // Note sur TOUS les avis visibles, pas seulement les 20 affichés sur la fiche.
  const ratingAgg = await prisma.review.aggregate({ where: { garageId: garage.id, ...VISIBLE_REVIEWS }, _avg: { rating: true } });
  const avgRating = ratingAgg._avg.rating ?? 0;

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
