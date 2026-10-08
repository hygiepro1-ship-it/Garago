import { Resend } from "resend";
import { unsubscribeUrl } from "@/lib/unsubscribe";

// ─── Config ───────────────────────────────────────────────────────────────────

const FROM        = process.env.EMAIL_FROM   ?? "Garago <support@garagopro.ca>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL  ?? "info.garago@gmail.com";
const BASE_URL    = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

function getResend() { return new Resend(process.env.RESEND_API_KEY); }

function canSend(): boolean {
  const key = process.env.RESEND_API_KEY;
  return !!key && !key.startsWith("re_VOTRE");
}

// Échappe tout texte fourni par un utilisateur avant de l'interpoler dans un email HTML —
// sans ça, un avis/suggestion/nom pourrait injecter du balisage dans l'email lu par l'admin.
function esc(value: string | null | undefined): string {
  if (!value) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

/** Liens "Ajouter au calendrier" — Google et Outlook en un clic (aucune app
 * requise), Apple/Outlook desktop/autres via le fichier .ics déjà généré par
 * /api/appointments/[id]/ics. Mêmes paramètres que ceux de BookingWidget. */
function calendarLinks(appt: AppointmentDetails & { appointmentId: string }): { google: string; outlook: string; ics: string } {
  const start = `${appt.date.replace(/-/g, "")}T${appt.startTime.replace(":", "")}00`;
  const end   = `${appt.date.replace(/-/g, "")}T${appt.endTime.replace(":", "")}00`;
  const title = `RDV ${appt.garageName}${appt.serviceName ? ` — ${appt.serviceName}` : ""}`;
  const details = `Rendez-vous chez ${appt.garageName}${appt.serviceName ? `\nService : ${appt.serviceName}` : ""}`;

  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${start}/${end}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(appt.garageAddress)}`;

  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent` +
    `&subject=${encodeURIComponent(title)}` +
    `&startdt=${start}&enddt=${end}` +
    `&location=${encodeURIComponent(appt.garageAddress)}`;

  const ics = `${BASE_URL}/api/appointments/${appt.appointmentId}/ics`;

  return { google, outlook, ics };
}

/** Orange info card used in appointment-related emails. */
function infoCard(rows: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:20px;margin-bottom:24px">
      <tr><td>${rows}</td></tr>
    </table>`;
}

/** A single row inside an infoCard. */
function row(label: string, value: string, last = false): string {
  return `<p style="margin:0${last ? "" : " 0 8px"};font-size:14px"><strong>${label} :</strong> ${value}</p>`;
}

// ─── Icônes de marque ─────────────────────────────────────────────────────────
// Un seul jeu d'icônes (trait orange, même style que le reste du site), servies comme de vrais fichiers PNG
// hébergés sur le site (public/email). Les images SVG intégrées (data:) ne s'affichent ni dans Gmail ni dans
// Outlook : le destinataire verrait une case vide. Les emoji, eux, varient selon l'appareil du destinataire.

type IconType = "check" | "calendar" | "bell" | "card" | "warning";

function iconUrl(type: IconType): string {
  return `${BASE_URL}/email/${type}.png`;
}

/** Lien téléphonique valide (« tel:+15145551001 ») à partir d'un numéro écrit à la main. */
function telHref(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.length === 10 ? `tel:+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `tel:+${digits}` : `tel:${digits}`;
}

/** Badge rond avec une seule icône de marque, affiché au-dessus du titre d'un
 * courriel destiné au client/garage — jamais utilisé dans les courriels
 * internes (admin) ni à côté des lignes de détail, pour garder le nombre
 * d'icônes au minimum. */
function iconBadge(type: IconType): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px">
      <tr><td width="56" height="56" align="center" valign="middle" style="background:#fff7ed;border-radius:6px">
        <img src="${iconUrl(type)}" width="26" height="26" alt="" style="display:block;border:0" />
      </td></tr>
    </table>`;
}

/** Primary CTA button. */
function primaryBtn(href: string, label: string, color = "#f97316"): string {
  return `<a href="${href}"
     style="display:inline-block;background:${color};color:#fff;padding:12px 28px;
            border-radius:5px;text-decoration:none;font-weight:700;font-size:14px">
    ${label}
  </a>`;
}

/** Secondary (light) button. */
function secondaryBtn(href: string, label: string): string {
  return `<a href="${href}"
     style="display:inline-block;background:#f1f5f9;color:#0b1f3a;padding:12px 24px;
            border-radius:5px;text-decoration:none;font-weight:700;font-size:14px;
            border:1px solid #e2e8f0">
    ${label}
  </a>`;
}

/** Deux boutons distincts côte à côte : confirmer / annuler (courriels de confirmation de rendez-vous). */
function confirmCancelBtns(confirmUrl: string, cancelUrl: string, confirmLabel = "Je confirme", cancelLabel = "J'annule ma réservation"): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr>
    <td style="padding:0 10px 10px 0">${primaryBtn(confirmUrl, confirmLabel)}</td>
    <td style="padding:0 0 10px 0">${secondaryBtn(cancelUrl, cancelLabel)}</td>
  </tr></table>`;
}

/** Phone number button. */
function phoneBtn(rawPhone: string): string {
  const phone = esc(rawPhone);
  return `<a href="${telHref(rawPhone)}"
     style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;
            border-radius:5px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:24px">
    ${phone}
  </a>`;
}

