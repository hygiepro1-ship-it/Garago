import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendDescriptionReviewEmail } from "@/lib/email";

const DESCRIPTION_MAX_PER_YEAR = 4;
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

// ─── Description validation ────────────────────────────────────────────────
// Only plain descriptive text — no URLs, emails, phone numbers, hashtags, @mentions.
function validateDescription(text: string | null | undefined): string | null {
  if (!text?.trim()) return null; // empty is fine
  if (text.length > 400) return "La description ne peut pas dépasser 400 caractères.";
  if (/(https?:\/\/|www\.)/i.test(text)) return "Les liens URL ne sont pas autorisés dans la description.";
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text))
    return "Les adresses courriel ne sont pas autorisées dans la description.";
  if (/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text))
    return "Les numéros de téléphone ne sont pas autorisés dans la description.";
  if (/#\w+|@\w+/.test(text))
    return "Les hashtags et mentions (@) ne sont pas autorisés dans la description.";
  return null;
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const garage = await prisma.garage.findUnique({
    where: { ownerId: userId },
    include: {
      services: { include: { category: true } },
      brands: true,
      availability: { orderBy: { dayOfWeek: "asc" } },
      photos: true,
      reviews: { include: { user: { select: { name: true, image: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { reviews: true } },
    },
  });

  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });
  return NextResponse.json(garage);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const body   = await req.json();

  // Validate description content
  const descErr = validateDescription(body.description);
  if (descErr) return NextResponse.json({ error: descErr }, { status: 422 });

  // Get current state
  const current = await prisma.garage.findUnique({
    where: { ownerId: userId },
    select: {
      id: true, name: true, email: true,
      description: true, descriptionStatus: true,
      descriptionChanges: true, descriptionChangesYear: true,
    },
  });
  if (!current) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const newDesc        = body.description?.trim() || null;
  const sameAsApproved = newDesc === (current.description?.trim() ?? null);

  let descFields: Record<string, unknown> = {};

  if (!sameAsApproved) {
    // Yearly limit check
    const thisYear = new Date().getFullYear();
    const sameYear = current.descriptionChangesYear === thisYear;
    const usedThisYear = sameYear ? (current.descriptionChanges ?? 0) : 0;

    if (usedThisYear >= DESCRIPTION_MAX_PER_YEAR) {
      return NextResponse.json(
        { error: `Limite atteinte — vous ne pouvez soumettre que ${DESCRIPTION_MAX_PER_YEAR} descriptions par année.` },
        { status: 429 }
      );
    }

    const newCount = usedThisYear + 1;
    descFields = {
      descriptionDraft:       newDesc,
      descriptionStatus:      "PENDING",
      descriptionChanges:     newCount,
      descriptionChangesYear: thisYear,
    };

    // Send review email (non-blocking)
    const token     = process.env.ADMIN_REVIEW_SECRET ?? "garago-admin-secret";
    const approveUrl = `${BASE_URL}/api/admin/description/review?garageId=${current.id}&action=approve&token=${token}`;
    const rejectUrl  = `${BASE_URL}/api/admin/description/review?garageId=${current.id}&action=reject&token=${token}`;

    sendDescriptionReviewEmail({
      garageId:   current.id,
      garageName: current.name,
      ownerEmail: current.email ?? userId,
      draft:      newDesc ?? "",
      approveUrl,
      rejectUrl,
    }).catch(console.error);
  }

  const garage = await prisma.garage.update({
    where: { ownerId: userId },
    data: {
      name:    body.name,
      address: body.address,
      city:    body.city,
      postalCode:      body.postalCode,
      phone:           body.phone,
      email:           body.email,
      website:         body.website,
      yearFounded:     body.yearFounded   ? parseInt(body.yearFounded)   : null,
      employeeCount:   body.employeeCount ? parseInt(body.employeeCount) : null,
      languages: body.languages != null
        ? (typeof body.languages === "string" ? body.languages : JSON.stringify(body.languages))
        : null,
      openingHours: body.openingHours != null
        ? (typeof body.openingHours === "string" ? body.openingHours : JSON.stringify(body.openingHours))
        : null,
      emailPublic:     body.emailPublic     ?? false,
      acceptsWalkIn:   body.acceptsWalkIn   ?? true,
      appointmentOnly: body.appointmentOnly ?? false,
      hourlyRate:      body.hourlyRate != null ? parseFloat(body.hourlyRate) : null,
      latitude:        body.latitude  != null ? parseFloat(body.latitude)  : undefined,
      longitude:       body.longitude != null ? parseFloat(body.longitude) : undefined,
      coverPosition:   body.coverPosition ?? "center",
      logoPosition:    body.logoPosition  ?? "center",
      ...descFields,
    },
  });

  return NextResponse.json(garage);
}
