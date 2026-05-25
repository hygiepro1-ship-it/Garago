/**
 * Webhook Calendly → reçoit les événements d'organisation.
 *
 * Événements gérés :
 *   - invitee.created            → quelqu'un a réservé un RDV (pas utile ici)
 *   - organization_membership.created → un garagiste a ACCEPTÉ l'invitation !
 *
 * Configuration dans Calendly :
 *   Intégrations → Webhooks → Nouveau webhook
 *   URL : https://votre-domaine.ca/api/webhooks/calendly
 *   Événements à cocher : organization_membership.created
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCalendlyWebhook, getBookingUrl } from "@/lib/calendly";

export async function POST(req: NextRequest) {
  const payload   = await req.text();
  const signature = req.headers.get("calendly-webhook-signature") ?? "";

  // Vérification de la signature (optionnelle en dev, obligatoire en prod)
  if (process.env.NODE_ENV === "production" && !verifyCalendlyWebhook(payload, signature)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  // ── Nouveau membre dans l'organisation (invitation acceptée) ─────────────
  if (event.event === "organization_membership.created") {
    const email: string = event.payload?.user?.email ?? "";
    if (!email) return NextResponse.json({ received: true });

    // Récupère l'URL de réservation Calendly du nouveau membre
    const bookingUrl = await getBookingUrl(email);
    if (!bookingUrl) {
      console.error(`Impossible de récupérer l'URL Calendly pour ${email}`);
      return NextResponse.json({ received: true });
    }

    // Met à jour le garage correspondant à cet email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { garage: true },
    });

    if (user?.garage) {
      await prisma.garage.update({
        where: { id: user.garage.id },
        data: { calcomLink: bookingUrl },
      });
      console.log(`✅ Calendly configuré pour ${email} : ${bookingUrl}`);
    }
  }

  return NextResponse.json({ received: true });
}
