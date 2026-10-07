"use client";

import { useEffect, useState } from "react";

// Changement de mot de passe depuis le tableau de bord (mot de passe actuel requis). Masqué pour les comptes Google.
export default function PasswordChangeCard() {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile").then((r) => r.json()).then((u) => setHasPassword(!!u?.hasPassword)).catch(() => setHasPassword(false));
  }, []);

  if (!hasPassword) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const res = await fetch("/api/user/password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: cur, newPassword: next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setCur(""); setNext(""); setMsg({ ok: true, text: "Mot de passe modifié." }); }
    else setMsg({ ok: false, text: data.error ?? "Impossible de changer le mot de passe." });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
      <h2 className="font-bold text-gray-900 text-lg mb-1">Mot de passe</h2>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 mt-3">
        <div>
          <label htmlFor="pwc-cur" className="block text-xs font-semibold text-gray-600 mb-1">Mot de passe actuel</label>
          <input id="pwc-cur" type="password" autoComplete="current-password" required className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" value={cur} onChange={(e) => setCur(e.target.value)} />
        </div>
        <div>
          <label htmlFor="pwc-new" className="block text-xs font-semibold text-gray-600 mb-1">Nouveau mot de passe (8 caractères minimum)</label>
          <input id="pwc-new" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={busy} className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#0b1f3a" }}>
            {busy ? "…" : "Changer le mot de passe"}
          </button>
          {msg && <span className="text-sm font-semibold" role="status" style={{ color: msg.ok ? "#15803d" : "#b91c1c" }}>{msg.text}</span>}
        </div>
      </form>
    </div>
  );
}
