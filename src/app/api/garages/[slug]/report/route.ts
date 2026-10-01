import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_REASONS = ["usurpation", "erreur", "retrait", "autre"];

// POST /api/garages/[slug]/report — "Signaler un problème / demander le retrait"
// Une demande de retrait masque la fiche immédiatement (section 5 : "traitement
// rapide, fiche masquée dès réception de la demande en attendant la vérification").
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
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
  if (reason === "retrait" && garage.claimStatus === "non_reclamee") {
    await prisma.garage.update({ where: { id: garage.id }, data: { hiddenByReport: true } });
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

  return NextResponse.json({ ok: true });
}
