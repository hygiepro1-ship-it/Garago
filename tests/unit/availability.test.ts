// Règles de créneaux et de portes (src/lib/availability.ts) : ce qui est proposé aux clients en ligne
// et ce qui empêche deux véhicules d'occuper la même porte en même temps.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateSlots, computeFreeSlots, wouldExceedCapacity, pickBay, bayIsFree,
  allowedBaysFor, bayVersatility, addDaysStr, dayOfWeekOf, findNextAvailability, findNextFreeStart,
  type AvailabilityRow,
} from "../../src/lib/availability";
import { quebecInstant } from "../../src/lib/rdv-confirmation";

const OPEN_8_12: AvailabilityRow = { dayOfWeek: 2, openTime: "08:00", closeTime: "12:00", isClosed: false };

test("les créneaux s'enchaînent à la durée du service, sans dépasser la fermeture", () => {
  assert.deepEqual(generateSlots("08:00", "12:00", 60), ["08:00", "09:00", "10:00", "11:00"]);
  assert.deepEqual(generateSlots("08:00", "12:00", 90), ["08:00", "09:30"]);
  assert.deepEqual(generateSlots("08:00", "09:00", 120), []);
});

test("une durée nulle ou invalide ne fige jamais le calcul", () => {
  assert.deepEqual(generateSlots("08:00", "12:00", 0), []);
  assert.deepEqual(generateSlots("08:00", "12:00", -30), []);
  assert.deepEqual(generateSlots("08:00", "12:00", Number.NaN), []);
});

test("jour fermé, horaire absent ou blocage d'une journée : aucun créneau", () => {
  assert.deepEqual(computeFreeSlots({ ...OPEN_8_12, isClosed: true }, [], [], 60), []);
  assert.deepEqual(computeFreeSlots(undefined, [], [], 60), []);
  assert.deepEqual(computeFreeSlots(OPEN_8_12, [{ startTime: null, endTime: null, allDay: true }], [], 60), []);
});

test("un blocage partiel retire les créneaux qui le chevauchent", () => {
  const blocks = [{ startTime: "09:00", endTime: "10:00", allDay: false }];
  assert.deepEqual(computeFreeSlots(OPEN_8_12, blocks, [], 60), ["08:00", "10:00", "11:00"]);
  // Un service de 90 min qui commencerait à 08:00 finirait dans le blocage.
  assert.deepEqual(computeFreeSlots(OPEN_8_12, blocks, [], 90), []);
});

test("capacité 1 : un rendez-vous occupe le garage pendant toute sa durée", () => {
  const booked = [{ startTime: "09:00", endTime: "10:30", bay: 1 }];
  assert.deepEqual(computeFreeSlots(OPEN_8_12, [], booked, 60, { capacity: 1 }), ["08:00", "11:00"]);
});

test("capacité 2 : le créneau reste offert tant qu'une porte est libre", () => {
  const one = [{ startTime: "09:00", endTime: "10:00", bay: 1 }];
  assert.ok(computeFreeSlots(OPEN_8_12, [], one, 60, { capacity: 2 }).includes("09:00"));
  const two = [...one, { startTime: "09:00", endTime: "10:00", bay: 2 }];
  assert.ok(!computeFreeSlots(OPEN_8_12, [], two, 60, { capacity: 2 }).includes("09:00"));
});

test("service réservé à certaines portes : offert seulement si l'une d'elles est libre", () => {
  const booked = [{ startTime: "09:00", endTime: "10:00", bay: 2 }];
  assert.ok(!computeFreeSlots(OPEN_8_12, [], booked, 60, { capacity: 2, allowedBays: [2] }).includes("09:00"));
  assert.ok(computeFreeSlots(OPEN_8_12, [], booked, 60, { capacity: 2, allowedBays: [1] }).includes("09:00"));
});

test("aujourd'hui : rien avant l'heure du Québec + 30 minutes", () => {
  const now = quebecInstant("2026-12-01", "10:00");
  assert.deepEqual(computeFreeSlots(OPEN_8_12, [], [], 60, { isToday: true, now }), ["11:00"]);
  // Un autre jour, la même heure ne retire rien.
  assert.equal(computeFreeSlots(OPEN_8_12, [], [], 60, { isToday: false, now }).length, 4);
});

