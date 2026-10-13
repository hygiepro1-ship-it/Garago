import prisma from "@/lib/prisma";
import { activeSubscriptionOr } from "@/lib/garage-access";
import { slugify } from "@/lib/utils";

/** Garages visibles du public : mêmes règles que le plan du site. */
export function publicGarageWhere() {
  const subOr = activeSubscriptionOr();
  return {
    hiddenByReport: false,
    OR: [
      { parentId: null, verificationStatus: "APPROVED", OR: subOr },
      { parent: { verificationStatus: "APPROVED", OR: subOr } },
      { claimStatus: "non_reclamee" },
    ],
  };
}

/** Nombre minimum de garages pour qu'une page de ville soit indexée (une page presque vide nuit au référencement). */
export const MIN_GARAGES_FOR_INDEX = 3;

export interface CityInfo { city: string; slug: string; count: number }

/** Villes et arrondissements qui ont des garages visibles, du plus fourni au moins fourni. */
export async function getCities(): Promise<CityInfo[]> {
  const rows = await prisma.garage.groupBy({
    by: ["city"],
    where: publicGarageWhere(),
    _count: { _all: true },
  });
  return rows
    .filter((r) => r.city && slugify(r.city))
    .map((r) => ({ city: r.city, slug: slugify(r.city), count: r._count._all }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "fr"));
}
