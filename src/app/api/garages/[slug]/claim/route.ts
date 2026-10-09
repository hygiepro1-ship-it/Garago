import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendClaimRequestNotification } from "@/lib/email";
import { clientIp, isRateLimited, cleanText } from "@/lib/abuse";
import { verifyTurnstile, CAPTCHA_ERROR } from "@/lib/turnstile";

// POST /api/garages/[slug]/claim — "Vous êtes le propriétaire ? Activez votre page"
// Section 3 de la stratégie fiches pré-créées : aucune connexion requise ici, la
// vérification (NEQ + pièce justificative) se fait à la main par un admin.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  if (!(await verifyTurnstile(body.turnstileToken, clientIp(req)))) {
    return NextResponse.json({ error: CAPTCHA_ERROR }, { status: 400 });
  }
  // Sans limite, un robot pourrait réclamer toutes les fiches une à une et noyer l'équipe de demandes bidon.
  if (await isRateLimited(`cl:${clientIp(req)}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard ou contactez-nous." }, { status: 429 });
  }
  const name  = cleanText(body.name, 80);
  const role  = cleanText(body.role, 60);
  const phone = cleanText(body.phone, 30);
  const email = String(body.email ?? "").trim().toLowerCase();
  const neq   = String(body.neq ?? "").replace(/\D/g, "");

  if (!name || !role || !phone || !email || !neq) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Adresse courriel invalide." }, { status: 400 });
  }
  // NEQ obligatoire pour activer une fiche — même exigence que pour l'inscription
  // d'un nouveau garage, vérifié manuellement par un admin dans les deux cas.
  if (!/^\d{10}$/.test(neq)) {
    return NextResponse.json({ error: "Numéro d'entreprise du Québec (NEQ) invalide : il doit compter 10 chiffres." }, { status: 400 });
  }

  const garage = await prisma.garage.findUnique({
    where: { slug },
    select: { id: true, name: true, city: true, claimStatus: true, ownerId: true },
  });
  if (!garage) return NextResponse.json({ error: "Garage introuvable." }, { status: 404 });

  // Fiche déjà réclamée, ou une demande est déjà en cours de vérification.
  if (garage.claimStatus !== "non_reclamee") {
    return NextResponse.json(
      { error: "Cette page est déjà gérée par son propriétaire. Un problème ? Contactez-nous." },
      { status: 409 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Revérifié dans la transaction : deux demandes simultanées sur la même
      // fiche ne doivent pas toutes les deux passer.
      const fresh = await tx.garage.findUnique({ where: { id: garage.id }, select: { claimStatus: true } });
      if (fresh?.claimStatus !== "non_reclamee") throw new Error("ALREADY_CLAIMED");

      await tx.claimRequest.create({
        data: { garageId: garage.id, name, role, phone, email, neq },
      });
      await tx.garage.update({ where: { id: garage.id }, data: { claimStatus: "en_attente" } });
      await tx.auditLog.create({
        data: {
          action: "claim_request_created",
          targetType: "Garage",
          targetId: garage.id,
          actorEmail: email,
          detail: `Demande de réclamation par ${name} (${role})`,
        },
      });
    });
  } catch (e: any) {
    if (e?.message === "ALREADY_CLAIMED") {
      return NextResponse.json(
        { error: "Cette page est déjà gérée par son propriétaire. Un problème ? Contactez-nous." },
        { status: 409 }
      );
    }
    throw e;
  }

  sendClaimRequestNotification({
    garageId: garage.id,
    garageName: garage.name,
    garageCity: garage.city,
    requesterName: name,
    requesterRole: role,
    requesterPhone: phone,
    requesterEmail: email,
    neq,
  }).catch((e) => console.error("[CLAIM REQUEST EMAIL]", e));

  return NextResponse.json({ ok: true });
}