/** Green note block (e.g. garage completion note). */
function noteBlock(content: string): string {
  return `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#15803d;
                text-transform:uppercase;letter-spacing:0.05em">Note du garage</p>
      <p style="margin:0;font-size:14px;color:#166534;line-height:1.6">${esc(content)}</p>
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
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Public Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#0b1f3a;border-radius:6px 6px 0 0;padding:20px 32px;text-align:center">
          <img src="${BASE_URL}/garago_logo_transparent_1.png" alt="Garago" height="72"
               style="display:block;margin:0 auto;max-height:72px;border:0" />
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f3f4f6;border-radius:0 0 6px 6px;border:1px solid #e5e7eb;
                       border-top:0;padding:16px 32px;text-align:center">
          <p style="margin:0;color:#9ca3af;font-size:12px">
            Garago Canada — <a href="${BASE_URL}" style="color:#f97316;text-decoration:none">garagopro.ca</a>
            · <a href="mailto:info@garagopro.ca" style="color:#f97316;text-decoration:none">info@garagopro.ca</a>
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
    ${appt.serviceName ? row("Service", esc(appt.serviceName)) : ""}
    ${row("Date", fmtDateFr(appt.date))}
    ${row("Heure", `${esc(appt.startTime)} – ${esc(appt.endTime)}`)}
    ${row("Garage", esc(appt.garageName))}
    ${row("Adresse", esc(appt.garageAddress), true)}
  `);
}

/** `fromName` : nom affiché comme expéditeur (ex. le garage), l'adresse d'envoi restant celle de Garago. */
async function send(to: string | string[], subject: string, body: string, fromName?: string) {
  const address = FROM.match(/<([^>]+)>/)?.[1] ?? FROM;
  const from = fromName ? `${fromName.replace(/[<>"\r\n]/g, " ").trim()} <${address}>` : FROM;
  await getResend().emails.send({ from, to, subject, html: baseLayout(body) });
}

// ─── Email: Vérification de compte ───────────────────────────────────────────

