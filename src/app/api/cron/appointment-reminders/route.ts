import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingReminder } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find appointments scheduled for tomorrow (24h window) that haven't been reminded
  const now      = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0]; // "YYYY-MM-DD"

  const appointments = await prisma.appointment.findMany({
    where: {
      date:         tomorrowStr,
      reminderSent: false,
      status:       { in: ["PENDING", "CONFIRMED"] },
      customerEmail: { not: null },
    },
    include: { garage: true },
  });

  let sent = 0;
  for (const appt of appointments) {
    if (!appt.customerEmail) continue;
    try {
      await sendBookingReminder({
        to:            appt.customerEmail,
        customerName:  appt.customerName,
        garageName:    appt.garage.name,
        garagePhone:   appt.garage.phone,
        garageAddress: [appt.garage.address, appt.garage.city].filter(Boolean).join(", "),
        date:          appt.date,
        startTime:     appt.startTime,
        endTime:       appt.endTime,
        serviceName:   appt.serviceName,
        appointmentId: appt.id,
      });
      await prisma.appointment.update({
        where: { id: appt.id },
        data:  { reminderSent: true },
      });
      sent++;
    } catch (err) {
      console.error(`Reminder failed for appt ${appt.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, checked: appointments.length });
}
