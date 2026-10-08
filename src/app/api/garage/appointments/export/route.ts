import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";
import { toMinutes } from "@/lib/availability";
import { buildXlsx, type Cell } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  PENDING: "En attente", CONFIRMED: "Prévu", CANCELLED: "Annulé", COMPLETED: "Terminé", NO_SHOW: "Client absent",
};
const CONFIRMATION: Record<string, string> = {
  NOT_REQUIRED: "", SCHEDULED: "Message à venir", AWAITING: "En attente de réponse",
  CONFIRMED: "Confirmé", EXPIRED: "Créneau libéré", NO_RESPONSE: "Sans réponse",
};
const CANCELLED_BY: Record<string, string> = { CLIENT: "Client", GARAGE: "Garage", SYSTEM: "Automatique" };

// GET /api/garage/appointments/export — tous les rendez-vous du garage dans un fichier Excel.
// Les données appartiennent au garage : il peut les récupérer à tout moment.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(session.user.id, readGarageId(req.url)) });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const appointments = await prisma.appointment.findMany({
    where: { garageId: garage.id },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const header = [
    "Date", "Heure", "Fin", "Durée (min)", "Client", "Téléphone", "Courriel", "Langue", "Contact",
    "Service", "Année", "Marque", "Modèle", "Statut", "Confirmation", "Annulé par", "Origine", "Notes",
  ];
  const rows: Cell[][] = appointments.map((a) => [
    a.date, a.startTime, a.endTime, toMinutes(a.endTime) - toMinutes(a.startTime),
    a.customerName, a.customerPhone, a.customerEmail,
    a.language === "en" ? "Anglais" : "Français",
    a.contactChannel === "SMS" ? "Texto" : a.contactChannel === "EMAIL" ? "Courriel" : "",
    a.serviceName, a.vehicleYear, a.vehicleMake, a.vehicleModel,
    STATUS[a.status] ?? a.status,
    a.confirmationStatus === "CONFIRMED" && a.confirmedVia === "PHONE" ? "Confirmé par téléphone" : (CONFIRMATION[a.confirmationStatus] ?? a.confirmationStatus),
    a.cancelledBy ? (CANCELLED_BY[a.cancelledBy] ?? a.cancelledBy) : "",
    a.source === "ONLINE" ? "En ligne" : "Saisi par le garage",
    a.notes,
  ]);

  const file = buildXlsx("Rendez-vous", header, rows, [12, 8, 8, 11, 26, 16, 28, 10, 10, 26, 8, 14, 14, 14, 22, 12, 18, 40]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rendez-vous-${garage.slug}-${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
