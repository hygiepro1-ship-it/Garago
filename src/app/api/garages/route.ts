import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { activeSubscriptionOr } from "@/lib/garage-access";
import { garageDistance } from "@/lib/geo";
import { findNextAvailability, type BlockedRow } from "@/lib/availability";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const service = searchParams.get("service");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const year = searchParams.get("year");
    const q = searchParams.get("q");
    const walkInOnly = searchParams.get("walkInOnly") === "1";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "12");

    // Position du conducteur — quand elle est fournie, le tri se fait par
    // proximité puis par disponibilité (voir plus bas), pas par ambassadeur/popularité.
    const lat = parseFloat(searchParams.get("lat") ?? "");
    const lng = parseFloat(searchParams.get("lng") ?? "");
    const hasPos = !isNaN(lat) && !isNaN(lng);

    // Un garage est visible si son abonnement (le sien s'il est principal/autonome,
    // celui de son garage principal s'il est une succursale) est actif, en essai,
    // ou impayé mais encore dans la période de grâce — et si son NEQ a été vérifié
    // par un admin (le sien, ou celui du garage principal pour une succursale).
    const subOr = activeSubscriptionOr();
    const where: any = {
      AND: [
        {
          OR: [
            { parentId: null, verificationStatus: "APPROVED", OR: subOr },
            { parent: { verificationStatus: "APPROVED", OR: subOr } },
          ],
        },
      ],
    };

    if (city) where.city = { contains: city };
    if (walkInOnly) where.acceptsWalkIn = true;
    if (q) {
      where.AND.push({
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { city: { contains: q } },
        ],
      });
    }

    if (make) {
      where.brands = {
        some: {
          brand: make,
          accepts: true,
        },
      };

      // Filtre par modèle précis : un garage correspond s'il n'a configuré aucune
      // restriction de modèle pour cette marque (= tous les modèles acceptés par
      // défaut), ou s'il a explicitement coché ce modèle.
      if (model) {
        where.AND = [
          ...(where.AND ?? []),
          {
            OR: [
              { brandModels: { none: { brand: make } } },
              { brandModels: { some: { brand: make, model } } },
            ],
          },
        ];
      }
    }

    if (service) {
      where.services = {
        some: {
          categoryId: service,
          active: true,
        },
      };
    }

    const sort = searchParams.get("sort");
    const orderBy: any =
      sort === "popular"
        ? [{ isAmbassador: "desc" }, { reviews: { _count: "desc" } }, { appointments: { _count: "desc" } }]
        : [{ isAmbassador: "desc" }, { createdAt: "desc" }];

    const include = {
      services: {
        include: { category: true },
        where: { active: true },
      },
      brands: true,
      reviews: {
        select: { rating: true },
      },
      availability: true,
      _count: {
        select: { reviews: true, appointments: true },
      },
    };

    // Avec géolocalisation, on trie par proximité + disponibilité sur l'ensemble
    // des garages correspondants : impossible de paginer au niveau de la base de
    // données avant de connaître la distance de chacun. Le marché visé (garages
    // du Québec) reste d'une taille où charger tous les résultats correspondants
    // puis trier/paginer en mémoire est largement acceptable.
    const [rawGarages, total] = await Promise.all([
      prisma.garage.findMany({
        where,
        ...(hasPos ? {} : { skip: (page - 1) * limit, take: limit }),
        include,
        orderBy,
      }),
      prisma.garage.count({ where }),
    ]);

    // ── Disponibilités réelles ───────────────────────────────────────────────
    // Une seule requête groupée par table plutôt qu'un aller-retour par garage :
    // on récupère les blocages/RDV des prochains jours pour tous les garages du
    // lot, puis on cherche localement le premier créneau libre de chacun.
    const DAYS_AHEAD = 14;
    const now = new Date();
    // Dates locales (pas toISOString, qui bascule en UTC — le serveur tourne en
    // UTC alors que les garages/RDV sont tous en heure du Québec) pour rester
    // cohérent avec findNextAvailability, qui calcule ses dates de la même façon.
    const toLocalDateStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const todayStr = toLocalDateStr(now);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + DAYS_AHEAD);
    const endStr = toLocalDateStr(endDate);

    const garageIds = rawGarages.map((g) => g.id);
    const [blockedRows, bookedRows] = garageIds.length
      ? await Promise.all([
          prisma.blockedSlot.findMany({
            where: { garageId: { in: garageIds }, date: { gte: todayStr, lte: endStr } },
            select: { garageId: true, date: true, startTime: true, endTime: true, allDay: true },
          }),
          prisma.appointment.findMany({
            where: {
              garageId: { in: garageIds },
              date: { gte: todayStr, lte: endStr },
              status: { not: "CANCELLED" },
            },
            select: { garageId: true, date: true, startTime: true, endTime: true },
          }),
        ])
      : [[], []];

    const blockedByGarage = new Map<string, Map<string, BlockedRow[]>>();
    for (const b of blockedRows) {
      if (!blockedByGarage.has(b.garageId)) blockedByGarage.set(b.garageId, new Map());
      const byDate = blockedByGarage.get(b.garageId)!;
      if (!byDate.has(b.date)) byDate.set(b.date, []);
      byDate.get(b.date)!.push({ startTime: b.startTime, endTime: b.endTime, allDay: b.allDay });
    }
    const bookedByGarage = new Map<string, Map<string, { startTime: string; endTime: string }[]>>();
    for (const a of bookedRows) {
      if (!bookedByGarage.has(a.garageId)) bookedByGarage.set(a.garageId, new Map());
      const byDate = bookedByGarage.get(a.garageId)!;
      if (!byDate.has(a.date)) byDate.set(a.date, []);
      byDate.get(a.date)!.push({ startTime: a.startTime, endTime: a.endTime });
    }

    const userPos = hasPos ? { lat, lng } : null;

    const garagesWithMeta = rawGarages.map((g) => {
      const avgRating =
        g.reviews.length > 0
          ? g.reviews.reduce((s, r) => s + r.rating, 0) / g.reviews.length
          : 0;
      const nextAvailability = findNextAvailability(
        g.availability,
        blockedByGarage.get(g.id) ?? new Map(),
        bookedByGarage.get(g.id) ?? new Map(),
        { daysAhead: DAYS_AHEAD, now }
      );
      return {
        ...g,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: g._count.reviews,
        distanceKm: userPos ? garageDistance(g, userPos) : null,
        nextAvailability,
      };
    });

    // ── Tri par proximité puis disponibilité ─────────────────────────────────
    // Le conducteur veut d'abord le garage le plus proche ; à distance égale (ou
    // quand la distance est inconnue pour les deux), celui dont le prochain
    // créneau libre arrive le plus tôt passe devant.
    if (userPos) {
      garagesWithMeta.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm != null) return 1;
        if (a.distanceKm != null && b.distanceKm == null) return -1;
        if (a.distanceKm != null && b.distanceKm != null && a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.nextAvailability == null && b.nextAvailability != null) return 1;
        if (a.nextAvailability != null && b.nextAvailability == null) return -1;
        if (a.nextAvailability && b.nextAvailability && a.nextAvailability.at !== b.nextAvailability.at) {
          return a.nextAvailability.at < b.nextAvailability.at ? -1 : 1;
        }
        return 0;
      });
    }

    const effectiveTotal = userPos ? garagesWithMeta.length : total;
    const pageItems = userPos
      ? garagesWithMeta.slice((page - 1) * limit, (page - 1) * limit + limit)
      : garagesWithMeta;

    return NextResponse.json({
      garages: pageItems,
      total: effectiveTotal,
      pages: Math.ceil(effectiveTotal / limit),
      page,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
