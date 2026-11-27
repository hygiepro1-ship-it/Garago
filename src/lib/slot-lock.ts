// Verrou « une journée d'un garage » : toute écriture qui OCCUPE une place dans l'agenda (réservation en ligne,
// saisie par le garage, déplacement, changement de porte, réactivation, reprise d'un créneau expiré) lit la
// journée puis écrit en tenant ce verrou. Deux écritures sur la même journée du même garage passent donc
// l'une après l'autre : la seconde voit le rendez-vous de la première et refuse la place s'il n'y en a plus.
//
// Pourquoi un verrou et pas seulement l'isolation « Serializable » : Postgres ne détecte un conflit que si
// TOUTES les transactions concernées sont sérialisables. Avant ce verrou, la saisie du garage ne l'était pas
// et une double réservation restait possible (tests/integration/double-reservation.test.ts).
//
// pg_advisory_xact_lock est libéré automatiquement à la fin de la transaction (validée ou annulée) ; il
// fonctionne derrière le pooler de Neon (mode transaction). Les libérations de place (annulation, absence)
// n'en ont pas besoin : elles ne peuvent pas créer de chevauchement.

import { prisma } from "@/lib/prisma";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Erreur levée dans une transaction verrouillée pour l'annuler et renvoyer une réponse précise. */
export class SlotError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

/** Prend le verrou de chaque journée (triées, sans doublon, pour ne jamais s'interbloquer). */
async function lockDays(tx: Tx, garageId: string, dates: string[]) {
  for (const date of [...new Set(dates)].sort()) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${garageId}), hashtext(${date}))`;
  }
}

/**
 * Exécute `fn` dans une transaction qui tient le verrou des journées `dates` du garage. Le verrou est pris
 * en premier : chaque lecture faite ensuite dans `fn` (avec `tx`) voit les rendez-vous déjà enregistrés.
 */
export async function withGarageDayLock<T>(garageId: string, dates: string | string[], fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await lockDays(tx, garageId, Array.isArray(dates) ? dates : [dates]);
    return fn(tx);
  }, { timeout: 15000, maxWait: 10000 });
}
