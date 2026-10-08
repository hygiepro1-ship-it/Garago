import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomInt } from "crypto";

/**
 * Remet la fiche du garage pilote (Garage Mecanique M.Vidal) à son propriétaire,
 * une fois son courriel connu. Crée son compte sans mot de passe et affiche un
 * code à usage unique (valable 48 h) à lui transmettre : il choisit son mot de
 * passe depuis la page d'accueil → Connexion → « Mot de passe oublié ».
 * Les courriels du garage (annulation, client à appeler) partent ensuite à cette adresse.
 *
 *   npx tsx --env-file=.env.local scripts/transfer_pilot_garage.ts courriel@garage.ca "Nom du contact"
 */
const SLUG = "garage-mecanique-m-vidal";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  const name = (process.argv[3] ?? "").trim() || null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Usage : transfer_pilot_garage.ts courriel@garage.ca \"Nom du contact\"");

  const garage = await prisma.garage.findUnique({ where: { slug: SLUG }, select: { id: true, name: true, phone: true, ownerId: true } });
  if (!garage) throw new Error(`Fiche introuvable : ${SLUG}`);

  const current = garage.ownerId ? await prisma.user.findUnique({ where: { id: garage.ownerId }, select: { role: true, email: true } }) : null;
  if (current && current.role !== "ADMIN") throw new Error(`La fiche appartient déjà à ${current.email} : rien n'a été modifié.`);

  let user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true, role: true } });
  if (user?.role === "ADMIN") throw new Error("Ce courriel est celui d'un compte administrateur.");
  if (!user) {
    user = await prisma.user.create({ data: { name: name ?? garage.name, email, phone: garage.phone, role: "GARAGE_OWNER" }, select: { id: true, role: true } });
  } else if (user.role !== "GARAGE_OWNER") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "GARAGE_OWNER" }, select: { id: true } });
  }

  await prisma.$transaction([
    prisma.garage.update({ where: { id: garage.id }, data: { ownerId: user.id, email }, select: { id: true } }),
    prisma.auditLog.create({
      data: { action: "pilot_garage_transferred", targetType: "Garage", targetId: garage.id, actorEmail: current?.email ?? null, detail: `Fiche ${garage.name} remise à ${email}` },
    }),
  ]);

  // « Mot de passe oublié » n'envoie un code qu'aux comptes qui ont déjà un mot de passe :
  // pour un compte neuf, on crée le code ici (même mécanisme que l'approbation d'une réclamation).
  const code = String(randomInt(100000, 1000000));
  await prisma.passwordResetCode.deleteMany({ where: { email } });
  await prisma.passwordResetCode.create({ data: { email, code, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) } });

  console.log(`OK — ${garage.name} appartient maintenant à ${email}.`);
  console.log(`Code à transmettre au garage (valable 48 h) : ${code}`);
  console.log("Il choisit son mot de passe : page d'accueil → Connexion → « Mot de passe oublié », avec ce courriel et ce code.");
}

main().catch((e) => { console.error(e.message ?? e); process.exitCode = 1; }).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
