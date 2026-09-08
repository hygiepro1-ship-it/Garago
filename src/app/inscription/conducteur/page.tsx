/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d={visible
          ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        }/>
    </svg>
  );
}

function LeftPanel() {
  const benefits = [
    {
      icon: (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
      title: "Recherche par marque et modèle",
      desc: "Trouvez exactement les garages qui connaissent votre véhicule.",
    },
    {
      icon: (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
      title: "Réservation en ligne",
      desc: "Choisissez votre créneau en quelques secondes.",
    },
    {
      icon: (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>),
      title: "Rappels d'entretien",
      desc: "Ne ratez plus une vidange ou un changement de pneus.",
    },
    {
      icon: (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>),
      title: "Garages favoris",
      desc: "Sauvegardez vos garages de confiance pour y revenir facilement.",
    },
  ];

  return (
    <div className="hidden lg:flex flex-col justify-between w-[400px] flex-shrink-0 p-10 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #071428 0%, #0b1f3a 100%)" }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }} />

      <div className="relative">
        <Link href="/" className="inline-flex mb-10">
          <img src="/garago_logo_transparent_1.png" alt="Garago" className="h-9 w-auto object-contain" />
        </Link>

        <h2 className="text-3xl font-black text-white leading-snug mb-3">
          Trouvez le bon<br />garage pour<br />
          <span style={{ color: "#f97316" }}>votre voiture.</span>
        </h2>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          Créez votre compte gratuitement et accédez aux garages partenaires au Québec.
        </p>

        <div className="space-y-4">
          {benefits.map((b) => (
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
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: "#f59e0b", fontSize: 12 }}>★</span>
          ))}
          <span className="text-white font-black text-sm ml-1">4.7 / 5</span>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
          &ldquo;Pratique et rapide — j'ai trouvé un garage adapté à ma Civic en 2 minutes.&rdquo;
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.22)" }}>— Julie M., Sherbrooke</p>
      </div>
    </div>
  );
}

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
    <div className="flex gap-2">
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InscriptionConducteurPage() {
  const router = useRouter();
  const { t } = useLang();
  const r = t.register;

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

  const [codeSent,      setCodeSent]      = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeInput,     setCodeInput]     = useState("");
  const [sendingCode,   setSendingCode]   = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeError,     setCodeError]     = useState("");
  const [codeSentMsg,   setCodeSentMsg]   = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const pwdStrength =
    password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  async function sendCode() {
    setCodeError(""); setCodeSentMsg("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCodeError("Entrez d'abord une adresse courriel valide.");
      return;
    }
    setSendingCode(true);
    try {
      const res  = await fetch("/api/verify-email/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setCodeError(data.error ?? "Erreur lors de l'envoi."); return; }
      setCodeSent(true); setEmailVerified(false); setCodeInput("");
      if (data.devCode) {
        setCodeSentMsg(`⚠️ Mode développement — code : ${data.devCode}`);
        setCodeInput(data.devCode);
        verifyCode(data.devCode);
      } else {
        setCodeSentMsg(`Code envoyé à ${email}`);
      }
    } catch { setCodeError("Erreur réseau."); }
    finally  { setSendingCode(false); }
  }

  async function verifyCode(code: string) {
    if (code.length < 6) return;
    setVerifyingCode(true); setCodeError("");
    try {
      const res  = await fetch("/api/verify-email/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setCodeError(data.error ?? "Code invalide."); return; }
      setEmailVerified(true); setCodeSentMsg("");
    } catch { setCodeError("Erreur réseau."); }
    finally  { setVerifyingCode(false); }
  }

  function handleCodeChange(val: string) {
    setCodeInput(val); setCodeError("");
    if (val.length === 6) verifyCode(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (password !== confirmPwd) { setError(r.pwdMismatch); return; }
    if (!acceptTerms)            { setError(r.termsRequired); return; }

    setLoading(true);
    const res  = await fetch("/api/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, phone, password, marketingConsent: acceptMkt, role: "DRIVER" }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Une erreur est survenue"); setLoading(false); return; }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/tableau-de-bord/conducteur");
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {/* ── Panel droit — formulaire ── */}
      <div className="flex-1 flex items-start justify-center px-4 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">

          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex justify-center items-center px-4 py-2 rounded-2xl"
              style={{ background: "#0b1f3a" }}>
              <img src="/garago_logo_transparent_1.png" alt="Garago" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          <h1 className="text-2xl font-black mb-1" style={{ color: "#0b1f3a" }}>{r.titleDriver}</h1>
          <p className="text-sm mb-7" style={{ color: "#94a3b8" }}>
            {r.alreadyAccount}{" "}
            <Link href="/connexion" className="font-bold" style={{ color: "#f97316" }}>{r.signIn}</Link>
          </p>

          {/* Social login */}
          <div className="space-y-2.5 mb-6">
            <button type="button"
              onClick={() => signIn("google", { callbackUrl: "/tableau-de-bord/conducteur" })}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-semibold text-sm transition-all active:scale-[0.98]"
              style={{ borderColor: "#e2e8f0", color: "#374151", background: "#fff", minHeight: 48 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" }}>ou créer un compte avec e-mail</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

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
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>{r.firstName}</label>
                <input type="text" required className="garago-input" placeholder="Marie"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>{r.lastName}</label>
                <input type="text" required className="garago-input" placeholder="Tremblay"
                  value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            {/* Courriel */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>{r.email}</label>
              <input type="email" required className="garago-input" placeholder="vous@exemple.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>
                Téléphone <span style={{ fontWeight: 500, color: "#94a3b8" }}>(optionnel)</span>
              </label>
              <input type="tel" className="garago-input" placeholder="(514) 555-1234"
                value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>{r.password}</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} required minLength={8}
                  className="garago-input pr-10" placeholder="Minimum 8 caractères"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <EyeIcon visible={showPwd} />
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 2, 3].map((i) => (
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
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>{r.confirmPassword}</label>
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
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
              {confirmPwd.length > 0 && confirmPwd !== password && (
                <p className="text-xs mt-1 text-red-500 font-medium">{r.pwdMismatch}.</p>
              )}
              {confirmPwd.length > 0 && confirmPwd === password && (
                <p className="text-xs mt-1 text-green-600 font-medium">✓ Les mots de passe correspondent.</p>
              )}
            </div>

            {/* Cases à cocher */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded flex-shrink-0" style={{ accentColor: "#f97316" }} />
                <span className="text-sm" style={{ color: "#374151" }}>
                  J'accepte les{" "}
                  <Link href="/conditions" target="_blank" className="font-semibold underline" style={{ color: "#f97316" }}>
                    conditions d'utilisation
                  </Link>{" "}et la{" "}
                  <Link href="/confidentialite" target="_blank" className="font-semibold underline" style={{ color: "#f97316" }}>
                    politique de confidentialité
                  </Link>{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acceptMkt}
                  onChange={(e) => setAcceptMkt(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded flex-shrink-0" style={{ accentColor: "#f97316" }} />
                <span className="text-sm" style={{ color: "#6b7280" }}>
                  J'accepte de recevoir des courriels de Garago (promotions, conseils, nouveautés).{" "}
                  <span className="text-xs">(facultatif)</span>
                </span>
              </label>
            </div>

            <button type="submit"
              disabled={loading || !acceptTerms || password !== confirmPwd || !password}
              className="btn-primary w-full py-3 text-base mt-2">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg> {r.creating}
                  </span>
                : r.createAccount
              }
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid #e2e8f0" }}>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              {t.auth.garageOwner}{" "}
              <Link href="/inscription/garage" className="font-bold" style={{ color: "#f97316" }}>
                {r.registerGarage} →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
