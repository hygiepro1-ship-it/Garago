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

    // Supprimer le code après validation
    await prisma.emailVerificationCode.delete({ where: { id: record.id } });

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
