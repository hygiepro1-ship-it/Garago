import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { activeSubscriptionOr } from "@/lib/garage-access";
import { garageDistance } from "@/lib/geo";
import { toPublicGarage } from "@/lib/public-garage";
import { findNextAvailability, quebecToday, addDaysStr, type BlockedRow } from "@/lib/availability";
import { serviceIdsFor } from "@/lib/services";
import { notTestGarage } from "@/lib/test-garages";
import { VISIBLE_REVIEWS, averageRating } from "@/lib/garage-rating";
import { FREE_SLOT_STATUSES } from "@/lib/rdv-confirmation";

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
    // Pagination bornée : sans plafond, « limit=100000 » permettait d'aspirer tout l'annuaire en une requête
    // (et une valeur non numérique faisait planter la requête).
    const page = Math.min(Math.max(parseInt(searchParams.get("page") ?? "1") || 1, 1), 500);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "12") || 12, 1), 50);

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
        // Fiche masquée (demande de retrait, ou garage activé hors vitrine comme un projet pilote).
        { hiddenByReport: false },
        // Garages de test : jamais dans la recherche publique.
        notTestGarage(),
        {
          OR: [
            { parentId: null, verificationStatus: "APPROVED", OR: subOr },
            { parent: { verificationStatus: "APPROVED", OR: subOr } },
            // Fiches pré-créées ("Doctolib") : visibles dès l'import, sans
            // abonnement — c'est tout le principe (être trouvé avant de s'abonner).
            { claimStatus: { in: ["non_reclamee", "en_attente"] }, hiddenByReport: false },
          ],
        },
      ],
    };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (walkInOnly) where.acceptsWalkIn = true;
    if (q) {
      where.AND.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
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
          categoryId: { in: serviceIdsFor(service) },
          active: true,
        },
      };
    }

    // Un seul garage (fiche touchée sur la carte quand elle n'est pas dans la page de résultats affichée).
    const slug = searchParams.get("slug");
    if (slug) where.slug = slug;

    // Mode carte : TOUS les garages correspondants (dans le rayon si la position est connue), mais seulement
    // ce qu'il faut pour placer les repères. Avant, la carte ne montrait que la page de la liste (20 garages).
    if (searchParams.get("map") === "1") {
      const radiusKm = Math.min(Math.max(parseFloat(searchParams.get("radiusKm") ?? "") || 0, 0), 100);
      // Préfiltre en base par un carré autour de la position (index latitude/longitude) : seuls les garages
      // proches sortent de la base, même avec des milliers de garages au Canada. Le cercle exact est fait ensuite.
      const box = hasPos && radiusKm
        ? (() => {
            const dLat = radiusKm / 111;
            const dLng = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
            return { latitude: { gte: lat - dLat, lte: lat + dLat }, longitude: { gte: lng - dLng, lte: lng + dLng } };
          })()
        : { latitude: { not: null }, longitude: { not: null } };
      const rows = await prisma.garage.findMany({
        where: { ...where, ...box },
        select: { slug: true, name: true, latitude: true, longitude: true, claimStatus: true, acceptsWalkIn: true },
        take: 3000,
      });
      const garages = rows
        .map((g) => ({ ...g, distanceKm: hasPos ? garageDistance(g, { lat, lng }) : null }))
        .filter((g) => !hasPos || !radiusKm || (g.distanceKm != null && g.distanceKm <= radiusKm));
      return NextResponse.json({ garages });
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
        where: VISIBLE_REVIEWS,
        select: { rating: true },
      },
      availability: true,
      _count: {
        select: { reviews: { where: VISIBLE_REVIEWS }, appointments: true },
      },
    };

    // Avec géolocalisation : on classe TOUS les garages correspondants par distance à partir de leurs seules
    // coordonnées (quelques octets par garage), puis on charge le détail complet (services, avis, horaires,
    // disponibilités) uniquement pour la page demandée. Avant, les 800+ garages étaient chargés au complet
    // avec leurs disponibilités à chaque recherche, ce qui ne tiendrait pas à 10 000 garages.
    let rawGarages;
    let total: number;
    if (hasPos) {
      const light = await prisma.garage.findMany({
        where,
        select: { id: true, latitude: true, longitude: true, city: true },
      });
      const ranked = light
        .map((g) => ({ id: g.id, d: garageDistance(g, { lat, lng }) }))
        .sort((a, b) => (a.d == null ? (b.d == null ? 0 : 1) : b.d == null ? -1 : a.d - b.d));
      total = ranked.length;
      const pageIds = ranked.slice((page - 1) * limit, page * limit).map((r) => r.id);
      const rank = new Map(pageIds.map((id, i) => [id, i]));
      rawGarages = (pageIds.length
        ? await prisma.garage.findMany({ where: { id: { in: pageIds } }, include })
        : []
      ).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
    } else {
      [rawGarages, total] = await Promise.all([
        prisma.garage.findMany({ where, skip: (page - 1) * limit, take: limit, include, orderBy }),
        prisma.garage.count({ where }),
      ]);
    }

    // ── Disponibilités réelles ───────────────────────────────────────────────
    // Une seule requête groupée par table plutôt qu'un aller-retour par garage :
    // on récupère les blocages/RDV des prochains jours pour tous les garages du
    // lot, puis on cherche localement le premier créneau libre de chacun.
    const DAYS_AHEAD = 14;
    const now = new Date();
    // Dates locales (pas toISOString, qui bascule en UTC — le serveur tourne en
    // UTC alors que les garages/RDV sont tous en heure du Québec) pour rester
    // cohérent avec findNextAvailability, qui calcule ses dates de la même façon.
    const todayStr = quebecToday(now);
    const endStr = addDaysStr(todayStr, DAYS_AHEAD);

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
              status: { notIn: FREE_SLOT_STATUSES },
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
      const nextAvailability = findNextAvailability(
        g.availability,
        blockedByGarage.get(g.id) ?? new Map(),
        bookedByGarage.get(g.id) ?? new Map(),
        { daysAhead: DAYS_AHEAD, now, capacity: g.capacity ?? 1 }
      );
      return {
        ...toPublicGarage(g),
        avgRating: averageRating(g.reviews) ?? 0,
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

    // La page est déjà découpée (par la base, ou par le classement par distance ci-dessus).
    const effectiveTotal = total;
    const pageItems = garagesWithMeta;

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
