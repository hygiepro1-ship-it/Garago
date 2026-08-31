import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendDescriptionReviewEmail } from "@/lib/email";

const DESCRIPTION_MAX_PER_YEAR = 4;
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

function validateDescription(text: string): string | null {
  if (text.length > 400) return "La description ne peut pas dépasser 400 caractères.";
  if (/(https?:\/\/|www\.)/i.test(text)) return "Les liens URL ne sont pas autorisés.";
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) return "Les adresses courriel ne sont pas autorisées.";
  if (/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) return "Les numéros de téléphone ne sont pas autorisés.";
  if (/#\w+|@\w+/.test(text)) return "Les hashtags et mentions (@) ne sont pas autorisés.";
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;
  const { description } = await req.json();
  const text = (description ?? "").trim();

  if (!text) return NextResponse.json({ error: "La description ne peut pas être vide." }, { status: 422 });

  const err = validateDescription(text);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  const garage = await prisma.garage.findUnique({
    where: { ownerId: userId },
    select: {
      id: true, name: true, email: true,
      description: true, descriptionStatus: true,
      descriptionChanges: true, descriptionChangesYear: true,
      owner: { select: { email: true } },
    },
  });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  if (text === (garage.description ?? "").trim()) {
    return NextResponse.json({ error: "La description est identique à la version approuvée." }, { status: 422 });
  }

  if (garage.descriptionStatus === "PENDING") {
    return NextResponse.json({ error: "Une description est déjà en attente de validation." }, { status: 409 });
  }

  const thisYear = new Date().getFullYear();
  const sameYear = garage.descriptionChangesYear === thisYear;
  const usedThisYear = sameYear ? (garage.descriptionChanges ?? 0) : 0;

  if (usedThisYear >= DESCRIPTION_MAX_PER_YEAR) {
    return NextResponse.json(
      { error: `Limite atteinte — vous ne pouvez soumettre que ${DESCRIPTION_MAX_PER_YEAR} descriptions par année.` },
      { status: 429 }
    );
  }

  const newCount = usedThisYear + 1;
  await prisma.garage.update({
    where: { id: garage.id },
    data: {
      descriptionDraft:       text,
      descriptionStatus:      "PENDING",
      descriptionChanges:     newCount,
      descriptionChangesYear: thisYear,
    },
  });

  const token      = process.env.ADMIN_REVIEW_SECRET ?? "garago-admin-secret";
  const approveUrl = `${BASE_URL}/api/admin/description/review?garageId=${garage.id}&action=approve&token=${token}`;
  const rejectUrl  = `${BASE_URL}/api/admin/description/review?garageId=${garage.id}&action=reject&token=${token}`;

  try {
    await sendDescriptionReviewEmail({
      garageId:   garage.id,
      garageName: garage.name,
      ownerEmail: garage.owner?.email ?? garage.email ?? "",
      draft:      text,
      approveUrl,
      rejectUrl,
    });
  } catch (err) {
    console.error("sendDescriptionReviewEmail failed:", err);
    // Roll back status so the garage isn't stuck in PENDING with no admin email
    await prisma.garage.update({
      where: { id: garage.id },
      data: { descriptionStatus: "APPROVED", descriptionDraft: null, descriptionChanges: usedThisYear, descriptionChangesYear: usedThisYear === 0 ? null : thisYear },
    });
    return NextResponse.json({ error: "Impossible d'envoyer l'email de vérification. Veuillez réessayer dans quelques minutes." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, usedThisYear: newCount, maxPerYear: DESCRIPTION_MAX_PER_YEAR });
}
