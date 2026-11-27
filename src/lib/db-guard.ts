// Garde-fou : la base de PRODUCTION n'est utilisable que par le site en ligne (Vercel, environnement
// « production »). Sur un ordinateur, un serveur de développement, un script ou un déploiement de
// prévisualisation, une adresse de production est refusée avant toute connexion : sinon un test local
// lit et modifie les vraies données des clients (et `prisma db push` change leur schéma).
//
// Exception volontaire, pour un script qu'on veut vraiment lancer sur la production :
//   ALLOW_PRODUCTION_DB=1 npx tsx scripts/mon-script.ts

/** Fragment d'hôte de la branche Neon de production (même valeur que scripts/comptes-test-apercu.ts). */
export const PRODUCTION_DB_HOST = "ep-quiet-resonance";

type Env = Record<string, string | undefined>;

export function isProductionDatabaseUrl(url: string | undefined | null): boolean {
  return !!url && url.includes(PRODUCTION_DB_HOST);
}

export function productionDatabaseAllowed(env: Env = process.env): boolean {
  return env.VERCEL_ENV === "production" || env.ALLOW_PRODUCTION_DB === "1";
}

/** Lève une erreur si l'une des adresses désigne la production hors du site en ligne. */
export function assertDatabaseAllowed(urls: (string | undefined | null)[], env: Env = process.env): void {
  if (productionDatabaseAllowed(env)) return;
  if (urls.some(isProductionDatabaseUrl)) {
    throw new Error(
      "Base de PRODUCTION refusée hors du site en ligne. Utilisez la base de test (.env.local), " +
      "ou ALLOW_PRODUCTION_DB=1 pour un script voulu sur la production.",
    );
  }
}
