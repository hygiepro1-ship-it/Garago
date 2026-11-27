// Courriels envoyés aux clients (src/lib/email.ts) : dans la langue du client.
// Aucun courriel ne part : l'appel à Resend est intercepté (fetch remplacé) et son contenu est lu.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

type Sent = { subject: string; html: string };
let sent: Sent[] = [];
const realFetch = globalThis.fetch;

before(() => {
  process.env.RESEND_API_KEY = "re_test_unitaire";
  globalThis.fetch = (async (_url: unknown, init?: { body?: unknown }) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    sent.push({ subject: body.subject, html: body.html });
    return new Response(JSON.stringify({ id: "test" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
});

after(() => {
  globalThis.fetch = realFetch;
});

const base = {
  to: "client@exemple.com", customerName: "Marc", garageName: "Garage Test", garagePhone: "(514) 555-0123",
  garageAddress: "1 rue Test, Montréal", date: "2026-12-01", startTime: "16:00", endTime: "17:00",
  serviceName: "Vidange d'huile", appointmentId: "rdv123",
  confirmUrl: "https://garagopro.ca/rdv/confirmer/abc", cancelUrl: "https://garagopro.ca/rdv/confirmer/abc?action=cancel",
  retakeUrl: "https://garagopro.ca/rdv/confirmer/abc",
};

// Chaque courriel, appelé avec la langue demandée.
async function all(lang?: "fr" | "en") {
  process.env.NEXTAUTH_SECRET ??= "secret-de-test-uniquement";
  const m = await import("../../src/lib/email");
  const p = { ...base, ...(lang ? { lang } : {}) };
  sent = [];
  await m.sendArrivalReminder(p);
  await m.sendBookingConfirmation({ ...p, confirmUrl: undefined, cancelUrl: undefined });
  await m.sendBookingConfirmation({ ...p, confirmDeadline: lang === "en" ? "by 5:00 p.m." : "avant 17 h" });
  await m.sendRescheduleNotification(p);
  await m.sendRescheduleNotification({ ...p, what: "service" });
  await m.sendCancelledByGarage(p);
  await m.sendConfirmationRequest({ ...p, deadline: "x", variant: "request" });
  await m.sendConfirmationRequest({ ...p, deadline: "x", variant: "nudge" });
  await m.sendSlotReleased(p);
  return sent;
}

const FRENCH_WORDS = /Bonjour|Rendez-vous|rendez-vous|créneau|Adresse|Heure|Vidange|décembre|Confirmez|annul/;

test("client anglophone : aucun courriel ne contient de français, date et service traduits", async () => {
  const mails = await all("en");
  assert.equal(mails.length, 9);
  for (const m of mails) {
    assert.doesNotMatch(m.subject, FRENCH_WORDS, `sujet en français : ${m.subject}`);
    // On ignore l'adresse du garage (saisie par le garage) et les liens.
    const text = m.html.replace(/1 rue Test, Montréal/g, "").replace(/href="[^"]*"/g, "");
    assert.doesNotMatch(text, /Bonjour|Rendez-vous confirmé|créneau|Adresse|Vidange|décembre|Confirmez|Je confirme/, `texte français dans : ${m.subject}`);
    assert.match(m.html, /Hello Marc/);
  }
  assert.ok(mails.some((m) => /December 1, 2026/.test(m.html)));
  assert.ok(mails.some((m) => /Oil change/.test(m.html)));
  assert.equal(mails[0].subject, "On your way? Garage Test at 16:00");
  assert.equal(mails[1].subject, "Appointment at Garage Test: December 1, 2026 at 16:00");
});

test("client francophone, ou langue inconnue : courriels en français, identiques entre eux", async () => {
  const fr = await all("fr");
  const unknown = await all();
  assert.equal(fr.length, 9);
  assert.deepEqual(unknown, fr);
  for (const m of fr) assert.match(m.html, /Bonjour Marc/);
  assert.equal(fr[0].subject, "Vous arrivez ? Garage Test à 16:00");
});
