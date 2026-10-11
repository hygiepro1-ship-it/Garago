import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import {
  BEATS, BeatText, Clock, DateScreen, FPS, GREEN, GREY, INK, InfoScreen, LINE, MIST, MailScreen, NAVY, NAVY_DEEP, Notification,
  ORANGE, OkScreen, Rail, Recap, Stopwatch, LangCtx, tr, useLang, type Lang, SentScreen, ServiceScreen, SlotScreen, T, clamp, fontFamily, pop, ramp, s,
} from "./Video";
import { Soundtrack } from "./Soundtrack";

// Deuxième version : mêmes étapes, mises en scène en 3D (téléphone avec épaisseur qui pivote,
// fiches qui flottent devant lui, agenda incliné dont le rendez-vous se retourne).

const inOut = Easing.inOut(Easing.cubic);
const sec = (frame: number) => frame / FPS;
/** Petite impulsion 0 → 1 → 0 centrée sur `at`. */
const bell = (t: number, at: number, width = 0.7) => {
  const x = (t - (at - width / 2)) / width;
  return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 2;
};

// ─────────────────────────────────────────────────────────────── le décor

const Orbs: React.FC = () => {
  const t = sec(useCurrentFrame());
  const orb = (x: number, y: number, size: number, color: string, speed: number, phase: number) => (
    <div style={{ position: "absolute", left: x + Math.sin(t * speed + phase) * 40, top: y + Math.cos(t * speed * 0.8 + phase) * 30, width: size, height: size, borderRadius: size,
      background: `radial-gradient(circle at 35% 30%, ${color}, rgba(0,0,0,0) 70%)`, filter: "blur(6px)" }} />
  );
  return (
    <AbsoluteFill>
      {orb(1560, -160, 620, "rgba(249,115,22,.20)", 0.5, 0)}
      {orb(-160, 640, 560, "rgba(60,120,220,.28)", 0.4, 2)}
    </AbsoluteFill>
  );
};

// ───────────────────────────────────────────────────────────── le téléphone

const phoneAngle = (frame: number) => {
  const t = sec(frame);
  let ry = interpolate(t, [T.stageIn, T.stageIn + 1.4], [-78, 17], { ...clamp, easing: Easing.out(Easing.cubic) });
  for (const c of [T.date, T.slot, T.info]) ry -= 9 * bell(t, c, 0.8);
  ry += interpolate(t, [T.sent - 0.2, T.sent + 0.9], [0, -27], { ...clamp, easing: inOut });
  ry += interpolate(t, [T.notif - 1.0, T.notif + 0.3], [0, 360], { ...clamp, easing: inOut }); // tour complet : deux jours passent
  ry += 2.6 * Math.sin(t * 0.9);
  const rx = 6 + 1.8 * Math.sin(t * 0.7 + 1) - 4 * bell(t, T.ok + 0.2, 0.9);
  return { ry, rx };
};

type TileDef = { label: string; hint: string; at: number; x: number; y: number; z: number };
const TILES: TileDef[] = [
  { label: "Freins", hint: "1 h 30", at: T.tapSvc + 0.4, x: 392, y: 250, z: 170 },
  { label: "Jeudi 15 octobre", hint: "le jour", at: T.tapDay + 0.4, x: -245, y: 440, z: 230 },
  { label: "08:00", hint: "l'heure", at: T.tapSlot + 0.4, x: 410, y: 590, z: 130 },
  { label: "Paul Gagnon", hint: "le client", at: 19.3, x: -195, y: 740, z: 200 },
];

