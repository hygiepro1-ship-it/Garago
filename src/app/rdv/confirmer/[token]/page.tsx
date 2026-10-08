"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Info {
  state: "ask" | "confirmed" | "expired" | "cancelled" | "closed" | "past" | "invalid";
  canRetake?: boolean;
  garageName?: string;
  garageAddress?: string;
  garagePhone?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  serviceName?: string | null;
  language?: "fr" | "en";
  manual?: boolean; // rendez-vous pris au téléphone, saisi par le garage
  error?: string;
}

const MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const DAYS = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];

function fmtDate(d: string, lang: "fr" | "en" = "fr") {
  const [y, m, day] = d.split("-").map(Number);
  if (lang === "en") {
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-CA", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return `${DAYS[dow]} ${day} ${MONTHS[m - 1]} ${y}`;
}

// Textes de la page, dans la langue choisie par le garage pour ce client.
const TEXTS = {
  fr: {
    appointment: "Rendez-vous", call: "Appeler le garage",
    cancelTitle: "Annuler ce rendez-vous ?", cancelYes: "Oui, j'annule", cancelNo: "Non, je confirme mon rendez-vous",
    cancelNote: "Annuler libère le créneau pour un autre conducteur.",
    askTitle: "Confirmer votre rendez-vous", confirm: "Je confirme", mustCancel: "Je dois annuler",
    confirmedTitle: "Rendez-vous confirmé", confirmedSub: "Merci, le garage vous attend.", cancelAfter: "Finalement, j'annule",
    cancelledTitle: "Rendez-vous annulé",
    cancelledSub: "Ce rendez-vous est annulé. Vous pouvez en réserver un nouveau à tout moment.",
    cancelledManual: "Ce rendez-vous est annulé, le garage est prévenu. Pour en reprendre un, appelez le garage.",
    rebook: "Réserver un autre créneau",
    pastTitle: "Rendez-vous passé", pastSub: "Ce rendez-vous n'est plus modifiable.",
  },
  en: {
    appointment: "Appointment", call: "Call the garage",
    cancelTitle: "Cancel this appointment?", cancelYes: "Yes, cancel it", cancelNo: "No, I confirm my appointment",
    cancelNote: "Cancelling frees the time slot for another driver.",
    askTitle: "Confirm your appointment", confirm: "I confirm", mustCancel: "I need to cancel",
    confirmedTitle: "Appointment confirmed", confirmedSub: "Thank you, the garage is expecting you.", cancelAfter: "Actually, I need to cancel",
    cancelledTitle: "Appointment cancelled",
    cancelledSub: "This appointment is cancelled. You can book a new one at any time.",
    cancelledManual: "This appointment is cancelled and the garage has been notified. To book a new one, call the garage.",
    rebook: "Book another time",
    pastTitle: "Past appointment", pastSub: "This appointment can no longer be changed.",
  },
};

export default function ConfirmerRdvPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<Info | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  // Le bouton « J'annule » du courriel ouvre cette page avec ?action=cancel.
  const [wantsCancel, setWantsCancel] = useState(false);
  useEffect(() => { setWantsCancel(new URLSearchParams(window.location.search).get("action") === "cancel"); }, []);

  useEffect(() => {
    fetch(`/api/rdv/${token}`).then((r) => r.json()).then(setInfo).catch(() => setInfo({ state: "invalid" }));
  }, [token]);

  async function act(action: "confirm" | "cancel" | "retake") {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/rdv/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.error) setMsg(data.error);
      setInfo((prev) => ({ ...(prev ?? {}), ...data }));
    } catch {
      setMsg("Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const navy = "#0b1f3a";
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 4px 24px rgba(11,31,58,0.06)" };

  if (!info) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-400">Chargement…</div>;
  }

  const lang = info.language === "en" ? "en" : "fr";
  const tx = TEXTS[lang];

  const summary = info.garageName && (
    <div className="text-left rounded-xl p-4 my-5" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
      <p className="text-sm font-bold text-gray-900">{info.serviceName ?? tx.appointment}</p>
      <p className="text-sm text-gray-700 mt-1">{info.date && fmtDate(info.date, lang)} · {info.startTime} – {info.endTime}</p>
      <p className="text-sm text-gray-700">{info.garageName}</p>
      <p className="text-xs text-gray-500 mt-1">{info.garageAddress}</p>
    </div>
  );

  const call = info.garagePhone && (
    <a href={`tel:${info.garagePhone}`} className="block mt-3 text-sm font-semibold underline" style={{ color: navy }}>
      {tx.call} · {info.garagePhone}
    </a>
  );

  const btnPrimary: React.CSSProperties = { background: "#f97316", color: "#fff", width: "100%", padding: "14px 20px", borderRadius: 5, fontWeight: 800, fontSize: 15 };
  const btnGhost: React.CSSProperties = { background: "transparent", color: "#475569", width: "100%", padding: "13px 20px", borderRadius: 5, fontWeight: 700, fontSize: 14, border: "1.5px solid #cbd5e1", marginTop: 10 };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center p-6 sm:p-8" style={card}>
        {info.state === "invalid" && (
          <>
            <h1 className="text-xl font-black" style={{ color: navy }}>Lien invalide</h1>
            <p className="text-sm text-gray-500 mt-2">Ce lien n'existe pas ou n'est plus valide. Vérifiez le courriel reçu ou contactez directement le garage.</p>
          </>
        )}

        {wantsCancel && (info.state === "ask" || info.state === "confirmed") && (
          <>
            <h1 className="text-xl font-black" style={{ color: navy }}>{tx.cancelTitle}</h1>
            {summary}
            <button onClick={() => act("cancel")} disabled={busy} style={{ ...btnPrimary, background: "#b91c1c" }} className="disabled:opacity-60">
              {busy ? "…" : tx.cancelYes}
            </button>
            <button onClick={() => { setWantsCancel(false); act("confirm"); }} disabled={busy} style={btnGhost} className="disabled:opacity-60">
              {tx.cancelNo}
            </button>
            <p className="text-xs text-gray-400 mt-4">{tx.cancelNote}</p>
            {call}
          </>
        )}

        {!wantsCancel && info.state === "ask" && (
          <>
            <h1 className="text-xl font-black" style={{ color: navy }}>{tx.askTitle}</h1>
            {summary}
            <button onClick={() => act("confirm")} disabled={busy} style={btnPrimary} className="disabled:opacity-60">
              {busy ? "…" : tx.confirm}
            </button>
            <button onClick={() => act("cancel")} disabled={busy} style={btnGhost} className="disabled:opacity-60">{tx.mustCancel}</button>
            <p className="text-xs text-gray-400 mt-4">{tx.cancelNote}</p>
            {call}
          </>
        )}

        {!wantsCancel && info.state === "confirmed" && (
          <>
            <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-black" style={{ background: "#e6f6ec", color: "#15803d" }}>✓</div>
            <h1 className="text-xl font-black" style={{ color: navy }}>{tx.confirmedTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">{tx.confirmedSub}</p>
            {summary}
            <button onClick={() => act("cancel")} disabled={busy} style={btnGhost} className="disabled:opacity-60">{tx.cancelAfter}</button>
            {call}
          </>
        )}

        {info.state === "expired" && (
          <>
            <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-black" style={{ background: "#fdf1d8", color: "#b45309" }}>!</div>
            <h1 className="text-xl font-black" style={{ color: navy }}>Ce créneau a été libéré</h1>
            <p className="text-sm text-gray-500 mt-1">
              {info.canRetake ? "Le délai de confirmation est passé, mais le créneau est encore libre : vous pouvez le reprendre." : "Le délai de confirmation est passé et le créneau n'est plus disponible."}
            </p>
            {summary}
            {info.canRetake && (
              <button onClick={() => act("retake")} disabled={busy} style={btnPrimary} className="disabled:opacity-60">
                {busy ? "…" : "Reprendre ce créneau"}
              </button>
            )}
            <a href="/rechercher" style={{ ...btnGhost, display: "block", textDecoration: "none" }}>Voir d'autres horaires</a>
            {call}
          </>
        )}

        {info.state === "cancelled" && (
          <>
            <h1 className="text-xl font-black" style={{ color: navy }}>{tx.cancelledTitle}</h1>
            <p className="text-sm text-gray-500 mt-2">{info.manual ? tx.cancelledManual : tx.cancelledSub}</p>
            {summary}
            {/* Client du garage (rendez-vous pris au téléphone) : on le renvoie vers son garage, pas vers la recherche. */}
            {info.manual
              ? call
              : <a href="/rechercher" style={{ ...btnPrimary, display: "block", textDecoration: "none" }}>{tx.rebook}</a>}
          </>
        )}

        {(info.state === "closed" || info.state === "past") && (
          <>
            <h1 className="text-xl font-black" style={{ color: navy }}>{tx.pastTitle}</h1>
            <p className="text-sm text-gray-500 mt-2">{tx.pastSub}</p>
            {summary}
          </>
        )}

        {msg && <p className="mt-4 text-sm font-semibold" style={{ color: "#b91c1c" }}>{msg}</p>}
      </div>
    </div>
  );
}
