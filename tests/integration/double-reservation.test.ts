// Double réservation : test d'intégration contre le SITE DÉMO (serveur `garago-apercu`, base Neon de test).
//
// Prérequis : le serveur démo tourne (`node scripts/dev-apercu.mjs`, port 3200) ; `.env.apercu.local` contient
// l'adresse de la base de test et le mot de passe de garage1@exemple.com (ligne « # garage1@exemple.com : … »).
// Sans serveur joignable, les tests sont ignorés. Ils ne touchent jamais la production (garde-fou db-guard).
//
// Lancer :  npm run test:integration
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { assertDatabaseAllowed } from "../../src/lib/db-guard";
import { addDaysStr, dayOfWeekOf, quebecToday } from "../../src/lib/availability";

const BASE = process.env.APERCU_URL ?? "http://localhost:3200";
const TAG = "[test-integration]";
const GARAGE_EMAIL = "garage1@exemple.com"; // Garage Tremblay & Fils, capacité 1, ouvert du lundi au vendredi 08:00–17:30

const envFile = readFileSync(".env.apercu.local", "utf8");
const dbUrl = /^DATABASE_URL_APERCU=["']?([^"'\r\n]+)/m.exec(envFile)?.[1];
const password = new RegExp(`^#\\s*${GARAGE_EMAIL.replace(".", "\\.")}\\s*:\\s*(\\S+)`, "m").exec(envFile)?.[1];

let db: Pool;
let cookie = "";
let garageId = "";
let serverUp = false;

/** Jour ouvrable à environ 40 jours : loin des rendez-vous réels de démo, dans la fenêtre de 120 jours. */
function testDate(offset: number): string {
  let d = addDaysStr(quebecToday(), 40 + offset);
  while (dayOfWeekOf(d) === 0 || dayOfWeekOf(d) === 6) d = addDaysStr(d, 1);
  return d;
}

async function cleanup() {
  await db.query(`DELETE FROM "Appointment" WHERE "garageId" = $1 AND notes LIKE $2`, [garageId, `%${TAG}%`]);
  await db.query(`DELETE FROM "Customer" WHERE "garageId" = $1 AND name LIKE 'Test Concurrence%'`, [garageId]);
  // Plafonds anti-abus de l'IP locale (6 réservations / heure) : remis à zéro pour pouvoir répéter le test.
  await db.query(`DELETE FROM "RegistrationAttempt" WHERE ip LIKE 'bk:%'`);
}

async function login(): Promise<string> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const jar = csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]);
  const { csrfToken } = await csrfRes.json();
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST", redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: jar.join("; ") },
    body: new URLSearchParams({ csrfToken, email: GARAGE_EMAIL, password: password ?? "", json: "true" }),
  });
  const all = [...jar, ...res.headers.getSetCookie().map((c) => c.split(";")[0])];
  if (!all.some((c) => c.includes("session-token="))) throw new Error("Connexion du garage de test impossible");
  return all.join("; ");
}

const online = (date: string, startTime: string, i: number) => fetch(`${BASE}/api/appointments`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    garageId, date, startTime, customerName: `Test Concurrence ${i}`,
    customerPhone: `514555${String(1000 + i).slice(-4)}`, customerEmail: `concurrence${i}@exemple.com`, notes: TAG,
  }),
});

const manual = (date: string, startTime: string) => fetch(`${BASE}/api/garage/appointments`, {
  method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ date, startTime, durationMin: 60, customerName: "Test Concurrence garage", customerPhone: "(514) 555-0999", notes: TAG }),
});

async function activeAt(date: string, startTime: string): Promise<number> {
  const r = await db.query(
    `SELECT count(*)::int AS n FROM "Appointment" WHERE "garageId" = $1 AND date = $2 AND "startTime" = $3 AND status NOT IN ('CANCELLED','NO_SHOW')`,
    [garageId, date, startTime],
  );
  return r.rows[0].n;
}

