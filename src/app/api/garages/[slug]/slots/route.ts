import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeFreeSlots, toMinutes, DEFAULT_DURATION_MIN, quebecToday, dayOfWeekOf } from "@/lib/availability";

// GET /api/garages/[slug]/slots?date=YYYY-MM-DD&categoryId=...
// Renvoie les créneaux libres pour une date donnée, dimensionnés à la durée
// configurée par le garage pour la prestation demandée (categoryId) — chaque
// service occupe le temps qui lui est propre dans l'agenda, pas un bloc fixe.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const date       = req.nextUrl.searchParams.get("date");
  const excludeId  = req.nextUrl.searchParams.get("excludeId"); // RDV en cours de déplacement
  // Une ou plusieurs prestations : categoryIds=a,b,c (categoryId seul reste accepté)
  const categoryIds = Array.from(new Set(
    (req.nextUrl.searchParams.get("categoryIds") ?? req.nextUrl.searchParams.get("categoryId") ?? "")
      .split(",").map((s) => s.trim()).filter(Boolean)
  )).slice(0, 6);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "date required" }, { status: 400 });

  const garage = await prisma.garage.findUnique({
    where: { slug },
    include: { availability: true },
  });
  if (!garage) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Réservation en ligne fermée pour ce garage : aucun créneau n'est proposé au public.
  if (!garage.onlineBooking) return NextResponse.json({ slots: [], closed: true, durationMin: DEFAULT_DURATION_MIN });
  const capacity = garage.capacity ?? 1;

  // La durée vient toujours d'une donnée déjà connue du serveur (jamais d'une
  // valeur envoyée par le client) : le service configuré par CE garage, ou —
  // lors d'un déplacement de RDV (excludeId) — la durée du RDV déplacé, pour
  // proposer des créneaux de la même longueur que celui qu'on remplace.
  let durationMin = DEFAULT_DURATION_MIN;
  if (categoryIds.length > 0) {
    const svcs = await prisma.garageService.findMany({
      where: { garageId: garage.id, categoryId: { in: categoryIds }, active: true },
      select: { durationMin: true },
    });
    if (svcs.length > 0) durationMin = svcs.reduce((sum, s) => sum + (s.durationMin ?? DEFAULT_DURATION_MIN), 0);
  } else if (excludeId) {
    const original = await prisma.appointment.findFirst({
      where: { id: excludeId, garageId: garage.id },
      select: { startTime: true, endTime: true },
    });
    if (original) {
      const d = toMinutes(original.endTime) - toMinutes(original.startTime);
      if (d > 0) durationMin = d;
    }
  }

  // Day of week: 0=Sun … 6=Sat
  const dow = dayOfWeekOf(date);
  const avail = garage.availability.find((a) => a.dayOfWeek === dow);

  const blockedSlots = await prisma.blockedSlot.findMany({
    where: { garageId: garage.id, date },
    select: { startTime: true, endTime: true, allDay: true },
  });

  const booked = await prisma.appointment.findMany({
    where: {
      garageId: garage.id,
      date,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { startTime: true, endTime: true },
  });

  const now = new Date();
  const isToday = date === quebecToday(now);

  const available = computeFreeSlots(avail, blockedSlots, booked, durationMin, { isToday, now, capacity });

  const closed = !avail || avail.isClosed || blockedSlots.some((b) => b.allDay);

  return NextResponse.json({
    slots: available,
    closed,
    durationMin,
    openTime: avail?.openTime,
    closeTime: avail?.closeTime,
  });
}
