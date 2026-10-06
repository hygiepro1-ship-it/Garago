// Données d'un garage exposées au public (recherche et fiche). Les routes publiques ne doivent jamais
// renvoyer la ligne brute de la base : elle contient des identifiants de facturation, le NEQ, les
// brouillons en modération, l'état du parrainage, et le courriel personnel du propriétaire.

const PRIVATE_KEYS = [
  "stripeCustomerId", "stripePriceId", "subscriptionEndAt", "pastDueSince", "cancelAtPeriodEnd",
  "cardReminderCount", "cardReminderSentAt",
  "neq", "hiddenByReport", "requireConfirmation",
  "descriptionDraft", "descriptionChanges", "descriptionChangesYear",
  "referralCode", "referredByCode", "referralRewardGranted", "referralCount", "referralCommissionEarned",
  "palier2Applied", "palier3Applied", "palier4Expiry", "ambassadorSince",
  "owner",
] as const;

export function toPublicGarage<T extends Record<string, any>>(garage: T): Omit<T, (typeof PRIVATE_KEYS)[number]> {
  const out: Record<string, any> = { ...garage };
  for (const k of PRIVATE_KEYS) delete out[k];
  // Le courriel du garage n'est public que si le garage l'a choisi.
  if (!out.emailPublic) out.email = null;
  // Avis : jamais l'identifiant interne du client.
  if (Array.isArray(out.reviews)) {
    out.reviews = out.reviews.map((r: Record<string, any>) => {
      const { userId: _u, ...rest } = r;
      return rest;
    });
  }
  return out as Omit<T, (typeof PRIVATE_KEYS)[number]>;
}
