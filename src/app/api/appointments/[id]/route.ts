import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/appointments/[id] — update status (garage owner)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { status, notes, date, startTime, endTime } = await req.json();

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { garage: true },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only garage owner can update
  if (appt.garage.ownerId !== (session.user as any)?.id) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(status                ? { status }    : {}),
      ...(notes !== undefined   ? { notes }     : {}),
      ...(date                  ? { date }      : {}),
      ...(startTime             ? { startTime } : {}),
      ...(endTime               ? { endTime }   : {}),
    },
  });

  return NextResponse.json(updated);
}
