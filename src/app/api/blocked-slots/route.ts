import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["GARAGE_OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const ownerId = session.user.id;
    const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(ownerId, readGarageId(req.url)) });
    if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // "YYYY-MM"

    const where: any = { garageId: garage.id };
    if (month) {
      where.date = { gte: `${month}-01`, lte: `${month}-31` };
    }

    const slots = await prisma.blockedSlot.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(slots);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["GARAGE_OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const ownerId = session.user.id;
    const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(ownerId, readGarageId(req.url)) });
    if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

    const { date, startTime, endTime, reason, allDay } = await req.json();
    if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Date requise (AAAA-MM-JJ)" }, { status: 400 });
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!allDay && (!hhmm.test(String(startTime)) || !hhmm.test(String(endTime)) || String(startTime) >= String(endTime))) {
      return NextResponse.json({ error: "Heures invalides" }, { status: 400 });
    }

    const slot = await prisma.blockedSlot.create({
      data: {
        garageId: garage.id,
        date,
        startTime: allDay ? null : startTime,
        endTime: allDay ? null : endTime,
        reason: reason ? String(reason).slice(0, 200) : null,
        allDay: !!allDay,
      },
    });

    return NextResponse.json(slot);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
