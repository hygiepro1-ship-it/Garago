import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";
import { toMinutes } from "@/lib/availability";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { cleanText } from "@/lib/abuse";

const KNOWN_CATEGORIES = new Map(SERVICE_CATEGORIES.map((c) => [c.id, c]));

function parsePrice(v: unknown): number | null | "invalid" {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100000) return "invalid";
  return Math.round(n * 100) / 100;
}

// Bornée pour éviter qu'une durée nulle/négative (saisie invalide, ou 0) ne
// puisse un jour faire boucler indéfiniment la génération de créneaux (voir
// generateSlots). Le plafond suit les heures d'ouverture réelles du garage
// (le jour le plus long de sa semaine) plutôt qu'une constante fixe — un
// garage ouvert 12h ne doit pas être limité comme un garage ouvert 8h. Sans
// horaires configurés, on reste juste dans le modèle (un RDV ne peut pas
// chevaucher minuit).
function sanitizeDuration(v: unknown, maxMinutes: number): number | null {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n) || n <= 0) return null; // pas de valeur = durée par défaut (60 min)
  return Math.min(Math.max(Math.round(n), 5), maxMinutes);
}

// Nombre de véhicules pris en charge en même temps : au moins 1 (sinon aucun
// créneau ne serait jamais réservable), plafonné à une valeur raisonnable, et
// jamais NaN dans une colonne Int.
function sanitizeCapacity(v: unknown): number {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.round(n), 50);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const { services, capacity, requireConfirmation } = await req.json();

  const garage = await prisma.garage.findFirst({
    where: ownedGarageWhere(userId, readGarageId(req.url)),
    include: { availability: true },
  });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const openWindows = garage.availability
    .filter((a) => !a.isClosed)
    .map((a) => toMinutes(a.closeTime) - toMinutes(a.openTime))
    .filter((m) => m > 0);
  const maxDurationMin = openWindows.length > 0 ? Math.max(...openWindows) : 1439;

  // La capacité se règle avec les services (durée + postes forment ensemble ce
  // qui remplit l'agenda) — omise du corps de requête, elle reste inchangée.
  if (capacity !== undefined) {
    await prisma.garage.update({ where: { id: garage.id }, data: { capacity: sanitizeCapacity(capacity) } });
  }

  // Confirmation du client par courriel : activée par défaut, désactivable par le garage.
  if (typeof requireConfirmation === "boolean") {
    await prisma.garage.update({ where: { id: garage.id }, data: { requireConfirmation } });
  }

  // Validation complète AVANT d'effacer quoi que ce soit : une valeur invalide ne doit jamais faire perdre
  // les services existants du garage (avant, l'effacement précédait la création, sans transaction).
  // Pas de liste = on ne touche pas aux services (ex. changement de la capacité seule) ; une valeur qui n'est pas
  // une liste est refusée au lieu d'être traitée comme « liste vide » (ce qui effaçait tous les services).
  if (services !== undefined && !Array.isArray(services)) {
    return NextResponse.json({ error: "Liste de services invalide." }, { status: 400 });
  }
  const list: unknown[] = Array.isArray(services) ? services : [];
  if (list.length > 40) return NextResponse.json({ error: "Trop de services (40 maximum)." }, { status: 400 });
  const prepared: { categoryId: string; name: string; description: string | null; priceMin: number | null; priceMax: number | null; durationMin: number | null }[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    const s = (raw ?? {}) as Record<string, unknown>;
    // Seules les catégories officielles sont acceptées : un garage ne peut pas créer de catégories dans la base commune.
    const known = typeof s.categoryId === "string" ? KNOWN_CATEGORIES.get(s.categoryId) : undefined;
    if (!known) return NextResponse.json({ error: "Catégorie de service inconnue." }, { status: 400 });
    if (seen.has(known.id)) continue;
    seen.add(known.id);
    const priceMin = parsePrice(s.priceMin);
    const priceMax = parsePrice(s.priceMax);
    if (priceMin === "invalid" || priceMax === "invalid") {
      return NextResponse.json({ error: "Prix invalide (nombre positif attendu)." }, { status: 400 });
    }
    if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
      return NextResponse.json({ error: "Le prix minimum ne peut pas dépasser le prix maximum." }, { status: 400 });
    }
    prepared.push({
      categoryId: known.id,
      name: cleanText(s.name, 100) || known.name,
      description: cleanText(s.description, 300) || null,
      priceMin, priceMax,
      durationMin: sanitizeDuration(s.durationMin, maxDurationMin),
    });
  }

  if (services !== undefined) await prisma.$transaction(async (tx) => {
    await tx.garageService.deleteMany({ where: { garageId: garage.id } });
    for (const s of prepared) {
      const known = KNOWN_CATEGORIES.get(s.categoryId)!;
      const cat = await tx.serviceCategory.upsert({
        where: { id: s.categoryId },
        update: {},
        create: { id: s.categoryId, name: known.name, icon: known.icon },
      });
      await tx.garageService.create({
        data: {
          garageId: garage.id, categoryId: cat.id, name: s.name, description: s.description,
          priceMin: s.priceMin, priceMax: s.priceMax, durationMin: s.durationMin, active: true,
        },
      });
    }
  });

  const updated = await prisma.garageService.findMany({
    where: { garageId: garage.id },
    include: { category: true },
  });
  return NextResponse.json(updated);
}
