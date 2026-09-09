import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    const record = await prisma.emailVerificationCode.findFirst({
      where: { email, code, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      return NextResponse.json({ error: "Code invalide ou expiré." }, { status: 400 });
    }

    // Marquer comme vérifié (et non supprimer) — /api/register doit pouvoir
    // confirmer côté serveur que cet email a bien été vérifié avant de créer le compte.
    await prisma.emailVerificationCode.update({ where: { id: record.id }, data: { verified: true } });

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
