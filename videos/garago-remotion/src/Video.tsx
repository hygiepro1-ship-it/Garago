import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/PublicSans";
import { Soundtrack } from "./Soundtrack";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

export const FPS = 30;
export const DURATION = 51 * FPS;

// Couleurs de Garago
export const NAVY = "#0b1f3a";
export const NAVY_DEEP = "#071428";
export const ORANGE = "#f97316";
export const MIST = "#c3cfe2";
export const INK = "#111827";
export const GREY = "#4b5563";
export const LINE = "#e2e5ea";
export const GREEN = "#16a34a";

// Version anglaise : chaque texte français affiché a sa traduction ici.
export const EN: Record<string, string> = {
  "Prendre rendez-vous": "Book an appointment",
  "1. Service": "1. Service",
  "2. Date": "2. Date",
  "3. Horaire": "3. Time",
  "4. Infos": "4. Info",
  "Vidange d'huile": "Oil change",
  "Freins": "Brakes",
  "Pneus d'hiver": "Winter tires",
  "Quel service souhaitez-vous ?": "Which service do you need?",
  "1 prestation, durée estimée 1 h 30": "1 service, estimated time 1 h 30",
  "Continuer": "Continue",
  "Octobre 2026": "October 2026",
  "Jeudi 15 octobre": "Thursday, October 15",
  "jeudi 15 octobre": "Thursday, October 15",
  " à ": " at ",
  "Nom complet *": "Full name *",
  "Téléphone *": "Phone *",
  "Courriel": "Email",
  "Véhicule": "Vehicle",
  "paul.gagnon@exemple.com": "paul.gagnon@example.com",
  "Confirmer le rendez-vous": "Confirm the appointment",
  "Demande envoyée !": "Request sent!",
  "Une confirmation a été envoyée à paul.gagnon@exemple.com": "A confirmation was sent to paul.gagnon@example.com",
  "maintenant": "now",
  "Confirmez votre rendez-vous de jeudi": "Please confirm Thursday's appointment",
  "à Paul Gagnon, mardi 8 h 00": "to Paul Gagnon, Tuesday 8:00 AM",
  "Confirmez votre rendez-vous": "Please confirm your appointment",
  "Bonjour Paul, votre rendez-vous est dans deux jours. Venez-vous toujours ?": "Hi Paul, your appointment is in two days. Are you still coming?",
  "Jeudi 15 octobre à 8 h 00": "Thursday, October 15 at 8:00 AM",
  "Freins, 2019 Chevrolet Silverado": "Brakes, 2019 Chevrolet Silverado",
  "Je confirme": "I confirm",
  "Je dois annuler": "I need to cancel",
  "Rendez-vous confirmé": "Appointment confirmed",
  "Garage Lafleur vous attend.": "Garage Lafleur is expecting you.",
  "Lundi, 21 h 40": "Monday, 9:40 PM",
  "Mardi, 8 h 00": "Tuesday, 8:00 AM",
  "48 h avant le rendez-vous": "48 h before the appointment",
  "Agenda": "Calendar",
  "Vidange d'huile, 2021 Honda Civic": "Oil change, 2021 Honda Civic",
  "Réservé en ligne": "Booked online",
  "Courriel envoyé, en attente de sa réponse": "Email sent, waiting for his reply",
  "Confirmé par le client": "Confirmed by the customer",
  "Service": "Service",
  "Date": "Date",
  "Horaire": "Time",
  "Coordonnées": "Details",
  "Confirmation": "Confirmation",
  "Moins d'une minute": "Under a minute",
  "Réservation en cours": "Booking in progress",
  "Ce que ça change pour votre garage": "What it changes for your garage",
  "pour réserver, à toute heure, sans un seul appel.": "to book, at any hour, without a single call.",
  "Moins de rendez‑vous manqués": "Fewer missed appointments",
  "Chaque client confirme 48 h avant de venir.": "Every customer confirms 48 h before coming in.",
  "Fini les rendez-vous pris au téléphone.": "No more appointments booked over the phone.",
  "Comment un client réserve en ligne chez vous, jusqu'à sa confirmation.": "How a customer books online with you, all the way to confirmation.",
  "Avec Garago, vos rendez-vous ne tombent plus à l'eau.": "With Garago, your appointments no longer fall through.",
  "Étape 1 sur 5": "Step 1 of 5",
  "Étape 2 sur 5": "Step 2 of 5",
  "Étape 3 sur 5": "Step 3 of 5",
  "Étape 4 sur 5": "Step 4 of 5",
  "Étape 5 sur 5": "Step 5 of 5",
  "Il choisit son service": "He picks his service",
  "Lundi soir, votre garage est fermé. Paul ouvre votre fiche sur Garago.": "Monday night, your garage is closed. Paul opens your page on Garago.",
  "Il choisit le jour": "He picks the day",
  "Le calendrier du mois, sans attendre l'ouverture du garage.": "The month's calendar, without waiting for you to open.",
  "Il choisit l'heure": "He picks the time",
  "Seules vos heures libres apparaissent, selon la durée du service.": "Only your open slots show up, based on how long the service takes.",
  "Il laisse ses coordonnées": "He leaves his details",
  "Son nom, son numéro, son courriel et son véhicule.": "His name, number, email and vehicle.",
  "Réservé": "Booked",
  "Réservé en moins d'une minute": "Booked in under a minute",
  "C'est dans votre agenda. Le téléphone n'a pas sonné.": "It's in your calendar. The phone never rang.",
  "48 h avant, il confirme": "48 h before, he confirms",
  "Garago lui écrit pour vous : vient-il toujours ?": "Garago writes to him for you: is he still coming?",
  "Confirmé": "Confirmed",
  "Vous savez qui vient": "You know who's coming",
  "Le rendez-vous passe au vert dans votre agenda.": "The appointment turns green in your calendar.",
  "le jour": "the day",
  "l'heure": "the time",
  "le client": "the customer",
};

