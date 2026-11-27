"use client";

// Extrait de src/app/tableau-de-bord/garage/page.tsx (découpage du tableau de bord du garage).

import { useState } from "react";
import { useTr } from "@/lib/dashboard-en";
import { gfetch, type Garage } from "../_lib/dashboard";

// ─── Component ──────────────────────────────────────────────────────────────
// ── Description verification section ────────────────────────────────────────
export function DescriptionSection({
  garage, inputClass, onUpdated,
}: {
  garage: Garage;
  inputClass: string;
  onUpdated: (data: Partial<Garage>) => void;
}) {
  const tr = useTr();
  const DESCRIPTION_MAX_PER_YEAR = 4;
  const [draft, setDraft] = useState(garage?.descriptionDraft ?? garage?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState(garage?.descriptionStatus ?? "APPROVED");
  const [usedThisYear, setUsedThisYear] = useState<number>(() => {
    const thisYear = new Date().getFullYear();
    return garage?.descriptionChangesYear === thisYear ? (garage?.descriptionChanges ?? 0) : 0;
  });

  const isPending  = status === "PENDING";
  const isRejected = status === "REJECTED";
  const remaining  = DESCRIPTION_MAX_PER_YEAR - usedThisYear;

  async function handleSubmit() {
    setError(""); setSuccess("");
    if (!draft.trim()) { setError(tr("La description ne peut pas être vide.")); return; }
    setSubmitting(true);
    try {
      const res = await gfetch("/api/garage/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: draft }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setStatus("PENDING");
      setUsedThisYear(data.usedThisYear);
      setSuccess(tr("Description soumise pour vérification. Vous recevrez une confirmation par courriel."));
      onUpdated({ descriptionDraft: draft.trim(), descriptionStatus: "PENDING", descriptionChanges: data.usedThisYear });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">{tr("Description du garage")}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {tr("Texte descriptif uniquement : pas de liens, courriels, numéros ou hashtags.")}
          </p>
        </div>
        {/* Status badge */}
        {isPending && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: "#fef3c7", color: "#92400e" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
            {tr("En attente de validation")}
          </span>
        )}
        {isRejected && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: "#fee2e2", color: "#991b1b" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            {tr("Description refusée")}
          </span>
        )}
        {status === "APPROVED" && garage?.description && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: "#dcfce7", color: "#166534" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            {tr("Approuvée")}
          </span>
        )}
      </div>

      {/* Current approved description (read-only display) */}
      {garage?.description && (
        <div className="mb-4 rounded-xl p-3 text-sm text-gray-700" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">{tr("Description active")}</p>
          <p className="whitespace-pre-wrap">{garage.description}</p>
        </div>
      )}

      {/* Draft pending review */}
      {isPending && garage?.descriptionDraft && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#92400e" }}>{tr("Modification en cours de révision")}</p>
          <p className="text-gray-700 whitespace-pre-wrap">{garage.descriptionDraft}</p>
          <p className="text-xs mt-2" style={{ color: "#78350f" }}>
            {tr("Elle remplacera la description active une fois approuvée par notre équipe.")}
          </p>
        </div>
      )}

      {/* Rejection message */}
      {isRejected && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#991b1b" }}>
            {tr("Votre dernière description a été refusée.")}
          </p>
          <p className="text-gray-700 text-xs">
            {tr("Elle ne respectait pas nos conditions : description de l'entreprise uniquement, sans promotion ni coordonnées. Soumettez une nouvelle version ci-dessous.")}
          </p>
        </div>
      )}

      {/* Edit area — hidden while PENDING */}
      {!isPending && (
        <div className="space-y-3">
          <textarea
            className={`${inputClass} min-h-[120px]`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={tr("Décrivez votre garage, votre expertise, vos spécialités…")}
            maxLength={400}
          />
          <p className="text-xs text-right" style={{ color: draft.length >= 380 ? "#dc2626" : "#9ca3af" }}>
            {draft.length} / 400 {tr.en ? "characters" : "caractères"}
          </p>
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
            {tr.en
              ? <>Changes to the description must be submitted separately with the <strong>&quot;Submit for review&quot;</strong> button. The &quot;Save profile&quot; button does not save them.</>
              : <>Les modifications de la description doivent être soumises séparément via le bouton <strong>«&nbsp;Faire vérifier&nbsp;»</strong>. Le bouton «&nbsp;Sauvegarder le profil&nbsp;» ne les enregistre pas.</>}
          </p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs" style={{ color: remaining <= 1 ? "#dc2626" : "#6b7280" }}>
              {remaining <= 0
                ? "Limite atteinte : plus aucune modification autorisée cette année."
                : tr.en
                  ? `${remaining} change${remaining > 1 ? "s" : ""} left this year (out of ${DESCRIPTION_MAX_PER_YEAR})`
                  : `${remaining} modification${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} cette année (sur ${DESCRIPTION_MAX_PER_YEAR})`}
            </p>
            <button
              type="button"
              disabled={submitting || remaining <= 0}
              onClick={handleSubmit}
              className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "#e0600c" }}>
              {submitting ? tr("Envoi en cours…") : tr("Faire vérifier")}
            </button>
          </div>
          {error   && <p className="text-xs font-medium" style={{ color: "#dc2626" }}>{error}</p>}
          {success && <p className="text-xs font-medium" style={{ color: "#16a34a" }}>{success}</p>}
        </div>
      )}

      {isPending && (
        <p className="text-xs text-gray-400 mt-2">
          {tr("La modification est en cours de révision. L'édition sera réactivée une fois la décision rendue.")}
        </p>
      )}
    </div>
  );
}

// ─── Appointment status colours ─────────────────────────────────────────────
