// Fusionne les fiches de garages enregistrées en double (même garage, adresse écrite autrement).
// La fiche gardée est celle à l'adresse principale (sans « -1 ») ; l'ancienne adresse du doublon
// est redirigée vers elle dans next.config.ts.
//
//   npx tsx scripts/merge_duplicate_garages.ts          → montre ce qui changerait, sans rien écrire
//   npx tsx scripts/merge_duplicate_garages.ts --apply  → applique
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ quiet: true });

const APPLY = process.argv.includes("--apply");

// [fiche gardée, doublon]
const PAIRS: [string, string][] = [
  // Fusionnés le 2026-10-16 (le script les ignore : doublons déjà supprimés)
  ["chirwan-inc", "chirwan-inc-1"],
  ["garage-deguire", "garage-deguire-1"],
  ["garage-martin-jacques", "garage-martin-jacques-1"],
  ["kamille-automobiles", "kamille-automobiles-1"],
  ["r-r-services", "r-r-services-1"],
  ["garage-auto-frah-mecanique-generale", "garage-auto-frah-mecanique-generale-1"],
  ["mcc-auto-enr", "mcc-auto-enr-1"],
  ["mecanique-pro-expert", "mecanique-pro-expert-1"],
  ["napa-autopro-garage-poirier-et-poirier-inc", "napa-autopro-garage-poirier-et-poirier-inc-1"],
  ["pneus-mecanique-verdun", "pneus-mecanique-verdun-1"],
  ["solution-auto-mecanique", "solution-auto-mecanique-1"],
  ["sp-mecanique", "sp-mecanique-1"],
  // Audit SEO du 2026-10-17 : même adresse et même téléphone (ou même nom), écrits autrement
  ["auto-de-l-eglise-inc", "de-l-eglise-auto-inc"],
  ["autocare-montreal", "autocare-montreal-rdp"],
  ["garage-les-galeries-d-anjou", "autopro-garage"],
  ["optimax-plus-inc", "garage-optimax-plus-inc"],
  ["garage-rapide", "garage-rapide-beaumont"],
  ["garage-yves-malo-et-fils-inc", "garage-yves-malo-fils-inc"],
  ["gmf-auto-garage-pointe-aux-trembles", "gmf-auto-mecanicien-garage-pointe-aux-trembles"],
  ["napa-autopro-mecanique-excellence-pierrefonds-goodyear", "goodyear-auto-service-mecanique"],
  ["station-service-r-et-r", "r-r-station-service-inc"],
  ["garage-auto-fera", "garage-auto-fera-enrg"],
];

(async () => {
  const { prisma } = await import("../src/lib/prisma");
  for (const [keepSlug, dupSlug] of PAIRS) {
    const keep = await prisma.garage.findUnique({ where: { slug: keepSlug }, select: { id: true, ownerId: true, claimStatus: true } });
    const dup = await prisma.garage.findUnique({
      where: { slug: dupSlug },
      select: {
        id: true, ownerId: true, claimStatus: true,
        _count: { select: { reviews: true, appointments: true, favorites: true, customers: true, claimRequests: true, services: true, photos: true, profileViews: true, branches: true, reports: true } },
      },
    });
    if (!keep || !dup) { console.log(`${dupSlug} : introuvable (déjà fusionné ?)`); continue; }
    const c = dup._count;
    // Ne jamais perdre ce qui appartient à un client ou à un propriétaire : dans ce cas, on s'arrête.
    const blocking = dup.ownerId || dup.claimStatus !== "non_reclamee" || c.reviews || c.appointments || c.favorites || c.customers || c.claimRequests || c.branches;
    console.log(`${dupSlug} → ${keepSlug} :`, JSON.stringify(c), blocking ? "BLOQUÉ (données à conserver)" : "à supprimer");
    if (!APPLY || blocking) continue;
    await prisma.$transaction(async (tx) => {
      // Les visites de la fiche en double rejoignent la fiche gardée (statistiques).
      await tx.garageProfileView.updateMany({ where: { garageId: dup.id }, data: { garageId: keep.id } });
      await tx.garage.delete({ where: { id: dup.id } });
    });
    console.log("   fusionné.");
  }
  console.log(APPLY ? "Terminé." : "Rien n'a été écrit. Relancez avec --apply pour appliquer.");
  await prisma.$disconnect();
})();
