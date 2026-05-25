import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/garages/[slug]/slots?date=YYYY-MM-DD
// Returns available 30-min slots for a given date
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const date = req.nextUrl.searchParams.get("date");
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

  // Generate 30-min slots between openTime and closeTime
  const slots = generateSlots(avail.openTime, avail.closeTime, 60);

  // Fetch already-booked slots for this date
  const booked = await prisma.appointment.findMany({
    where: {
      garageId: garage.id,
      date,
      status: { not: "CANCELLED" },
    },
    select: { startTime: true },
  });
  const bookedTimes = new Set(booked.map((b) => b.startTime));

  // Filter out past slots if today
  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);

  const available = slots.filter((s) => {
    if (bookedTimes.has(s)) return false;
    if (isToday) {
      const [h, m] = s.split(":").map(Number);
      const slotMinutes = h * 60 + m;
      const nowMinutes = now.getHours() * 60 + now.getMinutes() + 30; // 30-min buffer
      if (slotMinutes <= nowMinutes) return false;
    }
    return true;
  });

  return NextResponse.json({ slots: available, openTime: avail.openTime, closeTime: avail.closeTime });
}

function generateSlots(open: string, close: string, step = 60): string[] {
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const startMin = oh * 60 + om;
  const endMin   = ch * 60 + cm - step; // last slot starts 'step' min before close

  const result: string[] = [];
  for (let m = startMin; m <= endMin; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    result.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return result;
}