/** Chaque choix du client sort de l'écran et flotte devant le téléphone, puis tout part vers l'agenda. */
const Tile: React.FC<{ def: TileDef; index: number }> = ({ def, index }) => {
  const frame = useCurrentFrame();
  const k = pop(frame, def.at, 11);
  if (k <= 0) return null;
  const go = interpolate(frame, [s(T.sent + 0.3 + index * 0.08), s(T.sent + 1.0 + index * 0.08)], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  if (go >= 1) return null;
  const t = sec(frame);
  const bob = Math.sin(t * 1.4 + index * 1.7) * 7;
  const x = interpolate(go, [0, 1], [def.x, 860]);
  const y = interpolate(go, [0, 1], [def.y + bob, 500]);
  const z = interpolate(k, [0, 1], [0, def.z]) + go * 120;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${k * (1 - go * 0.6)})`, opacity: 1 - go, transformOrigin: "left top" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px 14px 14px", borderRadius: 18, background: "#ffffff", whiteSpace: "nowrap",
        boxShadow: "0 30px 60px rgba(4,12,28,.45), 0 0 0 1px rgba(11,31,58,.06)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, lineHeight: 1.1 }}>{tr(def.label)}</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: GREY }}>{tr(def.hint)}</div>
        </div>
      </div>
    </div>
  );
};

const Phone3D: React.FC = () => {
  const frame = useCurrentFrame();
  const k = pop(frame, T.stageIn, 17);
  const { ry, rx } = phoneAngle(frame);
  const dim = ramp(frame, T.notif, 0.3) * (1 - ramp(frame, T.mail - 0.1, 0.2));
  const facing = Math.abs(Math.cos((ry * Math.PI) / 180));
  const grow = 1 + 0.04 * bell(sec(frame), T.ok + 0.3, 0.9);
  const face: React.CSSProperties = { position: "absolute", inset: 0, borderRadius: 64, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };
  return (
    <div style={{ position: "absolute", left: 250, top: 62, width: 504, height: 956, perspective: 2300 }}>
      {/* Ombre au sol */}
      <div style={{ position: "absolute", left: -40, top: 930, width: 584, height: 70, borderRadius: "50%", background: "rgba(2,8,20,.75)", filter: "blur(34px)",
        transform: `scaleX(${0.45 + 0.55 * facing})`, opacity: Math.min(1, k) * 0.85 }} />
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d",
        transform: `translateY(${(1 - k) * 140}px) translateZ(${(1 - k) * -700}px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${grow})`, opacity: Math.min(1, k * 2.2) }}>
        {/* Épaisseur : la tranche du téléphone */}
        {Array.from({ length: 13 }, (_, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, borderRadius: 64, background: i % 2 ? "#1c3357" : "#132746", transform: `translateZ(${-3 - i * 3}px)` }} />
        ))}
        {/* Dos */}
        <div style={{ ...face, transform: "translateZ(-42px) rotateY(180deg)", background: "linear-gradient(150deg, #1d3a66, #0c1f3c)", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 0 0 0 3px rgba(255,255,255,.08)" }}>
          <Img src={staticFile("logo.webp")} style={{ width: 330 }} />
        </div>
        {/* Face */}
        <div style={{ ...face, background: "#16294a", padding: 12, boxShadow: "inset 0 0 0 2px rgba(255,255,255,.1)" }}>
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
            {/* Reflet qui glisse sur la vitre quand le téléphone tourne */}
            <div style={{ position: "absolute", top: -200, left: -400 + ((ry % 360) + 30) * 9, width: 260, height: 1400, transform: "rotate(18deg)",
              background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.22), rgba(255,255,255,0))" }} />
          </div>
        </div>
        {TILES.map((d, i) => <Tile key={d.label} def={d} index={i} />)}
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────── l'agenda

const Agenda3D: React.FC = () => {
  const frame = useCurrentFrame();
  const a = pop(frame, T.sent + 0.35, 17);
  if (a <= 0) return null;
  const t = sec(frame);
  const k = pop(frame, T.block, 10);
  const toWait = ramp(frame, T.mail + 0.55, 0.12);
  const toOk = ramp(frame, T.ok + 0.5, 0.12);
  const c = (grey: string, orange: string, green: string) => interpolateColors(toWait + toOk, [0, 1, 2], [grey, orange, green]);
  // Le rendez-vous se retourne à chaque changement d'état ; la couleur change quand il est sur la tranche.
  const flip = interpolate(frame, [s(T.mail + 0.25), s(T.mail + 0.95)], [0, 360], { ...clamp, easing: inOut })
    + interpolate(frame, [s(T.ok + 0.2), s(T.ok + 0.9)], [0, 360], { ...clamp, easing: inOut });
  const lift = 54 + 26 * bell(t, T.mail + 0.6, 0.9) + 40 * bell(t, T.ok + 0.55, 1.0);
  const ring = interpolate(frame, [s(T.ok + 0.7), s(T.ok + 1.7)], [0, 1], clamp);
  const cardRy = interpolate(a, [0, 1], [-62, -15]) + 1.6 * Math.sin(t * 0.8 + 2);
  const cardRx = 7 + 1.2 * Math.sin(t * 0.6);
  const label = toOk > 0.5 ? tr("Confirmé par le client") : toWait > 0.5 ? tr("Courriel envoyé, en attente de sa réponse") : tr("Réservé en ligne");
  return (
    <div style={{ position: "absolute", left: 20, top: 440, width: 880, height: 440, perspective: 1900 }}>
      <div style={{ position: "absolute", left: 60, top: 420, width: 800, height: 60, borderRadius: "50%", background: "rgba(2,8,20,.7)", filter: "blur(30px)", opacity: Math.min(1, a) }} />
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", opacity: Math.min(1, a * 1.6),
        transform: `translateX(${(1 - a) * 420}px) rotateY(${cardRy}deg) rotateX(${cardRx}deg)` }}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, borderRadius: 24, background: i % 2 ? "#c9d1dd" : "#b4bfce", transform: `translateZ(${-3 - i * 3}px)` }} />
        ))}
        <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "#fdfdfb", color: INK, padding: "22px 30px", transformStyle: "preserve-3d" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, paddingBottom: 14, borderBottom: `2px solid ${LINE}` }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: NAVY }}>{tr("Agenda")}</span>
            <span style={{ fontSize: 22, color: GREY }}>{tr("Jeudi 15 octobre")}</span>
            <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 700, color: GREY }}>Garage Lafleur</span>
          </div>
          <div style={{ position: "relative", height: 330, marginTop: 6, transformStyle: "preserve-3d" }}>
            {["08:00", "09:00", "10:00", "11:00"].map((h, i) => (
              <div key={h} style={{ position: "absolute", left: 0, right: 0, top: i * 82, height: 2, background: "#eceef2" }}>
                <span style={{ position: "absolute", left: 0, top: 8, fontSize: 20, color: "#6b7280" }}>{h}</span>
              </div>
            ))}
            <div style={{ position: "absolute", left: 96, right: 0, top: 210, height: 76, borderRadius: 12, borderLeft: `10px solid ${GREEN}`, background: "#e9f9ef", color: "#14532d", padding: "10px 20px",
              transform: "translateZ(16px)", boxShadow: "0 10px 18px rgba(11,31,58,.14)" }}>
              <div style={{ fontSize: 25, fontWeight: 800 }}>Luc Bouchard</div>
              <div style={{ fontSize: 20 }}>{tr("Vidange d'huile, 2021 Honda Civic")}</div>
            </div>
            {/* Ombre portée du rendez-vous de Paul sur l'agenda */}
            <div style={{ position: "absolute", left: 110, right: 6, top: 30, height: 112, borderRadius: 14, background: "rgba(11,31,58,.30)", filter: "blur(16px)", opacity: Math.min(1, k), transform: "translateZ(1px)" }} />
            <div style={{ position: "absolute", left: 114, right: 0, top: 4, height: 124, transformStyle: "preserve-3d", opacity: Math.min(1, k * 1.8),
              transform: `translateZ(${interpolate(k, [0, 1], [320, lift])}px) rotateX(${flip}deg) scale(${0.7 + 0.3 * k})` }}>
              <div style={{ position: "absolute", inset: -8, borderRadius: 20, border: `5px solid ${GREEN}`, opacity: ring > 0 && ring < 1 ? 1 - ring : 0, transform: `scale(${1 + ring * 0.09})` }} />
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} style={{ position: "absolute", inset: 0, borderRadius: 12, background: c("#8794a8", "#e2660f", "#12853d"), transform: `translateZ(${-3 - i * 3}px)` }} />
              ))}
              <div style={{ position: "absolute", inset: 0, borderRadius: 12, borderLeft: `10px solid ${c("#64748b", ORANGE, GREEN)}`, background: c("#eef1f5", "#fff3e6", "#e9f9ef"), color: c("#1f2937", "#7c2d12", "#14532d"), padding: "10px 20px" }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>Paul Gagnon</div>
                <div style={{ fontSize: 21, marginTop: 1 }}>{tr("Freins, 2019 Chevrolet Silverado")}</div>
                <span style={{ display: "inline-block", marginTop: 7, whiteSpace: "nowrap", fontSize: 21, fontWeight: 800, padding: "5px 16px", borderRadius: 999, background: "#fff" }}>{label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────── la scène

const Stage3D: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < s(T.stageIn) || frame >= s(T.outro)) return null;
  const out = ramp(frame, T.stageOut, 0.4);
  const lift = interpolate(frame, [s(T.sent - 0.3), s(T.sent + 0.3)], [0, 1], { ...clamp, easing: inOut });
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${1 + out * 0.06})` }}>
      <div style={{ position: "absolute", left: 900, top: 62, width: 920, height: 956 }}>
        <Clock />
        <Stopwatch />
        <div style={{ position: "absolute", left: 0, top: interpolate(lift, [0, 1], [250, 92]), transform: `scale(${interpolate(lift, [0, 1], [1, 0.78])})`, transformOrigin: "left top" }}>
          {BEATS.map((b) => <BeatText key={b.title} beat={b} />)}
        </div>
        <Agenda3D />
        <Rail />
      </div>
      <Phone3D />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────── ouverture et fin

