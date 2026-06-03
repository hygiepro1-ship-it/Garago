import { Resend } from "resend";

// Lazy — avoids build-time crash when RESEND_API_KEY is not set
function getResend() { return new Resend(process.env.RESEND_API_KEY); }
const FROM = process.env.EMAIL_FROM ?? "Garago <noreply@garago.ca>";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateFr(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return `${d} ${months[m - 1]} ${y}`;
}

function baseLayout(body: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Garago</title></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <!-- Header -->
        <tr><td style="background:#1e3a5f;border-radius:16px 16px 0 0;padding:24px 32px">
          <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">🔧 Garago</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:0;padding:16px 32px;text-align:center">
          <p style="margin:0;color:#9ca3af;font-size:12px">Garago Canada — <a href="https://garago.ca" style="color:#f97316;text-decoration:none">garago.ca</a></p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:11px">Pour annuler ou modifier, contactez directement le garage.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── Email verification code ───────────────────────────────────────────────────

export async function sendVerificationCode(to: string, code: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_VOTRE")) {
    console.log(`[DEV] Code de vérification pour ${to} : ${code}`);
    return;
  }

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Vérification de votre courriel 🔐</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bienvenue sur Garago ! Voici votre code de vérification :</p>

    <div style="text-align:center;margin:32px 0">
      <div style="display:inline-block;background:#0b1f3a;border-radius:16px;padding:24px 40px">
        <span style="font-size:44px;font-weight:900;letter-spacing:12px;color:#ffffff;font-family:monospace">${code}</span>
      </div>
    </div>

    <p style="margin:0 0 8px;color:#374151;font-size:14px;text-align:center">Ce code est valide pendant <strong>15 minutes</strong>.</p>
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center">Si vous n'avez pas demandé ce code, ignorez simplement ce message.</p>

    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Ne partagez jamais ce code avec qui que ce soit.</p>
  `;

  await getResend().emails.send({
    from:    FROM,
    to,
    subject: `${code} — Code de vérification Garago`,
    html:    baseLayout(body),
  });
}

// ── Confirmation email ────────────────────────────────────────────────────────

export async function sendBookingConfirmation(params: {
  to:           string;
  customerName: string;
  garageName:   string;
  garagePhone:  string;
  garageAddress:string;
  date:         string;
  startTime:    string;
  endTime:      string;
  serviceName:  string | null;
  appointmentId:string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Demande de rendez-vous envoyée ✅</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${params.customerName}, votre demande a bien été reçue.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px">
      <tr><td>
        ${params.serviceName ? `<p style="margin:0 0 8px;font-size:14px"><strong>🔧 Service :</strong> ${params.serviceName}</p>` : ""}
        <p style="margin:0 0 8px;font-size:14px"><strong>📅 Date :</strong> ${fmtDateFr(params.date)}</p>
        <p style="margin:0 0 8px;font-size:14px"><strong>🕐 Heure :</strong> ${params.startTime} – ${params.endTime}</p>
        <p style="margin:0 0 8px;font-size:14px"><strong>🏪 Garage :</strong> ${params.garageName}</p>
        <p style="margin:0;font-size:14px"><strong>📍 Adresse :</strong> ${params.garageAddress}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Le garage vous contactera pour <strong>confirmer</strong> votre rendez-vous. En cas de question, appelez directement :</p>
    <a href="tel:${params.garagePhone}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:24px">📞 ${params.garagePhone}</a>

    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
    <p style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:700">Ajouter à votre calendrier</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px">Ne manquez pas votre rendez-vous — ajoutez-le maintenant :</p>
    <a href="${process.env.NEXTAUTH_URL ?? "https://garago.ca"}/api/appointments/${params.appointmentId}/ics" style="display:inline-block;background:#f3f4f6;color:#374151;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;margin-right:8px;margin-bottom:8px">📅 Télécharger .ics</a>
  `;

  await getResend().emails.send({
    from:    FROM,
    to:      params.to,
    subject: `📅 RDV ${params.garageName} — ${fmtDateFr(params.date)} à ${params.startTime}`,
    html:    baseLayout(body),
  });
}

// ── Notification garage — nouveau RDV ────────────────────────────────────────