export type Lang = "fr" | "en";
export const LangCtx = React.createContext<Lang>("fr");
export const useLang = () => React.use(LangCtx);
/** Texte dans la langue de la vidéo. */
export const tr = (fr: string) => (React.use(LangCtx) === "en" ? EN[fr] ?? fr : fr);

export const s = (sec: number) => Math.round(sec * FPS);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.out(Easing.cubic);

/** 0 → 1 à partir de `from` (secondes). */
export const ramp = (frame: number, from: number, dur = 0.4) =>
  interpolate(frame, [s(from), s(from + dur)], [0, 1], { ...clamp, easing: ease });

export const pop = (frame: number, from: number, damping = 13) =>
  frame < s(from) ? 0 : spring({ frame: frame - s(from), fps: FPS, config: { damping, stiffness: 150, mass: 0.8 } });

// Moments clés (secondes)
export const T = {
  stageIn: 3.6,
  svc: 3.6, tapSvc: 5.2, tapNext: 7.4,
  date: 8.4, tapDay: 10.2,
  slot: 12.2, tapSlot: 13.9,
  info: 16, tapSend: 21.0,
  sent: 22, block: 23.0,
  notif: 27.4, tapNotif: 28.3,
  mail: 28.7, tapOk: 34.3,
  ok: 34.9,
  stageOut: 38.6,
  outro: 39, // fin de la scène
  recap: 39,
  end: 46,
};

// ─────────────────────────────────────────────────────────── éléments communs

const Tap: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const t = (frame - s(at)) / FPS;
  if (t < 0 || t > 0.75) return null;
  const scale = interpolate(t, [0, 0.25, 0.75], [1.9, 1, 0.7], clamp);
  const opacity = interpolate(t, [0, 0.18, 0.45, 0.75], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 76, height: 76, marginLeft: -38, marginTop: -38,
      borderRadius: 38, background: "rgba(11,31,58,.22)", border: "3px solid rgba(11,31,58,.6)", transform: `scale(${scale})`, opacity, zIndex: 5 }} />
  );
};

/** Légère pression d'un bouton au moment où on le touche. */
const usePress = (at: number) => {
  const frame = useCurrentFrame();
  const t = (frame - s(at)) / FPS;
  return interpolate(t, [0.15, 0.28, 0.5], [1, 0.955, 1], clamp);
};

const Screen: React.FC<{ from: number; to?: number; children: React.ReactNode; pad?: boolean }> = ({ from, to, children, pad = true }) => {
  const frame = useCurrentFrame();
  const a = ramp(frame, from, 0.38);
  const b = to === undefined ? 0 : ramp(frame, to - 0.28, 0.28);
  const opacity = a * (1 - b);
  if (opacity <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, padding: pad ? "58px 28px 28px" : 0, opacity, transform: `translateX(${(1 - a) * 56 - b * 56}px)` }}>
      {children}
    </div>
  );
};

