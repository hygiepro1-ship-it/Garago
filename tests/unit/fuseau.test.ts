// Fuseau horaire propre à chaque garage (src/lib/availability.ts, src/lib/rdv-confirmation.ts) :
// un rendez-vous à 9 h à Vancouver a lieu à 9 h heure de Vancouver, pas à 9 h heure du Québec.
import { test } from "node:test";
import assert from "node:assert/strict";
import { garageTimeZone, quebecToday, quebecMinutes, computeFreeSlots, findNextAvailability, type AvailabilityRow } from "../../src/lib/availability";
import { quebecInstant, formatQuebecMoment } from "../../src/lib/rdv-confirmation";

test("fuseau d'après la province : code ou nom complet, Québec par défaut", () => {
  assert.equal(garageTimeZone("QC"), "America/Toronto");
  assert.equal(garageTimeZone("on"), "America/Toronto");
  assert.equal(garageTimeZone("BC"), "America/Vancouver");
  assert.equal(garageTimeZone("Colombie-Britannique"), "America/Vancouver");
  assert.equal(garageTimeZone("Alberta"), "America/Edmonton");
  assert.equal(garageTimeZone("NL"), "America/St_Johns");
  assert.equal(garageTimeZone(""), "America/Toronto");
  assert.equal(garageTimeZone(null), "America/Toronto");
  assert.equal(garageTimeZone("XX"), "America/Toronto");
});

// Les calculs utilisent la Saskatchewan (America/Regina) : UTC−6 toute l'année, sans changement d'heure.
// Les fuseaux à règles changeantes (la Colombie-Britannique passe à l'heure permanente) varient selon la version
// de la base des fuseaux de Node : un test qui fixerait leur décalage échouerait d'une machine à l'autre.
const REGINA = "America/Regina";

test("instant réel d'un rendez-vous selon le fuseau du garage", () => {
  assert.equal(quebecInstant("2026-07-01", "09:00").toISOString(), "2026-07-01T13:00:00.000Z");
  assert.equal(quebecInstant("2026-01-15", "09:00").toISOString(), "2026-01-15T14:00:00.000Z");
  assert.equal(quebecInstant("2026-07-01", "09:00", REGINA).toISOString(), "2026-07-01T15:00:00.000Z");
  assert.equal(quebecInstant("2026-01-15", "09:00", REGINA).toISOString(), "2026-01-15T15:00:00.000Z");
});

test("aujourd'hui et maintenant dans le fuseau du garage", () => {
  const at = new Date("2026-12-02T05:30:00Z"); // 0 h 30 à Montréal, 23 h 30 la veille à Regina
  assert.equal(quebecToday(at), "2026-12-02");
  assert.equal(quebecToday(at, REGINA), "2026-12-01");
  assert.equal(quebecMinutes(at, REGINA), 23 * 60 + 30);
});

test("créneaux du jour : l'heure passée se compte à l'heure locale du garage", () => {
  const open: AvailabilityRow = { dayOfWeek: 2, openTime: "08:00", closeTime: "12:00", isClosed: false };
  const now = new Date("2026-12-01T16:00:00Z"); // 11 h à Montréal, 10 h à Regina
  assert.deepEqual(computeFreeSlots(open, [], [], 60, { isToday: true, now }), []);
  assert.deepEqual(computeFreeSlots(open, [], [], 60, { isToday: true, now, tz: REGINA }), ["11:00"]);
});

test("prochaine disponibilité : le jour de départ est celui du garage", () => {
  const every: AvailabilityRow[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, openTime: "08:00", closeTime: "14:00", isClosed: false }));
  const now = new Date("2026-12-01T17:30:00Z"); // 12 h 30 à Montréal (plus rien aujourd'hui), 11 h 30 à Regina
  assert.deepEqual(findNextAvailability(every, new Map(), new Map(), { now, tz: REGINA }), { date: "2026-12-01", slots: ["13:00"], at: "2026-12-01T13:00" });
  assert.equal(findNextAvailability(every, new Map(), new Map(), { now })?.date, "2026-12-02");
});

test("échéance affichée dans le fuseau du garage", () => {
  const at = new Date("2026-12-01T20:00:00Z"); // 15 h à Montréal, 14 h à Regina
  // Le format exact (espaces insécables, « p.m. » ou « PM ») varie selon la version de Node : on ne lit que l'heure.
  const plain = (s: string) => s.replace(/[  ]/g, " ");
  assert.match(plain(formatQuebecMoment(at, "en", REGINA)), /\b2:00\b/);
  assert.match(plain(formatQuebecMoment(at, "fr")), /\b15 ?h ?00\b/);
  assert.match(plain(formatQuebecMoment(at, "fr", REGINA)), /\b14 ?h ?00\b/);
});
