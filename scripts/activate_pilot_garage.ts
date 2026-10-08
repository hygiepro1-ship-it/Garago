import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Active sans frais la fiche du garage du projet pilote (Garage Mecanique M.Vidal) :
 *  - rattachée au compte administrateur, en attendant le courriel du garage ;
 *  - abonnement ACTIVE sans Stripe (aucune carte, aucune facturation) ;
 *  - masquée du public (hiddenByReport) : absente de la recherche, page publique introuvable ;
 *  - réservation en ligne fermée : seuls les rendez-vous saisis par le garage ;
 *  - horaires de sa fiche Google (relevés le 2026-10-07).
 *
 * Peut être relancé sans risque. La colonne onlineBooking n'existe qu'après la
 * publication : avant, cette étape est sautée (et signalée) — relancer ensuite.
 *   npx tsx --env-file=.env.local scripts/activate_pilot_garage.ts
 */
const SLUG = "garage-mecanique-m-vidal";

// 0 = dimanche … 6 = samedi
const HOURS: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[] = [
  { dayOfWeek: 0, openTime: "08:00", closeTime: "17:00", isClosed: true },
  { dayOfWeek: 1, openTime: "08:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 2, openTime: "08:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 3, openTime: "08:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 4, openTime: "08:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 5, openTime: "08:00", closeTime: "14:30", isClosed: false },
  { dayOfWeek: 6, openTime: "08:00", closeTime: "17:00", isClosed: true },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const garage = await prisma.garage.findUnique({ where: { slug: SLUG }, select: { id: true, name: true, ownerId: true, claimStatus: true } });
  if (!garage) throw new Error(`Fiche introuvable : ${SLUG}`);
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true } });
  if (admins.length !== 1) throw new Error(`${admins.length} comptes administrateur trouvés : précisez lequel.`);
  const admin = admins[0];

  if (garage.claimStatus === "en_attente" || (garage.ownerId && garage.ownerId !== admin.id)) {
    throw new Error(`La fiche ${garage.name} a déjà un propriétaire ou une réclamation en cours (${garage.claimStatus}) : rien n'a été modifié.`);
  }

  const column = await prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM information_schema.columns WHERE table_name = 'Garage' AND column_name = 'onlineBooking'`;
  const canCloseBooking = column[0].n === 1;

  await prisma.$transaction([
    prisma.garage.update({
      where: { id: garage.id },
      data: {
        ownerId: admin.id,
        claimStatus: "activee",
        subscriptionStatus: "ACTIVE",
        subscriptionEndAt: null,
        hiddenByReport: true,
        ...(canCloseBooking ? { onlineBooking: false } : {}),
      },
      select: { id: true },
    }),
    ...HOURS.map((h) => prisma.garageAvailability.upsert({
      where: { garageId_dayOfWeek: { garageId: garage.id, dayOfWeek: h.dayOfWeek } },
      update: h,
      create: { garageId: garage.id, ...h },
    })),
    prisma.auditLog.create({
      data: {
        action: "pilot_garage_activated",
        targetType: "Garage",
        targetId: garage.id,
        actorEmail: admin.email,
        detail: `Fiche ${garage.name} activée sans frais pour le projet pilote, rattachée au compte administrateur.`,
      },
    }),
  ]);

  const others = await prisma.garage.count({ where: { ownerId: admin.id, id: { not: garage.id } } });
  console.log(`OK — ${garage.name} activée et masquée du public. Autres garages du compte admin : ${others}.`);
  console.log(`Tableau de bord : /tableau-de-bord/garage?g=${garage.id}`);
  console.log(`Agenda : /tableau-de-bord/garage/agenda?g=${garage.id}`);
  if (!canCloseBooking) console.log("À REFAIRE après la publication : la réservation en ligne n'a pas encore pu être fermée (colonne absente).");
}

main().catch((e) => { console.error(e.message ?? e); process.exitCode = 1; }).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
