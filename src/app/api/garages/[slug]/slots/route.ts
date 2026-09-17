import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlots } from "@/lib/availability";

// GET /api/garages/[slug]/slots?date=YYYY-MM-DD
// Returns available 30-min slots for a given date
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const date      = req.nextUrl.searchParams.get("date");
  const excludeId = req.nextUrl.searchParams.get("excludeId"); // RDV en cours de déplacement
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const garage = await prisma.garage.findUnique({
    where: { slug },
    include: { availability: true },
  });
  if (!garage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Day of week: 0=Sun … 6=Sat
  const jsDate = new Date(date + "T12:00:00");
  const dow = jsDate.getDay();
  const avail = garage.availability.find((a) => a.dayOfWeek === dow);

  if (!avail || avail.isClosed) {
    return NextResponse.json({ slots: [], closed: true });
  }

  // Generate slots between openTime and closeTime
  const slots = generateSlots(avail.openTime, avail.closeTime, 60);

  // ── Créneaux bloqués par le garagiste ────────────────────────────────────
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: { garageId: garage.id, date },
  });

  // Journée entière bloquée → fermé
  if (blockedSlots.some(b => b.allDay)) {
    return NextResponse.json({ slots: [], closed: true });
  }

  // Créneaux partiellement bloqués : on marque chaque slot qui chevauche un bloc
  const blockedTimes = new Set<string>();
  for (const block of blockedSlots) {
    if (!block.startTime || !block.endTime) continue;
    const [bh, bm] = block.startTime.split(":").map(Number);
    const [eh, em] = block.endTime.split(":").map(Number);
    const blockStart = bh * 60 + bm;
    const blockEnd   = eh * 60 + em;
    for (const slot of slots) {
      const [sh, sm] = slot.split(":").map(Number);
      const slotStart = sh * 60 + sm;
      const slotEnd   = slotStart + 60; // durée d'un créneau
      if (slotStart < blockEnd && slotEnd > blockStart) {
        blockedTimes.add(slot);
      }
    }
  }

  // ── RDV déjà pris ────────────────────────────────────────────────────────
  const booked = await prisma.appointment.findMany({
    where: {
      garageId: garage.id,
      date,
      status: { not: "CANCELLED" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { startTime: true },
  });
  const bookedTimes = new Set(booked.map((b) => b.startTime));

  // ── Filtre final ──────────────────────────────────────────────────────────
  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);

  const available = slots.filter((s) => {
    if (bookedTimes.has(s))  return false; // déjà réservé
    if (blockedTimes.has(s)) return false; // bloqué par le garagiste
    if (isToday) {
      const [h, m] = s.split(":").map(Number);
      const slotMinutes = h * 60 + m;
      const nowMinutes  = now.getHours() * 60 + now.getMinutes() + 30;
      if (slotMinutes <= nowMinutes) return false; // passé
    }
    return true;
  });

  return NextResponse.json({ slots: available, openTime: avail.openTime, closeTime: avail.closeTime });
}
