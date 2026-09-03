import { Resend } from "resend";

// ─── Config ───────────────────────────────────────────────────────────────────

const FROM        = process.env.EMAIL_FROM   ?? "Garago <support@garagopro.ca>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL  ?? "info.garago@gmail.com";
const BASE_URL    = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

function getResend() { return new Resend(process.env.RESEND_API_KEY); }

function canSend(): boolean {
  const key = process.env.RESEND_API_KEY;
  return !!key && !key.startsWith("re_VOTRE");
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppointmentDetails {
  serviceName:   string | null;
  date:          string;
  startTime:     string;
  endTime:       string;
  garageName:    string;
  garageAddress: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_FR = [
  "janvier","février","mars","avril","mai","juin",
  "juillet","août","septembre","octobre","novembre","décembre",
];

function fmtDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${MONTHS_FR[m - 1]} ${y}`;
}

/** Orange info card used in appointment-related emails. */
function infoCard(rows: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px">
      <tr><td>${rows}</td></tr>
    </table>`;
}

/** A single row inside an infoCard. */
function row(icon: string, label: string, value: string, last = false): string {
  return `<p style="margin:0${last ? "" : " 0 8px"};font-size:14px"><strong>${icon} ${label} :</strong> ${value}</p>`;
}

/** Primary CTA button. */
function primaryBtn(href: string, label: string, color = "#f97316"): string {
  return `<a href="${href}"
     style="display:inline-block;background:${color};color:#fff;padding:12px 28px;
            border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
    ${label}
  </a>`;
}

/** Secondary (light) button. */
function secondaryBtn(href: string, label: string): string {
  return `<a href="${href}"
     style="display:inline-block;background:#f1f5f9;color:#0b1f3a;padding:12px 24px;
            border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;
            border:1px solid #e2e8f0">
    ${label}
  </a>`;
}

/** Phone number button. */
function phoneBtn(phone: string): string {
  return `<a href="tel:${phone}"
     style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;
            border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:24px">
    📞 ${phone}
  </a>`;
}

/** Green note block (e.g. garage completion note). */
function noteBlock(content: string): string {
  return `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#15803d;
                text-transform:uppercase;letter-spacing:0.05em">Note du garage</p>
      <p style="margin:0;font-size:14px;color:#166534;line-height:1.6">${content}</p>
    </div>`;
}

/** Horizontal divider. */
const HR = `<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">`;

/** Builds the full email HTML from a body string. */
function baseLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Garago</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#0b1f3a;border-radius:16px 16px 0 0;padding:20px 32px;text-align:center">
          <img src="${BASE_URL}/logo-garago.png" alt="Garago" height="72"
               style="display:block;margin:0 auto;max-height:72px" />
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;
                       border-top:0;padding:16px 32px;text-align:center">
          <p style="margin:0;color:#9ca3af;font-size:12px">
            Garago Canada — <a href="${BASE_URL}" style="color:#f97316;text-decoration:none">garagopro.ca</a>
          </p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:11px">
            Pour annuler ou modifier, contactez directement le garage.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Renders the standard appointment details card. */
function appointmentCard(appt: AppointmentDetails): string {
  return infoCard(`
    ${appt.serviceName ? row("🔧", "Service", appt.serviceName) : ""}
    ${row("📅", "Date", fmtDateFr(appt.date))}
    ${row("🕐", "Heure", `${appt.startTime} – ${appt.endTime}`)}
    ${row("🏪", "Garage", appt.garageName)}
    ${row("📍", "Adresse", appt.garageAddress, true)}
  `);
}

async function send(to: string | string[], subject: string, body: string) {
  await getResend().emails.send({ from: FROM, to, subject, html: baseLayout(body) });
}

// ─── Email: Vérification de compte ───────────────────────────────────────────

export async function sendVerificationCode(to: string, code: string) {
  if (!canSend()) {
    console.log(`[DEV] Code de vérification pour ${to} : ${code}`);
    return;
  }

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Vérification de votre courriel 🔐</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bienvenue sur Garago ! Voici votre code de vérification :</p>

    <div style="text-align:center;margin:32px 0">
      <div style="display:inline-block;background:#0b1f3a;border-radius:16px;padding:24px 40px">
        <span style="font-size:44px;font-weight:900;letter-spacing:12px;color:#fff;font-family:monospace">${code}</span>
      </div>
    </div>

    <p style="margin:0 0 8px;color:#374151;font-size:14px;text-align:center">Ce code est valide pendant <strong>15 minutes</strong>.</p>
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center">Si vous n'avez pas demandé ce code, ignorez simplement ce message.</p>
    ${HR}
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Ne partagez jamais ce code avec qui que ce soit.</p>
  `;

  await send(to, `${code} — Code de vérification Garago`, body);
}

// ─── Email: Confirmation de rendez-vous (client) ──────────────────────────────

export interface BookingConfirmationParams extends AppointmentDetails {
  to:            string;
  customerName:  string;
  garagePhone:   string;
  appointmentId: string;
}

export async function sendBookingConfirmation(params: BookingConfirmationParams) {
  if (!canSend()) return;

  const icsUrl = `${BASE_URL}/api/appointments/${params.appointmentId}/ics`;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Demande de rendez-vous envoyée ✅</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${params.customerName}, votre demande a bien été reçue.</p>

    ${appointmentCard(params)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">
      Le garage vous contactera pour <strong>confirmer</strong> votre rendez-vous. En cas de question, appelez directement :
    </p>
    ${phoneBtn(params.garagePhone)}

    ${HR}
    <p style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:700">Ajouter à votre calendrier</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px">Ne manquez pas votre rendez-vous — ajoutez-le maintenant :</p>
    ${secondaryBtn(icsUrl, "📅 Télécharger .ics")}
  `;

  await send(params.to, `📅 RDV ${params.garageName} — ${fmtDateFr(params.date)} à ${params.startTime}`, body);
}

// ─── Email: Nouveau rendez-vous (garage) ──────────────────────────────────────

export interface GarageNewAppointmentParams {
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
}

export async function sendGarageNewAppointment(params: GarageNewAppointmentParams) {
  if (!canSend()) return;

  const vehicle = [params.vehicleYear, params.vehicleMake, params.vehicleModel].filter(Boolean).join(" ");
  const dashUrl = `${BASE_URL}/tableau-de-bord/garage`;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">🔔 Nouveau rendez-vous en ligne !</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Un client vient de réserver via Garago. Voici les détails :</p>

    ${infoCard(`
      ${row("👤", "Client", params.customerName)}
      ${row("📞", "Téléphone", `<a href="tel:${params.customerPhone}" style="color:#f97316">${params.customerPhone}</a>`)}
      ${params.customerEmail ? row("✉️", "Courriel", params.customerEmail) : ""}
      ${vehicle ? row("🚗", "Véhicule", vehicle) : ""}
      ${params.serviceName ? row("🔧", "Service", params.serviceName) : ""}
      ${row("📅", "Date", fmtDateFr(params.date))}
      ${row("🕐", "Heure", `${params.startTime} – ${params.endTime}`, true)}
    `)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Confirmez ou gérez ce rendez-vous depuis votre tableau de bord :</p>
    ${primaryBtn(dashUrl, "📊 Ouvrir mon tableau de bord")}
  `;

  await send(
    params.to,
    `🔔 Nouveau RDV — ${params.customerName} · ${fmtDateFr(params.date)} à ${params.startTime}`,
    body,
  );
}

// ─── Email: Véhicule prêt ─────────────────────────────────────────────────────

export interface VehicleReadyParams {
  to:              string;
  customerName:    string;
  garageName:      string;
  garageAddress:   string;
  garagePhone:     string;
  completionNote?: string | null;
}

export async function sendVehicleReady(params: VehicleReadyParams) {
  if (!canSend()) return;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Votre véhicule est prêt ! 🎉</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${params.customerName}, votre véhicule est prêt à être récupéré.</p>

    ${params.completionNote ? noteBlock(params.completionNote) : ""}

    ${infoCard(`
      ${row("🏪", "Garage", params.garageName)}
      ${row("📍", "Adresse", params.garageAddress)}
      ${row("📞", "Téléphone", `<a href="tel:${params.garagePhone}" style="color:#f97316">${params.garagePhone}</a>`, true)}
    `)}

    <p style="margin:0;color:#6b7280;font-size:13px;text-align:center">Merci de votre confiance — à bientôt sur Garago !</p>
  `;

  await send(params.to, `✅ Votre véhicule est prêt — ${params.garageName}`, body);
}

// ─── Email: Rappel rendez-vous (24h avant) ────────────────────────────────────

export interface BookingReminderParams extends AppointmentDetails {
  to:           string;
  customerName: string;
  garagePhone:  string;
  appointmentId: string;
}

export async function sendBookingReminder(params: BookingReminderParams) {
  if (!canSend()) return;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Rappel — votre rendez-vous est demain ⏰</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${params.customerName}, voici un rappel de votre rendez-vous prévu demain.</p>

    ${appointmentCard(params)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Des questions ? Contactez le garage directement :</p>
    ${phoneBtn(params.garagePhone)}
  `;

  await send(params.to, `⏰ Rappel RDV demain — ${params.garageName} à ${params.startTime}`, body);
}

// ─── Email: Rendez-vous déplacé ───────────────────────────────────────────────

export interface RescheduleParams extends AppointmentDetails {
  to:           string;
  customerName: string;
  garagePhone:  string;
}

export async function sendRescheduleNotification(params: RescheduleParams) {
  if (!canSend()) return;

  const rescheduledCard = infoCard(`
    ${params.serviceName ? row("🔧", "Service", params.serviceName) : ""}
    ${row("📅", "Nouvelle date", fmtDateFr(params.date))}
    ${row("🕐", "Nouvel horaire", `${params.startTime} – ${params.endTime}`)}
    ${row("🏪", "Garage", params.garageName)}
    ${row("📍", "Adresse", params.garageAddress, true)}
  `);

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Votre rendez-vous a été déplacé 📅</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${params.customerName}, le garage a modifié l'horaire de votre rendez-vous.</p>

    ${rescheduledCard}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Des questions ou vous souhaitez annuler ? Contactez le garage :</p>
    ${phoneBtn(params.garagePhone)}
  `;

  await send(
    params.to,
    `📅 RDV déplacé — ${params.garageName} · ${fmtDateFr(params.date)} à ${params.startTime}`,
    body,
  );
}

// ─── Email: Nouvelle suggestion (admin) ───────────────────────────────────────

export interface NewSuggestionParams {
  content:     string;
  authorName:  string | null;
  authorEmail: string | null;
}

export async function sendAdminNewSuggestion(params: NewSuggestionParams) {
  if (!canSend() || !process.env.ADMIN_EMAIL) return;

  const author  = params.authorName  ?? "Anonyme";
  const contact = params.authorEmail ?? "aucun courriel fourni";

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">💡 Nouvelle suggestion reçue</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Un utilisateur vient de soumettre une suggestion sur Garago.</p>

    ${infoCard(`
      ${row("👤", "De", author)}
      <p style="margin:0 0 16px;font-size:14px"><strong>✉️ Contact :</strong> ${contact}</p>
      <div style="background:#fff;border-radius:8px;padding:16px;border:1px solid #e5e7eb">
        <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;white-space:pre-wrap">${params.content}</p>
      </div>
    `)}

    ${primaryBtn(`${BASE_URL}/tableau-de-bord/admin`, "📊 Voir dans le tableau de bord admin")}
  `;

  await send(ADMIN_EMAIL, `💡 Nouvelle suggestion — ${author}`, body);
}

// ─── Email: Signalement d'avis (admin) ───────────────────────────────────────

export interface ReviewReportParams {
  reviewId:     string;
  reviewerName: string | null;
  reviewRating: number;
  reviewText:   string | null;
  garageName:   string;
  garageSlug:   string;
  reason:       string | null;
}

export async function sendReviewReport(params: ReviewReportParams) {
  if (!canSend()) return;

  const garageUrl = `${BASE_URL}/garage/${params.garageSlug}`;
  const adminUrl  = `${BASE_URL}/tableau-de-bord/admin`;

  const reasonBlock = params.reason ? `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px">
      <tr><td>
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;
                  text-transform:uppercase;letter-spacing:0.05em">Motif du signalement</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#78350f;white-space:pre-wrap">${params.reason}</p>
      </td></tr>
    </table>` : "";

  const body = `
    <h2 style="margin:0 0 8px;color:#b91c1c;font-size:22px;font-weight:800">🚨 Signalement d'un avis</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Un garage a signalé un avis comme inapproprié ou abusif.</p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:20px;margin-bottom:24px">
      <tr><td>
        ${row("🏪", "Garage", params.garageName)}
        ${row("👤", "Auteur de l'avis", params.reviewerName ?? "Anonyme")}
        ${row("⭐", "Note", `${params.reviewRating}/5`)}
        ${params.reviewText ? `
          <div style="background:#fff;border-radius:8px;padding:16px;border:1px solid #fecdd3;margin-top:8px">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#374151">${params.reviewText}</p>
          </div>` : ""}
      </td></tr>
    </table>

    ${reasonBlock}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">
      Identifiant : <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px">${params.reviewId}</code>
    </p>

    ${primaryBtn(adminUrl, "📊 Tableau de bord admin", "#b91c1c")}
    &nbsp;&nbsp;
    ${secondaryBtn(garageUrl, "Voir le profil du garage →")}
  `;

  await send(ADMIN_EMAIL, `🚨 Signalement d'avis — ${params.garageName}`, body);
}

// ─── Email: Conseils auto hebdomadaires ───────────────────────────────────────

const CAT_ICONS: Record<string, string> = {
  entretien: "🔧", securite: "⚠️", saisonnier: "🍂",
  economie: "💰",  electrique: "⚡",  achat: "🛒",
};

export interface WeeklyTipsParams {
  recipients:  { email: string; name: string | null }[];
  tips:        { title: string; content: string; category: string; season: string }[];
  conseilsUrl: string;
}

export async function sendWeeklyTips(params: WeeklyTipsParams) {
  if (!canSend() || params.recipients.length === 0) return;

  const tipsHtml = params.tips.map((tip) => `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:16px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;
                letter-spacing:0.05em;color:#f97316">
        ${CAT_ICONS[tip.category] ?? "💡"} ${tip.category}
      </p>
      <h3 style="margin:0 0 10px;font-size:17px;font-weight:800;color:#0b1f3a;line-height:1.3">${tip.title}</h3>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151">${tip.content}</p>
    </div>
  `).join("");

  const prefsUrl = `${BASE_URL}/tableau-de-bord`;

  const body = `
    <h2 style="margin:0 0 6px;color:#0b1f3a;font-size:24px;font-weight:800">Vos conseils auto de la semaine 🔧</h2>
    <p style="margin:0 0 28px;color:#6b7280;font-size:15px">Deux conseils sélectionnés pour vous aider à prendre soin de votre véhicule.</p>

    ${tipsHtml}

    <div style="text-align:center;margin-top:28px">
      ${primaryBtn(params.conseilsUrl, "📚 Voir tous les conseils →", "#0b1f3a")}
    </div>

    ${HR}
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
      Vous recevez cet email car vous avez accepté les communications marketing de Garago.<br>
      <a href="${prefsUrl}" style="color:#f97316">Gérer mes préférences</a>
    </p>
  `;

  const BATCH_SIZE = 50;
  for (let i = 0; i < params.recipients.length; i += BATCH_SIZE) {
    const batch = params.recipients.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(({ email }) =>
        send(email, "🔧 Vos 2 conseils auto de la semaine — Garago", body)
          .catch((e) => console.error(`[WEEKLY TIP] Échec pour ${email}:`, e))
      )
    );
  }
}

// ─── Email: Alerte mauvais avis (admin) ───────────────────────────────────────

type AlertType = "LOW_RATING" | "BAD_STREAK" | "ONE_STAR";

interface AlertLabel { icon: string; title: string; desc: string }

export interface BadReviewAlertParams {
  garageName:   string;
  garageSlug:   string;
  alertType:    AlertType;
  avgRating:    number;
  reviewCount:  number;
  lastRating:   number;
  reviewerName: string | null;
}

export async function sendAdminBadReviewAlert(params: BadReviewAlertParams) {
  if (!canSend() || !process.env.ADMIN_EMAIL) {
    console.error("[Email] ADMIN_EMAIL manquant — alerte avis non envoyée");
    return;
  }

  const avg = params.avgRating.toFixed(1);
  const LABELS: Record<AlertType, AlertLabel> = {
    LOW_RATING: { icon: "⭐", title: "Note moyenne sous 3/5",  desc: `Le garage a une moyenne de <strong>${avg}/5</strong> sur ${params.reviewCount} avis.` },
    BAD_STREAK: { icon: "📉", title: "Série de mauvais avis", desc: `3 avis consécutifs ≤ 2/5 en moins de 30 jours. Moyenne : <strong>${avg}/5</strong>.` },
    ONE_STAR:   { icon: "🚨", title: "Avis 1 étoile reçu",   desc: `Un client vient de laisser un avis de <strong>1/5</strong>. Moyenne : <strong>${avg}/5</strong>.` },
  };
  const lbl       = LABELS[params.alertType];
  const adminUrl  = `${BASE_URL}/tableau-de-bord/admin`;
  const garageUrl = `${BASE_URL}/garage/${params.garageSlug}`;

  const body = `
    <h2 style="margin:0 0 6px;color:#b91c1c;font-size:22px;font-weight:800">${lbl.icon} Alerte qualité — ${lbl.title}</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Une action de votre part pourrait être nécessaire.</p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:20px;margin-bottom:24px">
      <tr><td>
        <p style="margin:0 0 8px;font-size:16px;font-weight:800;color:#111827">${params.garageName}</p>
        <p style="margin:0 0 12px;font-size:14px;color:#374151">${lbl.desc}</p>
        <hr style="border:none;border-top:1px solid #fecdd3;margin:12px 0"/>
        <p style="margin:0;font-size:13px;color:#6b7280">
          Dernier avis : <strong>${params.lastRating}/5</strong> par ${params.reviewerName ?? "un utilisateur anonyme"}
        </p>
      </td></tr>
    </table>

    ${primaryBtn(adminUrl, "📊 Tableau de bord admin", "#b91c1c")}
    &nbsp;&nbsp;
    ${secondaryBtn(garageUrl, "Voir le profil du garage →")}
  `;

  await send(ADMIN_EMAIL, `${lbl.icon} [Garago] Alerte — ${params.garageName} · ${lbl.title}`, body);
}

// ─── Email: Vérification de description (admin) ───────────────────────────────

export interface DescriptionReviewParams {
  garageId:   string;
  garageName: string;
  ownerEmail: string;
  draft:      string;
  approveUrl: string;
  rejectUrl:  string;
}

export async function sendDescriptionReviewEmail(params: DescriptionReviewParams) {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#0b1f3a">📝 Nouvelle description à vérifier</h2>

    <p style="margin:0 0 6px;font-size:14px;color:#374151"><strong>Garage :</strong> ${params.garageName}</p>
    <p style="margin:0 0 16px;font-size:14px;color:#374151"><strong>Propriétaire :</strong> ${params.ownerEmail}</p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #f97316;
                border-radius:8px;padding:16px;margin-bottom:20px">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap">${params.draft}</p>
    </div>

    <p style="margin:0 0 16px;font-size:12px;color:#6b7280">
      Vérifiez que ce texte est une description d'entreprise neutre — sans promotion, sans liens ni coordonnées.
    </p>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:12px">${primaryBtn(params.approveUrl, "✅ Approuver", "#16a34a")}</td>
        <td>${primaryBtn(params.rejectUrl, "✗ Refuser", "#dc2626")}</td>
      </tr>
    </table>
  `;

  await send(ADMIN_EMAIL, `📝 [Modération] Description à vérifier — ${params.garageName}`, body);
}

// ─── Email: Décision sur la description (garage) ──────────────────────────────

export interface DescriptionDecisionParams {
  ownerEmail: string;
  garageName: string;
  approved:   boolean;
}

export async function sendDescriptionDecisionEmail(params: DescriptionDecisionParams) {
  const body = params.approved
    ? `
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0b1f3a">✅ Description approuvée</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Bonjour,<br><br>
        La description de votre garage <strong>${params.garageName}</strong> a été approuvée
        et est maintenant visible publiquement sur Garago.
      </p>`
    : `
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0b1f3a">✗ Description refusée</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Bonjour,<br><br>
        La description soumise pour votre garage <strong>${params.garageName}</strong> a été refusée
        car elle ne respecte pas nos critères (contenu promotionnel, liens ou coordonnées non autorisés).<br><br>
        Vous pouvez soumettre une nouvelle version depuis votre tableau de bord.
      </p>`;

  const subject = params.approved
    ? `✅ Votre description a été approuvée — Garago`
    : `✗ Votre description a été refusée — Garago`;

  await send(params.ownerEmail, subject, body);
}