before(async () => {
  serverUp = await fetch(`${BASE}/api/auth/csrf`).then((r) => r.ok, () => false);
  if (!serverUp) return;
  assert.ok(dbUrl, "DATABASE_URL_APERCU absent de .env.apercu.local");
  assertDatabaseAllowed([dbUrl], {});
  db = new Pool({ connectionString: dbUrl });
  const g = await db.query(`SELECT g.id FROM "Garage" g JOIN "User" u ON u.id = g."ownerId" WHERE u.email = $1 AND g."parentId" IS NULL`, [GARAGE_EMAIL]);
  garageId = g.rows[0]?.id;
  assert.ok(garageId, "garage de test introuvable");
  await cleanup();
  cookie = await login();
});

after(async () => {
  if (!db) return;
  await cleanup();
  await db.end();
});

test("garage et clients en ligne au même moment sur la dernière place : un seul rendez-vous", async (t) => {
  if (!serverUp) return t.skip("site démo injoignable");
  const date = testDate(0);
  for (const startTime of ["09:00", "11:00", "14:00", "15:00"]) {
    await db.query(`DELETE FROM "RegistrationAttempt" WHERE ip LIKE 'bk:%'`);
    const results = await Promise.all([manual(date, startTime), online(date, startTime, 1), online(date, startTime, 2), manual(date, startTime)]);
    const created = results.filter((r) => r.status === 201).length;
    assert.equal(created, 1, `${startTime} : ${created} rendez-vous créés (statuts ${results.map((r) => r.status).join(", ")})`);
    for (const r of results) if (r.status !== 201) assert.equal(r.status, 409);
    assert.equal(await activeAt(date, startTime), 1);
  }
});

test("réactiver un rendez-vous absent sur une place reprise est refusé", async (t) => {
  if (!serverUp) return t.skip("site démo injoignable");
  const date = testDate(1);
  const first = await manual(date, "10:00");
  assert.equal(first.status, 201);
  const { id } = await first.json();
  // Le client ne vient pas ; la place est redonnée à un autre client.
  const noShow = await fetch(`${BASE}/api/appointments/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ status: "NO_SHOW" }),
  });
  assert.equal(noShow.status, 200);
  assert.equal((await manual(date, "10:00")).status, 201);
  // « Annuler le statut absent » : refusé, la porte est occupée.
  const back = await fetch(`${BASE}/api/appointments/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ status: "CONFIRMED" }),
  });
  assert.equal(back.status, 409);
  assert.equal(await activeAt(date, "10:00"), 1);
});

test("réservation en ligne seule, puis déplacement par le garage : libre accepté, occupé refusé", async (t) => {
  if (!serverUp) return t.skip("site démo injoignable");
  const date = testDate(3);
  await db.query(`DELETE FROM "RegistrationAttempt" WHERE ip LIKE 'bk:%'`);
  const booked = await online(date, "08:00", 7);
  assert.equal(booked.status, 201);
  const { id } = await booked.json();
  assert.equal((await manual(date, "10:00")).status, 201);
  const move = (startTime: string, endTime: string) => fetch(`${BASE}/api/appointments/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ date, startTime, endTime }),
  });
  assert.equal((await move("09:00", "10:00")).status, 200);
  assert.equal((await move("10:00", "11:00")).status, 409);
  assert.equal(await activeAt(date, "09:00"), 1);
  assert.equal(await activeAt(date, "10:00"), 1);
});

test("réactiver un rendez-vous absent quand la place est restée libre fonctionne", async (t) => {
  if (!serverUp) return t.skip("site démo injoignable");
  const date = testDate(2);
  const first = await manual(date, "13:00");
  const { id } = await first.json();
  const patch = (status: string) => fetch(`${BASE}/api/appointments/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ status }),
  });
  assert.equal((await patch("NO_SHOW")).status, 200);
  assert.equal((await patch("CONFIRMED")).status, 200);
  assert.equal(await activeAt(date, "13:00"), 1);
});
