import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "GARAGE_OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const ownerId = (session.user as any).id;
    const garage = await prisma.garage.findUnique({ where: { ownerId } });
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
    if (!session?.user || (session.user as any).role !== "GARAGE_OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const ownerId = (session.user as any).id;
    const garage = await prisma.garage.findUnique({ where: { ownerId } });
    if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

    const { date, startTime, endTime, reason, allDay } = await req.json();
    if (!date) return NextResponse.json({ error: "Date requise" }, { status: 400 });

    const slot = await prisma.blockedSlot.create({
      data: {
        garageId: garage.id,
        date,
        startTime: allDay ? null : startTime,
        endTime: allDay ? null : endTime,
        reason: reason || null,
        allDay: !!allDay,
      },
    });

    return NextResponse.json(slot);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
