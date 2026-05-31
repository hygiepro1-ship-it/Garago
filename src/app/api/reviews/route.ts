import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Simple French offensive words filter (case-insensitive partial match)
const OFFENSIVE_WORDS = [
  "merde", "putain", "connard", "connasse", "salaud", "salope",
  "enculé", "encule", "nique", "fdp", "va te", "imbécile", "idiot",
  "crisse", "tabarnak", "ostie", "estie", "câlisse", "calice",
  "fuck", "shit", "bitch", "bastard", "asshole",
];

function containsOffensiveContent(text: string): boolean {
  const lower = text.toLowerCase();
  return OFFENSIVE_WORDS.some((word) => lower.includes(word));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { garageId, rating, title, comment, service, vehicleMake, vehicleModel, vehicleYear } = body;

    if (!garageId || !rating) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const existing = await prisma.review.findFirst({ where: { garageId, userId } });
    if (existing) {
      return NextResponse.json({ error: "Vous avez déjà laissé un avis pour ce garage" }, { status: 409 });
    }

    // Auto-moderation: hide if comment or title contains offensive content
    const textToCheck = `${title ?? ""} ${comment ?? ""}`;
    const isHidden = containsOffensiveContent(textToCheck);

    const review = await prisma.review.create({
      data: {
        garageId,
        userId,
        rating: parseInt(rating),
        title,
        comment,
        service,
        vehicleMake,
        vehicleModel,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
        isHidden,
      },
      include: { user: { select: { name: true, image: true } } },
    });

    return NextResponse.json(review);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