export async function sendGarageNewAppointment(params: {
  to:            string;
  garageName:    string;
  customerName:  string;
  customerPhone: string;
  customerEmail: string | null;
  vehicleYear:   number | null;
  vehicleMake:   string | null;
  vehicleModel:  string | null;
  serviceName:   string | null;
  date:          string;
  startTime:     string;
  endTime:       string;
  appointmentId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const vehicle = [params.vehicleYear, params.vehicleMake, params.vehicleModel].filter(Boolean).join(" ");
  const dashUrl = `${process.env.NEXTAUTH_URL ?? "https://garago.ca"}/tableau-de-bord/garage`;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">🔔 Nouveau rendez-vous en ligne !</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Un client vient de réserver via Garago. Voici les détails :</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px">
      <tr><td>
        <p style="margin:0 0 10px;font-size:14px"><strong>👤 Client :</strong> ${params.customerName}</p>
        <p style="margin:0 0 10px;font-size:14px"><strong>📞 Téléphone :</strong> <a href="tel:${params.customerPhone}" style="color:#f97316">${params.customerPhone}</a></p>
        ${params.customerEmail ? `<p style="margin:0 0 10px;font-size:14px"><strong>✉️ Courriel :</strong> ${params.customerEmail}</p>` : ""}
        ${vehicle ? `<p style="margin:0 0 10px;font-size:14px"><strong>🚗 Véhicule :</strong> ${vehicle}</p>` : ""}
        ${params.serviceName ? `<p style="margin:0 0 10px;font-size:14px"><strong>🔧 Service :</strong> ${params.serviceName}</p>` : ""}
        <p style="margin:0 0 10px;font-size:14px"><strong>📅 Date :</strong> ${fmtDateFr(params.date)}</p>
        <p style="margin:0;font-size:14px"><strong>🕐 Heure :</strong> ${params.startTime} – ${params.endTime}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Confirmez ou gérez ce rendez-vous depuis votre tableau de bord :</p>
    <a href="${dashUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
      📊 Ouvrir mon tableau de bord
    </a>
  `;

  await getResend().emails.send({
    from:    FROM,
    to:      params.to,
    subject: `🔔 Nouveau RDV — ${params.customerName} · ${fmtDateFr(params.date)} à ${params.startTime}`,
    html:    baseLayout(body),
  });
}

// ── Véhicule prêt ─────────────────────────────────────────────────────────────

export async function sendVehicleReady(params: {
  to:            string;
  customerName:  string;
  garageName:    string;
  garageAddress: string;
  garagePhone:   string;
  completionNote?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const noteBlock = params.completionNote ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.05em">Note du garage</p>
      <p style="margin:0;font-size:14px;color:#166534;line-height:1.6">${params.completionNote}</p>
    </div>
  ` : "";

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Votre véhicule est prêt ! 🎉</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${params.customerName}, votre véhicule est prêt à être récupéré.</p>

    ${noteBlock}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px">
      <tr><td>
        <p style="margin:0 0 8px;font-size:14px"><strong>🏪 Garage :</strong> ${params.garageName}</p>
        <p style="margin:0 0 8px;font-size:14px"><strong>📍 Adresse :</strong> ${params.garageAddress}</p>
        <p style="margin:0;font-size:14px"><strong>📞 Téléphone :</strong> <a href="tel:${params.garagePhone}" style="color:#f97316">${params.garagePhone}</a></p>
      </td></tr>
    </table>

    <p style="margin:0;color:#6b7280;font-size:13px;text-align:center">Merci de votre confiance — à bientôt sur Garago !</p>
  `;

  await getResend().emails.send({
    from:    FROM,
    to:      params.to,
    subject: `✅ Votre véhicule est prêt — ${params.garageName}`,
    html:    baseLayout(body),
  });
}

// ── Reminder email (24h before) ───────────────────────────────────────────────

export async function sendBookingReminder(params: {
  to:           string;
  customerName: string;
  garageName:   string;
  garagePhone:  string;
  garageAddress:string;
  date:         string;
  startTime:    string;
  endTime:      string;
  serviceName:  string | null;
  appointmentId:string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Rappel — votre rendez-vous est demain ⏰</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${params.customerName}, voici un rappel de votre rendez-vous prévu demain.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px">
      <tr><td>
        ${params.serviceName ? `<p style="margin:0 0 8px;font-size:14px"><strong>🔧 Service :</strong> ${params.serviceName}</p>` : ""}
        <p style="margin:0 0 8px;font-size:14px"><strong>📅 Date :</strong> ${fmtDateFr(params.date)}</p>
        <p style="margin:0 0 8px;font-size:14px"><strong>🕐 Heure :</strong> ${params.startTime} – ${params.endTime}</p>
        <p style="margin:0 0 8px;font-size:14px"><strong>🏪 Garage :</strong> ${params.garageName}</p>
        <p style="margin:0;font-size:14px"><strong>📍 Adresse :</strong> ${params.garageAddress}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Des questions ? Contactez le garage directement :</p>
    <a href="tel:${params.garagePhone}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">📞 ${params.garagePhone}</a>
  `;

  await getResend().emails.send({
    from:    FROM,
    to:      params.to,
    subject: `⏰ Rappel RDV demain — ${params.garageName} à ${params.startTime}`,
    html:    baseLayout(body),
  });
}
