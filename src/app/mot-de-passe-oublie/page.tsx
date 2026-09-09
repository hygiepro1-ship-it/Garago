/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import Link from "next/link";

function CodeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.padEnd(6, " ").slice(0, 6).split("");

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const ch = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...chars];
    next[i] = ch || " ";
    const val = next.join("").trimEnd();
    onChange(val);
    if (ch && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && chars[i].trim() === "" && i > 0) refs.current[i - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          disabled={disabled}
          value={chars[i].trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-xl font-black border-2 rounded-xl focus:outline-none transition-colors bg-white disabled:opacity-50"
          style={{ borderColor: chars[i].trim() ? "#f97316" : "#e2e8f0", color: "#0b1f3a" }}
        />
      ))}
    </div>
  );
}

export default function MotDePasseOubliePage() {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); setLoading(false); return; }
      if (data.devCode) { setCode(data.devCode); }
      setStep("reset");
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (newPassword !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); setLoading(false); return; }
      setStep("done");
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center items-center px-4 py-2 rounded-2xl mb-6"
            style={{ background: "#0b1f3a" }}>
            <img src="/garago_logo_transparent_1.png?v=3" alt="Garago" className="h-9 w-auto object-contain" />
          </Link>
          <h1 className="text-2xl font-black mb-1" style={{ color: "#0b1f3a" }}>
            {step === "done" ? "Mot de passe réinitialisé" : "Mot de passe oublié"}
          </h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            {step === "email" && "Entrez votre courriel pour recevoir un code de réinitialisation."}
            {step === "reset" && `Entrez le code envoyé à ${email} et votre nouveau mot de passe.`}
            {step === "done" && "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm mb-4"
            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
            {error}
          </div>
        )}
        {info && (
          <div className="px-4 py-3 rounded-xl text-sm mb-4"
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}>
            {info}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>Courriel</label>
              <input id="email" type="email" required className="garago-input" placeholder="vous@exemple.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? "Envoi…" : "Envoyer le code"}
            </button>
            <p className="text-center text-sm" style={{ color: "#94a3b8" }}>
              <Link href="/connexion" className="font-bold" style={{ color: "#f97316" }}>Retour à la connexion</Link>
            </p>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={confirmReset} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2 text-center" style={{ color: "#0b1f3a" }}>Code reçu par courriel</label>
              <CodeInput value={code} onChange={setCode} disabled={loading} />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>Nouveau mot de passe</label>
              <input id="newPassword" type="password" required minLength={8} className="garago-input"
                placeholder="Minimum 8 caractères"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>Confirmer le mot de passe</label>
              <input id="confirmPassword" type="password" required className="garago-input"
                placeholder="Répétez votre mot de passe"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading || code.length < 6} className="btn-primary w-full py-3 text-base disabled:opacity-50">
              {loading ? "Réinitialisation…" : "Réinitialiser mon mot de passe"}
            </button>
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }}
              className="w-full text-center text-sm font-semibold" style={{ color: "#64748b" }}>
              Utiliser une autre adresse courriel
            </button>
          </form>
        )}

        {step === "done" && (
          <Link href="/connexion" className="btn-primary w-full py-3 text-base flex items-center justify-center">
            Se connecter
          </Link>
        )}
      </div>
    </div>
  );
}
