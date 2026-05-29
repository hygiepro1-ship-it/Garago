import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toIcsDate(dateStr: string, timeStr: string) {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:MM" → "YYYYMMDDTHHmmss"
  return dateStr.replace(/-/g, "") + "T" + timeStr.replace(":", "") + "00";
}

function escape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { garage: true },
  });

  if (!appt) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const dtStart = toIcsDate(appt.date, appt.startTime);
  const dtEnd   = toIcsDate(appt.date, appt.endTime);
  const now     = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const location = escape([appt.garage.address, appt.garage.city, appt.garage.province].filter(Boolean).join(", "));
  const summary  = escape(`RDV ${appt.garage.name}${appt.serviceName ? ` — ${appt.serviceName}` : ""}`);
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
    `UID:appt-${appt.id}@garago.ca`,
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
