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

    // Envoyer le courriel — non-fatal : si l'envoi échoue (Resend non configuré,
    // domaine non vérifié, etc.) on retourne quand même ok et on logue l'erreur.
    // En dev sans RESEND_API_KEY, le code s'affiche dans la console serveur.
    try {
      await sendVerificationCode(email, code);
    } catch (emailErr) {
      console.error("[verify-email/send] Échec d'envoi du courriel :", emailErr);
      // En développement, afficher le code directement pour faciliter les tests
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV] Code de vérification pour ${email} : ${code}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[verify-email/send] Erreur :", err);
    return NextResponse.json({ error: "Erreur lors de la génération du code." }, { status: 500 });
  }
}
