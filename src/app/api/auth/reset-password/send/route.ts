import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPasswordResetCode } from "@/lib/email";
import { clientIp, isRateLimited } from "@/lib/abuse";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || email.length > 120 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email)) {
      return NextResponse.json({ error: "Adresse courriel invalide." }, { status: 400 });
    }

    // Limite par IP : empêche d'inonder la boîte d'une victime (ou de plusieurs) de codes de réinitialisation.
    if (await isRateLimited(`pr:${clientIp(req)}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
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

    // Recherche insensible à la casse : le courriel stocké peut avoir une casse
    // différente de celle retapée par l'utilisateur (ex. majuscule auto sur mobile).
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, password: true },
    });

    // Ne jamais révéler si un compte existe pour cette adresse (anti-énumération) —
    // on répond succès dans tous les cas et on n'envoie réellement que si le compte existe.
    if (user && user.password) {
      // Les codes précédents sont conservés : supprimer les anciens remettait à zéro le compteur d'envois
      // ET celui des tentatives, ce qui rendait le code devinable à volonté en en redemandant sans cesse.
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
