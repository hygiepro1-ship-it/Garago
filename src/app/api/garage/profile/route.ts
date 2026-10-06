import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendDescriptionReviewEmail, sendAdminGarageRenamed } from "@/lib/email";
import { geocodeAddress } from "@/lib/geocode";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";
import { cleanText, isValidEmail } from "@/lib/abuse";

const DESCRIPTION_MAX_PER_YEAR = 4;

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
  const garage = await prisma.garage.findFirst({
    where: ownedGarageWhere(userId, readGarageId(_req.url)),
    include: {
      services: { include: { category: true } },
      brands: true,
      brandModels: true,
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
  const body   = await req.json().catch(() => ({}));

  // Champs de contact : validés avant d'être enregistrés (ils s'affichent sur la fiche publique et dans des courriels)
  if (body.email && !isValidEmail(String(body.email).trim())) {
    return NextResponse.json({ error: "Adresse courriel invalide." }, { status: 422 });
  }
  if (body.website && !/^https?:\/\/[^\s<>"']{3,200}$/i.test(String(body.website).trim())) {
    return NextResponse.json({ error: "Le site web doit commencer par http:// ou https://." }, { status: 422 });
  }
  if (body.name !== undefined && cleanText(body.name, 100).length < 2) {
    return NextResponse.json({ error: "Nom du garage invalide." }, { status: 422 });
  }

  // Validate description content
  const descErr = validateDescription(body.description);
  if (descErr) return NextResponse.json({ error: descErr }, { status: 422 });

  // Get current state
  const current = await prisma.garage.findFirst({
    where: ownedGarageWhere(userId, readGarageId(req.url)),
    select: {
      id: true, name: true, slug: true, neq: true, email: true, owner: { select: { email: true } },
      description: true, descriptionStatus: true,
      descriptionChanges: true, descriptionChangesYear: true,
    },
  });
  if (!current) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  // Géocode l'adresse si elle a changé ou si les coordonnées manquent
  // Coordonnées : acceptées seulement si elles tombent au Canada (sinon recalculées depuis l'adresse)
  let geoLat: number | undefined = body.latitude  != null && parseFloat(body.latitude)  >= 41 && parseFloat(body.latitude)  <= 84   ? parseFloat(body.latitude)  : undefined;
  let geoLng: number | undefined = body.longitude != null && parseFloat(body.longitude) >= -142 && parseFloat(body.longitude) <= -52 ? parseFloat(body.longitude) : undefined;
  if ((geoLat == null || geoLng == null) && body.address && body.city) {
    const coords = await geocodeAddress(body.address, body.city);
    if (coords) { geoLat = coords.latitude; geoLng = coords.longitude; }
  }

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
    sendDescriptionReviewEmail({
      garageId:   current.id,
      garageName: current.name,
      ownerEmail: current.email ?? userId,
      draft:      newDesc ?? "",
    }).catch(console.error);
  }

  // Changement de nom : tracé dans le journal d'audit et signalé à l'administrateur, qui peut vérifier
  // que le nouveau nom correspond bien au NEQ (empêche l'usurpation d'un autre garage après vérification).
  const newName = body.name !== undefined ? cleanText(body.name, 100) : null;
  if (newName && newName !== current.name) {
    await prisma.auditLog.create({
      data: {
        action: "garage_renamed", targetType: "Garage", targetId: current.id,
        actorEmail: session.user.email ?? null, detail: `« ${current.name} » → « ${newName} »`,
      },
    });
    sendAdminGarageRenamed({
      garageId: current.id, slug: current.slug, oldName: current.name, newName,
      neq: current.neq ?? null, ownerEmail: current.owner?.email ?? null,
    }).catch(console.error);
  }

  const garage = await prisma.garage.update({
    where: { id: current.id },
    data: {
      name:    body.name !== undefined ? cleanText(body.name, 100) : undefined,
      address: body.address !== undefined ? cleanText(body.address, 150) : undefined,
      city:    body.city !== undefined ? cleanText(body.city, 80) : undefined,
      postalCode:      body.postalCode !== undefined ? cleanText(body.postalCode, 10) : undefined,
      phone:           body.phone !== undefined ? cleanText(body.phone, 30) : undefined,
      email:           body.email ? String(body.email).trim().toLowerCase() : body.email === "" ? null : undefined,
      website:         body.website ? String(body.website).trim() : body.website === "" ? null : undefined,
      yearFounded:     Number.isInteger(parseInt(body.yearFounded))   && parseInt(body.yearFounded)   >= 1800 && parseInt(body.yearFounded)   <= new Date().getFullYear() ? parseInt(body.yearFounded)   : null,
      employeeCount:   Number.isInteger(parseInt(body.employeeCount)) && parseInt(body.employeeCount) >= 0 && parseInt(body.employeeCount) <= 100000 ? parseInt(body.employeeCount) : null,
      languages: body.languages != null
        ? (typeof body.languages === "string" ? body.languages : JSON.stringify(body.languages))
        : null,
      openingHours: body.openingHours != null
        ? (typeof body.openingHours === "string" ? body.openingHours : JSON.stringify(body.openingHours))
        : null,
      emailPublic:     body.emailPublic     ?? false,
      acceptsWalkIn:   body.acceptsWalkIn   ?? true,
      appointmentOnly: body.appointmentOnly ?? false,
      hourlyRate:      body.hourlyRate != null && Number.isFinite(parseFloat(body.hourlyRate)) && parseFloat(body.hourlyRate) >= 0 && parseFloat(body.hourlyRate) < 10000 ? parseFloat(body.hourlyRate) : null,
      latitude:        geoLat,
      longitude:       geoLng,
      coverPosition:   body.coverPosition ?? "center",
      logoPosition:    body.logoPosition  ?? "center",
      ...descFields,
    },
  });

  return NextResponse.json(garage);
}
