import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { clientIp, isRateLimited } from "@/lib/abuse";

// Un code à 6 chiffres n'a que 900 000 combinaisons — sans limite de tentatives,
// il serait brute-forçable dans sa fenêtre de validité. On compte les essais
// par adresse plutôt que par code : même un attaquant qui redemande un nouveau
// code ne repart pas à zéro pendant que le précédent est toujours valide.
const MAX_ATTEMPTS = 5;
// Plafond sur l'ensemble des codes récents d'une adresse (15 min), quel que soit le nombre de codes redemandés.
const MAX_TOTAL_ATTEMPTS = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const code = String(body?.code ?? "").trim();
    const newPassword = body?.newPassword;

    if (!email || !code || typeof newPassword !== "string" || !newPassword) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
    }
    if (newPassword.length > 128) {
      return NextResponse.json({ error: "Le mot de passe est trop long (128 caractères maximum)" }, { status: 400 });
    }

    // Limite par IP sur les essais de code
    if (await isRateLimited(`pc:${clientIp(req)}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
    }

    const recentCodes = await prisma.passwordResetCode.findMany({
      where: { email, createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } },
      select: { attempts: true },
    });
    if (recentCodes.reduce((sum, c) => sum + c.attempts, 0) >= MAX_TOTAL_ATTEMPTS) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
    }

    const record = await prisma.passwordResetCode.findFirst({
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
      await prisma.passwordResetCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Code invalide ou expiré." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!user) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    // Le code ne doit servir qu'une fois
    await prisma.passwordResetCode.deleteMany({ where: { email } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password/confirm] Erreur :", err);
    return NextResponse.json({ error: "Erreur lors de la réinitialisation." }, { status: 500 });
  }
}
