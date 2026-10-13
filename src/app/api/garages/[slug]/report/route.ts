import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clientIp, isRateLimited } from "@/lib/abuse";
import { verifyTurnstile, CAPTCHA_ERROR } from "@/lib/turnstile";

const VALID_REASONS = ["usurpation", "erreur", "retrait", "autre"];

// POST /api/garages/[slug]/report — "Signaler un problème / demander le retrait"
// Une demande de retrait masque la fiche immédiatement (section 5 : "traitement
// rapide, fiche masquée dès réception de la demande en attendant la vérification").
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // Un « retrait » masque la fiche immédiatement : on limite le débit pour qu'un script ne puisse pas masquer l'annuaire.
  if (await isRateLimited(`rp:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de signalements. Réessayez plus tard." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  if (!(await verifyTurnstile(body.turnstileToken, clientIp(req)))) {
    return NextResponse.json({ error: CAPTCHA_ERROR }, { status: 400 });
  }
  const reason = String(body.reason ?? "");
  const message = body.message ? String(body.message).trim().slice(0, 1000) : null;
  const reporterEmail = body.reporterEmail ? String(body.reporterEmail).trim().toLowerCase() : null;

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Motif invalide." }, { status: 400 });
  }
  if (reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
    return NextResponse.json({ error: "Adresse courriel invalide." }, { status: 400 });
  }

  const garage = await prisma.garage.findUnique({ where: { slug }, select: { id: true, claimStatus: true } });
  if (!garage) return NextResponse.json({ error: "Garage introuvable." }, { status: 404 });

  await prisma.garageReport.create({
    data: { garageId: garage.id, reason, message, reporterEmail },
  });

  // Retrait demandé sur une fiche pas encore réclamée : on la masque tout de
  // suite, un admin tranche ensuite (retrait définitif ou remise en ligne).
  // Plafond global : au-delà de 15 retraits automatiques en 24 h, la demande est enregistrée pour l'équipe mais
  // la fiche reste en ligne (un réseau de robots ne peut pas vider l'annuaire ; l'équipe tranche ensuite).
  let hidden = false;
  if (reason === "retrait" && garage.claimStatus === "non_reclamee") {
    const hiddenToday = await prisma.garageReport.count({
      where: { reason: "retrait", createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    if (hiddenToday <= 15) {
      await prisma.garage.update({ where: { id: garage.id }, data: { hiddenByReport: true } });
      hidden = true;
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "report_created",
      targetType: "Garage",
      targetId: garage.id,
      actorEmail: reporterEmail,
      detail: `Signalement (${reason})${message ? " : " + message : ""}`,
    },
  });

  return NextResponse.json({ ok: true, hidden });
}
