import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ─── Description validation ────────────────────────────────────────────────
// Only plain descriptive text — no URLs, emails, phone numbers, hashtags, @mentions.
function validateDescription(text: string | null | undefined): string | null {
  if (!text?.trim()) return null; // empty is fine
  if (text.length > 1000) return "La description ne peut pas dépasser 1 000 caractères.";
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

  const userId = (session.user as any).id;
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

  const userId = (session.user as any).id;
  const body   = await req.json();

  // Validate description content
  const descErr = validateDescription(body.description);
  if (descErr) return NextResponse.json({ error: descErr }, { status: 422 });

  // Get current approved description
  const current = await prisma.garage.findUnique({ where: { ownerId: userId }, select: { description: true } });
  const newDesc  = body.description?.trim() || null;
  const sameAsApproved = newDesc === (current?.description?.trim() ?? null);

  // Description moderation: store as draft if changed
  const descFields = sameAsApproved
    ? {} // no change — don't touch status
    : {
        descriptionDraft:  newDesc,
        descriptionStatus: "PENDING",
      };

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
