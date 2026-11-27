// Données d'un garage exposées au public (recherche et fiche). Les routes publiques ne renvoient jamais la ligne
// brute de la base : elle contient des identifiants de facturation, le NEQ, les brouillons en modération,
// l'état du parrainage, la configuration interne de l'atelier et le courriel personnel du propriétaire.
//
// Liste BLANCHE : seuls les champs listés ici sortent. Un champ ajouté plus tard au modèle Garage reste privé
// tant qu'on ne l'ajoute pas volontairement ci-dessous (test : tests/security/donnees-publiques-garage.test.ts).

export const PUBLIC_GARAGE_FIELDS = [
  // Identité et coordonnées
  "id", "name", "slug", "description", "address", "city", "province", "postalCode", "phone", "email", "website",
  "latitude", "longitude", "languages", "yearFounded", "employeeCount", "openingHours", "hourlyRate",
  // Images
  "logoUrl", "logoPosition", "coverUrl", "coverPosition",
  // Ce que la fiche affiche ou décide
  "claimStatus",        // fiche activée ou non (bouton « Activez votre page »)
  "onlineBooking",      // réservation en ligne ouverte
  "acceptsWalkIn", "appointmentOnly",
  "isAmbassador",       // badge « garage certifié »
  "subscriptionStatus", // badge « Période d'essai » de la fiche
  "emailPublic",
  // ownerId : sert à la fiche pour reconnaître son propriétaire ; seul, il ne donne accès à rien
  // (toutes les routes vérifient la session). Voir SECURITE.md.
  "ownerId",
  // Relations chargées par les routes publiques
  "services", "brands", "availability", "photos", "reviews",
] as const;

type PublicKey = (typeof PUBLIC_GARAGE_FIELDS)[number];

type Review = Record<string, unknown> & { userId?: unknown };

export function toPublicGarage<T extends Record<string, unknown>>(garage: T): Pick<T, Extract<keyof T, PublicKey>> {
  const out: Record<string, unknown> = {};
  for (const k of PUBLIC_GARAGE_FIELDS) if (k in garage) out[k] = garage[k];
  // Le courriel du garage n'est public que si le garage l'a choisi.
  if (!out.emailPublic) out.email = null;
  // Avis : jamais l'identifiant interne du client.
  if (Array.isArray(out.reviews)) {
    out.reviews = (out.reviews as Review[]).map((r) => {
      const rest = { ...r };
      delete rest.userId;
      return rest;
    });
  }
  return out as Pick<T, Extract<keyof T, PublicKey>>;
}
