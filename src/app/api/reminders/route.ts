import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([], { status: 401 });
  const userId = (session.user as any).id;

  const reminders = await prisma.maintenanceReminder.findMany({
    where:   { userId },
    include: { vehicle: { select: { id: true, year: true, make: true, model: true } } },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId = (session.user as any).id;
  const { title, notes, dueDate, vehicleId, priority } = await req.json();

  if (!title?.trim()) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const reminder = await prisma.maintenanceReminder.create({
    data: {
      userId,
      title:     title.trim(),
      notes:     notes?.trim() || null,
      dueDate:   dueDate ? new Date(dueDate) : null,
      vehicleId: vehicleId || null,
      priority:  priority ?? "SOON",
    },
    include: { vehicle: { select: { id: true, year: true, make: true, model: true } } },
  });

  return NextResponse.json(reminder, { status: 201 });
}
