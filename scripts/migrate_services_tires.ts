// À lancer UNE FOIS, juste après la publication du code qui remplace « Pneus d'hiver » et
// « Pneus d'été / toutes saisons » par « Installation de pneus » (tires) et renomme
// « Inspection mécanique » en « Inspection pré-achat ».
//
//   npx tsx scripts/migrate_services_tires.ts          → montre ce qui changerait, sans rien écrire
//   npx tsx scripts/migrate_services_tires.ts --apply  → applique
//
// Avant cette conversion, le site reconnaît déjà les anciens identifiants (voir LEGACY_SERVICE_IDS) :
// rien ne casse si elle est lancée quelques minutes après la mise en ligne.
import { config } from "dotenv";
config({ path: ".env.local" });
config();

const APPLY = process.argv.includes("--apply");

(async () => {
  const { prisma } = await import("../src/lib/prisma");
  const old = await prisma.garageService.findMany({
    where: { categoryId: { in: ["tires-winter", "tires-summer"] } },
    select: { id: true, garageId: true, categoryId: true, name: true, priceMin: true, priceMax: true, durationMin: true },
  });
  const existing = new Set((await prisma.garageService.findMany({ where: { categoryId: "tires" }, select: { garageId: true } })).map((s) => s.garageId));
  console.log(`${old.length} service(s) de pneus à convertir.`);

  if (APPLY) {
    await prisma.$transaction(async (tx) => {
      await tx.serviceCategory.upsert({
        where: { id: "tires" },
        update: { name: "Installation de pneus", nameEn: "Tire installation", icon: "🛞" },
        create: { id: "tires", name: "Installation de pneus", nameEn: "Tire installation", icon: "🛞" },
      });
      for (const s of old) {
        if (existing.has(s.garageId)) {
          // Le garage offrait les deux (hiver et été) : un seul service « Installation de pneus » suffit.
          await tx.garageService.delete({ where: { id: s.id } });
        } else {
          await tx.garageService.update({ where: { id: s.id }, data: { categoryId: "tires", name: "Installation de pneus" } });
          existing.add(s.garageId);
        }
      }
      await tx.serviceCategory.updateMany({ where: { id: "inspection" }, data: { name: "Inspection pré-achat", nameEn: "Pre-purchase inspection" } });
      await tx.garageService.updateMany({ where: { categoryId: "inspection", name: "Inspection mécanique" }, data: { name: "Inspection pré-achat" } });
    });
    console.log("Conversion faite.");
  } else {
    for (const s of old) console.log(`  garage ${s.garageId} : ${s.name} (${s.categoryId})${existing.has(s.garageId) ? " → supprimé (déjà un service de pneus)" : " → Installation de pneus"}`);
    console.log("Rien n'a été écrit. Relancez avec --apply pour appliquer.");
  }
  await prisma.$disconnect();
})();
