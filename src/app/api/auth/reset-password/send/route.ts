import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPasswordResetCode } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Adresse courriel invalide." }, { status: 400 });
    }

    // Rate-limit : max 3 envois en 15 min par adresse
    const recent = await prisma.passwordResetCode.count({
      where: { email, createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } },
    });
    if (recent >= 3) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, password: true } });

    // Ne jamais révéler si un compte existe pour cette adresse (anti-énumération) —
    // on répond succès dans tous les cas et on n'envoie réellement que si le compte existe.
    if (user && user.password) {
      await prisma.passwordResetCode.deleteMany({ where: { email } });

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.passwordResetCode.create({ data: { email, code, expiresAt } });

      try {
        await sendPasswordResetCode(email, code);
      } catch (e) {
        console.error("[reset-password/send] Échec d'envoi :", e);
      }

      const isDev = process.env.NODE_ENV !== "production";
      if (isDev) {
        return NextResponse.json({ ok: true, devCode: code });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password/send] Erreur :", err);
    return NextResponse.json({ error: "Erreur lors de la génération du code." }, { status: 500 });
  }
}
