import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { geocodeAddress } from "@/lib/geocode";

// 32-char alphabet — no ambiguous chars (0/O, 1/I/L removed)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateReferralCode(): string {
  const bytes = randomBytes(8);
  let part = "";
  for (const b of bytes) part += ALPHABET[b % ALPHABET.length];
  // GAR-XXXXXXXX — 32^8 ≈ 1 trillion combinations
  return "GAR-" + part;
}

const MAX_REGISTRATIONS_PER_WINDOW = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName, lastName, name: nameRaw, email, password, role, phone,
      marketingConsent,
      garageName, garageAddress, garageCity, garagePostalCode, garagePhone,
      garageLat, garageLng,
      referredByCode,
      _hp,
    } = body;

    // Honeypot — les bots remplissent ce champ caché, jamais les humains
    if (_hp) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    // Anti-spam : limite le nombre d'inscriptions par IP dans une fenêtre de temps
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";
    const recentAttempts = await prisma.registrationAttempt.count({
      where: { ip, createdAt: { gt: new Date(Date.now() - WINDOW_MS) } },
    });
    if (recentAttempts >= MAX_REGISTRATIONS_PER_WINDOW) {
      return NextResponse.json(
        { error: "Trop de tentatives d'inscription. Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }
    await prisma.registrationAttempt.create({ data: { ip } });

    // Accept either firstName+lastName (new) or name (legacy)
    const name = firstName && lastName
      ? `${firstName.trim()} ${lastName.trim()}`
      : nameRaw ?? "";

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec ce courriel" }, { status: 409 });
    }

    // Le courriel doit avoir été vérifié via /api/verify-email/confirm avant de pouvoir
    // créer le compte — empêche un appel direct à cette route de contourner la vérification.
    const verification = await prisma.emailVerificationCode.findFirst({
      where: { email, verified: true, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!verification) {
      return NextResponse.json({ error: "Veuillez d'abord vérifier votre adresse courriel." }, { status: 403 });
    }

    // Validate referral code if provided — le parrain doit être un garage abonné
    // (le programme de parrainage est réservé aux abonnés).
    let referralBonus = false;
    if (referredByCode) {
      const referrer = await prisma.garage.findUnique({
        where: { referralCode: referredByCode.trim().toUpperCase() },
        select: { subscriptionStatus: true },
      });
      if (!referrer) {
        return NextResponse.json({ error: "Code de parrainage invalide" }, { status: 400 });
      }
      if (referrer.subscriptionStatus !== "ACTIVE") {
        return NextResponse.json({ error: "Ce code de parrainage n'est plus actif." }, { status: 400 });
      }
      referralBonus = true;
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role ?? "DRIVER", phone, marketingConsent: !!marketingConsent },
    });

    // Code de vérification consommé — plus valide pour une prochaine inscription
    await prisma.emailVerificationCode.deleteMany({ where: { email } });

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

      // Géocode l'adresse si lat/lng non fournis par le formulaire
      let finalLat: number | null = garageLat  ? parseFloat(garageLat)  : null;
      let finalLng: number | null = garageLng ? parseFloat(garageLng) : null;
      if ((finalLat == null || finalLng == null) && garageAddress && garageCity) {
        const coords = await geocodeAddress(garageAddress, garageCity);
        if (coords) { finalLat = coords.latitude; finalLng = coords.longitude; }
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
          latitude:  finalLat,
          longitude: finalLng,
          subscriptionStatus: "TRIAL",
          subscriptionEndAt: new Date(Date.now() + (referralBonus ? 60 : 30) * 24 * 60 * 60 * 1000),
          referralCode,
          referredByCode: referralBonus ? referredByCode.trim().toUpperCase() : null,
        },
      });
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err: any) {
    console.error("[register] Erreur :", err);
    // Retourner un message plus précis en développement
    const msg = process.env.NODE_ENV !== "production" && err?.message
      ? `Erreur serveur : ${err.message}`
      : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
