/**
 * Calendly API — gestion des membres de l'organisation Garago.
 *
 * Flux d'activation d'un garage :
 *   1. Stripe webhook → subscription activée
 *   2. inviteToOrg(email)  → Calendly envoie un email d'invitation au garage
 *   3. Le garagiste accepte l'invitation → crée son compte → utilise l'app
 *   4. Calendly webhook (invitee.created) → getBookingUrl(email)
 *   5. On sauvegarde l'URL de réservation dans garage.calcomLink
 */

const CALENDLY_BASE = "https://api.calendly.com";

function headers() {
  return {
    Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Invite un garagiste à rejoindre l'organisation Calendly. */
export async function inviteToOrg(email: string): Promise<{ success: boolean; error?: string }> {
  const orgUri = process.env.CALENDLY_ORG_URI;
  if (!orgUri) return { success: false, error: "CALENDLY_ORG_URI non configuré" };

  // Extrait l'UUID depuis l'URI
  const orgUuid = orgUri.split("/").pop();
  const url = `${CALENDLY_BASE}/organizations/${orgUuid}/invitations`;

  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // 409 = déjà membre ou invitation en cours — pas une erreur bloquante
    if (res.status === 409) return { success: true };
    return { success: false, error: body.message ?? `HTTP ${res.status}` };
  }

  return { success: true };
}

/**
 * Récupère l'URL de réservation d'un membre à partir de son email.
 * Appelée après que l'invitation a été acceptée (webhook Calendly).
 */
export async function getBookingUrl(email: string): Promise<string | null> {
  const orgUri = process.env.CALENDLY_ORG_URI;
  if (!orgUri) return null;

  const orgUuid = orgUri.split("/").pop();
  const res = await fetch(
    `${CALENDLY_BASE}/organization_memberships?organization=${orgUri}&email=${encodeURIComponent(email)}&count=1`,
    { headers: headers() }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const member = data.collection?.[0];
  if (!member) return null;

  // scheduling_url = "https://calendly.com/username"
  // On retourne le chemin "username" (ou "username/event-type")
  const schedulingUrl: string = member.user?.scheduling_url ?? "";
  if (!schedulingUrl) return null;

  // Extraire le path relatif : "username" → utilisé comme calLink dans l'embed
  const match = schedulingUrl.match(/calendly\.com\/(.+)/);
  return match ? match[1] : null;
}

/**
 * Vérifie la signature d'un webhook Calendly.
 * Signing key disponible dans Intégrations → Webhooks de ton compte.
 */
export function verifyCalendlyWebhook(payload: string, signature: string): boolean {
  const secret = process.env.CALENDLY_WEBHOOK_SECRET;
  if (!secret) return false;

  try {
    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return expected === signature;
  } catch {
    return false;
  }
}
