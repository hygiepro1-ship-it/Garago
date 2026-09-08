/**
 * One-time script: geocodes all garages that have no lat/lng.
 * Run with: npx ts-node --project tsconfig.json scripts/geocode-garages.ts
 */
import prisma from "../src/lib/prisma";
import { geocodeAddress } from "../src/lib/geocode";

async function main() {
  const garages = await prisma.garage.findMany({
    where: { OR: [{ latitude: null }, { longitude: null }] },
    select: { id: true, name: true, address: true, city: true },
  });

  console.log(`${garages.length} garage(s) sans coordonnées.`);

  for (const g of garages) {
    if (!g.address || !g.city) { console.log(`⏭  ${g.name} — adresse incomplète`); continue; }

    const coords = await geocodeAddress(g.address, g.city);
    if (!coords) { console.log(`❌ ${g.name} — géocodage échoué`); continue; }

    await prisma.garage.update({
      where: { id: g.id },
      data:  { latitude: coords.latitude, longitude: coords.longitude },
    });
    console.log(`✅ ${g.name} → ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);

    // Nominatim: max 1 requête/seconde
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log("Terminé.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
