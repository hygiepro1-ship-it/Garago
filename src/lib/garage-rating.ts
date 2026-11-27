// Note d'un garage : une seule règle pour la recherche, la fiche, les pages de ville, le JSON-LD et l'admin.
// Seuls les avis visibles comptent : un avis masqué (contenu offensant, ou retiré par l'équipe Garago après
// un signalement) ne fait ni baisser ni monter la note, et n'entre pas dans le nombre d'avis affiché.
// Un garage ne peut pas masquer lui-même un avis (voir src/app/api/reviews/[id]/hide/route.ts).

/** Filtre Prisma des avis qui comptent dans la note et le nombre d'avis. */
export const VISIBLE_REVIEWS = { isHidden: false } as const;

/** Moyenne arrondie à une décimale (4,25 → 4,3), ou null sans avis. */
export function averageRating(ratings: { rating: number }[]): number | null {
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10;
}
