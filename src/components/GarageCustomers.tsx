"use client";

/**
 * Carnet de clients du garage : tous les clients pour qui il a pris un rendez-vous,
 * avec leurs coordonnées. Le garage y cherche un client et corrige sa fiche au
 * besoin (numéro changé, courriel mal noté, langue, moyen de le joindre).
 */

import { useEffect, useState } from "react";
import { Dialog, Segmented, gfetch } from "@/components/GarageAgenda";
import type { CustomerMatch, CustomerPage } from "@/lib/customers";
import { emailSuggestions, emailTypoFix, formatPhone, PHONE_PATTERN } from "@/lib/contact-format";

type Edit = { id: string; name: string; phone: string; email: string; language: string; contactChannel: string };

async function fetchPageFromApi(q: string, page: number): Promise<CustomerPage> {
  const res = await gfetch("/api/garage/customers", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ list: true, q, page }),
  });
  if (!res.ok) throw new Error("load");
  return res.json();
}

async function saveToApi(edit: Edit): Promise<string | null> {
  const res = await gfetch(`/api/garage/customers/${edit.id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: edit.name, phone: edit.phone, email: edit.email, language: edit.language, contactChannel: edit.contactChannel || "NONE" }),
  });
  if (res.ok) return null;
  const d = await res.json().catch(() => ({}));
  return d.error ?? "Impossible d'enregistrer cette fiche.";
}

const shortDate = (date: string) => new Date(date + "T12:00:00").toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
const carName = (v: CustomerMatch["vehicles"][number]) => [v.year, v.make, v.model].filter(Boolean).join(" ");
const input = "w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-orange-400";
const label = "block text-[11px] font-semibold text-gray-500 mb-0.5";

export default function GarageCustomers({
  fetchPage = fetchPageFromApi, save = saveToApi,
}: {
  /** Remplacés par des données fictives dans la page d'aperçu. */
  fetchPage?: (q: string, page: number) => Promise<CustomerPage>;
  save?: (edit: Edit) => Promise<string | null>;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0); // relance le chargement après une modification
  const [data, setData] = useState<CustomerPage | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [edit, setEdit] = useState<Edit | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let stale = false;
    // Petite attente pendant la frappe : une recherche par mot, pas par lettre.
    const timer = setTimeout(async () => {
      try {
        const found = await fetchPage(q.trim(), page);
        if (stale) return;
        setData(found);
        setLoadError(false);
      } catch {
        if (!stale) setLoadError(true);
      }
    }, q ? 250 : 0);
    return () => { stale = true; clearTimeout(timer); };
  }, [q, page, version, fetchPage]);

  function openEdit(c: CustomerMatch) {
    setSaveError("");
    setEdit({
      id: c.id, name: c.name, phone: formatPhone(c.phone), email: c.email ?? "",
      language: c.language === "en" ? "en" : "fr",
      contactChannel: c.contactChannel === "SMS" || c.contactChannel === "EMAIL" ? c.contactChannel : c.contactChannel === "NONE" ? "" : "SMS",
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setSaving(true);
    setSaveError("");
    try {
      const error = await save(edit);
      if (error) { setSaveError(error); return; }
      setEdit(null);
      setVersion((v) => v + 1);
    } catch {
      setSaveError("Erreur réseau. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  const total = data?.total ?? 0;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pageBtn = "px-3 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 bg-white disabled:opacity-40";

  return (
    <section aria-label="Carnet de clients" className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-gray-900">Carnet de clients</h2>
          <p className="text-sm text-gray-500">
            Chaque client pour qui vous prenez un rendez-vous est ajouté ici. Corrigez ses coordonnées au besoin.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <label className={label} htmlFor="clients-search">Chercher un client</label>
          <input id="clients-search" type="search" autoComplete="off" className={input} placeholder="Nom, téléphone ou courriel"
            value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        {loadError ? (
          <p className="px-4 py-8 text-sm text-center font-semibold text-red-600" role="alert">
            Le carnet n&apos;a pas pu être chargé. Vérifiez votre connexion et réessayez.
          </p>
        ) : !data ? (
          <p className="px-4 py-8 text-sm text-center text-gray-500">Chargement…</p>
        ) : data.customers.length === 0 ? (
          <p className="px-4 py-8 text-sm text-center text-gray-500">
            {q.trim() ? "Aucun client ne correspond à cette recherche." : "Aucun client encore. Le premier rendez-vous que vous saisirez ajoutera son client ici."}
          </p>
        ) : (
          <>
            <div className="hidden sm:grid gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-500 border-b border-gray-200"
              style={{ gridTemplateColumns: "1.5fr 1fr 1.5fr 1.3fr auto" }} aria-hidden="true">
              <span>Client</span><span>Téléphone</span><span>Courriel</span><span>Véhicule</span><span className="w-[76px]" />
            </div>
            <ul className="divide-y divide-gray-100">
              {data.customers.map((c) => (
                <li key={c.id} className="px-4 py-2.5 grid gap-x-3 gap-y-0.5 items-center grid-cols-[minmax(0,1fr)_auto] sm:[grid-template-columns:1.5fr_1fr_1.5fr_1.3fr_auto]">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {c.visits === 0 ? "Aucun rendez-vous" : `${c.visits} rendez-vous`}
                      {c.lastDate ? ` · dernier le ${shortDate(c.lastDate)}` : ""}
                      {c.language === "en" ? " · anglais" : ""}
                    </p>
                  </div>
                  <a href={`tel:${c.phone}`} className="order-3 sm:order-none col-span-2 sm:col-span-1 text-sm font-semibold tabular-nums whitespace-nowrap" style={{ color: "#15803d" }}>{c.phone}</a>
                  <p className="order-3 sm:order-none col-span-2 sm:col-span-1 text-sm text-gray-700 truncate min-w-0">
                    {c.email ? <a href={`mailto:${c.email}`} style={{ color: "#1d4ed8" }}>{c.email}</a> : <span className="text-gray-400">Pas de courriel</span>}
                  </p>
                  <p className="order-3 sm:order-none col-span-2 sm:col-span-1 text-sm text-gray-700 truncate min-w-0">
                    {c.vehicles.length === 0 ? <span className="text-gray-400">—</span> : c.vehicles.map(carName).join(", ")}
                  </p>
                  <button type="button" onClick={() => openEdit(c)} aria-label={`Modifier la fiche de ${c.name}`}
                    className="order-2 sm:order-none justify-self-end px-3 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-800 bg-white hover:bg-gray-50">
                    Modifier
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {data && total > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500" role="status">
              {total === 1 ? "1 client" : `${total} clients`}{pages > 1 ? ` · page ${data.page} sur ${pages}` : ""}
            </p>
            {pages > 1 && (
              <div className="flex gap-1.5">
                <button type="button" className={pageBtn} disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>Précédent</button>
                <button type="button" className={pageBtn} disabled={data.page >= pages} onClick={() => setPage(data.page + 1)}>Suivant</button>
              </div>
            )}
          </div>
        )}
      </div>

      {edit && (
        <Dialog title="Modifier la fiche du client" onClose={() => setEdit(null)}>
          <form onSubmit={submit} className="grid grid-cols-2 gap-x-2 gap-y-2.5">
            <div className="col-span-2">
              <label className={label} htmlFor="client-name">Nom du client</label>
              <input id="client-name" required autoFocus autoComplete="off" maxLength={80} className={input}
                value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={label} htmlFor="client-phone">Téléphone</label>
              <input id="client-phone" required type="tel" inputMode="tel" autoComplete="off" className={`${input} tabular-nums`}
                placeholder="(514) 555-0123" pattern={PHONE_PATTERN} title="10 chiffres, sous la forme (514) 555-0123"
                value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: formatPhone(e.target.value) })} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={label} htmlFor="client-email">Courriel{edit.contactChannel === "EMAIL" ? "" : " (facultatif)"}</label>
              <input id="client-email" type="email" inputMode="email" autoComplete="off" autoCapitalize="none" spellCheck={false} list="client-email-domains"
                required={edit.contactChannel === "EMAIL"} className={input} placeholder="nom@gmail.com"
                value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value.replace(/\s/g, "") })} />
              <datalist id="client-email-domains">
                {emailSuggestions(edit.email).map((address) => <option key={address} value={address} />)}
              </datalist>
              {(() => {
                const fix = emailTypoFix(edit.email);
                return fix && (
                  <button type="button" onClick={() => setEdit({ ...edit, email: fix })}
                    className="block text-left text-[11px] font-semibold mt-0.5 underline" style={{ color: "#b45309" }}>
                    Vouliez-vous dire {fix} ?
                  </button>
                );
              })()}
            </div>
            <div className="col-span-2">
              <span className={label}>Demande de confirmation envoyée par</span>
              <Segmented name="Moyen d'envoi" value={edit.contactChannel} onChange={(v) => setEdit({ ...edit, contactChannel: v })} options={[["SMS", "Texto"], ["EMAIL", "Courriel"], ["", "Aucun"]]} />
            </div>
            <div className="col-span-2">
              <span className={label}>Langue du client</span>
              <Segmented name="Langue du client" value={edit.language} onChange={(v) => setEdit({ ...edit, language: v })} options={[["fr", "Français"], ["en", "English"]]} />
            </div>

            {saveError && <p className="col-span-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">{saveError}</p>}

            <div className="col-span-2 flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-gray-500">Ses rendez-vous à venir prendront ces coordonnées.</p>
              <button type="submit" disabled={saving} className="flex-shrink-0 text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-60" style={{ background: "#f97316" }}>
                {saving ? "…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
