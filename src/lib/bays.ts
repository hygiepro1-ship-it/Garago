// Règles de postes d'un garage : quels services se font à quels postes.
// Lu côté serveur au moment de proposer un créneau ou d'attribuer un poste.

import { prisma } from "@/lib/prisma";
import { allowedBaysFor, bayVersatility } from "@/lib/availability";

export interface BayRules {
  /** Postes autorisés pour ces services (identifiants de catégorie). */
  forCategories: (categoryIds: string[]) => number[];
  /** Postes autorisés pour un rendez-vous dont on ne connaît que le nom de service (« Freins + Vidange d'huile »). */
  forServiceName: (serviceName: string | null | undefined) => number[];
  /** Nombre de services possibles par poste (indice = numéro − 1) : sert à choisir le poste le plus spécialisé. */
  versatility: number[];
}

export async function loadBayRules(garageId: string, capacity: number): Promise<BayRules> {
  const services = await prisma.garageService.findMany({
    where: { garageId, active: true },
    select: { categoryId: true, bays: true, category: { select: { name: true } } },
  });
  const byCategory = new Map(services.map((s) => [s.categoryId, s.bays]));
  const byName = new Map(services.map((s) => [s.category.name.trim().toLowerCase(), s.bays]));
  return {
    forCategories: (ids) => allowedBaysFor(capacity, ids.map((id) => byCategory.get(id) ?? [])),
    forServiceName: (name) => allowedBaysFor(
      capacity,
      (name ?? "").split("+").map((part) => byName.get(part.trim().toLowerCase()) ?? []),
    ),
    versatility: bayVersatility(capacity, services.map((s) => s.bays)),
  };
}
