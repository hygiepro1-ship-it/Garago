import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

const SETTING_ID = "singleton";

/** GET /api/admin/maintenance — état actuel du mode maintenance. */
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const setting = await prisma.siteSetting.findUnique({ where: { id: SETTING_ID } });
  return NextResponse.json(setting ?? { id: SETTING_ID, maintenanceMode: false, maintenanceMessage: null, maintenanceUntil: null });
}

/** PUT /api/admin/maintenance — active/désactive le mode maintenance + message. */
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const maintenanceMode = !!body.maintenanceMode;
  const maintenanceMessage = typeof body.maintenanceMessage === "string" ? body.maintenanceMessage.trim().slice(0, 500) || null : null;
  const maintenanceUntil = body.maintenanceUntil ? new Date(body.maintenanceUntil) : null;

  const setting = await prisma.siteSetting.upsert({
    where: { id: SETTING_ID },
    create: { id: SETTING_ID, maintenanceMode, maintenanceMessage, maintenanceUntil },
    update: { maintenanceMode, maintenanceMessage, maintenanceUntil },
  });

  return NextResponse.json(setting);
}