const Card3D: React.FC<{ from: number; to: number; sub: string; url?: boolean }> = ({ from, to, sub, url }) => {
  const frame = useCurrentFrame();
  if (frame < s(from) || frame >= s(to)) return null;
  const out = url ? 0 : ramp(frame, to - 0.45, 0.45);
  const logo = pop(frame, from + 0.15, 14);
  const bar = ramp(frame, from + 0.5, 0.6);
  const a = ramp(frame, from + 1.6, 0.5);
  const b = pop(frame, from + 2.1, 12);
  const t = sec(frame) - from;
  return (
    <AbsoluteFill style={{ padding: "0 150px", justifyContent: "center", opacity: 1 - out, perspective: 1600, transform: `translateZ(0) scale(${1 + out * 0.08})` }}>
      <div style={{ transformStyle: "preserve-3d", transform: `rotateY(${interpolate(t, [0, 4.5], [7, -3], clamp)}deg) rotateX(${interpolate(t, [0, 4.5], [3, 0], clamp)}deg)`, transformOrigin: "30% 50%" }}>
        <Img src={staticFile("logo.webp")} style={{ width: 430, marginBottom: 54, marginLeft: -14, opacity: Math.min(1, logo * 1.5),
          transform: `translateZ(${interpolate(logo, [0, 1], [-400, 60])}px) rotateY(${(1 - logo) * -60}deg)` }} />
        <div style={{ width: 190, height: 10, background: ORANGE, marginBottom: 46, transform: `scaleX(${bar}) translateZ(30px)`, transformOrigin: "left center" }} />
        <div style={{ fontSize: useLang() === "en" ? 104 : 118, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#fff", maxWidth: 1300, transformStyle: "preserve-3d" }}>
          {tr("Fini les rendez-vous pris au téléphone.").split(" ").map((w, i) => {
            const k = pop(frame, from + 0.6 + i * 0.1, 13);
            return (
              <span key={i} style={{ display: "inline-block", marginRight: "0.26em", opacity: Math.min(1, k * 1.5), transformOrigin: "50% 100%",
                transform: `translateZ(${(1 - k) * -260 + 40}px) rotateX(${(1 - k) * -85}deg)`, textShadow: "0 18px 40px rgba(2,8,20,.55)" }}>{w}</span>
            );
          })}
        </div>
        <div style={{ fontSize: 44, lineHeight: 1.3, color: MIST, marginTop: 40, maxWidth: 1250, opacity: a, transform: `translateY(${(1 - a) * 24}px) translateZ(10px)` }}>{tr(sub)}</div>
        {url && (
          <div style={{ display: "inline-block", marginTop: 46, fontSize: 40, fontWeight: 800, color: "#1c0a00", background: ORANGE, padding: "16px 38px", borderRadius: 14,
            transform: `translateZ(${interpolate(b, [0, 1], [-200, 80])}px) scale(${b})`, transformOrigin: "left center", boxShadow: "0 24px 50px rgba(2,8,20,.5)" }}>garagopro.ca</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const ReservationEnLigne3D: React.FC<{ lang?: Lang }> = ({ lang = "fr" }) => (
  <LangCtx.Provider value={lang}>
  <AbsoluteFill style={{ fontFamily, background: NAVY_DEEP }}>
    <AbsoluteFill style={{ background: `radial-gradient(1200px 950px at 28% 50%, #1b3d70 0%, ${NAVY} 50%, ${NAVY_DEEP} 100%)` }} />
    <Orbs />
    <Card3D from={0} to={T.stageIn} sub="Comment un client réserve en ligne chez vous, jusqu'à sa confirmation." />
    <Stage3D />
    <Recap depth />
    <Card3D from={T.end} to={51.1} sub="Avec Garago, vos rendez-vous ne tombent plus à l'eau." url />
    <Soundtrack lang={lang} />
  </AbsoluteFill>
  </LangCtx.Provider>
);