export async function sendVerificationCode(to: string, code: string) {
  if (!canSend()) {
    console.log(`[DEV] Code de vérification pour ${to} : ${code}`);
    return;
  }

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Vérification de votre courriel</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bienvenue sur Garago ! Voici votre code de vérification :</p>

    <div style="text-align:center;margin:32px 0">
      <div style="display:inline-block;background:#0b1f3a;border-radius:6px;padding:24px 40px">
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

// ─── Email: Réinitialisation de mot de passe ──────────────────────────────────

export async function sendPasswordResetCode(to: string, code: string) {
  if (!canSend()) {
    console.log(`[DEV] Code de réinitialisation pour ${to} : ${code}`);
    return;
  }

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Réinitialisation de mot de passe</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Voici votre code pour réinitialiser votre mot de passe Garago :</p>

    <div style="text-align:center;margin:32px 0">
      <div style="display:inline-block;background:#0b1f3a;border-radius:6px;padding:24px 40px">
        <span style="font-size:44px;font-weight:900;letter-spacing:12px;color:#fff;font-family:monospace">${code}</span>
      </div>
    </div>

    <p style="margin:0 0 8px;color:#374151;font-size:14px;text-align:center">Ce code est valide pendant <strong>15 minutes</strong>.</p>
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center">Si vous n'avez pas demandé cette réinitialisation, ignorez simplement ce message — votre mot de passe ne changera pas.</p>
    ${HR}
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">Ne partagez jamais ce code avec qui que ce soit.</p>
  `;

  await send(to, `${code} — Réinitialisation de mot de passe Garago`, body);
}

// ─── Email: Confirmation de rendez-vous (client) ──────────────────────────────

export interface BookingConfirmationParams extends AppointmentDetails {
  to:            string;
  customerName:  string;
  garagePhone:   string;
  appointmentId: string;
  /** Rendez-vous de dernière minute : lien de confirmation + échéance (texte déjà formaté). */
  confirmUrl?:      string;
  cancelUrl?:       string;
  confirmDeadline?: string;
}

export async function sendBookingConfirmation(params: BookingConfirmationParams) {
  if (!canSend()) return;

  const cal = calendarLinks(params);

  const body = `
    ${iconBadge(params.confirmUrl ? "calendar" : "check")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">${params.confirmUrl ? "Rendez-vous réservé : confirmez votre venue" : "Rendez-vous confirmé"}</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${esc(params.customerName)}, ${params.confirmUrl ? "votre créneau est réservé. Confirmez que vous venez pour le garder." : "votre rendez-vous est confirmé."}</p>

    ${appointmentCard(params)}

    ${params.confirmUrl ? `
    <div style="background:#fdf1d8;border-radius:6px;padding:16px 18px;margin:0 0 24px">
      <p style="margin:0 0 6px;color:#7a3d00;font-size:15px;font-weight:800">Confirmez votre venue ${esc(params.confirmDeadline ?? "dans l'heure")}</p>
      <p style="margin:0 0 14px;color:#7a3d00;font-size:13px">Ce rendez-vous est très proche. Sans confirmation, le créneau est remis à disposition des autres conducteurs.</p>
      ${confirmCancelBtns(params.confirmUrl, params.cancelUrl ?? params.confirmUrl)}
    </div>` : ""}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">
      En cas de question, appelez directement le garage :
    </p>
    ${phoneBtn(params.garagePhone)}

    ${HR}
    <p style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:700">Ajouter à votre calendrier</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px">Ne manquez pas votre rendez-vous :</p>
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:8px;padding-bottom:8px">${secondaryBtn(cal.google, "Google Calendar")}</td>
      <td style="padding-bottom:8px">${secondaryBtn(cal.outlook, "Outlook")}</td>
    </tr></table>
    ${secondaryBtn(cal.ics, "Apple Calendar / autre (.ics)")}
  `;

  const subject = params.confirmUrl
    ? `Confirmez dans l'heure — ${params.garageName}, ${fmtDateFr(params.date)} à ${params.startTime}`
    : `RDV ${params.garageName} — ${fmtDateFr(params.date)} à ${params.startTime}`;
  await send(params.to, subject, body);
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
    ${iconBadge("bell")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Nouveau rendez-vous en ligne</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Un client vient de réserver via Garago. Voici les détails :</p>

    ${infoCard(`
      ${row("Client", esc(params.customerName))}
      ${row("Téléphone", `<a href="${telHref(params.customerPhone)}" style="color:#f97316">${esc(params.customerPhone)}</a>`)}
      ${params.customerEmail ? row("Courriel", esc(params.customerEmail)) : ""}
      ${vehicle ? row("Véhicule", esc(vehicle)) : ""}
      ${params.serviceName ? row("Service", esc(params.serviceName)) : ""}
      ${row("Date", fmtDateFr(params.date))}
      ${row("Heure", `${esc(params.startTime)} – ${esc(params.endTime)}`, true)}
    `)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Gérez ce rendez-vous depuis votre tableau de bord :</p>
    ${primaryBtn(dashUrl, "Ouvrir mon tableau de bord")}
  `;

  await send(
    params.to,
    `Nouveau RDV — ${params.customerName} · ${fmtDateFr(params.date)} à ${params.startTime}`,
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
    ${iconBadge("check")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Votre véhicule est prêt</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${esc(params.customerName)}, votre véhicule est prêt à être récupéré.</p>

    ${params.completionNote ? noteBlock(params.completionNote) : ""}

    ${infoCard(`
      ${row("Garage", esc(params.garageName))}
      ${row("Adresse", esc(params.garageAddress))}
      ${row("Téléphone", `<a href="${telHref(params.garagePhone)}" style="color:#f97316">${esc(params.garagePhone)}</a>`, true)}
    `)}

    <p style="margin:0;color:#6b7280;font-size:13px;text-align:center">Merci de votre confiance — à bientôt sur Garago !</p>
  `;

  await send(params.to, `Votre véhicule est prêt — ${params.garageName}`, body);
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
    ${iconBadge("calendar")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Rappel — votre rendez-vous est demain</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${esc(params.customerName)}, voici un rappel de votre rendez-vous prévu demain.</p>

    ${appointmentCard(params)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Des questions ? Contactez le garage directement :</p>
    ${phoneBtn(params.garagePhone)}
  `;

  await send(params.to, `Rappel RDV demain — ${params.garageName} à ${params.startTime}`, body);
}

// ─── Email: Rappel d'entretien véhicule ───────────────────────────────────────

export interface MaintenanceReminderParams {
  to:           string;
  customerName: string;
  title:        string;
  notes?:       string | null;
  dueDate:      string;
  vehicleLabel?: string | null;
}

export async function sendMaintenanceReminder(params: MaintenanceReminderParams) {
  if (!canSend()) return;

  const body = `
    ${iconBadge("calendar")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Rappel d'entretien</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${esc(params.customerName)}, un entretien approche pour votre véhicule.</p>

    ${infoCard(`
      ${row("Entretien", esc(params.title))}
      ${params.vehicleLabel ? row("Véhicule", esc(params.vehicleLabel)) : ""}
      ${row("Échéance", params.dueDate)}
    `)}

    ${params.notes ? noteBlock(esc(params.notes)) : ""}

    <p style="margin:0;color:#6b7280;font-size:13px;text-align:center">Retrouvez tous vos rappels dans votre tableau de bord Garago.</p>
  `;

  await send(params.to, `Rappel d'entretien — ${esc(params.title)}`, body);
}

// ─── Email: Relance carte manquante (inscription garage inachevée) ───────────

export interface CardReminderParams {
  to:         string;
  garageName: string;
  isFinal:    boolean; // dernière relance — l'accès restera bloqué sans action
}

export async function sendCardReminder(params: CardReminderParams) {
  if (!canSend()) return;

  const dashboardUrl = `${BASE_URL}/tableau-de-bord/garage`;

  const body = `
    ${iconBadge("card")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Votre essai gratuit attend une carte</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">
      Bonjour, le profil de <strong>${esc(params.garageName)}</strong> a bien été créé sur Garago, mais l'inscription
      n'est pas terminée : aucune carte n'a été enregistrée, donc l'accès à votre tableau de bord reste bloqué.
    </p>

    ${infoCard(`
      ${row("Aucun frais", "Rien n'est prélevé avant la fin de votre essai de 30 jours", true)}
    `)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Ajoutez votre carte pour débloquer votre tableau de bord et commencer à recevoir des clients :</p>
    ${primaryBtn(dashboardUrl, "Ajouter ma carte")}

    ${params.isFinal ? `
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px">
      Ceci est notre dernière relance. Sans carte enregistrée, votre profil restera inaccessible et sera éventuellement retiré.
    </p>` : ""}
  `;

  await send(params.to, "Votre essai Garago attend une carte pour démarrer", body);
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
    ${params.serviceName ? row("Service", esc(params.serviceName)) : ""}
    ${row("Nouvelle date", fmtDateFr(params.date))}
    ${row("Nouvel horaire", `${esc(params.startTime)} – ${esc(params.endTime)}`)}
    ${row("Garage", esc(params.garageName))}
    ${row("Adresse", esc(params.garageAddress), true)}
  `);

  const body = `
    ${iconBadge("calendar")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Votre rendez-vous a été déplacé</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${esc(params.customerName)}, le garage a modifié l'horaire de votre rendez-vous.</p>

    ${rescheduledCard}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Des questions ou vous souhaitez annuler ? Contactez le garage :</p>
    ${phoneBtn(params.garagePhone)}
  `;

  await send(
    params.to,
    `RDV déplacé — ${params.garageName} · ${fmtDateFr(params.date)} à ${params.startTime}`,
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

  const author  = esc(params.authorName)  || "Anonyme";
  const contact = esc(params.authorEmail) || "aucun courriel fourni";

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Nouvelle suggestion reçue</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Un utilisateur vient de soumettre une suggestion sur Garago.</p>

    ${infoCard(`
      ${row("De", author)}
      <p style="margin:0 0 16px;font-size:14px"><strong>Contact :</strong> ${contact}</p>
      <div style="background:#fff;border-radius:4px;padding:16px;border:1px solid #e5e7eb">
        <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;white-space:pre-wrap">${esc(params.content)}</p>
      </div>
    `)}

    ${primaryBtn(`${BASE_URL}/tableau-de-bord/admin`, "Voir dans le tableau de bord admin")}
  `;

  await send(ADMIN_EMAIL, `Nouvelle suggestion — ${author}`, body);
}

// ─── Emails: annulation d'un rendez-vous ─────────────────────────────────────

export interface AppointmentCancelledParams {
  to:            string;
  customerName:  string;
  garageName:    string;
  garagePhone:   string;
  serviceName:   string | null;
  date:          string;
  startTime:     string;
}

/** Le GARAGE annule : le client doit en être informé (sinon il se présente pour rien). */
export async function sendCancelledByGarage(params: AppointmentCancelledParams) {
  if (!canSend()) return;

  const body = `
    ${iconBadge("warning")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Votre rendez-vous a été annulé</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${esc(params.customerName)}, ${esc(params.garageName)} a dû annuler votre rendez-vous. Nous sommes désolés pour le dérangement.</p>

    ${infoCard(`
      ${params.serviceName ? row("Service", esc(params.serviceName)) : ""}
      ${row("Date", fmtDateFr(params.date))}
      ${row("Heure", esc(params.startTime), true)}
    `)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Vous pouvez joindre le garage pour convenir d'une autre date, ou choisir un autre créneau en ligne :</p>
    <p style="margin:0 0 20px">${primaryBtn(`${BASE_URL}/rechercher`, "Trouver un autre créneau")}</p>
    ${phoneBtn(params.garagePhone)}
  `;

  await send(params.to, `Rendez-vous annulé — ${params.garageName}, ${fmtDateFr(params.date)} à ${params.startTime}`, body);
}

export interface CancelledByCustomerParams {
  to:            string;
  garageName:    string;
  customerName:  string;
  customerPhone: string;
  serviceName:   string | null;
  date:          string;
  startTime:     string;
}

/** Le CLIENT annule : le garage doit le savoir pour réorganiser sa journée. */
export async function sendCancelledByCustomer(params: CancelledByCustomerParams) {
  if (!canSend()) return;

  const body = `
    ${iconBadge("bell")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Un client a annulé son rendez-vous</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Le créneau est de nouveau disponible pour les réservations en ligne.</p>

    ${infoCard(`
      ${row("Client", esc(params.customerName))}
      ${row("Téléphone", `<a href="${telHref(params.customerPhone)}" style="color:#f97316">${esc(params.customerPhone)}</a>`)}
      ${params.serviceName ? row("Service", esc(params.serviceName)) : ""}
      ${row("Date", fmtDateFr(params.date))}
      ${row("Heure", esc(params.startTime), true)}
    `)}

    ${primaryBtn(`${BASE_URL}/tableau-de-bord/garage/agenda`, "Ouvrir mon agenda")}
  `;

  await send(params.to, `Rendez-vous annulé par le client — ${params.customerName}, ${fmtDateFr(params.date)} à ${params.startTime}`, body);
}

// ─── Email: changement de nom d'un garage (admin) ────────────────────────────

export async function sendAdminGarageRenamed(params: { garageId: string; slug: string; oldName: string; newName: string; neq: string | null; ownerEmail: string | null }) {
  if (!canSend() || !process.env.ADMIN_EMAIL) return;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Un garage a changé de nom</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Vérifiez que le nouveau nom correspond bien au NEQ du garage (risque d'usurpation).</p>

    ${infoCard(`
      ${row("Ancien nom", esc(params.oldName))}
      ${row("Nouveau nom", esc(params.newName))}
      ${row("NEQ", esc(params.neq) || "—")}
      ${row("Propriétaire", esc(params.ownerEmail) || "—")}
    `)}

    ${primaryBtn(`${BASE_URL}/garage/${encodeURIComponent(params.slug)}`, "Voir la fiche")}
  `;

  await send(ADMIN_EMAIL, `Changement de nom — ${params.oldName} → ${params.newName}`, body);
}

// ─── Email: nouvelle succursale (admin) ──────────────────────────────────────

export async function sendAdminBranchCreated(params: { slug: string; branchName: string; branchAddress: string; mainName: string; neq: string | null; ownerEmail: string | null }) {
  if (!canSend() || !process.env.ADMIN_EMAIL) return;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Nouvelle succursale ajoutée</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Une succursale est visible publiquement dès sa création, sans vérification préalable. Contrôlez qu'elle appartient bien à l'entreprise.</p>

    ${infoCard(`
      ${row("Garage principal", esc(params.mainName))}
      ${row("Succursale", esc(params.branchName))}
      ${row("Adresse", esc(params.branchAddress))}
      ${row("NEQ du principal", esc(params.neq) || "—")}
      ${row("Propriétaire", esc(params.ownerEmail) || "—")}
    `)}

    ${primaryBtn(`${BASE_URL}/garage/${encodeURIComponent(params.slug)}`, "Voir la succursale")}
  `;

  await send(ADMIN_EMAIL, `Nouvelle succursale — ${params.branchName}`, body);
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
           style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:20px;margin-bottom:24px">
      <tr><td>
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;
                  text-transform:uppercase;letter-spacing:0.05em">Motif du signalement</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#78350f;white-space:pre-wrap">${esc(params.reason)}</p>
      </td></tr>
    </table>` : "";

  const body = `
    <h2 style="margin:0 0 8px;color:#b91c1c;font-size:22px;font-weight:800">Signalement d'un avis</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Un garage a signalé un avis comme inapproprié ou abusif.</p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff1f2;border:1px solid #fecdd3;border-radius:6px;padding:20px;margin-bottom:24px">
      <tr><td>
        ${row("Garage", esc(params.garageName))}
        ${row("Auteur de l'avis", esc(params.reviewerName) || "Anonyme")}
        ${row("Note", `${params.reviewRating}/5`)}
        ${params.reviewText ? `
          <div style="background:#fff;border-radius:4px;padding:16px;border:1px solid #fecdd3;margin-top:8px">
            <p style="margin:0;font-size:14px;line-height:1.7;color:#374151">${esc(params.reviewText)}</p>
          </div>` : ""}
      </td></tr>
    </table>

    ${reasonBlock}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">
      Identifiant : <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px">${params.reviewId}</code>
    </p>

    ${primaryBtn(adminUrl, "Tableau de bord admin", "#b91c1c")}
    &nbsp;&nbsp;
    ${secondaryBtn(garageUrl, "Voir le profil du garage →")}
  `;

  await send(ADMIN_EMAIL, `Signalement d'avis — ${params.garageName}`, body);
}

// ─── Email: Conseils auto hebdomadaires ───────────────────────────────────────

export interface WeeklyTipsParams {
  recipients:  { email: string; name: string | null }[];
  tips:        { title: string; content: string; category: string; season: string }[];
  conseilsUrl: string;
}

export async function sendWeeklyTips(params: WeeklyTipsParams) {
  if (!canSend() || params.recipients.length === 0) return;

  const tipsHtml = params.tips.map((tip) => `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:20px;margin-bottom:16px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;
                letter-spacing:0.05em;color:#f97316">
        ${tip.category}
      </p>
      <h3 style="margin:0 0 10px;font-size:17px;font-weight:800;color:#0b1f3a;line-height:1.3">${tip.title}</h3>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#374151">${tip.content}</p>
    </div>
  `).join("");

  // Un courriel par destinataire : chacun reçoit SON lien de désabonnement (obligatoire selon la LCAP) et l'en-tête
  // « List-Unsubscribe » en un clic exigé par Gmail, Outlook et Yahoo pour les envois groupés.
  const bodyFor = (email: string) => `
    <h2 style="margin:0 0 6px;color:#0b1f3a;font-size:24px;font-weight:800">Vos conseils auto de la semaine</h2>
    <p style="margin:0 0 28px;color:#6b7280;font-size:15px">Deux conseils sélectionnés pour vous aider à prendre soin de votre véhicule.</p>

    ${tipsHtml}

    <div style="text-align:center;margin-top:28px">
      ${primaryBtn(params.conseilsUrl, "Voir tous les conseils →", "#0b1f3a")}
    </div>

    ${HR}
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
      Vous recevez ce courriel car vous avez accepté les communications de Garago.<br>
      <a href="${unsubscribeUrl(email)}" style="color:#f97316">Se désabonner</a> en un clic, à tout moment.
    </p>
  `;

  // Envoi par lots (API groupée de Resend) : l'envoi de 50 courriels en parallèle dépasse la limite de débit
  // de Resend, et les échecs étaient avalés en silence alors que les conseils étaient marqués « envoyés ».
  const BATCH_SIZE = 100;
  let failed = 0;
  for (let i = 0; i < params.recipients.length; i += BATCH_SIZE) {
    const batch = params.recipients.slice(i, i + BATCH_SIZE);
    const payload = batch.map(({ email }) => ({
      from: FROM, to: email, subject: "Vos 2 conseils auto de la semaine — Garago", html: baseLayout(bodyFor(email)),
      headers: { "List-Unsubscribe": `<${unsubscribeUrl(email)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }));
    try {
      const { error } = await getResend().batch.send(payload);
      if (error) { failed += batch.length; console.error("[WEEKLY TIP] Échec du lot :", error); }
    } catch (e) {
      failed += batch.length;
      console.error("[WEEKLY TIP] Échec du lot :", e);
    }
  }
  if (failed > 0) console.error(`[WEEKLY TIP] ${failed} courriel(s) non envoyé(s) sur ${params.recipients.length}`);
}

// ─── Email: Alerte mauvais avis (admin) ───────────────────────────────────────

type AlertType = "LOW_RATING" | "BAD_STREAK" | "ONE_STAR";

interface AlertLabel { title: string; desc: string }

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
    LOW_RATING: { title: "Note moyenne sous 3/5",  desc: `Le garage a une moyenne de <strong>${avg}/5</strong> sur ${params.reviewCount} avis.` },
    BAD_STREAK: { title: "Série de mauvais avis", desc: `3 avis consécutifs ≤ 2/5 en moins de 30 jours. Moyenne : <strong>${avg}/5</strong>.` },
    ONE_STAR:   { title: "Avis 1 étoile reçu",   desc: `Un client vient de laisser un avis de <strong>1/5</strong>. Moyenne : <strong>${avg}/5</strong>.` },
  };
  const lbl       = LABELS[params.alertType];
  const adminUrl  = `${BASE_URL}/tableau-de-bord/admin`;
  const garageUrl = `${BASE_URL}/garage/${params.garageSlug}`;

  const body = `
    <h2 style="margin:0 0 6px;color:#b91c1c;font-size:22px;font-weight:800">Alerte qualité — ${lbl.title}</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Une action de votre part pourrait être nécessaire.</p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff1f2;border:1px solid #fecdd3;border-radius:6px;padding:20px;margin-bottom:24px">
      <tr><td>
        <p style="margin:0 0 8px;font-size:16px;font-weight:800;color:#111827">${esc(params.garageName)}</p>
        <p style="margin:0 0 12px;font-size:14px;color:#374151">${lbl.desc}</p>
        <hr style="border:none;border-top:1px solid #fecdd3;margin:12px 0"/>
        <p style="margin:0;font-size:13px;color:#6b7280">
          Dernier avis : <strong>${params.lastRating}/5</strong> par ${esc(params.reviewerName) || "un utilisateur anonyme"}
        </p>
      </td></tr>
    </table>

    ${primaryBtn(adminUrl, "Tableau de bord admin", "#b91c1c")}
    &nbsp;&nbsp;
    ${secondaryBtn(garageUrl, "Voir le profil du garage →")}
  `;

  await send(ADMIN_EMAIL, `[Garago] Alerte — ${params.garageName} · ${lbl.title}`, body);
}

// ─── Email: Vérification de description (admin) ───────────────────────────────

export interface DescriptionReviewParams {
  garageId:   string;
  garageName: string;
  ownerEmail: string;
  draft:      string;
}

export async function sendDescriptionReviewEmail(params: DescriptionReviewParams) {
  if (!canSend()) return;
  const adminUrl = `${BASE_URL}/tableau-de-bord/admin`;
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#0b1f3a">Nouvelle description à vérifier</h2>

    <p style="margin:0 0 6px;font-size:14px;color:#374151"><strong>Garage :</strong> ${esc(params.garageName)}</p>
    <p style="margin:0 0 16px;font-size:14px;color:#374151"><strong>Propriétaire :</strong> ${esc(params.ownerEmail)}</p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #f97316;
                border-radius:4px;padding:16px;margin-bottom:20px">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap">${esc(params.draft)}</p>
    </div>

    <p style="margin:0 0 16px;font-size:12px;color:#6b7280">
      Vérifiez que ce texte est une description d'entreprise neutre — sans promotion, sans liens ni coordonnées.
    </p>

    ${primaryBtn(adminUrl, "Approuver ou refuser dans le tableau de bord")}
  `;

  await send(ADMIN_EMAIL, `[Modération] Description à vérifier — ${params.garageName}`, body);
}

// ─── Email: Décision sur la description (garage) ──────────────────────────────

export interface DescriptionDecisionParams {
  ownerEmail: string;
  garageName: string;
  approved:   boolean;
}

export async function sendDescriptionDecisionEmail(params: DescriptionDecisionParams) {
  if (!canSend()) return;
  const body = params.approved
    ? `
      ${iconBadge("check")}
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0b1f3a">Description approuvée</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Bonjour,<br><br>
        La description de votre garage <strong>${esc(params.garageName)}</strong> a été approuvée
        et est maintenant visible publiquement sur Garago.
      </p>`
    : `
      ${iconBadge("warning")}
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0b1f3a">Description refusée</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Bonjour,<br><br>
        La description soumise pour votre garage <strong>${esc(params.garageName)}</strong> a été refusée
        car elle ne respecte pas nos critères (contenu promotionnel, liens ou coordonnées non autorisés).<br><br>
        Vous pouvez soumettre une nouvelle version depuis votre tableau de bord.
      </p>`;

  const subject = params.approved
    ? `Votre description a été approuvée — Garago`
    : `Votre description a été refusée — Garago`;

  await send(params.ownerEmail, subject, body);
}

// ─── Email: Nouveau garage à vérifier (admin) ─────────────────────────────────

export interface GarageVerificationRequestParams {
  garageId:   string;
  garageName: string;
  neq:        string;
  ownerEmail: string;
}

export async function sendGarageVerificationRequest(params: GarageVerificationRequestParams) {
  if (!canSend()) return;

  const adminUrl = `${BASE_URL}/tableau-de-bord/admin`;
  const reqUrl   = "https://www.registreentreprises.gouv.qc.ca/fr/consulter/rechercher/default.aspx";

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Nouveau garage à vérifier</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Un nouveau garage vient de s'inscrire et attend une vérification manuelle avant d'apparaître dans les résultats de recherche.</p>

    ${infoCard(`
      ${row("Garage", esc(params.garageName))}
      ${row("Propriétaire", esc(params.ownerEmail))}
      ${row("NEQ", `<span style="font-family:monospace">${esc(params.neq)}</span>`, true)}
    `)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Vérifiez le NEQ au Registre des entreprises du Québec, puis approuvez ou refusez depuis le tableau de bord admin :</p>
    ${primaryBtn(adminUrl, "Ouvrir le tableau de bord admin")}
    &nbsp;&nbsp;
    ${secondaryBtn(reqUrl, "Rechercher au Registre →")}
  `;

  await send(ADMIN_EMAIL, `Garage à vérifier — ${params.garageName}`, body);
}

// ─── Email: Décision de vérification (garage) ─────────────────────────────────

export interface GarageVerificationDecisionParams {
  ownerEmail: string;
  garageName: string;
  approved:   boolean;
}

export async function sendGarageVerificationDecision(params: GarageVerificationDecisionParams) {
  if (!canSend()) return;

  const dashboardUrl = `${BASE_URL}/tableau-de-bord/garage`;

  const body = params.approved
    ? `
      ${iconBadge("check")}
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0b1f3a">Votre garage est vérifié</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Bonjour,<br><br>
        Le profil de <strong>${esc(params.garageName)}</strong> a été vérifié et est maintenant visible dans les résultats de recherche Garago.
      </p>
      ${primaryBtn(dashboardUrl, "Ouvrir mon tableau de bord")}`
    : `
      ${iconBadge("warning")}
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0b1f3a">Vérification refusée</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Bonjour,<br><br>
        Nous n'avons pas pu vérifier le profil de <strong>${esc(params.garageName)}</strong> à partir des informations fournies.
        Votre profil reste invisible dans les résultats de recherche.<br><br>
        Pour résoudre la situation, contactez notre équipe à <a href="mailto:${ADMIN_EMAIL}" style="color:#f97316">${ADMIN_EMAIL}</a>.
      </p>`;

  const subject = params.approved
    ? `Votre garage est vérifié — Garago`
    : `Vérification de votre garage refusée — Garago`;

  await send(params.ownerEmail, subject, body);
}

// ─── Email: Demande de réclamation de fiche ("Doctolib") ───────────────────────

export interface ClaimRequestNotificationParams {
  garageId:    string;
  garageName:  string;
  garageCity:  string;
  requesterName:  string;
  requesterRole:  string;
  requesterPhone: string;
  requesterEmail: string;
  neq?: string | null;
}

export async function sendClaimRequestNotification(params: ClaimRequestNotificationParams) {
  if (!canSend()) return;

  const adminUrl = `${BASE_URL}/tableau-de-bord/admin`;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Demande de réclamation de fiche</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Quelqu'un affirme être propriétaire d'une fiche garage pré-créée et demande à l'activer.</p>

    ${infoCard(`
      ${row("Garage", `${esc(params.garageName)} — ${esc(params.garageCity)}`)}
      ${row("Nom du demandeur", esc(params.requesterName))}
      ${row("Rôle", esc(params.requesterRole))}
      ${row("Téléphone", esc(params.requesterPhone))}
      ${row("Courriel", esc(params.requesterEmail))}
      ${row("NEQ", params.neq ? `<span style="font-family:monospace">${esc(params.neq)}</span>` : "Non fourni", true)}
    `)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Vérifiez l'identité du demandeur (NEQ au Registre des entreprises, pièce justificative demandée par courriel), puis approuvez ou refusez depuis le tableau de bord admin :</p>
    ${primaryBtn(adminUrl, "Ouvrir le tableau de bord admin")}
  `;

  await send(ADMIN_EMAIL, `Réclamation de fiche — ${params.garageName}`, body);
}

export interface ClaimDecisionParams {
  requesterEmail: string;
  requesterName:  string;
  garageName:     string;
  approved:       boolean;
  setPasswordUrl?: string;
  resetCode?:      string;
}

export async function sendClaimDecision(params: ClaimDecisionParams) {
  if (!canSend()) return;

  const body = params.approved
    ? `
      ${iconBadge("check")}
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0b1f3a">Votre fiche est activée</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Bonjour ${esc(params.requesterName)},<br><br>
        Votre demande pour <strong>${esc(params.garageName)}</strong> a été approuvée. Votre essai gratuit de 30 jours commence maintenant.
      </p>
      ${params.resetCode ? `
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Pour créer votre mot de passe, utilisez le code ci-dessous sur la page qui s'ouvrira :<br>
        <strong style="font-size:20px;letter-spacing:2px;color:#0b1f3a">${esc(params.resetCode)}</strong>
      </p>` : ""}
      ${params.setPasswordUrl ? primaryBtn(params.setPasswordUrl, "Créer mon mot de passe") : ""}`
    : `
      ${iconBadge("warning")}
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0b1f3a">Demande refusée</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Bonjour ${esc(params.requesterName)},<br><br>
        Nous n'avons pas pu confirmer que vous êtes le propriétaire de <strong>${esc(params.garageName)}</strong> à partir des informations fournies.<br><br>
        Pour résoudre la situation, contactez notre équipe à <a href="mailto:${ADMIN_EMAIL}" style="color:#f97316">${ADMIN_EMAIL}</a>.
      </p>`;

  const subject = params.approved
    ? `Votre fiche ${params.garageName} est activée — Garago`
    : `Demande de réclamation refusée — Garago`;

  await send(params.requesterEmail, subject, body);
}


// ─── Confirmation des rendez-vous : demande, relance, libération ─────────────

export interface ConfirmationRequestParams extends AppointmentDetails {
  to:           string;
  customerName: string;
  garagePhone:  string;
  confirmUrl:   string;
  cancelUrl:    string;
  /** Échéance déjà formatée, ex. « jeudi 8 octobre à 20 h 00 ». */
  deadline:     string;
  variant:      "request" | "nudge";
}

export async function sendConfirmationRequest(params: ConfirmationRequestParams) {
  if (!canSend()) return;
  const nudge = params.variant === "nudge";

  const body = `
    ${iconBadge("calendar")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">${nudge ? "Dernier rappel : confirmez votre rendez-vous" : "Confirmez votre rendez-vous"}</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${esc(params.customerName)}, ${nudge ? "nous n'avons pas encore reçu votre confirmation." : "votre rendez-vous approche. Un clic suffit pour le garder."}</p>

    ${appointmentCard(params)}

    ${confirmCancelBtns(params.confirmUrl, params.cancelUrl)}

    <div style="background:#fdf1d8;border-radius:5px;padding:12px 16px;margin:0 0 20px">
      <p style="margin:0;color:#7a3d00;font-size:13px;font-weight:700">Sans réponse avant ${esc(params.deadline)}, ce créneau sera remis à disposition des autres conducteurs.</p>
    </div>

    <p style="margin:0 0 12px;color:#374151;font-size:14px">Un empêchement ? Utilisez « J'annule ma réservation » : un autre conducteur pourra prendre votre place.</p>
    ${phoneBtn(params.garagePhone)}
  `;

  await send(
    params.to,
    `${nudge ? "Dernier rappel — confirmez" : "Confirmez"} votre rendez-vous — ${params.garageName}, ${fmtDateFr(params.date)} à ${params.startTime}`,
    body,
  );
}

export interface SlotReleasedParams extends AppointmentDetails {
  to:           string;
  customerName: string;
  garagePhone:  string;
  /** Page où le client peut reprendre le créneau s'il est encore libre. */
  retakeUrl:    string;
}

export async function sendSlotReleased(params: SlotReleasedParams) {
  if (!canSend()) return;

  const body = `
    ${iconBadge("warning")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Votre créneau a été libéré</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${esc(params.customerName)}, nous n'avons pas reçu votre confirmation : ce créneau est remis à disposition des autres conducteurs.</p>

    ${appointmentCard(params)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Toujours intéressé ? Si le créneau est encore libre, vous pouvez le reprendre en un clic.</p>
    <p style="margin:0 0 20px">${primaryBtn(params.retakeUrl, "Reprendre ce créneau")}</p>
    ${phoneBtn(params.garagePhone)}
  `;

  await send(params.to, `Votre créneau a été libéré — ${params.garageName}`, body);
}

export interface ArrivalReminderParams extends AppointmentDetails {
  to:           string;
  customerName: string;
  garagePhone:  string;
  confirmUrl:   string;
}

export async function sendArrivalReminder(params: ArrivalReminderParams) {
  if (!canSend()) return;

  const body = `
    ${iconBadge("calendar")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Vous arrivez ?</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Bonjour ${esc(params.customerName)}, votre rendez-vous a lieu dans environ 2 heures.</p>

    ${appointmentCard(params)}

    <p style="margin:0 0 16px;color:#374151;font-size:14px">Un imprévu ? Prévenez le garage en annulant ici, pour qu'un autre conducteur profite du créneau.</p>
    <p style="margin:0 0 20px">${secondaryBtn(params.confirmUrl, "Voir ou annuler mon rendez-vous")}</p>
    ${phoneBtn(params.garagePhone)}
  `;

  await send(params.to, `Vous arrivez ? — ${params.garageName} à ${params.startTime}`, body);
}

export interface GarageSlotReleasedParams {
  to:           string;
  garageName:   string;
  customerName: string;
  date:         string;
  startTime:    string;
  serviceName:  string | null;
}

export async function sendGarageSlotReleased(params: GarageSlotReleasedParams) {
  if (!canSend()) return;

  const body = `
    ${iconBadge("bell")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Un créneau a été libéré</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Le client n'a pas confirmé son rendez-vous : le créneau est de nouveau disponible pour les réservations en ligne.</p>

    ${infoCard(`
      ${row("Client", esc(params.customerName))}
      ${params.serviceName ? row("Service", esc(params.serviceName)) : ""}
      ${row("Date", fmtDateFr(params.date))}
      ${row("Heure", esc(params.startTime), true)}
    `)}

    ${primaryBtn(`${BASE_URL}/tableau-de-bord/garage/agenda`, "Ouvrir mon agenda")}
  `;

  await send(params.to, `Créneau libéré — ${params.customerName}, ${fmtDateFr(params.date)} à ${params.startTime}`, body);
}

// ─── Rendez-vous saisis par le garage : confirmation demandée au client ───────

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmtDateLang(dateStr: string, lang: "fr" | "en"): string {
  if (lang === "fr") return fmtDateFr(dateStr);
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${MONTHS_EN[m - 1]} ${d}, ${y}`;
}

export interface ManualConfirmationRequestParams extends AppointmentDetails {
  to:           string;
  lang:         "fr" | "en";
  customerName: string;
  garagePhone:  string;
  confirmUrl:   string;
  cancelUrl:    string;
}

/**
 * Courriel envoyé 48 h avant un rendez-vous pris au téléphone. Il part au nom du
 * garage (le client ne connaît pas Garago) et ne menace jamais de libérer le
 * créneau : sans réponse, c'est le garage qui appelle.
 */
export async function sendManualConfirmationRequest(params: ManualConfirmationRequestParams) {
  if (!canSend()) throw new Error("Courriel non configuré (RESEND_API_KEY absente)");
  const en = params.lang === "en";

  const card = infoCard(`
    ${params.serviceName ? row("Service", esc(params.serviceName)) : ""}
    ${row("Date", fmtDateLang(params.date, params.lang))}
    ${row(en ? "Time" : "Heure", esc(params.startTime))}
    ${row("Garage", esc(params.garageName))}
    ${row(en ? "Address" : "Adresse", esc(params.garageAddress), true)}
  `);

  const body = `
    ${iconBadge("calendar")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">${en ? "Please confirm your appointment" : "Confirmez votre rendez-vous"}</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">${en
      ? `Hello ${esc(params.customerName)}, your appointment at ${esc(params.garageName)} is coming up. One click lets us know you will be there.`
      : `Bonjour ${esc(params.customerName)}, votre rendez-vous chez ${esc(params.garageName)} approche. Un clic suffit pour nous dire que vous serez là.`}</p>

    ${card}

    ${en
      ? confirmCancelBtns(params.confirmUrl, params.cancelUrl, "I confirm", "I need to cancel")
      : confirmCancelBtns(params.confirmUrl, params.cancelUrl, "Je confirme", "Je dois annuler")}

    <p style="margin:0 0 12px;color:#374151;font-size:14px">${en ? "Need another time? Call the garage:" : "Besoin d'un autre moment ? Appelez le garage :"}</p>
    ${phoneBtn(params.garagePhone)}
  `;

  await send(
    params.to,
    en
      ? `Please confirm your appointment — ${params.garageName}, ${fmtDateLang(params.date, "en")} at ${params.startTime}`
      : `Confirmez votre rendez-vous — ${params.garageName}, ${fmtDateFr(params.date)} à ${params.startTime}`,
    body,
    params.garageName,
  );
}

export interface GarageNoResponseParams {
  to:            string;
  customerName:  string;
  customerPhone: string;
  date:          string;
  startTime:     string;
  serviceName:   string | null;
  /** Le message n'a pas pu partir (numéro invalide, ligne fixe, adresse refusée). */
  undelivered?:  boolean;
}

/** Le client n'a pas répondu à la demande de confirmation : le garage doit l'appeler. Le créneau reste réservé. */
export async function sendGarageNoResponse(params: GarageNoResponseParams) {
  if (!canSend()) return;

  const body = `
    ${iconBadge("bell")}
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800">Client à appeler : rendez-vous non confirmé</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">${params.undelivered
      ? "Le message de confirmation n'a pas pu être remis à ce client (numéro ou adresse invalide)."
      : "Ce client n'a pas répondu à la demande de confirmation."} Le rendez-vous reste à votre agenda : un appel suffit pour vérifier qu'il vient.</p>

    ${infoCard(`
      ${row("Client", esc(params.customerName))}
      ${row("Téléphone", `<a href="${telHref(params.customerPhone)}" style="color:#f97316">${esc(params.customerPhone)}</a>`)}
      ${params.serviceName ? row("Service", esc(params.serviceName)) : ""}
      ${row("Date", fmtDateFr(params.date))}
      ${row("Heure", esc(params.startTime), true)}
    `)}

    <p style="margin:0 0 20px">${phoneBtn(params.customerPhone)}</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px">Après l'appel, indiquez dans l'agenda « Confirmé par téléphone » ou annulez le rendez-vous.</p>
    ${primaryBtn(`${BASE_URL}/tableau-de-bord/garage/agenda`, "Ouvrir mon agenda")}
  `;

  await send(params.to, `À appeler — ${params.customerName}, ${fmtDateFr(params.date)} à ${params.startTime}`, body);
}
