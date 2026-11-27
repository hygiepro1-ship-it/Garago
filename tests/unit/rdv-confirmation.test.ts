// Cycle de confirmation des rendez-vous (src/lib/rdv-confirmation.ts). Règle du projet pilote à préserver :
// un rendez-vous saisi par le garage (MANUAL) n'est jamais libéré automatiquement.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planConfirmation, planManualConfirmation, standardDeadline, manualDeadline, quebecInstant, quebecDateStr,
  wantsEmailReminder,
} from "../../src/lib/rdv-confirmation";

test("rappel de la veille par courriel : seulement par le moyen choisi par le client", () => {
  assert.equal(wantsEmailReminder({ source: "ONLINE", contactChannel: null }), true);
  assert.equal(wantsEmailReminder({ source: "MANUAL", contactChannel: "EMAIL" }), true);
  assert.equal(wantsEmailReminder({ source: "MANUAL", contactChannel: "SMS" }), false);
  assert.equal(wantsEmailReminder({ source: "MANUAL", contactChannel: null }), false); // « aucun message »
});

const H = 60 * 60 * 1000;
const NOW = new Date("2026-12-01T15:00:00Z");
const inHours = (h: number) => new Date(NOW.getTime() + h * H);

test("heure du Québec : heure avancée et heure normale", () => {
  assert.equal(quebecInstant("2026-07-01", "12:00").toISOString(), "2026-07-01T16:00:00.000Z");
  assert.equal(quebecInstant("2026-01-15", "12:00").toISOString(), "2026-01-15T17:00:00.000Z");
  assert.equal(quebecDateStr(new Date("2026-12-02T03:30:00Z")), "2026-12-01"); // 22 h 30 la veille au Québec
});

test("en ligne, plus de 24 h avant : confirmation planifiée, aucune échéance encore", () => {
  const p = planConfirmation(inHours(72), NOW, { enabled: true, hasEmail: true });
  assert.equal(p.confirmationStatus, "SCHEDULED");
  assert.equal(p.confirmTier, "STANDARD");
  assert.equal(p.confirmBy, null);
  assert.match(p.confirmToken ?? "", /^[a-f0-9]{48}$/);
});

test("en ligne, entre 2 h et 24 h : confirmation exigée dans l'heure", () => {
  const p = planConfirmation(inHours(10), NOW, { enabled: true, hasEmail: true });
  assert.equal(p.confirmationStatus, "AWAITING");
  assert.equal(p.confirmTier, "LAST_MINUTE");
  assert.equal(p.confirmBy?.getTime(), NOW.getTime() + H);
  assert.equal(p.confirmRequestedAt?.getTime(), NOW.getTime());
});

test("en ligne : rien à confirmer à moins de 2 h, sans courriel, ou si le garage l'a désactivé", () => {
  for (const p of [
    planConfirmation(inHours(1), NOW, { enabled: true, hasEmail: true }),
    planConfirmation(inHours(72), NOW, { enabled: true, hasEmail: false }),
    planConfirmation(inHours(72), NOW, { enabled: false, hasEmail: true }),
  ]) {
    assert.equal(p.confirmationStatus, "NOT_REQUIRED");
    assert.equal(p.confirmToken, null);
  }
});

test("deux jetons de confirmation ne sont jamais identiques", () => {
  const a = planConfirmation(inHours(72), NOW, { enabled: true, hasEmail: true }).confirmToken;
  const b = planConfirmation(inHours(72), NOW, { enabled: true, hasEmail: true }).confirmToken;
  assert.notEqual(a, b);
});

test("saisi par le garage : planifié, jamais d'échéance de libération", () => {
  const p = planManualConfirmation(inHours(72), NOW, { enabled: true, reachable: true });
  assert.equal(p.confirmationStatus, "SCHEDULED");
  assert.equal(p.confirmTier, "MANUAL");
  assert.equal(p.confirmBy, null);
});

test("saisi par le garage : rien si le client est injoignable, trop proche, ou confirmation désactivée", () => {
  assert.equal(planManualConfirmation(inHours(72), NOW, { enabled: true, reachable: false }).confirmationStatus, "NOT_REQUIRED");
  assert.equal(planManualConfirmation(inHours(1), NOW, { enabled: true, reachable: true }).confirmationStatus, "NOT_REQUIRED");
  assert.equal(planManualConfirmation(inHours(72), NOW, { enabled: false, reachable: true }).confirmationStatus, "NOT_REQUIRED");
});

test("échéance en ligne : −12 h, au moins une heure de délai, rien si trop tard", () => {
  assert.equal(standardDeadline(inHours(72), NOW)?.getTime(), inHours(60).getTime());
  assert.equal(standardDeadline(inHours(3), NOW)?.getTime(), inHours(1).getTime());
  assert.equal(standardDeadline(inHours(0.5), NOW), null);
});

test("alerte au garage (MANUAL) : −24 h, au moins 2 h après l'envoi", () => {
  assert.equal(manualDeadline(inHours(72), NOW)?.getTime(), inHours(48).getTime());
  assert.equal(manualDeadline(inHours(3), NOW)?.getTime(), inHours(2).getTime());
  assert.equal(manualDeadline(inHours(0.5), NOW), null);
});
