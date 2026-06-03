import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name:      true,
      email:     true,
      phone:     true,
      notifPref: true,
      vehicles: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select: { id: true, year: true, make: true, model: true, isDefault: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  return NextResponse.json(user);
}

// PATCH /api/user/profile — mise à jour notifPref et/ou phone
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;
  const { notifPref, phone, name } = await req.json();

  // Validation notifPref
  const validPrefs = ["EMAIL", "SMS", "BOTH"];
  if (notifPref && !validPrefs.includes(notifPref)) {
    return NextResponse.json({ error: "Préférence invalide" }, { status: 400 });
  }

  // Si SMS ou BOTH, un numéro de téléphone est requis
  if ((notifPref === "SMS" || notifPref === "BOTH") && !phone) {
    return NextResponse.json({ error: "Un numéro de téléphone est requis pour les notifications SMS." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(notifPref !== undefined ? { notifPref } : {}),
      ...(phone     !== undefined ? { phone }     : {}),
      ...(name      !== undefined ? { name }      : {}),
    },
    select: { id: true, name: true, email: true, phone: true, notifPref: true },
  });

  return NextResponse.json(updated);
}
