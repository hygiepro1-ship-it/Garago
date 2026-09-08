import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMaintenanceReminder } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rappels dont l'échéance tombe dans les 3 prochains jours, non envoyés, non complétés
  const now       = new Date();
  const threeDays = new Date(now);
  threeDays.setDate(threeDays.getDate() + 3);

  const reminders = await prisma.maintenanceReminder.findMany({
    where: {
      done:         false,
      reminderSent: false,
      dueDate:      { gte: now, lte: threeDays },
    },
    include: { user: true, vehicle: true },
  });

  let sent = 0;
  for (const reminder of reminders) {
    if (!reminder.user.email) continue;
    try {
      await sendMaintenanceReminder({
        to:           reminder.user.email,
        customerName: reminder.user.name ?? "",
        title:        reminder.title,
        notes:        reminder.notes,
        dueDate:      reminder.dueDate!.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" }),
        vehicleLabel: reminder.vehicle ? `${reminder.vehicle.make} ${reminder.vehicle.model} ${reminder.vehicle.year}` : null,
      });
      await prisma.maintenanceReminder.update({
        where: { id: reminder.id },
        data:  { reminderSent: true },
      });
      sent++;
    } catch (err) {
      console.error(`Maintenance reminder failed for ${reminder.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, checked: reminders.length });
}
