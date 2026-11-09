import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { verifyIcsToken } from "@/lib/ics-token";

export const dynamic = "force-dynamic";

function toIcsDate(dateStr: string, timeStr: string) {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:MM" → "YYYYMMDDTHHmmss"
  return dateStr.replace(/-/g, "") + "T" + timeStr.replace(":", "") + "00";
}

function escape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Lien signé (courriel, écran de fin de réservation) ou, à défaut, client ou garage du rendez-vous connecté.
  const signed = verifyIcsToken(id, req.nextUrl.searchParams.get("t"));
  const userId = signed ? null : (await getServerSession(authOptions))?.user?.id ?? null;
  if (!signed && !userId) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { garage: true },
  });

  // Même réponse que pour un rendez-vous inexistant : rien n'indique qu'il existe.
  if (!appt || (!signed && appt.userId !== userId && appt.garage.ownerId !== userId)) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const dtStart = toIcsDate(appt.date, appt.startTime);
  const dtEnd   = toIcsDate(appt.date, appt.endTime);
  const now     = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const location = escape([appt.garage.address, appt.garage.city, appt.garage.province].filter(Boolean).join(", "));
  const summary  = escape(`RDV ${appt.garage.name}${appt.serviceName ? ` · ${appt.serviceName}` : ""}`);
  const description = escape([
    appt.serviceName ? `Service : ${appt.serviceName}` : "",
    appt.vehicleMake ? `Véhicule : ${appt.vehicleYear ?? ""} ${appt.vehicleMake} ${appt.vehicleModel ?? ""}`.trim() : "",
    `Téléphone : ${appt.garage.phone}`,
  ].filter(Boolean).join("\n"));

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Garago//Garago//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:appt-${appt.id}@garagopro.ca`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Rappel rendez-vous",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Rappel rendez-vous demain",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type":        "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="rdv-${appt.id}.ics"`,
    },
  });
}
