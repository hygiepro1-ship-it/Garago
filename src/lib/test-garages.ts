// Garages de test : gardés en base pour les essais (réservation, courriels), mais retirés du site public.
// Leur fiche reste accessible par lien direct, en noindex, et n'apparaît ni dans les listes, ni dans la
// recherche, ni dans le sitemap.
export const TEST_GARAGE_SLUGS = ["garage-tremblay-fils"];

export const isTestGarage = (slug: string) => TEST_GARAGE_SLUGS.includes(slug);

/** Condition Prisma qui exclut les garages de test d'une requête publique. */
export const notTestGarage = () => ({ slug: { notIn: TEST_GARAGE_SLUGS } });
