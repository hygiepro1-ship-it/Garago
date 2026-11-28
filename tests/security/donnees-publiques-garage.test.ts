// Données publiques d'un garage (src/lib/public-garage.ts) : liste blanche. Aucune donnée de facturation,
// d'identification (NEQ), de parrainage ou de configuration interne ne sort par la recherche ou la fiche,
// et un champ ajouté plus tard au modèle reste privé tant qu'on ne l'autorise pas explicitement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toPublicGarage, PUBLIC_GARAGE_FIELDS } from "../../src/lib/public-garage";

const row = {
  id: "g1", name: "Garage", slug: "garage", phone: "(514) 555-0123", email: "prive@exemple.com", emailPublic: false,
  ownerId: "u1", subscriptionStatus: "ACTIVE", claimStatus: "activee",
  stripeCustomerId: "cus_123", stripePriceId: "price_1", neq: "1234567890", referralCode: "GAR-X",
  descriptionDraft: "brouillon", verificationStatus: "PENDING", ambassadorTier: 3, capacity: 4, parentId: "g0",
  requireConfirmation: true, hiddenByReport: false, cardReminderCount: 2, createdAt: new Date(), updatedAt: new Date(),
  owner: { email: "proprio@exemple.com" },
  champAjouteDemain: "secret",
  reviews: [{ id: "r1", rating: 5, userId: "client-interne" }],
};

test("seuls les champs de la liste blanche sortent", () => {
  const out = toPublicGarage(row) as Record<string, unknown>;
  for (const k of Object.keys(out)) assert.ok((PUBLIC_GARAGE_FIELDS as readonly string[]).includes(k), `champ non autorisé : ${k}`);
  for (const k of ["stripeCustomerId", "stripePriceId", "neq", "referralCode", "descriptionDraft", "verificationStatus",
    "ambassadorTier", "capacity", "parentId", "requireConfirmation", "hiddenByReport", "cardReminderCount", "owner", "champAjouteDemain"]) {
    assert.ok(!(k in out), `${k} ne doit pas être public`);
  }
});

test("courriel masqué sauf choix du garage ; avis sans identifiant du client", () => {
  const out = toPublicGarage(row) as { email: string | null; reviews: { userId?: string; rating: number }[] };
  assert.equal(out.email, null);
  assert.equal(out.reviews[0].userId, undefined);
  assert.equal(out.reviews[0].rating, 5);
  assert.equal((toPublicGarage({ ...row, emailPublic: true }) as { email: string | null }).email, "prive@exemple.com");
});
