import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOf(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const garage = await prisma.garage.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, ambassadorTier: true },
  });
  if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });
  if (garage.ambassadorTier < 1) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const now = new Date();
  const d30 = startOf(30);
  const d60 = startOf(60);
  const d7  = startOf(7);
  const d14 = startOf(14);

  const [
    views30, views7, viewsPrev30, viewsPrev7,
    appts30, appts7, apptsPrev30, apptsPrev7,
    allReviews, reviews30, reviewsPrev30,
  ] = await Promise.all([
    prisma.garageProfileView.count({ where: { garageId: garage.id, createdAt: { gte: d30 } } }),
    prisma.garageProfileView.count({ where: { garageId: garage.id, createdAt: { gte: d7 } } }),
    prisma.garageProfileView.count({ where: { garageId: garage.id, createdAt: { gte: d60, lt: d30 } } }),
    prisma.garageProfileView.count({ where: { garageId: garage.id, createdAt: { gte: d14, lt: d7 } } }),

    prisma.appointment.count({ where: { garageId: garage.id, createdAt: { gte: d30 } } }),
    prisma.appointment.count({ where: { garageId: garage.id, createdAt: { gte: d7 } } }),
    prisma.appointment.count({ where: { garageId: garage.id, createdAt: { gte: d60, lt: d30 } } }),
    prisma.appointment.count({ where: { garageId: garage.id, createdAt: { gte: d14, lt: d7 } } }),

    prisma.review.findMany({ where: { garageId: garage.id, isHidden: false }, select: { rating: true, createdAt: true } }),
    prisma.review.findMany({ where: { garageId: garage.id, isHidden: false, createdAt: { gte: d30 } }, select: { rating: true } }),
    prisma.review.findMany({ where: { garageId: garage.id, isHidden: false, createdAt: { gte: d60, lt: d30 } }, select: { rating: true } }),
  ]);

  const avg = (arr: { rating: number }[]) =>
    arr.length ? Math.round((arr.reduce((s, r) => s + r.rating, 0) / arr.length) * 10) / 10 : null;

  const conversion30 = views30 > 0 ? Math.round((appts30 / views30) * 1000) / 10 : 0;
  const conversionPrev30 = viewsPrev30 > 0 ? Math.round((apptsPrev30 / viewsPrev30) * 1000) / 10 : 0;

  const trend = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
  };

  // Daily views for the last 30 days (chart data)
  const dailyViews = await prisma.garageProfileView.groupBy({
    by: ["createdAt"],
    where: { garageId: garage.id, createdAt: { gte: d30 } },
    _count: true,
  });

  // Build a map day → count
  const viewsByDay: Record<string, number> = {};
  for (const row of dailyViews) {
    const day = row.createdAt.toISOString().slice(0, 10);
    viewsByDay[day] = (viewsByDay[day] ?? 0) + row._count;
  }
  const chartDays: { date: string; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    chartDays.push({ date: key, views: viewsByDay[key] ?? 0 });
  }

  return NextResponse.json({
    views:      { last30: views30, last7: views7, trend30: trend(views30, viewsPrev30), trend7: trend(views7, viewsPrev7) },
    appts:      { last30: appts30, last7: appts7, trend30: trend(appts30, apptsPrev30), trend7: trend(appts7, apptsPrev7) },
    rating:     { overall: avg(allReviews), last30: avg(reviews30), prev30: avg(reviewsPrev30), total: allReviews.length },
    conversion: { last30: conversion30, trend30: trend(conversion30, conversionPrev30) },
    chart:      chartDays,
  });
}
