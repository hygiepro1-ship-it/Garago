import { PrismaClient } from "../src/generated/prisma/index.js";
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.findUnique({ where: { email: "garage1@exemple.com" }, include: { garage: true } });
  if (!u?.garage) { console.log("introuvable"); return; }
  const r = await prisma.garage.update({ where: { id: u.garage.id }, data: { ambassadorTier: 1, referralCount: 3, ambassadorSince: new Date() } });
  console.log("OK tier:", r.ambassadorTier, "count:", r.referralCount);
  await prisma.$disconnect();
}
main();