test("capacité : des rendez-vous qui se suivent n'occupent qu'une porte à la fois", () => {
  const rows = [{ startTime: "12:30", endTime: "13:30" }, { startTime: "14:00", endTime: "15:00" }];
  assert.equal(wouldExceedCapacity("12:00", 180, rows, 2), false);
  assert.equal(wouldExceedCapacity("12:00", 180, rows, 1), true);
  const overlapping = [{ startTime: "12:30", endTime: "14:00" }, { startTime: "13:00", endTime: "15:00" }];
  assert.equal(wouldExceedCapacity("12:00", 180, overlapping, 2), true);
  // Fin et début qui se touchent ne se chevauchent pas.
  assert.equal(wouldExceedCapacity("13:30", 30, [{ startTime: "12:30", endTime: "13:30" }], 1), false);
});

test("choix de la porte : la plus spécialisée, puis le plus petit numéro", () => {
  assert.equal(pickBay("09:00", 60, [], 3, { versatility: [3, 1, 2] }), 2);
  assert.equal(pickBay("09:00", 60, [], 3), 1);
  assert.equal(pickBay("09:00", 60, [], 3, { prefer: 3 }), 3);
  assert.equal(pickBay("09:00", 60, [{ startTime: "09:00", endTime: "10:00", bay: 1 }], 2), 2);
});

test("porte : aucune si le garage est plein, en comptant les rendez-vous sans porte", () => {
  const booked = [{ startTime: "09:00", endTime: "10:00", bay: 1 }, { startTime: "09:30", endTime: "10:30", bay: null }];
  assert.equal(pickBay("09:30", 30, booked, 2), null);
  assert.equal(pickBay("09:00", 60, [{ startTime: "09:00", endTime: "10:00", bay: 1 }], 1), null);
  assert.equal(pickBay("09:00", 60, [{ startTime: "09:00", endTime: "10:00", bay: 1 }], 2, { allowed: [1] }), null);
});

test("bayIsFree ne regarde que la porte demandée", () => {
  const booked = [{ startTime: "09:00", endTime: "10:00", bay: 1 }];
  assert.equal(bayIsFree(1, "09:30", 30, booked), false);
  assert.equal(bayIsFree(2, "09:30", 30, booked), true);
  assert.equal(bayIsFree(1, "10:00", 30, booked), true);
});

test("portes autorisées pour plusieurs services", () => {
  assert.deepEqual(allowedBaysFor(3, []), [1, 2, 3]);
  assert.deepEqual(allowedBaysFor(3, [[], []]), [1, 2, 3]);
  assert.deepEqual(allowedBaysFor(3, [[2], [2, 3]]), [2]);
  assert.deepEqual(allowedBaysFor(3, [[1], [3]]), [1, 3]); // aucune porte commune : celles qui en font au moins un
  assert.deepEqual(allowedBaysFor(2, [[5]]), [1, 2]); // porte hors capacité ignorée
  assert.deepEqual(bayVersatility(2, [[], [2]]), [1, 2]);
});

test("dates : calendrier pur, sans fuseau", () => {
  assert.equal(addDaysStr("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysStr("2028-02-28", 1), "2028-02-29");
  assert.equal(dayOfWeekOf("2026-11-26"), 4); // jeudi
});

test("prochaine disponibilité : saute les jours fermés", () => {
  const now = quebecInstant("2026-11-28", "09:00"); // samedi
  const availability: AvailabilityRow[] = [
    { dayOfWeek: 6, openTime: "08:00", closeTime: "12:00", isClosed: true },
    { dayOfWeek: 1, openTime: "08:00", closeTime: "12:00", isClosed: false },
  ];
  const next = findNextAvailability(availability, new Map(), new Map(), { now, daysAhead: 7, maxSlots: 2 });
  assert.deepEqual(next, { date: "2026-11-30", slots: ["08:00", "09:00"], at: "2026-11-30T08:00" });
});

test("heure proposée au garage : première place libre, jour suivant si la journée est pleine", () => {
  const availability: AvailabilityRow[] = [
    { dayOfWeek: 1, openTime: "08:00", closeTime: "10:00", isClosed: false },
    { dayOfWeek: 2, openTime: "08:00", closeTime: "10:00", isClosed: false },
  ];
  const booked = [{ date: "2026-11-30", startTime: "08:00", endTime: "10:00", bay: 1 }];
  assert.deepEqual(
    findNextFreeStart(availability, [], booked, { fromDate: "2026-11-30", today: "2026-11-30", nowMin: 0, durationMin: 60 }),
    { date: "2026-12-01", time: "08:00" },
  );
});
