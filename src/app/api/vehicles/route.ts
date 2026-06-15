import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;
  const vehicles = await prisma.userVehicle.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;
  const { year, make, model, trim, color, mileage, licensePlate, vin, tireSize } = await req.json();

  const count = await prisma.userVehicle.count({ where: { userId } });
  const vehicle = await prisma.userVehicle.create({
    data: { userId, year, make, model, trim, color, mileage, licensePlate, vin: vin || null, tireSize: tireSize || null, isDefault: count === 0 },
  });

  return NextResponse.json(vehicle);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  await prisma.userVehicle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
