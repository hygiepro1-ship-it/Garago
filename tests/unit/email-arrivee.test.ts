// Courriel « Vous arrivez ? » (src/lib/email.ts) : envoyé dans la langue du client.
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

const params = {
  to: "client@exemple.com", customerName: "Marc", garageName: "Garage Test", garagePhone: "(514) 555-0123",
  garageAddress: "1 rue Test, Montréal", date: "2026-12-01", startTime: "16:00", endTime: "17:00",
  serviceName: "Vidange d'huile", confirmUrl: "https://garagopro.ca/rdv/confirmer/abc",
};

test("client anglophone : sujet, textes, date et service en anglais", async () => {
  sent = [];
  const { sendArrivalReminder } = await import("../../src/lib/email");
  await sendArrivalReminder({ ...params, lang: "en" });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, "On your way? Garage Test at 16:00");
  assert.match(sent[0].html, /your appointment is in about 2 hours/);
  assert.match(sent[0].html, /View or cancel my appointment/);
  assert.match(sent[0].html, /December 1, 2026/);
  assert.match(sent[0].html, /Oil change/);
  assert.doesNotMatch(sent[0].html, /Vous arrivez|Bonjour|Adresse/);
});

test("client francophone, ou langue inconnue : courriel inchangé, en français", async () => {
  sent = [];
  const { sendArrivalReminder } = await import("../../src/lib/email");
  await sendArrivalReminder({ ...params, lang: "fr" });
  await sendArrivalReminder(params);
  assert.equal(sent.length, 2);
  for (const s of sent) {
    assert.equal(s.subject, "Vous arrivez ? Garage Test à 16:00");
    assert.match(s.html, /votre rendez-vous a lieu dans environ 2 heures/);
    assert.match(s.html, /Vidange d(&#39;|')huile/);
  }
});
