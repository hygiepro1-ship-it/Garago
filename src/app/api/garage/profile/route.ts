import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;
  const garage = await prisma.garage.findUnique({
    where: { ownerId: userId },
    include: {
      services: { include: { category: true } },
      brands: true,
      availability: { orderBy: { dayOfWeek: "asc" } },
      photos: true,
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { reviews: true } },
    },
  });

  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });
  return NextResponse.json(garage);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  const garage = await prisma.garage.update({
    where: { ownerId: userId },
    data: {
      name: body.name,
      description: body.description,
      address: body.address,
      city: body.city,
      postalCode: body.postalCode,
      phone: body.phone,
      email: body.email,
      website: body.website,
      yearFounded: body.yearFounded ? parseInt(body.yearFounded) : null,
      employeeCount: body.employeeCount ? parseInt(body.employeeCount) : null,
      languages: body.languages ? JSON.stringify(body.languages) : null,
      openingHours: body.openingHours ? JSON.stringify(body.openingHours) : null,
      acceptsWalkIn: body.acceptsWalkIn ?? true,
      appointmentOnly: body.appointmentOnly ?? false,
      latitude:  body.latitude  != null ? parseFloat(body.latitude)  : undefined,
      longitude: body.longitude != null ? parseFloat(body.longitude) : undefined,
    },
  });

  return NextResponse.json(garage);
}
