import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Adresse courriel invalide." }, { status: 400 });
    }

    // Rate-limit : max 3 envois en 15 min par adresse
    const recent = await prisma.emailVerificationCode.count({
      where: { email, createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } },
    });
    if (recent >= 3) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }

    // Supprimer les anciens codes pour ce courriel
    await prisma.emailVerificationCode.deleteMany({ where: { email } });

    // Générer un code à 6 chiffres
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.emailVerificationCode.create({ data: { email, code, expiresAt } });

    // Tenter l'envoi du courriel
    let emailSent = false;
    let emailError: string | null = null;
    try {
      await sendVerificationCode(email, code);
      emailSent = true;
    } catch (emailErr: any) {
      console.error("[verify-email/send] Échec d'envoi du courriel :", emailErr);
      emailError = emailErr?.message ?? "Erreur inconnue";
    }

    // En développement OU si le courriel n'a pas pu être envoyé :
    // renvoyer le code dans la réponse pour permettre les tests.
    const isDev = process.env.NODE_ENV !== "production";
    const resendNotConfigured =
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY.startsWith("re_VOTRE");

    if (isDev || resendNotConfigured || !emailSent) {
      // En production avec Resend configuré mais qui échoue, on signale l'erreur
      if (!isDev && !resendNotConfigured && !emailSent) {
        console.error("[verify-email/send] Resend configuré mais envoi échoué :", emailError);
      }
      return NextResponse.json({ ok: true, devCode: code });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[verify-email/send] Erreur :", err);
    return NextResponse.json({ error: "Erreur lors de la génération du code." }, { status: 500 });
  }
}
