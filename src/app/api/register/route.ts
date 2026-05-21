import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, phone, garageName, garageAddress, garageCity, garagePostalCode, garagePhone } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec ce courriel" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role ?? "DRIVER",
        phone,
      },
    });

    if (role === "GARAGE_OWNER" && garageName) {
      const baseSlug = slugify(garageName);
      let slug = baseSlug;
      let i = 1;
      while (await prisma.garage.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`;
      }

      await prisma.garage.create({
        data: {
          ownerId: user.id,
          name: garageName,
          slug,
          address: garageAddress ?? "",
          city: garageCity ?? "",
          postalCode: garagePostalCode ?? "",
          phone: garagePhone ?? phone ?? "",
          subscriptionStatus: "TRIAL",
          subscriptionEndAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        },
      });
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
