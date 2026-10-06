import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText } from "@/lib/abuse";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId = session.user.id;
  const { id }   = await params;
  const body     = await req.json().catch(() => ({}));
  if (body.priority !== undefined && !["URGENT", "SOON", "LOW"].includes(body.priority)) return NextResponse.json({ error: "Priorité invalide" }, { status: 400 });
  if (body.dueDate && Number.isNaN(new Date(body.dueDate).getTime())) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  if (body.title !== undefined && !cleanText(body.title, 120)) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const reminder = await prisma.maintenanceReminder.updateMany({
    where: { id, userId },
    data: {
      ...(body.done     !== undefined && { done:     body.done === true }),
      ...(body.title    !== undefined && { title:    cleanText(body.title, 120) }),
      ...(body.notes    !== undefined && { notes:    body.notes ? String(body.notes).slice(0, 1000) : null }),
      ...(body.dueDate  !== undefined && { dueDate:  body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.priority !== undefined && { priority: body.priority }),
    },
  });

  return NextResponse.json(reminder);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId = session.user.id;
  const { id }   = await params;

  await prisma.maintenanceReminder.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
