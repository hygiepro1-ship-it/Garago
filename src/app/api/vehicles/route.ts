import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cleanText } from "@/lib/abuse";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const vehicles = await prisma.userVehicle.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const { year: yearRaw, make: makeRaw, model: modelRaw, trim: trimRaw, color: colorRaw, mileage: mileageRaw, licensePlate: plateRaw, vin: vinRaw, tireSize: tireRaw, specs } = body;

  const count = await prisma.userVehicle.count({ where: { userId } });
  // Limite raisonnable : empêche de remplir la base de véhicules fictifs.
  if (count >= 20) return NextResponse.json({ error: "Limite de 20 véhicules atteinte." }, { status: 400 });

  const year = Number.isInteger(Number(yearRaw)) && Number(yearRaw) >= 1950 && Number(yearRaw) <= new Date().getFullYear() + 1 ? Number(yearRaw) : null;
  const make = cleanText(makeRaw, 60), model = cleanText(modelRaw, 60);
  if (!year || !make || !model) return NextResponse.json({ error: "Année, marque et modèle valides requis." }, { status: 400 });
  const trim = cleanText(trimRaw, 80) || null, color = cleanText(colorRaw, 40) || null, licensePlate = cleanText(plateRaw, 15) || null;
  const mileage = Number.isFinite(Number(mileageRaw)) && Number(mileageRaw) >= 0 && Number(mileageRaw) < 3_000_000 && mileageRaw !== "" && mileageRaw != null ? Math.round(Number(mileageRaw)) : null;
  const vin = vinRaw ? String(vinRaw).trim().toUpperCase() : null;
  if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return NextResponse.json({ error: "NIV invalide (17 caractères)." }, { status: 400 });
  const tireSize = cleanText(tireRaw, 40) || null;
  const specsJson = specs ? JSON.stringify(specs) : null;
  if (specsJson && specsJson.length > 4000) return NextResponse.json({ error: "Spécifications trop volumineuses." }, { status: 400 });
  const vehicle = await prisma.userVehicle.create({
    data: {
      userId, year, make, model, trim, color, mileage, licensePlate,
      vin,
      tireSize,
      specs:    specsJson,
      isDefault: count === 0,
    },
  });

  return NextResponse.json(vehicle);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const result = await prisma.userVehicle.deleteMany({ where: { id, userId } });
  if (result.count === 0) return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });

  return NextResponse.json({ success: true });
}
