import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clientIp, isRateLimited } from "@/lib/abuse";

// Même raisonnement que reset-password/confirm : un code à 6 chiffres est
// brute-forçable sans limite de tentatives dans sa fenêtre de validité.
const MAX_ATTEMPTS = 5;
const MAX_TOTAL_ATTEMPTS = 10; // sur l'ensemble des codes récents de l'adresse (15 min)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const code = String(body?.code ?? "").trim();

    if (!email || !code) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    if (await isRateLimited(`vc:${clientIp(req)}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
    }
    const recentCodes = await prisma.emailVerificationCode.findMany({
      where: { email, createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } },
      select: { attempts: true },
    });
    if (recentCodes.reduce((sum, c) => sum + c.attempts, 0) >= MAX_TOTAL_ATTEMPTS) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
    }

    const record = await prisma.emailVerificationCode.findFirst({
      where: { email, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "Code invalide ou expiré." }, { status: 400 });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Trop de tentatives. Demandez un nouveau code." },
        { status: 429 }
      );
    }

    if (record.code !== code) {
      await prisma.emailVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
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
