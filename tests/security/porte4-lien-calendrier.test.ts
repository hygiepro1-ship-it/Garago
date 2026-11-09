// Porte 4 — À qui appartient chaque donnée : le fichier calendrier (.ics) d'un rendez-vous révèle le garage,
// le service et le véhicule. Il ne doit s'ouvrir qu'avec le lien remis au client (jeton signé) ou pour
// le client et le garage connectés — jamais en connaissant seulement l'identifiant du rendez-vous.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { icsToken, verifyIcsToken } from "@/lib/ics-token";

test("le jeton remis avec le rendez-vous ouvre son fichier calendrier", () => {
  assert.equal(verifyIcsToken("rdv_123", icsToken("rdv_123")), true);
});

test("sans jeton, ou avec un jeton inventé, le fichier calendrier reste fermé", () => {
  assert.equal(verifyIcsToken("rdv_123", null), false);
  assert.equal(verifyIcsToken("rdv_123", ""), false);
  assert.equal(verifyIcsToken("rdv_123", "0".repeat(32)), false);
});

test("le jeton d'un rendez-vous n'ouvre pas celui d'un autre", () => {
  assert.equal(verifyIcsToken("rdv_456", icsToken("rdv_123")), false);
});

test("la route du calendrier vérifie le jeton ou la session avant de lire le rendez-vous", () => {
  const src = readFileSync("src/app/api/appointments/[id]/ics/route.ts", "utf8");
  assert.match(src, /verifyIcsToken\(/, "la route ne vérifie aucun jeton");
  assert.match(src, /getServerSession\(/, "la route ne reconnaît pas le client ou le garage connecté");
});
