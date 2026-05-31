import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id }   = await params;
  const body     = await req.json();

  const reminder = await prisma.maintenanceReminder.updateMany({
    where: { id, userId },
    data: {
      ...(body.done     !== undefined && { done:     body.done }),
      ...(body.title    !== undefined && { title:    body.title }),
      ...(body.notes    !== undefined && { notes:    body.notes }),
      ...(body.dueDate  !== undefined && { dueDate:  body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.priority !== undefined && { priority: body.priority }),
    },
  });

  return NextResponse.json(reminder);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id }   = await params;

  await prisma.maintenanceReminder.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
