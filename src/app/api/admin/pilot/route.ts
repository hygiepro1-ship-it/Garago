import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { quebecInstant } from "@/lib/rdv-confirmation";

export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// GET /api/admin/pilot?from=YYYY-MM-DD&to=YYYY-MM-DD[&garageId=...]
// Résultats du projet pilote : rendez-vous saisis par les garages (pris au
// téléphone) et réponses des clients à la demande de confirmation, par garage.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const from = req.nextUrl.searchParams.get("from");
  const to   = req.nextUrl.searchParams.get("to");
  const garageId = req.nextUrl.searchParams.get("garageId");
  if (!isDate(from) || !isDate(to)) return NextResponse.json({ error: "Période invalide" }, { status: 400 });

  const rows = await prisma.appointment.findMany({
    where: { source: "MANUAL", date: { gte: from, lte: to }, ...(garageId ? { garageId } : {}) },
    select: {
      garageId: true, date: true, startTime: true, status: true, contactChannel: true,
      confirmationStatus: true, confirmedVia: true, confirmRequestedAt: true, confirmRespondedAt: true,
      noResponseAt: true, cancelledBy: true, cancelledAt: true,
      garage: { select: { name: true, slug: true, city: true } },
    },
  });

  // Les garages du pilote (réservation en ligne fermée : ils saisissent eux-mêmes leurs rendez-vous)
  // et le garage demandé apparaissent toujours, même sans rendez-vous sur la période.
  const listed = await prisma.garage.findMany({
    where: garageId ? { id: garageId } : { onlineBooking: false, claimStatus: "activee" },
    select: { id: true, name: true, slug: true, city: true },
  });

  const now = Date.now();
  const info = new Map(listed.map((g) => [g.id, g]));
  const byGarage = new Map<string, typeof rows>(listed.map((g) => [g.id, []]));
  for (const r of rows) {
    if (!info.has(r.garageId)) info.set(r.garageId, { id: r.garageId, ...r.garage });
    const list = byGarage.get(r.garageId);
    if (list) list.push(r); else byGarage.set(r.garageId, [r]);
  }

  const garages = [...byGarage.entries()].map(([id, list]) => {
    const g = info.get(id)!;
    const withMessage = list.filter((a) => a.contactChannel);
    // Demandes réellement parties, puis celles dont on connaît l'issue (réponse reçue ou échéance passée).
    const sent      = withMessage.filter((a) => a.confirmRequestedAt);
    const settled   = sent.filter((a) => a.confirmRespondedAt || a.noResponseAt);
    const noReply   = sent.filter((a) => a.noResponseAt);
    // A répondu lui-même au message (confirmation ou annulation) avant l'échéance de 24 h.
    const answered  = settled.filter((a) => !a.noResponseAt);
    const undelivered = withMessage.filter((a) => a.noResponseAt && !a.confirmRequestedAt);

    const clientConfirmed = sent.filter((a) => a.confirmedVia === "LINK" && a.cancelledBy !== "CLIENT");
    const clientCancelled = list.filter((a) => a.cancelledBy === "CLIENT");
    const noticeHours = clientCancelled
      .filter((a) => a.cancelledAt)
      .map((a) => (quebecInstant(a.date, a.startTime).getTime() - (a.cancelledAt as Date).getTime()) / HOUR);
    const responseMinutes = sent
      .filter((a) => a.confirmRespondedAt && a.confirmedVia !== "PHONE")
      .map((a) => ((a.confirmRespondedAt as Date).getTime() - (a.confirmRequestedAt as Date).getTime()) / 60000)
      .filter((m) => m >= 0);

    // Absences : sur les rendez-vous dont l'heure est passée et qui n'ont pas été annulés.
    const past      = list.filter((a) => a.status !== "CANCELLED" && quebecInstant(a.date, a.startTime).getTime() < now);
    const noShows   = past.filter((a) => a.status === "NO_SHOW");
    const pastConfirmed   = past.filter((a) => a.confirmationStatus === "CONFIRMED");
    const pastUnconfirmed = past.filter((a) => a.confirmationStatus !== "CONFIRMED");

    const channel = (c: "SMS" | "EMAIL") => {
      const s = settled.filter((a) => a.contactChannel === c);
      return { settled: s.length, answered: s.filter((a) => a.confirmRespondedAt && a.confirmedVia !== "PHONE" && (!a.noResponseAt || a.confirmRespondedAt < a.noResponseAt)).length };
    };

    return {
      id, name: g.name, slug: g.slug, city: g.city,
      total: list.length,
      withoutMessage: list.length - withMessage.length,
      sent: sent.length,
      settled: settled.length,
      pending: sent.length - settled.length,
      undelivered: undelivered.length,
      clientConfirmed: clientConfirmed.length,
      clientCancelled: clientCancelled.length,
      // Annulations reçues au moins 24 h avant : le garage a le temps de redonner le créneau.
      cancelledEarly: noticeHours.filter((h) => h >= 24).length,
      medianNoticeHours: median(noticeHours),
      answered: answered.length,
      noReply: noReply.length,
      noReplyPhoneConfirmed: noReply.filter((a) => a.confirmedVia === "PHONE").length,
      noReplyLateAnswer: noReply.filter((a) => a.confirmedVia === "LINK" || a.cancelledBy === "CLIENT").length,
      garageCancelled: list.filter((a) => a.cancelledBy === "GARAGE").length,
      medianResponseMinutes: median(responseMinutes),
      past: past.length,
      noShows: noShows.length,
      pastConfirmed: pastConfirmed.length,
      noShowsConfirmed: pastConfirmed.filter((a) => a.status === "NO_SHOW").length,
      pastUnconfirmed: pastUnconfirmed.length,
      noShowsUnconfirmed: pastUnconfirmed.filter((a) => a.status === "NO_SHOW").length,
      sms: channel("SMS"),
      email: channel("EMAIL"),
    };
  }).sort((a, b) => b.total - a.total);

  return NextResponse.json({ from, to, garages });
}
