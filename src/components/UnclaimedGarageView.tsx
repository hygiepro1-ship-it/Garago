"use client";

import { useState } from "react";
import Link from "next/link";
import Turnstile, { turnstileActive } from "@/components/Turnstile";

interface Props {
  garage: {
    slug: string;
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    claimStatus: string; // "non_reclamee" | "en_attente"
  };
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

// Fiche non activée (section 2.1 de la stratégie) : informations d'entreprise
// publiques seulement — pas de photo, pas d'avis, pas de prix, pas de
// disponibilité, aucun nom personnel. Deux actions : réclamer la fiche, ou
// signaler un problème.
export default function UnclaimedGarageView({ garage }: Props) {
  const [showClaim, setShowClaim] = useState(false);
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0"
            style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0", color: "#0b1f3a" }}>
            {garage.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: "#0b1f3a" }}>{garage.name}</h1>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${garage.address}, ${garage.city}, ${garage.province} ${garage.postalCode}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 hover:text-orange-500 hover:underline w-fit">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {garage.address}, {garage.city}, {garage.province} {garage.postalCode}
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl p-4 flex items-start gap-3" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
          </svg>
          <p className="text-sm font-semibold" style={{ color: "#9a3412" }}>
            {garage.claimStatus === "en_attente"
              ? "Une demande de réclamation de cette fiche est en cours de vérification."
              : "Ce garage ne prend pas encore de rendez-vous en ligne sur Garago"}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`tel:${garage.phone}`}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm w-full sm:w-auto"
            style={{ background: "#f97316", color: "#1c0a00" }}>
            Appeler · {garage.phone}
          </a>
          {garage.claimStatus === "non_reclamee" && (
            <button onClick={() => setShowClaim(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border"
              style={{ borderColor: "#f97316", color: "#f97316" }}>
              Vous êtes le propriétaire ? Activez votre page
            </button>
          )}
        </div>

        <button onClick={() => setShowReport(true)}
          className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline">
          Signaler un problème / demander le retrait de cette fiche
        </button>

        <p className="mt-8 text-xs text-gray-400">
          Fiche créée à partir d'informations d'entreprise publiques. <Link href="/garagistes" className="underline hover:text-gray-600">En savoir plus sur Garago pour les garages</Link>.
        </p>
      </div>

      {showClaim && <ClaimModal slug={garage.slug} onClose={() => setShowClaim(false)} />}
      {showReport && <ReportModal slug={garage.slug} onClose={() => setShowReport(false)} />}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11,31,58,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 font-bold text-lg">×</button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ClaimModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("proprietaire");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [neq, setNeq] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [tsToken, setTsToken] = useState("");
  const [tsReset, setTsReset] = useState(0);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/garages/${slug}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, phone, email, neq, turnstileToken: tsToken }),
    });
    setSubmitting(false);
    setTsReset((n) => n + 1);
    if (res.ok) {
      setDone(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Impossible d'envoyer la demande.");
    }
  }

  if (done) {
    return (
      <Modal title="Demande envoyée" onClose={onClose}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-full" style={{ background: "#ecfdf5" }}>
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <p className="text-sm text-gray-600">
            Notre équipe va vérifier votre identité (NEQ et pièce justificative) avant d'activer votre page. Vous serez contacté par courriel.
          </p>
          <button onClick={onClose} className="mt-5 text-sm font-semibold text-orange-500 hover:underline">Fermer</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Activez votre page" onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-4">
        <p className="text-xs text-gray-500">
          Une pièce justificative (facture du garage, compte de taxes) vous sera demandée par courriel pour confirmer votre identité.
        </p>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Nom complet *</label>
          <input className={inputCls} required value={name} onChange={e => setName(e.target.value)} placeholder="Jean Tremblay" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Rôle *</label>
          <select className={inputCls} value={role} onChange={e => setRole(e.target.value)}>
            <option value="proprietaire">Propriétaire</option>
            <option value="gerant">Gérant</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Cellulaire *</label>
          <input className={inputCls} required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="514 555-0100" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Courriel *</label>
          <input className={inputCls} required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">NEQ (Numéro d'entreprise du Québec) *</label>
          <input className={inputCls} required value={neq} onChange={e => setNeq(e.target.value)} placeholder="10 chiffres" maxLength={10}
            pattern="\d{10}" title="10 chiffres" />
          <p className="text-xs text-gray-400 mt-1">Exigé pour confirmer que vous êtes bien l'entreprise titulaire de ce garage.</p>
        </div>
        <Turnstile onToken={setTsToken} resetKey={tsReset} />
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={submitting || (turnstileActive && !tsToken)}
          className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60" style={{ background: "#f97316" }}>
          {submitting ? "Envoi…" : "Envoyer la demande"}
        </button>
      </form>
    </Modal>
  );
}

function ReportModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [reason, setReason] = useState("retrait");
  const [message, setMessage] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/garages/${slug}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, message: message || undefined, reporterEmail: reporterEmail || undefined }),
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Impossible d'envoyer le signalement.");
    }
  }

  if (done) {
    return (
      <Modal title="Signalement envoyé" onClose={onClose}>
        <div className="p-6 text-center">
          <p className="text-sm text-gray-600">
            {reason === "retrait"
              ? "Cette fiche a été masquée en attendant la vérification de votre demande."
              : "Merci, notre équipe va examiner votre signalement."}
          </p>
          <button onClick={onClose} className="mt-5 text-sm font-semibold text-orange-500 hover:underline">Fermer</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Signaler un problème" onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Motif *</label>
          <select className={inputCls} value={reason} onChange={e => setReason(e.target.value)}>
            <option value="retrait">Demander le retrait de cette fiche</option>
            <option value="usurpation">Usurpation de ce garage</option>
            <option value="erreur">Information erronée</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Message <span className="font-normal text-gray-400">(optionnel)</span></label>
          <textarea className={inputCls} rows={3} value={message} onChange={e => setMessage(e.target.value)} maxLength={1000} style={{ resize: "none" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Votre courriel <span className="font-normal text-gray-400">(optionnel, pour vous répondre)</span></label>
          <input className={inputCls} type="email" value={reporterEmail} onChange={e => setReporterEmail(e.target.value)} placeholder="vous@exemple.com" />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={submitting}
          className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60" style={{ background: "#0b1f3a" }}>
          {submitting ? "Envoi…" : "Envoyer"}
        </button>
      </form>
    </Modal>
  );
}
