"use client";

import { useCallback, useEffect, useState } from "react";

interface ChannelStats { settled: number; answered: number }

interface PilotGarage {
  id: string; name: string; slug: string; city: string;
  total: number; withoutMessage: number;
  sent: number; settled: number; pending: number; undelivered: number;
  clientConfirmed: number; clientCancelled: number; cancelledEarly: number; medianNoticeHours: number | null;
  answered: number; noReply: number; noReplyPhoneConfirmed: number; noReplyLateAnswer: number;
  garageCancelled: number; medianResponseMinutes: number | null;
  past: number; noShows: number;
  pastConfirmed: number; noShowsConfirmed: number; pastUnconfirmed: number; noShowsUnconfirmed: number;
  sms: ChannelStats; email: ChannelStats;
}

function dateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)} %` : "—";
}

function duration(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${(minutes / 60).toFixed(1).replace(".", ",")} h`;
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "good" | "bad" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color: tone === "good" ? "#15803d" : tone === "bad" ? "#b91c1c" : "#111827" }}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

/** Onglet « Projet pilote » de l'administration : réponses des clients aux demandes de confirmation, par garage. */
export default function AdminPilotStats({ garage, onShowAll }: {
  /** Fiche ouverte depuis l'onglet Garages : seuls ses résultats sont affichés. */
  garage?: { id: string; name: string } | null;
  onShowAll?: () => void;
}) {
  // Valeur moyenne d'un rendez-vous, saisie par l'admin : traduit les créneaux récupérés en dollars.
  const [avgValue, setAvgValue] = useState("");
  const garageId = garage?.id ?? "";
  const [from, setFrom] = useState(dateStr(-30));
  const [to, setTo]     = useState(dateStr(60));
  const [garages, setGarages] = useState<PilotGarage[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/pilot?from=${from}&to=${to}${garageId ? `&garageId=${encodeURIComponent(garageId)}` : ""}`);
      if (!r.ok) throw new Error();
      setGarages((await r.json()).garages);
      setError("");
    } catch {
      setError("Impossible de charger les résultats du pilote.");
    }
  }, [from, to, garageId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-gray-500">
          Rendez-vous du
          <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)}
            className="block mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800" />
        </label>
        <label className="text-xs font-semibold text-gray-500">
          au
          <input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)}
            className="block mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800" />
        </label>
        <label className="text-xs font-semibold text-gray-500">
          Valeur moyenne d&apos;un rendez-vous ($)
          <input type="number" inputMode="decimal" min={0} step={5} value={avgValue} onChange={(e) => setAvgValue(e.target.value)} placeholder="ex. 90"
            className="block mt-1 w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800" />
        </label>
        <p className="text-xs text-gray-400 flex-1 min-w-[200px]">
          Rendez-vous saisis par le garage (pris au téléphone). La période porte sur la date du rendez-vous, pas sur la date de saisie.
        </p>
      </div>

      {garage && (
        <p className="text-sm text-gray-600">
          Résultats de <span className="font-bold text-gray-900">{garage.name}</span> uniquement.{" "}
          <button type="button" onClick={onShowAll} className="font-semibold underline text-orange-600">Voir tous les garages</button>
        </p>
      )}
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {garages && garages.length === 0 && (
        <p className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-200 p-6 text-center">Aucun garage en projet pilote et aucun rendez-vous saisi par un garage sur cette période.</p>
      )}

      {garages?.map((g) => (
        <section key={g.id} className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-extrabold text-gray-900">{g.name} <span className="text-sm font-medium text-gray-400">{g.city}</span></h2>
            <p className="text-xs text-gray-500">
              {g.total} rendez-vous saisis · {g.sent} demandes envoyées
              {g.pending > 0 && ` · ${g.pending} en attente de réponse`}
              {g.withoutMessage > 0 && ` · ${g.withoutMessage} sans message`}
            </p>
          </div>

          {g.settled === 0 && (
            <p className="text-xs text-gray-500 bg-white rounded-xl border border-gray-200 px-3 py-2">
              Aucune demande de confirmation n&apos;est encore arrivée à échéance sur cette période : les taux s&apos;afficheront dès les premières réponses.
            </p>
          )}

          {/* Réponse au message de confirmation : les deux taux se complètent (100 % à eux deux) */}
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Taux de réponse au message" value={pct(g.answered, g.settled)} tone="good"
              sub={`${g.answered} clients ont répondu sur ${g.settled} demandes arrivées à échéance`} />
            <Metric label="Taux de non-réponse" value={pct(g.noReply, g.settled)} tone={g.noReply > 0 ? "bad" : undefined}
              sub={`${g.noReply} à appeler · ${g.noReplyPhoneConfirmed} confirmés par téléphone · ${g.noReplyLateAnswer} ont répondu après l'échéance`} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Metric label="Taux de confirmation" value={pct(g.clientConfirmed, g.settled)} tone="good"
              sub={`${g.clientConfirmed} rendez-vous confirmés par le client`} />
            <Metric label="Taux d'annulation" value={pct(g.clientCancelled, g.settled)}
              sub={`${g.clientCancelled} annulés par le client, dont ${g.cancelledEarly} au moins 24 h avant`} />
            <Metric label="Taux d'absence" value={pct(g.noShows, g.past)} tone={g.noShows > 0 ? "bad" : undefined}
              sub={`${g.noShows} clients absents sur ${g.past} rendez-vous passés`} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700">
            <p>
              <span className="font-bold text-gray-900">{g.cancelledEarly}</span> créneaux libérés à temps pour être redonnés
              {Number(avgValue) > 0 && <>, soit jusqu&apos;à <span className="font-bold text-green-700">{Math.round(g.cancelledEarly * Number(avgValue)).toLocaleString("fr-CA")} $</span> de travail récupérable</>}
            </p>
            <p>Préavis médian d&apos;annulation : <span className="font-bold text-gray-900">{g.medianNoticeHours === null ? "—" : duration(g.medianNoticeHours * 60)}</span></p>
            <p>Absences chez les confirmés : <span className="font-bold text-gray-900">{pct(g.noShowsConfirmed, g.pastConfirmed)}</span> ({g.noShowsConfirmed}/{g.pastConfirmed})</p>
            <p>Absences chez les non confirmés : <span className="font-bold text-gray-900">{pct(g.noShowsUnconfirmed, g.pastUnconfirmed)}</span> ({g.noShowsUnconfirmed}/{g.pastUnconfirmed})</p>
            <p>Réponse par texto : <span className="font-bold text-gray-900">{pct(g.sms.answered, g.sms.settled)}</span> ({g.sms.answered}/{g.sms.settled})</p>
            <p>Réponse par courriel : <span className="font-bold text-gray-900">{pct(g.email.answered, g.email.settled)}</span> ({g.email.answered}/{g.email.settled})</p>
            <p>Délai médian de réponse : <span className="font-bold text-gray-900">{duration(g.medianResponseMinutes)}</span></p>
            <p>Messages non remis : <span className="font-bold text-gray-900">{g.undelivered}</span> · annulés par le garage : <span className="font-bold text-gray-900">{g.garageCancelled}</span></p>
          </div>
        </section>
      ))}
    </div>
  );
}
