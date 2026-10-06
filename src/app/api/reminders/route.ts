import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText } from "@/lib/abuse";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([], { status: 401 });
  const userId = session.user.id;

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
  const userId = session.user.id;
  const { title: titleRaw, notes: notesRaw, dueDate, vehicleId, priority } = await req.json().catch(() => ({}));

  const title = cleanText(titleRaw, 120);
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  const due = dueDate ? new Date(dueDate) : null;
  if (due && Number.isNaN(due.getTime())) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  if (priority !== undefined && !["URGENT", "SOON", "LOW"].includes(priority)) return NextResponse.json({ error: "Priorité invalide" }, { status: 400 });
  // Le véhicule doit appartenir à l'utilisateur (sinon la réponse divulguerait le véhicule d'un autre compte).
  if (vehicleId) {
    const own = await prisma.userVehicle.findFirst({ where: { id: String(vehicleId), userId }, select: { id: true } });
    if (!own) return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  }
  if ((await prisma.maintenanceReminder.count({ where: { userId } })) >= 200) {
    return NextResponse.json({ error: "Limite de rappels atteinte." }, { status: 400 });
  }

  const reminder = await prisma.maintenanceReminder.create({
    data: {
      userId,
      title,
      notes:     notesRaw ? String(notesRaw).replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").trim().slice(0, 1000) || null : null,
      dueDate:   due,
      vehicleId: vehicleId || null,
      priority:  priority ?? "SOON",
    },
    include: { vehicle: { select: { id: true, year: true, make: true, model: true } } },
  });

  return NextResponse.json(reminder, { status: 201 });
}
