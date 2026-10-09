import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

/**
 * Remet la fiche du garage pilote (Garage Mecanique M.Vidal) à son propriétaire,
 * une fois son courriel connu. Crée son compte avec un mot de passe provisoire,
 * affiché une seule fois (seule son empreinte est enregistrée) : il le change
 * ensuite depuis son tableau de bord, onglet Abonnement.
 * Les courriels du garage (annulation, client à appeler) partent ensuite à cette adresse.
 *
 *   npx tsx --env-file=.env.local scripts/transfer_pilot_garage.ts courriel@garage.ca "Nom du contact"
 */
const SLUG = "garage-mecanique-m-vidal";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Mot de passe provisoire lisible au téléphone : sans 0/O, 1/l/I ni caractères spéciaux. */
function temporaryPassword(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const group = () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  const name = (process.argv[3] ?? "").trim() || null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Usage : transfer_pilot_garage.ts courriel@garage.ca \"Nom du contact\"");

  const garage = await prisma.garage.findUnique({ where: { slug: SLUG }, select: { id: true, name: true, phone: true, ownerId: true } });
  if (!garage) throw new Error(`Fiche introuvable : ${SLUG}`);

  const current = garage.ownerId ? await prisma.user.findUnique({ where: { id: garage.ownerId }, select: { role: true, email: true } }) : null;
  if (current && current.role !== "ADMIN") throw new Error(`La fiche appartient déjà à ${current.email} : rien n'a été modifié.`);

  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true, role: true, password: true } });
  if (existing?.role === "ADMIN") throw new Error("Ce courriel est celui d'un compte administrateur.");
  // On ne remplace jamais le mot de passe d'un compte qui en a déjà un : la personne garde le sien.
  if (existing?.password) throw new Error(`Un compte avec mot de passe existe déjà pour ${email} : rien n'a été modifié.`);

  const password = temporaryPassword();
  const hashed = await bcrypt.hash(password, 12);

  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { role: "GARAGE_OWNER", password: hashed }, select: { id: true } })
    : await prisma.user.create({ data: { name: name ?? garage.name, email, phone: garage.phone, role: "GARAGE_OWNER", password: hashed }, select: { id: true } });

  await prisma.$transaction([
    prisma.garage.update({ where: { id: garage.id }, data: { ownerId: user.id, email }, select: { id: true } }),
    prisma.auditLog.create({
      data: { action: "pilot_garage_transferred", targetType: "Garage", targetId: garage.id, actorEmail: current?.email ?? null, detail: `Fiche ${garage.name} remise à ${email}` },
    }),
  ]);

  console.log(`OK : ${garage.name} appartient maintenant à ${email}.`);
  console.log(`Mot de passe provisoire : ${password}`);
  console.log("Connexion depuis la page d'accueil, bouton Connexion. À changer ensuite dans le tableau de bord, onglet Abonnement.");
}

main().catch((e) => { console.error(e.message ?? e); process.exitCode = 1; }).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