const WidgetHead: React.FC<{ active: number }> = ({ active }) => (
  <>
    <div style={{ fontSize: 19, fontWeight: 700, color: GREY }}>{tr("Prendre rendez-vous")}</div>
    <div style={{ fontSize: 30, fontWeight: 800, color: NAVY, marginTop: 2 }}>Garage Lafleur</div>
    <div style={{ display: "flex", margin: "18px -28px 22px", borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
      {[tr("1. Service"), tr("2. Date"), tr("3. Horaire"), tr("4. Infos")].map((l, i) => (
        <div key={l} style={{ flex: 1, textAlign: "center", padding: "13px 0 10px", fontSize: 18, fontWeight: 700,
          color: i === active ? "#c2410c" : i < active ? GREY : "#9ca3af", borderBottom: `4px solid ${i === active ? ORANGE : "transparent"}` }}>{l}</div>
      ))}
    </div>
  </>
);

const Button: React.FC<{ label: string; tapAt?: number; color?: string; text?: string; outline?: boolean }> = ({ label, tapAt, color = ORANGE, text = "#1c0a00", outline }) => {
  const press = usePress(tapAt ?? -100);
  return (
    <div style={{ position: "relative", marginTop: 16, padding: "18px 0", borderRadius: 12, textAlign: "center", fontSize: 24, fontWeight: 800,
      background: outline ? "#fff" : color, color: outline ? GREY : text, border: outline ? `2px solid ${LINE}` : "none", transform: `scale(${press})` }}>
      {label}
      {tapAt !== undefined && <Tap at={tapAt} />}
    </div>
  );
};

const BigCheck: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const k = pop(frame, at, 9);
  const draw = ramp(frame, at + 0.12, 0.35);
  return (
    <div style={{ width: 132, height: 132, borderRadius: 66, background: "#e7f8ee", margin: "120px auto 34px", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${k})` }}>
      <svg width="74" height="74" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" strokeDasharray="24" strokeDashoffset={24 * (1 - draw)} />
      </svg>
    </div>
  );
};

// ───────────────────────────────────────────────────────── écrans du téléphone

export const ServiceScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const on = ramp(frame, T.tapSvc + 0.25, 0.18);
  const rows: [string, string][] = [[tr("Vidange d'huile"), "~30 min"], [tr("Freins"), "~90 min"], [tr("Pneus d'hiver"), "~60 min"]];
  return (
    <Screen from={T.svc} to={T.date}>
      <WidgetHead active={0} />
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{tr("Quel service souhaitez-vous ?")}</div>
      {rows.map(([name, dur], i) => {
        const sel = i === 1 ? on : 0;
        return (
          <div key={name} style={{ position: "relative", display: "flex", alignItems: "center", gap: 14, padding: "17px 16px", marginBottom: 12, borderRadius: 14, fontSize: 24, fontWeight: 600,
            border: `2px solid ${interpolateColors(sel, [0, 1], [LINE, "#fb923c"])}`, background: interpolateColors(sel, [0, 1], ["#ffffff", "#fff7ed"]) }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, border: `2px solid ${interpolateColors(sel, [0, 1], ["#9ca3af", ORANGE])}`, background: interpolateColors(sel, [0, 1], ["#ffffff", ORANGE]),
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: sel }}><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            {name}
            <span style={{ marginLeft: "auto", fontSize: 18, fontWeight: 500, color: GREY }}>{dur}</span>
            {i === 1 && <Tap at={T.tapSvc} />}
          </div>
        );
      })}
      <div style={{ opacity: on, transform: `translateY(${(1 - on) * 14}px)` }}>
        <div style={{ fontSize: 18, color: GREY, marginTop: 6 }}>{tr("1 prestation, durée estimée 1 h 30")}</div>
        <Button label={tr("Continuer")} tapAt={T.tapNext} />
      </div>
    </Screen>
  );
};

export const DateScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const on = ramp(frame, T.tapDay + 0.25, 0.18);
  const cells: (number | null)[] = [null, null, null, ...Array.from({ length: 31 }, (_, i) => i + 1)]; // le 1er octobre 2026 est un jeudi
  return (
    <Screen from={T.date} to={T.slot}>
      <WidgetHead active={1} />
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 14 }}>{tr("Octobre 2026")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center" }}>
        {(useLang() === "en" ? ["M", "T", "W", "T", "F", "S", "S"] : ["L", "M", "M", "J", "V", "S", "D"]).map((d, i) => <div key={i} style={{ fontSize: 17, fontWeight: 700, color: "#6b7280", paddingBottom: 6 }}>{d}</div>)}
        {cells.map((d, i) => {
          const sel = d === 15 ? on : 0;
          const closed = i % 7 === 6;
          return (
            <div key={i} style={{ position: "relative", padding: "12px 0", borderRadius: 10, fontSize: 23, fontWeight: d !== null && d >= 12 && !closed ? 700 : 400,
              color: sel > 0.5 ? "#fff" : d !== null && d >= 12 && !closed ? INK : "#b6bcc6", background: interpolateColors(sel, [0, 1], ["rgba(255,255,255,0)", NAVY]),
              outline: d === 12 ? `2px solid ${ORANGE}` : "none", outlineOffset: -2 }}>
              {d ?? ""}
              {d === 15 && <Tap at={T.tapDay} />}
            </div>
          );
        })}
      </div>
    </Screen>
  );
};

export const SlotScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const on = ramp(frame, T.tapSlot + 0.25, 0.18);
  const slots = ["08:00", "08:30", "09:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];
  return (
    <Screen from={T.slot} to={T.info}>
      <WidgetHead active={2} />
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 14 }}>{tr("Jeudi 15 octobre")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {slots.map((t, i) => {
          const sel = i === 0 ? on : 0;
          const enter = ramp(frame, T.slot + 0.25 + i * 0.035, 0.3);
          return (
            <div key={t} style={{ position: "relative", padding: "15px 0", borderRadius: 12, textAlign: "center", fontSize: 23, fontWeight: 700, opacity: enter, transform: `translateY(${(1 - enter) * 12}px)`,
              border: `2px solid ${interpolateColors(sel, [0, 1], [LINE, NAVY])}`, background: interpolateColors(sel, [0, 1], ["#ffffff", NAVY]), color: sel > 0.5 ? "#fff" : INK }}>
              {t}
              {i === 0 && <Tap at={T.tapSlot} />}
            </div>
          );
        })}
      </div>
    </Screen>
  );
};

const Field: React.FC<{ label: string; value: string; from: number; dur: number }> = ({ label, value, from, dur }) => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [s(from), s(from + dur)], [0, value.length], clamp));
  const typing = frame >= s(from) && frame < s(from + dur + 0.25);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: GREY, marginBottom: 4 }}>{label}</div>
      <div style={{ height: 54, borderRadius: 12, border: `2px solid ${typing ? ORANGE : LINE}`, background: "#fff", padding: "0 14px", fontSize: 23, lineHeight: "50px", whiteSpace: "nowrap" }}>
        {value.slice(0, n)}
        {typing && <span style={{ display: "inline-block", width: 2, height: 26, background: INK, marginLeft: 2, verticalAlign: "middle" }} />}
      </div>
    </div>
  );
};

export const InfoScreen: React.FC = () => (
  <Screen from={T.info} to={T.sent}>
    <WidgetHead active={3} />
    <Field label={tr("Nom complet *")} value="Paul Gagnon" from={16.6} dur={0.8} />
    <Field label={tr("Téléphone *")} value="514 555-0142" from={17.65} dur={0.8} />
    <Field label={tr("Courriel")} value={tr("paul.gagnon@exemple.com")} from={18.7} dur={1.0} />
    <Field label={tr("Véhicule")} value="2019 Chevrolet Silverado" from={19.95} dur={0.5} />
    <Button label={tr("Confirmer le rendez-vous")} tapAt={T.tapSend} />
  </Screen>
);

export const SentScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ramp(frame, T.sent + 0.45);
  const b = ramp(frame, T.sent + 0.65);
  return (
    <Screen from={T.sent} to={T.mail}>
      <BigCheck at={T.sent + 0.2} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: NAVY, opacity: a, transform: `translateY(${(1 - a) * 16}px)` }}>{tr("Demande envoyée !")}</div>
        <div style={{ fontSize: 24, color: GREY, marginTop: 14, opacity: b }}><b style={{ color: INK }}>{tr("jeudi 15 octobre")}</b>{tr(" à ")}<b style={{ color: INK }}>08:00</b></div>
        <div style={{ fontSize: 20, color: GREY, marginTop: 18, lineHeight: 1.4, opacity: b }}>{tr("Une confirmation a été envoyée à paul.gagnon@exemple.com")}</div>
      </div>
    </Screen>
  );
};

export const Notification: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < s(T.notif) || frame > s(T.mail + 0.3)) return null;
  const k = pop(frame, T.notif, 15);
  const out = ramp(frame, T.mail - 0.1, 0.3);
  const press = interpolate((frame - s(T.tapNotif)) / FPS, [0.15, 0.28, 0.5], [1, 0.96, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 16, right: 16, top: 52, borderRadius: 22, background: "#f1f3f6", boxShadow: "0 18px 50px rgba(11,31,58,.28)", padding: "18px 20px",
      transform: `translateY(${(1 - k) * -220}px) scale(${press})`, opacity: 1 - out, zIndex: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, color: GREY, fontWeight: 600 }}><span>{tr("Courriel")}</span><span>{tr("maintenant")}</span></div>
      <div style={{ fontSize: 23, fontWeight: 800, color: INK, marginTop: 4 }}>Garage Lafleur</div>
      <div style={{ fontSize: 21, color: GREY, marginTop: 2 }}>{tr("Confirmez votre rendez-vous de jeudi")}</div>
      <Tap at={T.tapNotif} />
    </div>
  );
};

export const MailScreen: React.FC = () => (
  <Screen from={T.mail} to={T.ok}>
    <div style={{ paddingBottom: 14, borderBottom: `1px solid ${LINE}`, marginBottom: 20 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: INK }}>Garage Lafleur</div>
      <div style={{ fontSize: 18, color: GREY }}>{tr("à Paul Gagnon, mardi 8 h 00")}</div>
    </div>
    <div style={{ fontSize: 30, fontWeight: 800, color: INK, lineHeight: 1.15 }}>{tr("Confirmez votre rendez-vous")}</div>
    <div style={{ fontSize: 22, color: GREY, marginTop: 12, lineHeight: 1.4 }}>{tr("Bonjour Paul, votre rendez-vous est dans deux jours. Venez-vous toujours ?")}</div>
    <div style={{ border: `2px solid ${LINE}`, borderRadius: 14, padding: "16px 18px", marginTop: 20, marginBottom: 10 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: INK }}>{tr("Jeudi 15 octobre à 8 h 00")}</div>
      <div style={{ fontSize: 21, color: GREY, marginTop: 4 }}>{tr("Freins, 2019 Chevrolet Silverado")}</div>
    </div>
    <Button label={tr("Je confirme")} tapAt={T.tapOk} color={GREEN} text="#fff" />
    <Button label={tr("Je dois annuler")} outline />
  </Screen>
);

export const OkScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ramp(frame, T.ok + 0.45);
  return (
    <Screen from={T.ok}>
      <BigCheck at={T.ok + 0.2} />
      <div style={{ textAlign: "center", opacity: a, transform: `translateY(${(1 - a) * 16}px)` }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: NAVY }}>{tr("Rendez-vous confirmé")}</div>
        <div style={{ fontSize: 24, color: GREY, marginTop: 14 }}>{tr("Jeudi 15 octobre à 8 h 00")}</div>
        <div style={{ fontSize: 22, color: GREY, marginTop: 8 }}>{tr("Garage Lafleur vous attend.")}</div>
      </div>
    </Screen>
  );
};

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const k = pop(frame, T.stageIn, 16);
  const dim = ramp(frame, T.notif, 0.3) * (1 - ramp(frame, T.mail - 0.1, 0.2));
  return (
    <div style={{ position: "absolute", left: 210, top: 62, width: 504, height: 956, borderRadius: 64, background: "#16294a", padding: 12,
      boxShadow: "0 50px 120px rgba(0,0,0,.5), inset 0 0 0 2px rgba(255,255,255,.08)", transform: `translateY(${(1 - k) * 160}px) rotate(${(1 - k) * -4}deg)`, opacity: Math.min(1, k * 2) }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 52, background: "#fdfdfb", overflow: "hidden", color: INK }}>
        <ServiceScreen />
        <DateScreen />
        <SlotScreen />
        <InfoScreen />
        <SentScreen />
        <MailScreen />
        <OkScreen />
        <div style={{ position: "absolute", inset: 0, background: "rgba(11,31,58,.18)", opacity: dim }} />
        <Notification />
        <div style={{ position: "absolute", left: "50%", top: 14, width: 120, height: 26, marginLeft: -60, borderRadius: 13, background: "#16294a" }} />
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────── colonne de droite

type Beat = { from: number; to: number; step: string; title: string; text: string };
export const BEATS: Beat[] = [
  { from: T.svc, to: T.date, step: "Étape 1 sur 5", title: "Il choisit son service", text: "Lundi soir, votre garage est fermé. Paul ouvre votre fiche sur Garago." },
  { from: T.date, to: T.slot, step: "Étape 2 sur 5", title: "Il choisit le jour", text: "Le calendrier du mois, sans attendre l'ouverture du garage." },
  { from: T.slot, to: T.info, step: "Étape 3 sur 5", title: "Il choisit l'heure", text: "Seules vos heures libres apparaissent, selon la durée du service." },
  { from: T.info, to: T.sent, step: "Étape 4 sur 5", title: "Il laisse ses coordonnées", text: "Son nom, son numéro, son courriel et son véhicule." },
  { from: T.sent, to: T.notif - 0.2, step: "Réservé", title: "Réservé en moins d'une minute", text: "C'est dans votre agenda. Le téléphone n'a pas sonné." },
  { from: T.notif - 0.2, to: T.ok, step: "Étape 5 sur 5", title: "48 h avant, il confirme", text: "Garago lui écrit pour vous : vient-il toujours ?" },
  { from: T.ok, to: 100, step: "Confirmé", title: "Vous savez qui vient", text: "Le rendez-vous passe au vert dans votre agenda." },
];

export const BeatText: React.FC<{ beat: Beat }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const out = ramp(frame, beat.to - 0.3, 0.3);
  if (frame < s(beat.from) || out >= 1) return null;
  const line = (delay: number) => {
    const a = ramp(frame, beat.from + delay, 0.45);
    return { opacity: a * (1 - out), transform: `translateY(${(1 - a) * 34 - out * 22}px)` };
  };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 920 }}>
      <div style={{ ...line(0.05), display: "inline-block", fontSize: 28, fontWeight: 800, color: "#1c0a00", background: ORANGE, padding: "8px 20px", borderRadius: 999 }}>{tr(beat.step)}</div>
      <div style={{ ...line(0.13), fontSize: 88, fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.025em", color: "#fff", marginTop: 26 }}>{tr(beat.title)}</div>
      <div style={{ ...line(0.22), fontSize: 38, lineHeight: 1.32, color: MIST, marginTop: 24, maxWidth: 820 }}>{tr(beat.text)}</div>
    </div>
  );
};

export const Clock: React.FC = () => {
  const frame = useCurrentFrame();
  const flip = ramp(frame, T.notif - 0.2, 0.45);
  const a = ramp(frame, T.stageIn + 0.3);
  const chip = pop(frame, T.notif + 0.15);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, height: 60, width: 920, opacity: a }}>
      <div style={{ position: "absolute", fontSize: 34, fontWeight: 700, color: "#fff", opacity: 1 - flip, transform: `translateY(${flip * -26}px)` }}>{tr("Lundi, 21 h 40")}</div>
      <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 18, opacity: flip, transform: `translateY(${(1 - flip) * 26}px)` }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: "#fff" }}>{tr("Mardi, 8 h 00")}</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: "#ffb37a", border: "2px solid rgba(249,115,22,.7)", borderRadius: 999, padding: "5px 16px", transform: `scale(${chip})` }}>{tr("48 h avant le rendez-vous")}</span>
      </div>
    </div>
  );
};

const Agenda: React.FC = () => {
  const frame = useCurrentFrame();
  const a = pop(frame, T.sent + 0.35, 18);
  if (a <= 0) return null;
  const k = pop(frame, T.block, 11);
  const toWait = ramp(frame, T.mail + 0.3, 0.4);
  const toOk = ramp(frame, T.ok + 0.25, 0.4);
  const c = (grey: string, orange: string, green: string) => interpolateColors(toWait + toOk, [0, 1, 2], [grey, orange, green]);
  const bump = 1 + 0.035 * Math.sin(Math.PI * interpolate(frame, [s(T.ok + 0.3), s(T.ok + 0.85)], [0, 1], clamp));
  const ring = interpolate(frame, [s(T.ok + 0.3), s(T.ok + 1.2)], [0, 1], clamp);
  const pill = (label: string, opacity: number) => (
    <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap", fontSize: 21, fontWeight: 800, padding: "5px 16px", borderRadius: 999, background: "#fff", opacity }}>{label}</span>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 432, width: 920, height: 456, borderRadius: 22, background: "#fdfdfb", color: INK, padding: "24px 30px", overflow: "hidden",
      boxShadow: "0 40px 100px rgba(0,0,0,.4)", opacity: Math.min(1, a * 1.5), transform: `translateY(${(1 - a) * 90}px)` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, paddingBottom: 14, borderBottom: `2px solid ${LINE}` }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: NAVY }}>{tr("Agenda")}</span>
        <span style={{ fontSize: 22, color: GREY }}>{tr("Jeudi 15 octobre")}</span>
        <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 700, color: GREY }}>Garage Lafleur</span>
      </div>
      <div style={{ position: "relative", height: 340, marginTop: 6 }}>
        {["08:00", "09:00", "10:00", "11:00"].map((h, i) => (
          <div key={h} style={{ position: "absolute", left: 0, right: 0, top: i * 84, height: 2, background: "#eceef2" }}>
            <span style={{ position: "absolute", left: 0, top: 8, fontSize: 20, color: "#6b7280" }}>{h}</span>
          </div>
        ))}
        <div style={{ position: "absolute", left: 96, right: 0, top: 216, height: 76, borderRadius: 12, borderLeft: `10px solid ${GREEN}`, background: "#e9f9ef", color: "#14532d", padding: "10px 20px" }}>
          <div style={{ fontSize: 25, fontWeight: 800 }}>Luc Bouchard</div>
          <div style={{ fontSize: 20 }}>{tr("Vidange d'huile, 2021 Honda Civic")}</div>
        </div>
        <div style={{ position: "absolute", left: 96, right: 0, top: 4, height: 124, transform: `translateX(${(1 - k) * -60}px) scale(${(0.9 + 0.1 * k) * bump})`, opacity: Math.min(1, k * 1.6) }}>
          <div style={{ position: "absolute", inset: -6, borderRadius: 18, border: `4px solid ${GREEN}`, opacity: ring > 0 && ring < 1 ? 1 - ring : 0, transform: `scale(${1 + ring * 0.06})` }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: 12, borderLeft: `10px solid ${c("#64748b", ORANGE, GREEN)}`, background: c("#eef1f5", "#fff3e6", "#e9f9ef"), color: c("#1f2937", "#7c2d12", "#14532d"), padding: "10px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>Paul Gagnon</div>
            <div style={{ fontSize: 21, marginTop: 1 }}>{tr("Freins, 2019 Chevrolet Silverado")}</div>
            <div style={{ position: "relative", height: 36, marginTop: 6 }}>
              {pill(tr("Réservé en ligne"), 1 - toWait)}
              {pill(tr("Courriel envoyé, en attente de sa réponse"), toWait * (1 - toOk))}
              {pill(tr("Confirmé par le client"), toOk)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Rail: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ramp(frame, T.stageIn + 0.4);
  const done = [T.date, T.slot, T.info, T.sent, T.ok + 0.25];
  const starts = [T.svc, T.date, T.slot, T.info, T.notif];
  return (
    <div style={{ position: "absolute", left: 0, top: 916, width: 920, display: "flex", gap: 12, opacity: a }}>
      {[tr("Service"), tr("Date"), tr("Horaire"), tr("Coordonnées"), tr("Confirmation")].map((l, i) => {
        const fill = ramp(frame, done[i] - 0.1, 0.45);
        const active = frame >= s(starts[i]) && frame < s(done[i]);
        return (
          <div key={l} style={{ flex: 1 }}>
            <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,.16)", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(fill, active ? 0.14 : 0) * 100}%`, height: "100%", background: ORANGE, borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 21, fontWeight: active ? 800 : 600, color: active || fill > 0.5 ? "#fff" : "#93a3bd", marginTop: 10 }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Chronomètre : il tourne pendant que le client réserve, puis affiche le résultat. */
export const Stopwatch: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ramp(frame, T.svc + 0.6) * (1 - ramp(frame, T.notif - 0.5, 0.3));
  if (a <= 0) return null;
  const run = interpolate(frame, [s(T.svc + 0.6), s(T.sent)], [0, 1], clamp);
  const done = pop(frame, T.sent + 0.1, 10);
  const C = 2 * Math.PI * 21;
  return (
    <div style={{ position: "absolute", right: 0, top: -8, height: 64, display: "flex", alignItems: "center", gap: 14, opacity: a,
      padding: "0 22px 0 10px", borderRadius: 999, background: interpolateColors(done, [0, 1], ["rgba(255,255,255,.08)", ORANGE]), transform: `scale(${1 + 0.12 * Math.sin(Math.PI * Math.min(1, done))})`, transformOrigin: "right center" }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="28" r="21" fill="none" stroke={done > 0.5 ? "rgba(28,10,0,.25)" : "rgba(255,255,255,.22)"} strokeWidth="5" />
        <circle cx="26" cy="28" r="21" fill="none" stroke={done > 0.5 ? "#1c0a00" : ORANGE} strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - run * 0.8)} transform="rotate(-90 26 28)" />
        <rect x="22" y="1" width="8" height="5" rx="2" fill={done > 0.5 ? "#1c0a00" : "#fff"} />
        <line x1="26" y1="28" x2="26" y2="14" stroke={done > 0.5 ? "#1c0a00" : "#fff"} strokeWidth="4" strokeLinecap="round" transform={`rotate(${run * 288} 26 28)`} />
      </svg>
      <span style={{ fontSize: 26, fontWeight: 800, color: done > 0.5 ? "#1c0a00" : "#fff", whiteSpace: "nowrap" }}>{done > 0.5 ? tr("Moins d'une minute") : tr("Réservation en cours")}</span>
    </div>
  );
};

/** Le bilan : les deux bénéfices, côte à côte. `depth` incline les panneaux en perspective (version 3D). */
export const Recap: React.FC<{ depth?: boolean; second?: number }> = ({ depth, second = 2.3 }) => {
  const frame = useCurrentFrame();
  if (frame < s(T.recap) || frame >= s(T.end)) return null;
  const out = ramp(frame, T.end - 0.45, 0.45);
  const head = ramp(frame, T.recap + 0.15, 0.5);
  const C = 2 * Math.PI * 46;
  const panel = (index: number, at: number, icon: React.ReactNode, title: string, text: string) => {
    const k = pop(frame, at, 14);
    const side = index === 0 ? 1 : -1;
    const t = (frame - s(at)) / FPS;
    const float = depth ? Math.sin(t * 1.1 + index) * 1.5 : 0;
    return (
      <div style={{ flex: 1, borderRadius: 30, padding: "58px 56px", background: "rgba(255,255,255,.07)", border: "2px solid rgba(255,255,255,.16)", opacity: Math.min(1, k * 1.6),
        boxShadow: depth ? "0 50px 90px rgba(2,8,20,.5)" : "none",
        transform: depth ? `translateZ(${interpolate(k, [0, 1], [-500, 0])}px) rotateY(${side * (interpolate(k, [0, 1], [55, 9]) + float)}deg) rotateX(3deg)` : `translateY(${(1 - k) * 70}px)` }}>
        {icon}
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.03em", color: "#fff", marginTop: 40 }}>{title}</div>
        <div style={{ fontSize: 37, lineHeight: 1.32, color: MIST, marginTop: 22 }}>{text}</div>
      </div>
    );
  };
  const ring = ramp(frame, T.recap + 0.6, 1.1);
  const tick = ramp(frame, T.recap + second + 0.35, 0.45);
  return (
    <AbsoluteFill style={{ padding: "110px 130px 0", opacity: 1 - out }}>
      <div style={{ fontSize: 46, fontWeight: 700, color: MIST, opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>{tr("Ce que ça change pour votre garage")}</div>
      <div style={{ display: "flex", gap: 50, marginTop: 110, perspective: depth ? 2000 : undefined, transformStyle: "preserve-3d" }}>
        {panel(0, T.recap + 0.4,
          <svg width="130" height="130" viewBox="0 0 120 120">
            <circle cx="60" cy="66" r="46" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="10" />
            <circle cx="60" cy="66" r="46" fill="none" stroke={ORANGE} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ring * 0.8)} transform="rotate(-90 60 66)" />
            <rect x="50" y="4" width="20" height="12" rx="4" fill="#fff" />
            <line x1="60" y1="66" x2="60" y2="36" stroke="#fff" strokeWidth="9" strokeLinecap="round" transform={`rotate(${ring * 288} 60 66)`} />
          </svg>,
          tr("Moins d'une minute"), tr("pour réserver, à toute heure, sans un seul appel."))}
        {panel(1, T.recap + second,
          <svg width="130" height="130" viewBox="0 0 120 120" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="12" y="22" width="96" height="86" rx="14" stroke="#fff" strokeWidth="9" />
            <line x1="12" y1="48" x2="108" y2="48" stroke="#fff" strokeWidth="9" />
            <line x1="38" y1="10" x2="38" y2="30" stroke="#fff" strokeWidth="9" />
            <line x1="82" y1="10" x2="82" y2="30" stroke="#fff" strokeWidth="9" />
            <path d="M40 78l14 14 28-30" stroke={ORANGE} strokeWidth="11" strokeDasharray="64" strokeDashoffset={64 * (1 - tick)} />
          </svg>,
          tr("Moins de rendez‑vous manqués"), tr("Chaque client confirme 48 h avant de venir."))}
      </div>
    </AbsoluteFill>
  );
};

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < s(T.stageIn) || frame >= s(T.outro)) return null;
  const out = ramp(frame, T.stageOut, 0.4);
  // Le texte monte pour laisser la place à l'agenda quand la réservation est faite.
  const lift = interpolate(frame, [s(T.sent - 0.3), s(T.sent + 0.3)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <Phone />
      <div style={{ position: "absolute", left: 850, top: 62, width: 920, height: 956 }}>
        <Clock />
        <Stopwatch />
        <div style={{ position: "absolute", left: 0, top: interpolate(lift, [0, 1], [250, 92]), transform: `scale(${interpolate(lift, [0, 1], [1, 0.78])})`, transformOrigin: "left top" }}>
          {BEATS.map((b) => <BeatText key={b.title} beat={b} />)}
        </div>
        <Agenda />
        <Rail />
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────── ouverture et fin

const Words: React.FC<{ text: string; from: number; size: number }> = ({ text, from, size }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#fff", maxWidth: 1300 }}>
      {text.split(" ").map((w, i) => {
        const k = pop(frame, from + i * 0.09, 15);
        return <span key={i} style={{ display: "inline-block", marginRight: "0.26em", opacity: Math.min(1, k * 1.4), transform: `translateY(${(1 - k) * 60}px)` }}>{w}</span>;
      })}
    </div>
  );
};

const Card: React.FC<{ from: number; to: number; sub: string; url?: boolean }> = ({ from, to, sub, url }) => {
  const frame = useCurrentFrame();
  if (frame < s(from) || frame >= s(to)) return null;
  const out = url ? 0 : ramp(frame, to - 0.4, 0.4);
  const logo = pop(frame, from + 0.15, 16);
  const bar = ramp(frame, from + 0.45, 0.6);
  const a = ramp(frame, from + 1.45, 0.5);
  const b = pop(frame, from + 2.0, 13);
  return (
    <AbsoluteFill style={{ padding: "0 150px", justifyContent: "center", opacity: 1 - out }}>
      <Img src={staticFile("logo.webp")} style={{ width: 430, marginBottom: 54, marginLeft: -14, opacity: Math.min(1, logo * 1.5), transform: `translateY(${(1 - logo) * 30}px)` }} />
      <div style={{ width: 190, height: 10, background: ORANGE, marginBottom: 46, transform: `scaleX(${bar})`, transformOrigin: "left center" }} />
      <Words text={tr("Fini les rendez-vous pris au téléphone.")} from={from + 0.55} size={useLang() === "en" ? 104 : 118} />
      <div style={{ fontSize: 44, lineHeight: 1.3, color: MIST, marginTop: 40, maxWidth: 1250, opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>{tr(sub)}</div>
      {url && (
        <div style={{ marginTop: 46, alignSelf: "flex-start", fontSize: 40, fontWeight: 800, color: "#1c0a00", background: ORANGE, padding: "16px 38px", borderRadius: 14, transform: `scale(${b})`, transformOrigin: "left center" }}>garagopro.ca</div>
      )}
    </AbsoluteFill>
  );
};

export const ReservationEnLigne: React.FC<{ lang?: Lang }> = ({ lang = "fr" }) => {
  const frame = useCurrentFrame();
  // Lueur lente derrière le téléphone, pour que le fond ne soit jamais figé.
  const drift = Math.sin((frame / DURATION) * Math.PI * 2) * 4;
  return (
    <LangCtx.Provider value={lang}>
    <AbsoluteFill style={{ fontFamily, background: NAVY_DEEP }}>
      <AbsoluteFill style={{ background: `radial-gradient(1100px 900px at ${24 + drift}% 52%, #1a3b6b 0%, ${NAVY} 48%, ${NAVY_DEEP} 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(700px 500px at 96% 4%, rgba(249,115,22,.16), rgba(249,115,22,0) 70%)" }} />
      <Card from={0} to={T.stageIn} sub="Comment un client réserve en ligne chez vous, jusqu'à sa confirmation." />
      <Stage />
      <Recap />
      <Card from={T.end} to={51.1} sub="Avec Garago, vos rendez-vous ne tombent plus à l'eau." url />
      <Soundtrack lang={lang} />
    </AbsoluteFill>
    </LangCtx.Provider>
  );
};
