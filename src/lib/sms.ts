/**
 * SMS via Twilio — actif uniquement si TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 * et TWILIO_FROM_NUMBER sont définis dans les variables d'environnement.
 * Sans ces clés, toutes les fonctions sont silencieuses (aucune erreur).
 */

function getTwilio() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  // Import dynamique pour éviter un crash au build si twilio n'est pas installé
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Twilio = require("twilio");
    return new Twilio(sid, token);
  } catch {
    return null;
  }
}

const FROM = process.env.TWILIO_FROM_NUMBER ?? "";

async function sendSMS(to: string, body: string) {
  const client = getTwilio();
  if (!client || !FROM) {
    console.log(`[SMS non configuré] → ${to}: ${body}`);
    return;
  }
  // Normalise le numéro québécois → E.164
  const normalized = to.replace(/\D/g, "");
  const e164 = normalized.startsWith("1") ? `+${normalized}` : `+1${normalized}`;
  await client.messages.create({ from: FROM, to: e164, body });
}

// ── Confirmation de réservation ───────────────────────────────────────────────

export async function sendBookingConfirmationSMS(params: {
  to:          string;
  customerName:string;
  garageName:  string;
  garagePhone: string;
  date:        string;
  startTime:   string;
  serviceName: string | null;
}) {
  const dateStr = new Date(params.date + "T12:00:00").toLocaleDateString("fr-CA", {
    weekday: "long", day: "numeric", month: "long",
  });
  const service = params.serviceName ? `\nService : ${params.serviceName}` : "";
  const msg =
    `[Garago] Demande de RDV reçue ✅\n` +
    `${params.garageName}${service}\n` +
    `${dateStr} à ${params.startTime}\n` +
    `Le garage vous contactera pour confirmer. Questions ? ${params.garagePhone}`;
  await sendSMS(params.to, msg);
}

// ── Rappel 24h ────────────────────────────────────────────────────────────────

export async function sendBookingReminderSMS(params: {
  to:          string;
  customerName:string;
  garageName:  string;
  garagePhone: string;
  date:        string;
  startTime:   string;
  serviceName: string | null;
}) {
  const dateStr = new Date(params.date + "T12:00:00").toLocaleDateString("fr-CA", {
    weekday: "long", day: "numeric", month: "long",
  });
  const service = params.serviceName ? ` · ${params.serviceName}` : "";
  const msg =
    `[Garago] Rappel RDV demain ⏰\n` +
    `${params.garageName}${service}\n` +
    `${dateStr} à ${params.startTime}\n` +
    `Questions ? ${params.garagePhone}`;
  await sendSMS(params.to, msg);
}

// ── Véhicule prêt ─────────────────────────────────────────────────────────────

export async function sendVehicleReadySMS(params: {
  to:             string;
  customerName:   string;
  garageName:     string;
  garageAddress:  string;
  garagePhone:    string;
  completionNote?: string | null;
}) {
  const note = params.completionNote ? `\n📋 ${params.completionNote}` : "";
  const msg =
    `[Garago] Votre véhicule est prêt ! 🎉${note}\n` +
    `Récupérez-le au ${params.garageAddress}\n` +
    `📞 ${params.garagePhone}`;
  await sendSMS(params.to, msg);
}
