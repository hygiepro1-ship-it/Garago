"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// ── 6-digit code input ────────────────────────────────────────────────────────

function CodeInput({
  value, onChange, disabled,
}: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
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
    if (e.key === "Backspace" && chars[i].trim() === "" && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="flex gap-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={chars[i].trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-xl font-black border-2 rounded-xl focus:outline-none transition-colors bg-white disabled:opacity-50"
          style={{
            borderColor: chars[i].trim() ? "#f97316" : "#e2e8f0",
            color: "#0b1f3a",
          }}
        />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InscriptionConducteurPage() {
  const router = useRouter();

  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMkt,   setAcceptMkt]   = useState(false);

  // Email verification
  const [codeSent,       setCodeSent]       = useState(false);
  const [emailVerified,  setEmailVerified]  = useState(false);
  const [codeInput,      setCodeInput]      = useState("");
  const [sendingCode,    setSendingCode]    = useState(false);
  const [verifyingCode,  setVerifyingCode]  = useState(false);
  const [codeError,      setCodeError]      = useState("");
  const [codeSentMsg,    setCodeSentMsg]    = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const pwdStrength =
    password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  // ── Send verification code ──────────────────────────────────────────────────
  async function sendCode() {
    setCodeError("");
    setCodeSentMsg("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCodeError("Entrez d'abord une adresse courriel valide.");
      return;
    }
    setSendingCode(true);
    try {
      const res = await fetch("/api/verify-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setCodeError(data.error ?? "Erreur lors de l'envoi."); return; }
      setCodeSent(true);
      setEmailVerified(false);
      setCodeInput("");
      setCodeSentMsg(`Code envoyé à ${email}`);
    } catch {
      setCodeError("Erreur réseau.");
    } finally {
      setSendingCode(false);
    }
  }

  // ── Verify code ─────────────────────────────────────────────────────────────
  async function verifyCode(code: string) {
    if (code.length < 6) return;
    setVerifyingCode(true);
    setCodeError("");
    try {
      const res = await fetch("/api/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setCodeError(data.error ?? "Code invalide."); return; }
      setEmailVerified(true);
      setCodeSentMsg("");
    } catch {
      setCodeError("Erreur réseau.");
    } finally {
      setVerifyingCode(false);
    }
  }

  function handleCodeChange(val: string) {
    setCodeInput(val);
    setCodeError("");
    if (val.length === 6) verifyCode(val);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!emailVerified) { setError("Veuillez vérifier votre adresse courriel."); return; }
    if (password !== confirmPwd) { setError("Les mots de passe ne correspondent pas."); return; }
    if (!acceptTerms) { setError("Vous devez accepter les conditions d'utilisation."); return; }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName, lastName, email, phone, password,
        marketingConsent: acceptMkt,
        role: "DRIVER",
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Une erreur est survenue"); setLoading(false); return; }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/tableau-de-bord/conducteur");
  }

  const eyeIcon = (visible: boolean) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d={visible
          ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        }/>
    </svg>
  );

  return (
    <div className="min-h-screen flex">

      {/* ── Panel gauche ───────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #071428 0%, #0b1f3a 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }} />

        <div className="relative">
          <Link href="/" className="inline-flex mb-10">
            <div className="bg-white rounded-xl px-2.5 py-1">
              <img src="/logo-garago.png" alt="Garago" className="h-9 w-auto object-contain" />
            </div>
          </Link>

          <h2 className="text-3xl font-black text-white leading-snug mb-3">
            Trouvez le bon<br />garage pour<br />
            <span style={{ color: "#f97316" }}>votre voiture.</span>
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            Créez votre compte gratuitement et accédez à 500+ garages partenaires au Québec.
          </p>

          <div className="space-y-4">
            {[
              { icon: "🔍", title: "Recherche par marque et modèle",  desc: "Trouvez exactement les garages qui connaissent votre véhicule." },
              { icon: "💰", title: "Prix affichés, sans surprise",    desc: "Comparez les tarifs avant de vous déplacer." },
              { icon: "📅", title: "Réservation en ligne",           desc: "Choisissez votre créneau en quelques secondes." },
              { icon: "🔔", title: "Rappels d'entretien",            desc: "Ne ratez plus une vidange ou un changement de pneus." },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)" }}>
                  {b.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{b.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative p-4 rounded-xl mt-8"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-1 mb-1">
            {[1,2,3,4,5].map(i => <span key={i} style={{ color: "#f59e0b", fontSize: 12 }}>★</span>)}
            <span className="text-white font-black text-sm ml-1">4.7 / 5</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
            &ldquo;Pratique et rapide — j'ai trouvé un garage adapté à ma Civic en 2 minutes.&rdquo;
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.22)" }}>— Julie M., Sherbrooke</p>
        </div>
      </div>

      {/* ── Panel droit — formulaire ────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-4 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">

          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex justify-center">
              <img src="/logo-garago.png" alt="Garago" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          <h1 className="text-2xl font-black mb-1" style={{ color: "#0b1f3a" }}>Créer mon compte</h1>
          <p className="text-sm mb-7" style={{ color: "#94a3b8" }}>
            Déjà un compte ?{" "}
            <Link href="/connexion" className="font-bold" style={{ color: "#f97316" }}>Se connecter</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
                ⚠️ {error}
              </div>
            )}

            {/* Prénom / Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>Prénom</label>
                <input type="text" required className="garago-input" placeholder="Marie"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>Nom de famille</label>
                <input type="text" required className="garago-input" placeholder="Tremblay"
                  value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            {/* Courriel + bouton d'envoi */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>
                Adresse courriel
              </label>
              <div className="flex gap-2">
                <input
                  type="email" required
                  className={`garago-input flex-1 ${emailVerified ? "opacity-60 pointer-events-none" : ""}`}
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailVerified(false);
                    setCodeSent(false);
                    setCodeInput("");
                    setCodeError("");
                    setCodeSentMsg("");
                  }}
                />
                {!emailVerified && (
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={sendingCode || !email}
                    className="flex-shrink-0 text-xs px-3 py-2 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{ background: "#0b1f3a" }}>
                    {sendingCode ? "…" : codeSent ? "Renvoyer" : "Envoyer le code"}
                  </button>
                )}
                {emailVerified && (
                  <div className="flex items-center gap-1 flex-shrink-0 px-3 text-green-600 font-semibold text-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Vérifié
                  </div>
                )}
              </div>

              {/* Message d'envoi */}
              {codeSentMsg && !emailVerified && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: "#16a34a" }}>
                  ✓ {codeSentMsg} — vérifiez vos courriels (et vos indésirables).
                </p>
              )}
            </div>

            {/* Saisie du code */}
            {codeSent && !emailVerified && (
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: "#0b1f3a" }}>
                  Code de vérification
                </label>
                <div className="flex items-center gap-3">
                  <CodeInput value={codeInput} onChange={handleCodeChange} disabled={verifyingCode} />
                  {verifyingCode && (
                    <svg className="w-5 h-5 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  )}
                </div>
                {codeError && (
                  <p className="text-xs mt-1.5 text-red-600 font-medium">{codeError}</p>
                )}
                <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>
                  Entrez le code à 6 chiffres reçu par courriel. Valide 15 minutes.
                </p>
              </div>
            )}

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>
                Téléphone <span style={{ fontWeight: 500, color: "#94a3b8" }}>(optionnel)</span>
              </label>
              <input type="tel" className="garago-input" placeholder="(514) 555-1234"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))} />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>Mot de passe</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} required minLength={8}
                  className="garago-input pr-10" placeholder="Minimum 8 caractères"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {eyeIcon(showPwd)}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  {[1,2,3].map((i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                      style={{ background: i <= pwdStrength
                        ? (pwdStrength === 3 ? "#10b981" : pwdStrength === 2 ? "#f59e0b" : "#ef4444")
                        : "#e2e8f0" }} />
                  ))}
                  <span className="text-xs ml-1" style={{ color: "#94a3b8" }}>
                    {pwdStrength === 1 ? "Faible" : pwdStrength === 2 ? "Moyen" : pwdStrength === 3 ? "Fort" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} required
                  className={`garago-input pr-10 ${
                    confirmPwd.length > 0 && confirmPwd !== password
                      ? "border-red-300 focus:border-red-400"
                      : confirmPwd.length > 0 && confirmPwd === password
                      ? "border-green-300 focus:border-green-400"
                      : ""
                  }`}
                  placeholder="Répétez votre mot de passe"
                  value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {eyeIcon(showConfirm)}
                </button>
              </div>
              {confirmPwd.length > 0 && confirmPwd !== password && (
                <p className="text-xs mt-1 text-red-500 font-medium">Les mots de passe ne correspondent pas.</p>
              )}
              {confirmPwd.length > 0 && confirmPwd === password && (
                <p className="text-xs mt-1 text-green-600 font-medium">✓ Les mots de passe correspondent.</p>
              )}
            </div>

            {/* Cases à cocher */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                  style={{ accentColor: "#f97316" }}
                />
                <span className="text-sm" style={{ color: "#374151" }}>
                  J'accepte les{" "}
                  <Link href="/conditions" target="_blank" className="font-semibold underline" style={{ color: "#f97316" }}>
                    conditions d'utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link href="/confidentialite" target="_blank" className="font-semibold underline" style={{ color: "#f97316" }}>
                    politique de confidentialité
                  </Link>{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptMkt}
                  onChange={(e) => setAcceptMkt(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                  style={{ accentColor: "#f97316" }}
                />
                <span className="text-sm" style={{ color: "#6b7280" }}>
                  J'accepte de recevoir des courriels de Garago (promotions, conseils, nouveautés).{" "}
                  <span className="text-xs">(facultatif)</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !emailVerified || !acceptTerms || password !== confirmPwd || !password}
              className="btn-primary w-full py-3 text-base mt-2">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg> Création…
                  </span>
                : "Créer mon compte gratuitement"
              }
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid #e2e8f0" }}>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Propriétaire d'un garage ?{" "}
              <Link href="/inscription/garage" className="font-bold" style={{ color: "#f97316" }}>
                Inscrire mon garage →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
