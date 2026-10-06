import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/email";
import { clientIp, isRateLimited } from "@/lib/abuse";
import { verifyTurnstile, CAPTCHA_ERROR } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || email.length > 120 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email)) {
      return NextResponse.json({ error: "Adresse courriel invalide." }, { status: 400 });
    }

    // Captcha (actif dès que les clés Turnstile sont configurées)
    if (!(await verifyTurnstile(body?.turnstileToken, clientIp(req)))) {
      return NextResponse.json({ error: CAPTCHA_ERROR }, { status: 400 });
    }

    // Limite par adresse IP : empêche d'utiliser le site pour envoyer des courriels en rafale à des tiers.
    if (await isRateLimited(`vs:${clientIp(req)}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
    }

    // Rate-limit : max 3 envois en 15 min par adresse. Les anciens codes sont conservés (et non
    // supprimés) : sinon le compte ne dépasserait jamais 1, et chaque nouvel envoi remettrait à zéro
    // le compteur de tentatives — ce qui permettrait de deviner le code à volonté.
    const recent = await prisma.emailVerificationCode.count({
      where: { email, createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } },
    });
    if (recent >= 3) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }

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

    const isDev = process.env.NODE_ENV !== "production";
    const resendNotConfigured =
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY.startsWith("re_VOTRE");

    // En développement uniquement → retourner le code pour les tests
    if (isDev) {
      return NextResponse.json({ ok: true, devCode: code });
    }

    // En production : si Resend n'est pas configuré, erreur explicite (ne jamais exposer le code)
    if (resendNotConfigured || !emailSent) {
      console.error("[verify-email/send] Envoi impossible :", resendNotConfigured ? "Resend non configuré" : emailError);
      return NextResponse.json(
        { error: "Impossible d'envoyer le code de vérification. Vérifiez votre adresse courriel et réessayez." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[verify-email/send] Erreur :", err);
    return NextResponse.json({ error: "Erreur lors de la génération du code." }, { status: 500 });
  }
}
