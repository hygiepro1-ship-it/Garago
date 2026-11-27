// Garde-fou de la base de production (src/lib/db-guard.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertDatabaseAllowed, isProductionDatabaseUrl, PRODUCTION_DB_HOST } from "../../src/lib/db-guard";

const PROD = `postgresql://u:p@${PRODUCTION_DB_HOST}-pooler.example.neon.tech/neondb`;
const TEST = "postgresql://u:p@ep-round-wave-pooler.example.neon.tech/neondb";

test("l'adresse de production est reconnue, pas celle de test", () => {
  assert.equal(isProductionDatabaseUrl(PROD), true);
  assert.equal(isProductionDatabaseUrl(TEST), false);
  assert.equal(isProductionDatabaseUrl(undefined), false);
});

test("hors de Vercel Production, la base de production est refusée", () => {
  assert.throws(() => assertDatabaseAllowed([PROD], {}), /PRODUCTION refusée/);
  assert.throws(() => assertDatabaseAllowed([TEST, PROD], { VERCEL_ENV: "preview" }), /PRODUCTION refusée/);
  assert.throws(() => assertDatabaseAllowed([PROD], { VERCEL_ENV: "development" }), /PRODUCTION refusée/);
});

test("le site en ligne et l'exception explicite passent ; la base de test passe toujours", () => {
  assert.doesNotThrow(() => assertDatabaseAllowed([PROD], { VERCEL_ENV: "production" }));
  assert.doesNotThrow(() => assertDatabaseAllowed([PROD], { ALLOW_PRODUCTION_DB: "1" }));
  assert.doesNotThrow(() => assertDatabaseAllowed([TEST], {}));
  assert.doesNotThrow(() => assertDatabaseAllowed([undefined], {}));
});
