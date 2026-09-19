import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return null;
  return session;
}

// Prix affichés publiquement (voir /garagistes et l'inscription garage) — utilisés
// ici uniquement pour une estimation de revenu récurrent, pas une source de
// vérité comptable (le vrai montant facturé vit dans Stripe).
const MONTHLY_PRICE = 109.99;
const ANNUAL_MONTHLY_EQUIVALENT = 88.00;
const BRANCH_ADDON = 49.99;

export async function GET(_req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

  const [
    totalDrivers, newDrivers30d,
    totalGarages, newGarages30d,
    garagesByStatus, garagesByVerification,
    activeMonthly, activeAnnual, activeBranches,
    trialCohort, convertedCohort,
    garagesNoServices, garagesNoReviews,
    unreadAlerts, pendingVerifications, pendingDescriptions, pendingSuggestions,
    totalAppointments, appointments30d, appointmentsByStatus30d,
    totalReviews, ratingAgg,
    totalAmbassadors, referralAgg,
    visitorGroups30d, visitorGroups7d,
    garagesByCity,
    topByAppointments,
    leastActiveGarages,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "DRIVER" } }),
    prisma.user.count({ where: { role: "DRIVER", createdAt: { gte: d30 } } }),

    prisma.garage.count({ where: { parentId: null } }),
    prisma.garage.count({ where: { parentId: null, createdAt: { gte: d30 } } }),

    prisma.garage.groupBy({ by: ["subscriptionStatus"], where: { parentId: null }, _count: true }),
    prisma.garage.groupBy({ by: ["verificationStatus"], where: { parentId: null }, _count: true }),

    prisma.garage.count({ where: { parentId: null, subscriptionStatus: "ACTIVE", stripePriceId: process.env.STRIPE_PRICE_ID } }),
    prisma.garage.count({ where: { parentId: null, subscriptionStatus: "ACTIVE", stripePriceId: process.env.STRIPE_PRICE_ID_ANNUAL } }),
    prisma.garage.count({ where: { parentId: { not: null }, parent: { subscriptionStatus: "ACTIVE" } } }),

    prisma.garage.count({ where: { parentId: null, subscriptionStatus: { in: ["ACTIVE", "PAST_DUE", "EXPIRED"] } } }),
    prisma.garage.count({ where: { parentId: null, subscriptionStatus: { in: ["ACTIVE", "PAST_DUE"] } } }),

    prisma.garage.count({ where: { parentId: null, services: { none: {} } } }),
    prisma.garage.count({ where: { parentId: null, reviews: { none: {} } } }),

    prisma.garageAlert.count({ where: { isRead: false } }),
    prisma.garage.count({ where: { verificationStatus: "PENDING" } }),
    prisma.garage.count({ where: { descriptionStatus: "PENDING" } }),
    prisma.suggestion.count({ where: { status: "PENDING" } }),

    prisma.appointment.count(),
    prisma.appointment.count({ where: { createdAt: { gte: d30 } } }),
    prisma.appointment.groupBy({ by: ["status"], where: { createdAt: { gte: d30 } }, _count: true }),

    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),

    prisma.garage.count({ where: { isAmbassador: true } }),
    prisma.garage.aggregate({ _sum: { referralCount: true, referralCommissionEarned: true } }),

    prisma.siteVisit.groupBy({ by: ["visitorId"], where: { createdAt: { gte: d30 } } }),
    prisma.siteVisit.groupBy({ by: ["visitorId"], where: { createdAt: { gte: d7 } } }),

    prisma.garage.groupBy({ by: ["city"], where: { parentId: null }, _count: true }),

    prisma.garage.findMany({
      where: { parentId: null },
      select: { id: true, name: true, slug: true, city: true, subscriptionStatus: true, _count: { select: { appointments: true, reviews: true } } },
      orderBy: { appointments: { _count: "desc" } },
      take: 5,
    }),

    // Garages établis depuis au moins 14 jours, encore actifs (essai ou payant),
    // avec le moins de rendez-vous — candidats à un suivi personnalisé.
    prisma.garage.findMany({
      where: {
        parentId: null,
        subscriptionStatus: { in: ["TRIAL", "ACTIVE"] },
        createdAt: { lte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true, name: true, slug: true, city: true, phone: true, subscriptionStatus: true, createdAt: true,
        owner: { select: { name: true, email: true } },
        _count: { select: { appointments: true, reviews: true } },
      },
      orderBy: { appointments: { _count: "asc" } },
      take: 5,
    }),
  ]);

  const groupToMap = (rows: any[], key: string) =>
    Object.fromEntries(rows.map((r) => [r[key], r._count]));

  const mrr = activeMonthly * MONTHLY_PRICE + activeAnnual * ANNUAL_MONTHLY_EQUIVALENT + activeBranches * BRANCH_ADDON;

  const visitors30d = visitorGroups30d.length;
  const visitors7d  = visitorGroups7d.length;
  const newSignups30d = newDrivers30d + newGarages30d;
  const visitorConversionRate = visitors30d > 0 ? (newSignups30d / visitors30d) * 100 : null;
  const trialConversionRate = trialCohort > 0 ? (convertedCohort / trialCohort) * 100 : null;

  return NextResponse.json({
    users: {
      totalDrivers, newDrivers30d,
    },
    garages: {
      total: totalGarages,
      new30d: newGarages30d,
      byStatus: groupToMap(garagesByStatus, "subscriptionStatus"),
      byVerification: groupToMap(garagesByVerification, "verificationStatus"),
      noServices: garagesNoServices,
      noReviews: garagesNoReviews,
      byCity: garagesByCity
        .map((g: any) => ({ city: g.city || "—", count: g._count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10),
    },
    revenue: {
      mrr: Math.round(mrr * 100) / 100,
      activeMonthly, activeAnnual, activeBranches,
      trialConversionRate,
    },
    marketplace: {
      totalAppointments, appointments30d,
      appointmentsByStatus30d: groupToMap(appointmentsByStatus30d, "status"),
      totalReviews, avgRating: ratingAgg._avg.rating,
      topGarages: topByAppointments.map((g: any) => ({
        id: g.id, name: g.name, slug: g.slug, city: g.city, subscriptionStatus: g.subscriptionStatus,
        appointmentCount: g._count.appointments, reviewCount: g._count.reviews,
      })),
      leastActiveGarages: leastActiveGarages.map((g: any) => ({
        id: g.id, name: g.name, slug: g.slug, city: g.city, phone: g.phone,
        subscriptionStatus: g.subscriptionStatus, createdAt: g.createdAt,
        ownerName: g.owner?.name ?? null, ownerEmail: g.owner?.email ?? null,
        appointmentCount: g._count.appointments, reviewCount: g._count.reviews,
      })),
    },
    referral: {
      totalAmbassadors,
      totalReferrals: referralAgg._sum.referralCount ?? 0,
      totalCommission: referralAgg._sum.referralCommissionEarned ?? 0,
    },
    traffic: {
      visitors30d, visitors7d,
      newSignups30d,
      visitorConversionRate,
    },
    queues: {
      unreadAlerts, pendingVerifications, pendingDescriptions, pendingSuggestions,
    },
  });
}
