/**
 * POST /api/admin/calendly-invite
 * Envoie manuellement une invitation Calendly à un garage.
 * Réservé aux admins — utile pour réinviter ou gérer les cas d'erreur.
 *
 * Body: { garageId?: string, email?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inviteToOrg, getBookingUrl } from "@/lib/calendly";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { garageId, email: directEmail } = await req.json();

  let email = directEmail;

  if (garageId && !email) {
    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      include: { owner: { select: { email: true } } },
    });
    email = garage?.owner?.email;
  }

  if (!email) {
    return NextResponse.json({ error: "Email introuvable" }, { status: 404 });
  }

  const result = await inviteToOrg(email);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Tente de récupérer immédiatement l'URL si déjà membre
  const bookingUrl = await getBookingUrl(email);
  if (bookingUrl) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { garage: true },
    });
    if (user?.garage) {
      await prisma.garage.update({
        where: { id: user.garage.id },
        data: { calcomLink: bookingUrl },
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Invitation envoyée à ${email}`,
    bookingUrl: bookingUrl ?? "En attente d'acceptation",
  });
}
