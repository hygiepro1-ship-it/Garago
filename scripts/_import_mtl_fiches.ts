import fs from "fs";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const SRC = "C:\\Users\\yannb\\AppData\\Local\\Temp\\claude\\C--Users-yannb-OneDrive-Bureau-Claude-garagepro\\eb2dd2eb-6778-4285-ab7f-5c0930d801b8\\scratchpad\\mtl_final_ready.json";

type Row = [string, string, string, string, string, string, number | null, number | null, string];
// [nom, rue, ville, postal, tel, site, lat, lng, statut]

async function main() {
  const rows: Row[] = JSON.parse(fs.readFileSync(SRC, "utf-8"));
  const ready = rows.filter((r) => r[8] === "ready");
  console.log(`Import de ${ready.length} fiches non réclamées (Montréal)`);

  const existing = await prisma.garage.findMany({ select: { slug: true } });
  const usedSlugs = new Set(existing.map((g) => g.slug));

  const data = ready.map((r) => {
    const [nom, rue, ville, postal, tel, site, lat, lng] = r;
    const base = slugify(nom);
    let slug = base || "garage";
    let i = 1;
    while (usedSlugs.has(slug)) slug = `${base}-${i++}`;
    usedSlugs.add(slug);

    return {
      name: nom,
      slug,
      address: rue,
      city: ville,
      province: "QC",
      postalCode: postal,
      phone: tel,
      website: site || null,
      latitude: lat,
      longitude: lng,
      ownerId: null,
      claimStatus: "non_reclamee",
      verificationStatus: "APPROVED",
      subscriptionStatus: "NON_RECLAMEE",
      acceptsWalkIn: true,
      appointmentOnly: false,
    };
  });

  const result = await prisma.garage.createMany({ data, skipDuplicates: true });
  console.log(`Créées : ${result.count}`);

  await prisma.auditLog.create({
    data: {
      action: "fiches_importees",
      targetType: "Garage",
      targetId: "batch",
      detail: `${result.count} fiches non réclamées importées depuis Garago_Répertoire_Garages_Québec.xlsx (région Montréal, adresse vérifiée OSM/Nominatim + téléphone présent)`,
    },
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
