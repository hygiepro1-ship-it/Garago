import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { wouldExceedCapacity, toMinutes } from "@/lib/availability";
import { quebecInstant, FREE_SLOT_STATUSES } from "@/lib/rdv-confirmation";
import { sendCancelledByCustomer } from "@/lib/email";

// Page publique de confirmation : le jeton (192 bits aléatoires, reçu par
// courriel) tient lieu d'authentification. On n'expose que ce qui est utile à
// la personne : garage, date, heure, service. Aucune coordonnée du client.

type State = "ask" | "confirmed" | "expired" | "cancelled" | "closed" | "past" | "invalid";

async function load(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  return prisma.appointment.findFirst({
    where: { confirmToken: token },
    include: { garage: { select: { name: true, address: true, city: true, phone: true, capacity: true, email: true, owner: { select: { email: true } } } } },
  });
}

type Loaded = NonNullable<Awaited<ReturnType<typeof load>>>;

async function slotIsFree(a: Loaded): Promise<boolean> {
  const duration = toMinutes(a.endTime) - toMinutes(a.startTime);
  const sameDay = await prisma.appointment.findMany({
    where: { garageId: a.garageId, date: a.date, id: { not: a.id }, status: { notIn: FREE_SLOT_STATUSES } },
    select: { startTime: true, endTime: true },
  });
  return !wouldExceedCapacity(a.startTime, duration, sameDay, a.garage.capacity ?? 1);
}

async function describe(a: Loaded, now = new Date()) {
  const start = quebecInstant(a.date, a.startTime);
  let state: State;
  let canRetake = false;

  if (a.status === "COMPLETED" || a.status === "NO_SHOW") state = "closed";
  else if (a.status === "CANCELLED" && a.confirmationStatus === "EXPIRED") {
    state = "expired";
    canRetake = start.getTime() - now.getTime() > 60 * 60 * 1000 && (await slotIsFree(a));
  } else if (a.status === "CANCELLED") state = "cancelled";
  else if (start.getTime() <= now.getTime()) state = "past";
  else if (a.confirmationStatus === "CONFIRMED") state = "confirmed";
  else state = "ask";

  return {
    state, canRetake,
    garageName: a.garage.name,
    garageAddress: [a.garage.address, a.garage.city].filter(Boolean).join(", "),
    garagePhone: a.garage.phone,
    date: a.date, startTime: a.startTime, endTime: a.endTime,
    serviceName: a.serviceName,
    confirmBy: a.confirmBy,
    // Rendez-vous pris au téléphone : la page parle la langue choisie par le garage et
    // renvoie vers le garage (pas vers la recherche d'autres garages) après une annulation.
    language: a.language === "en" ? "en" : "fr",
    manual: a.source === "MANUAL",
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = await load(token);
  if (!a) return NextResponse.json({ state: "invalid" satisfies State }, { status: 404 });
  return NextResponse.json(await describe(a));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { action } = await req.json().catch(() => ({}));
  if (!["confirm", "cancel", "retake"].includes(action)) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  const a = await load(token);
  if (!a) return NextResponse.json({ state: "invalid" satisfies State }, { status: 404 });

  const live = { status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] } };

  if (action === "confirm") {
    // Tant que la tâche planifiée n'a pas libéré le créneau, la confirmation reste possible.
    await prisma.appointment.updateMany({
      where: { id: a.id, ...live, confirmationStatus: { in: ["AWAITING", "SCHEDULED", "NO_RESPONSE"] } },
      data: { confirmationStatus: "CONFIRMED", confirmedVia: "LINK", confirmRespondedAt: a.confirmRespondedAt ?? new Date() },
    });
  } else if (action === "cancel") {
    const start = quebecInstant(a.date, a.startTime);
    if (start.getTime() > Date.now()) {
      const now = new Date();
      const done = await prisma.appointment.updateMany({
        where: { id: a.id, ...live },
        data: { status: "CANCELLED", cancelledBy: "CLIENT", cancelledAt: now, confirmRespondedAt: a.confirmRespondedAt ?? now },
      });
      // Le garage doit le savoir tout de suite pour redonner le créneau.
      const garageTo = a.garage.email || a.garage.owner?.email;
      if (done.count === 1 && garageTo) {
        await sendCancelledByCustomer({
          to: garageTo, garageName: a.garage.name, customerName: a.customerName, customerPhone: a.customerPhone,
          serviceName: a.serviceName, date: a.date, startTime: a.startTime,
        }).catch((e) => console.error("[rdv] sendCancelledByCustomer", e));
      }
    }
  } else if (action === "retake") {
    try {
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.appointment.findUnique({ where: { id: a.id }, include: { garage: { select: { capacity: true } } } });
        if (!fresh || fresh.status !== "CANCELLED" || fresh.confirmationStatus !== "EXPIRED") throw new Error("NOT_RETAKABLE");
        if (quebecInstant(fresh.date, fresh.startTime).getTime() - Date.now() <= 60 * 60 * 1000) throw new Error("NOT_RETAKABLE");
        const duration = toMinutes(fresh.endTime) - toMinutes(fresh.startTime);
        const sameDay = await tx.appointment.findMany({
          where: { garageId: fresh.garageId, date: fresh.date, id: { not: fresh.id }, status: { notIn: FREE_SLOT_STATUSES } },
          select: { startTime: true, endTime: true },
        });
        if (wouldExceedCapacity(fresh.startTime, duration, sameDay, fresh.garage.capacity ?? 1)) throw new Error("SLOT_TAKEN");
        await tx.appointment.update({
          where: { id: fresh.id },
          data: { status: "CONFIRMED", confirmationStatus: "CONFIRMED", confirmBy: null, cancelledBy: null, cancelledAt: null },
        });
      }, { isolationLevel: "Serializable" });
    } catch (e: any) {
      if (e?.message === "NOT_RETAKABLE" || e?.message === "SLOT_TAKEN" || e?.code === "P2034") {
        const again = await load(token);
        return NextResponse.json({ ...(again ? await describe(again) : {}), error: "Ce créneau n'est plus disponible." }, { status: 409 });
      }
      throw e;
    }
  }

  const fresh = await load(token);
  return NextResponse.json(fresh ? await describe(fresh) : { state: "invalid" });
}
