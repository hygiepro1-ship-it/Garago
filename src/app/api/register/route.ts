import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// 32-char alphabet — no ambiguous chars (0/O, 1/I/L removed)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateReferralCode(): string {
  const bytes = randomBytes(8);
  let part = "";
  for (const b of bytes) part += ALPHABET[b % ALPHABET.length];
  // GAR-XXXXXXXX — 32^8 ≈ 1 trillion combinations
  return "GAR-" + part;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, email, password, role, phone,
      garageName, garageAddress, garageCity, garagePostalCode, garagePhone,
      garageLat, garageLng,
      referredByCode, // Code de parrainage entré lors de l'inscription
    } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec ce courriel" }, { status: 409 });
    }

    // Validate referral code if provided
    if (referredByCode) {
      const referrer = await prisma.garage.findUnique({ where: { referralCode: referredByCode.trim().toUpperCase() } });
      if (!referrer) {
        return NextResponse.json({ error: "Code de parrainage invalide" }, { status: 400 });
      }
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role ?? "DRIVER", phone },
    });

    if (role === "GARAGE_OWNER" && garageName) {
      const baseSlug = slugify(garageName);
      let slug = baseSlug;
      let i = 1;
      while (await prisma.garage.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`;
      }

      // Generate unique referral code
      let referralCode = generateReferralCode();
      while (await prisma.garage.findUnique({ where: { referralCode } })) {
        referralCode = generateReferralCode();
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
          latitude:  garageLat  ? parseFloat(garageLat)  : null,
          longitude: garageLng ? parseFloat(garageLng) : null,
          subscriptionStatus: "TRIAL",
          subscriptionEndAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          referralCode,
          referredByCode: referredByCode ? referredByCode.trim().toUpperCase() : null,
        },
      });
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
