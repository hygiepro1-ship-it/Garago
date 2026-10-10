import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";
import { quebecToday } from "@/lib/availability";
import { cleanText, isValidEmail } from "@/lib/abuse";
import { formatPhone, isFormattedPhone } from "@/lib/contact-format";
import { updateCustomer } from "@/lib/customers";

// PATCH /api/garage/customers/[id] — le garage corrige la fiche d'un de ses clients.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(session.user.id, readGarageId(req.url)), select: { id: true } });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const name = cleanText(body.name, 80);
  if (!name) return NextResponse.json({ error: "Entrez le nom du client." }, { status: 400 });

  const phone = formatPhone(String(body.phone ?? ""));
  if (!isFormattedPhone(phone)) {
    return NextResponse.json({ error: "Entrez un numéro de téléphone à 10 chiffres, par exemple (514) 555-0123." }, { status: 400 });
  }

  const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (rawEmail && !isValidEmail(rawEmail)) return NextResponse.json({ error: "Adresse courriel invalide." }, { status: 400 });

  const contactChannel = body.contactChannel === "SMS" || body.contactChannel === "EMAIL" ? body.contactChannel : "NONE";
  if (contactChannel === "EMAIL" && !rawEmail) {
    return NextResponse.json({ error: "Entrez le courriel du client pour lui écrire par courriel." }, { status: 400 });
  }

  try {
    const found = await updateCustomer(
      garage.id, id,
      { name, phone, email: rawEmail || null, language: body.language === "en" ? "en" : "fr", contactChannel },
      quebecToday(),
    );
    // Fiche inexistante ou d'un autre garage : même réponse, sans rien révéler.
    if (!found) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Une autre fiche porte déjà ce nom et ce numéro de téléphone." }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
