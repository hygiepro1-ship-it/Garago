// Recherche avec la position du conducteur (src/app/api/garages/route.ts) : rayons croissants, classement par
// distance, page suivante qui élargit le rayon. Contre le SITE DÉMO (garages de démonstration de la base de test).
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.APERCU_URL ?? "http://localhost:3200";
const MONTREAL = { lat: 45.5019, lng: -73.5674 };

type Result = { total: number; pages: number; radiusKm: number | null; garages: { slug: string; distanceKm: number | null }[] };
const search = async (params: Record<string, string | number>): Promise<Result | null> => {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  return fetch(`${BASE}/api/garages?${qs}`).then((r) => (r.ok ? r.json() : null), () => null);
};

test("position connue : garages proches d'abord, rayon le plus petit qui suffit", async (t) => {
  const first = await search({ ...MONTREAL, limit: 2, page: 1 });
  if (!first) return t.skip("site démo injoignable");
  assert.ok(first.radiusKm != null && first.radiusKm <= 100, `rayon parcouru : ${first.radiusKm}`);
  const d = first.garages.map((g) => g.distanceKm ?? Infinity);
  assert.deepEqual(d, [...d].sort((a, b) => a - b), "classés par distance");
  for (const x of d) assert.ok(x <= first.radiusKm!, "tous dans le rayon annoncé");
  assert.ok(first.pages > 1, "une page de plus est proposée tant que le rayon peut s'élargir");
});

test("page suivante : le rayon s'élargit et la distance ne recule jamais", async (t) => {
  const p1 = await search({ ...MONTREAL, limit: 2, page: 1 });
  const p2 = await search({ ...MONTREAL, limit: 2, page: 2 });
  if (!p1 || !p2) return t.skip("site démo injoignable");
  const last1 = Math.max(...p1.garages.map((g) => g.distanceKm ?? 0));
  for (const g of p2.garages) assert.ok((g.distanceKm ?? Infinity) >= last1);
  const slugs = new Set([...p1.garages, ...p2.garages].map((g) => g.slug));
  assert.equal(slugs.size, p1.garages.length + p2.garages.length, "aucun garage en double entre les pages");
});

test("sans position : comportement inchangé (pas de rayon)", async (t) => {
  const r = await search({ limit: 12 });
  if (!r) return t.skip("site démo injoignable");
  assert.equal(r.radiusKm ?? null, null);
  assert.ok(r.total >= r.garages.length);
});
