"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { VEHICLE_MAKES } from "@/lib/vehicleData";
import AddressAutocomplete, { type AddressResult } from "@/components/AddressAutocomplete";

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
          className="w-10 h-11 text-center text-lg font-black border-2 rounded-xl focus:outline-none transition-colors bg-white disabled:opacity-50"
          style={{
            borderColor: chars[i].trim() ? "#f97316" : "#e2e8f0",
            color: "#0b1f3a",
          }}
        />
      ))}
    </div>
  );
}

const PLANS = [
  {
    id: "trial",
    label: "Essai gratuit",
    price: "0 $",
    period: "30 jours",
    tag: null,
    color: "#f8fafc",
    border: "#e2e8f0",
    textColor: "#0b1f3a",
    features: [
      "Profil garage complet",
      "Gestion des services & prix",
      "Marques et modèles configurables",
      "Avis clients vérifiés",
      "Horaires d'ouverture",
      "Visible dans les résultats",
    ],
    cta: "Commencer gratuitement",
    ctaStyle: { backgroundColor: "#0b1f3a", color: "white" },
  },
  {
    id: "monthly",
    label: "Pro Mensuel",
    price: "49 $",
    period: "/mois",
    tag: "POPULAIRE",
    color: "#0b1f3a",
    border: "#f97316",
    textColor: "white",
    features: [
      "Tout inclus dans l'essai",
      "Priorité dans les résultats",
      'Badge "Garage certifié Garago"',
      "Réponses aux avis clients",
      "Statistiques détaillées",
      "Support prioritaire 7j/7",
    ],
    cta: "Commencer l'essai 30j gratuit",
    ctaStyle: { backgroundColor: "#f97316", color: "white" },
  },
  {
    id: "annual",
    label: "Pro Annuel",
    price: "39 $",
    period: "/mois",
    tag: "−20%",
    color: "#f8fafc",
    border: "#e2e8f0",
    textColor: "#0b1f3a",
    features: [
      "Tout inclus dans Pro Mensuel",
      "2 mois offerts",
      "Tarif garanti 12 mois",
      "Rapport annuel de performance",
      "Onboarding personnalisé",
    ],
    cta: "Souscrire annuellement",
    ctaStyle: { backgroundColor: "#0b1f3a", color: "white" },
  },
];

export default function InscriptionGaragePage() {
  const router = useRouter();
  const { t } = useLang();
  const r = t.register;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Compte + garage
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [phone,      setPhone]      = useState("");
  const [password,   setPassword]   = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [showConfirm,setShowConfirm]= useState(false);
  const [acceptTerms,setAcceptTerms]= useState(false);
  const [acceptMkt,  setAcceptMkt]  = useState(false);

  // Email verification
  const [codeSent,      setCodeSent]      = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeInput,     setCodeInput]     = useState("");
  const [sendingCode,   setSendingCode]   = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeError,     setCodeError]     = useState("");
  const [codeSentMsg,   setCodeSentMsg]   = useState("");
  const [garageName, setGarageName] = useState("");
  const [garageAddress, setGarageAddress]     = useState("");
  const [garageCity, setGarageCity]           = useState("");
  const [garagePostalCode, setGaragePostalCode] = useState("");
  const [garagePhone, setGaragePhone]         = useState("");
  const [garageLat, setGarageLat]             = useState<number | null>(null);
  const [garageLng, setGarageLng]             = useState<number | null>(null);
  const [referredByCode, setReferredByCode]   = useState("");
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  function handleAddressSelect(r: AddressResult) {
    setGarageAddress(r.streetAddress);
    setGarageCity(r.city);
    setGaragePostalCode(r.postalCode);
    setGarageLat(r.lat);
    setGarageLng(r.lng);
    setAddressConfirmed(true);
  }

  // Step 2 — Services + marques exclues
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [excludedBrands, setExcludedBrands] = useState<string[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);

  // Step 3 — Plan
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function toggleExcludedBrand(brand: string) {
    setExcludedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }

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
      if (data.devCode) {
        setCodeSentMsg(`⚠️ Mode développement — code : ${data.devCode}`);
        setCodeInput(data.devCode);
        verifyCode(data.devCode);
      } else {
        setCodeSentMsg(`Code envoyé à ${email}`);
      }
    } catch { setCodeError("Erreur réseau."); }
    finally { setSendingCode(false); }
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
    } catch { setCodeError("Erreur réseau."); }
    finally { setVerifyingCode(false); }
  }

  function handleCodeChange(val: string) {
    setCodeInput(val);
    setCodeError("");
    if (val.length === 6) verifyCode(val);
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!emailVerified) { setError(r.emailNotVerified); return; }
    if (password !== confirmPwd) { setError(r.pwdMismatch); return; }
    if (!acceptTerms) { setError(r.termsRequired); return; }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName, lastName, email, phone, password,
        marketingConsent: acceptMkt,
        role: "GARAGE_OWNER",
        garageName, garageAddress, garageCity, garagePostalCode, garagePhone,
        garageLat, garageLng,
        referredByCode: referredByCode.trim().toUpperCase() || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue");
      setLoading(false);
      return;
    }

    // Auto sign-in
    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    setStep(2);
  }

  async function handleStep2() {
    setSavingConfig(true);

    // Save services
    if (selectedServices.length > 0) {
      const servicesPayload = selectedServices.map((id) => {
        const cat = SERVICE_CATEGORIES.find((s) => s.id === id);
        return { categoryId: id, categoryName: cat?.name, icon: cat?.icon, name: cat?.name, priceMin: "", priceMax: "", durationMin: "" };
      });
      await fetch("/api/garage/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: servicesPayload }),
      });
    }

    // Save excluded brands
    if (excludedBrands.length > 0) {
      const brandsPayload = excludedBrands.map((brand) => ({ brand, accepts: false }));
      await fetch("/api/garage/brands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brands: brandsPayload }),
      });
    }

    setSavingConfig(false);
    setStep(3);
  }

  const inputClass =
    "block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm bg-white";

  const totalSteps = 3;

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top bar */}
      <div style={{ backgroundColor: "#0b1f3a" }} className="py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex">
            <div className="bg-white rounded-xl px-2 py-0.5">
              <img src="/logo-garago.png" alt="Garago" className="h-8 w-auto object-contain" />
            </div>
          </Link>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            {r.alreadyAccount} <Link href="/connexion" className="text-orange-400 font-semibold hover:underline">{r.signIn}</Link>
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {[
            { num: 1, label: r.gStep1 },
            { num: 2, label: r.gStep2 },
            { num: 3, label: r.gStep3 },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all"
                  style={
                    step > s.num
                      ? { backgroundColor: "#22c55e", color: "white" }
                      : step === s.num
                      ? { backgroundColor: "#f97316", color: "white" }
                      : { backgroundColor: "#e2e8f0", color: "#94a3b8" }
                  }
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span className={`text-xs mt-1 font-semibold ${step >= s.num ? "text-gray-700" : "text-gray-400"}`}>{s.label}</span>
              </div>
              {i < totalSteps - 1 && (
                <div className="w-20 h-0.5 mx-2 mb-4 rounded" style={{ backgroundColor: step > s.num ? "#22c55e" : "#e2e8f0" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1 ─────────────────────────────────── */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <h1 className="text-2xl font-black text-gray-900 mb-1">{r.garageProfileTitle}</h1>
                <p className="text-gray-500 text-sm mb-6">{r.garageProfileSub}</p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
                )}

                <form onSubmit={handleStep1} className="space-y-4">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{r.yourInfo}</p>
                    <div className="space-y-3">

                      {/* Prénom + Nom */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">{r.firstNameLabel}</label>
                          <input type="text" required className={inputClass} placeholder="Jean"
                            value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">{r.lastNameLabel}</label>
                          <input type="text" required className={inputClass} placeholder="Tremblay"
                            value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                      </div>

                      {/* Courriel + envoi code */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">{r.email}</label>
                        <div className="flex gap-2">
                          <input
                            type="email" required
                            className={`${inputClass} flex-1 ${emailVerified ? "opacity-60 pointer-events-none" : ""}`}
                            placeholder="vous@garage.com"
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
                              className="flex-shrink-0 text-xs px-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
                              style={{ background: "#0b1f3a" }}>
                              {sendingCode ? "…" : codeSent ? r.resendCode : r.sendCode}
                            </button>
                          )}
                          {emailVerified && (
                            <div className="flex items-center gap-1 flex-shrink-0 px-2 text-green-600 font-semibold text-sm">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              {r.emailVerified}
                            </div>
                          )}
                        </div>
                        {codeSentMsg && !emailVerified && (
                          <p className="text-xs mt-1 font-medium rounded px-2 py-1"
                            style={codeSentMsg.startsWith("⚠️")
                              ? { color: "#92400e", background: "#fef3c7" }
                              : { color: "#16a34a" }}>
                            {codeSentMsg.startsWith("⚠️") ? codeSentMsg : `✓ ${codeSentMsg} — vérifiez vos courriels.`}
                          </p>
                        )}
                      </div>

                      {/* Saisie du code */}
                      {codeSent && !emailVerified && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">{r.codeLabel}</label>
                          <div className="flex items-center gap-3">
                            <CodeInput value={codeInput} onChange={handleCodeChange} disabled={verifyingCode} />
                            {verifyingCode && (
                              <svg className="w-5 h-5 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                            )}
                          </div>
                          {codeError && <p className="text-xs mt-1 text-red-600 font-medium">{codeError}</p>}
                          <p className="text-xs mt-1 text-gray-400">{r.codeHint}</p>
                        </div>
                      )}

                      {/* Téléphone */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">{r.phone}</label>
                        <input type="tel" required className={inputClass} placeholder="(514) 555-1234"
                          value={phone}
                          onChange={(e) => setPhone(formatPhone(e.target.value))} />
                      </div>

                      {/* Mot de passe */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">{r.password}</label>
                          <div className="relative">
                            <input type={showPwd ? "text" : "password"} required minLength={8}
                              className={`${inputClass} pr-9`} placeholder="Min. 8 caractères"
                              value={password} onChange={(e) => setPassword(e.target.value)} />
                            <button type="button" onClick={() => setShowPwd(!showPwd)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d={showPwd
                                    ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                    : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  }/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">{r.confirmLabel}</label>
                          <div className="relative">
                            <input type={showConfirm ? "text" : "password"} required
                              className={`${inputClass} pr-9 ${
                                confirmPwd.length > 0 && confirmPwd !== password ? "border-red-300" :
                                confirmPwd.length > 0 && confirmPwd === password ? "border-green-300" : ""
                              }`}
                              placeholder="Répétez"
                              value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d={showConfirm
                                    ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                    : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  }/>
                              </svg>
                            </button>
                          </div>
                          {confirmPwd.length > 0 && confirmPwd !== password && (
                            <p className="text-xs mt-1 text-red-500">Ne correspondent pas.</p>
                          )}
                        </div>
                      </div>

                      {/* Consentements */}
                      <div className="space-y-2.5 pt-1">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input type="checkbox" required checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="mt-0.5 w-4 h-4 flex-shrink-0 rounded"
                            style={{ accentColor: "#f97316" }} />
                          <span className="text-xs text-gray-600">
                            J'accepte les{" "}
                            <Link href="/conditions" target="_blank" className="underline font-semibold text-orange-500">
                              conditions d'utilisation
                            </Link>{" "}
                            et la{" "}
                            <Link href="/confidentialite" target="_blank" className="underline font-semibold text-orange-500">
                              politique de confidentialité
                            </Link>{" "}
                            <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input type="checkbox" checked={acceptMkt}
                            onChange={(e) => setAcceptMkt(e.target.checked)}
                            className="mt-0.5 w-4 h-4 flex-shrink-0 rounded"
                            style={{ accentColor: "#f97316" }} />
                          <span className="text-xs text-gray-500">
                            J'accepte de recevoir des courriels de Garago (promotions, conseils).{" "}
                            <span className="text-gray-400">(facultatif)</span>
                          </span>
                        </label>
                      </div>

                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{r.step2}</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">{r.garageName}</label>
                        <input type="text" required className={inputClass} placeholder="Garage Tremblay & Fils" value={garageName} onChange={(e) => setGarageName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          {r.garageAddressLabel}
                        </label>
                        <AddressAutocomplete
                          onSelect={handleAddressSelect}
                          placeholder="Ex : 1234 Rue Saint-Denis, Montréal"
                          inputClass={inputClass}
                        />
                        {addressConfirmed && garageCity && (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 rounded-md font-medium text-gray-600 bg-gray-100">{garageAddress}</span>
                            <span className="px-2 py-1 rounded-md font-medium text-gray-600 bg-gray-100">{garageCity}</span>
                            {garagePostalCode && <span className="px-2 py-1 rounded-md font-medium text-gray-600 bg-gray-100">{garagePostalCode}</span>}
                            <span className="px-2 py-1 rounded-md font-semibold text-green-700 bg-green-50">{r.addressVerified}</span>
                          </div>
                        )}
                        <input type="hidden" required value={garageCity} onChange={() => {}} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">{r.garagePhone}</label>
                        <input type="tel" className={inputClass} placeholder="(514) 555-5678"
                          value={garagePhone}
                          onChange={(e) => setGaragePhone(formatPhone(e.target.value))} />
                      </div>
                    </div>
                  </div>

                  {/* ── Code de parrainage ── */}
                  <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50 p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {r.referralCode}
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Ex : GAR-A1B2C3"
                      value={referredByCode}
                      onChange={(e) => setReferredByCode(e.target.value.toUpperCase())}
                      maxLength={10}
                      style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
                    />
                    <p className="mt-1.5 text-xs text-orange-700">
                      {r.referralHint} <strong>{r.referralDiscount}</strong>.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !emailVerified || !acceptTerms || password !== confirmPwd || !password}
                    className="w-full py-4 rounded-xl font-black text-white text-base transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: "#f97316" }}
                  >
                    {loading ? r.creating : r.next}
                  </button>
                </form>
              </div>
            </div>

            {/* Benefits sidebar */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: "#0b1f3a" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🚀</span>
                  <span className="font-black text-lg">Pourquoi Garago?</span>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: "👁️", text: "Visibilité auprès de milliers de conducteurs québécois chaque jour" },
                    { icon: "📅", text: "Gérez vos horaires et disponibilités en temps réel" },
                    { icon: "⭐", text: "Accumulez des avis vérifiés qui construisent votre réputation" },
                    { icon: "💰", text: "Affichez vos prix — attirez des clients qui savent ce qu'ils veulent" },
                    { icon: "🚗", text: "Indiquez les marques que vous traitez (et celles que vous ne traitez pas)" },
                    { icon: "📊", text: "Tableau de bord centralisé pour tout gérer" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-lg mt-0.5">{item.icon}</span>
                      <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: "#fff7ed" }}>💬</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">"Un client de plus par semaine couvre largement l'abonnement"</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">— Patrick G., Garage Auto-Sport, Laval</p>
                <div className="mt-3 flex">
                  {"★★★★★".split("").map((_, i) => <span key={i} style={{ color: "#f59e0b" }}>★</span>)}
                </div>
              </div>

              <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p className="font-bold text-green-700 mb-1">✓ Aucune carte de crédit requise</p>
                <p className="text-green-600">30 jours complets pour tester la plateforme. Résiliez en 1 clic si ce n'est pas pour vous.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 ─────────────────────────────────── */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2">{r.configureTitle}</h2>
              <p className="text-gray-500">{r.configureSub}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Services */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 className="font-black text-gray-900 mb-1">{r.servicesOffered}</h3>
                <p className="text-xs text-gray-500 mb-4">{r.servicesSub}</p>
                <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1">
                  {SERVICE_CATEGORIES.map((cat) => {
                    const active = selectedServices.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border"
                        style={active
                          ? { backgroundColor: "#fff7ed", borderColor: "#fed7aa" }
                          : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }
                        }
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleService(cat.id)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: "#f97316" }}
                        />
                        <span className="text-lg">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                          <p className="text-xs text-gray-400 truncate">{cat.description}</p>
                        </div>
                        {active && <span className="text-orange-500 font-bold text-sm">✓</span>}
                      </label>
                    );
                  })}
                </div>
                {selectedServices.length > 0 && (
                  <p className="text-xs text-orange-600 font-semibold mt-2">{selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} sélectionné{selectedServices.length > 1 ? "s" : ""}</p>
                )}
              </div>

              {/* Excluded brands */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 className="font-black text-gray-900 mb-1">{r.excludedBrands}</h3>
                <p className="text-xs text-gray-500 mb-4">{r.excludedBrandsSub}</p>
                <div className="flex flex-wrap gap-2 max-h-[380px] overflow-y-auto">
                  {VEHICLE_MAKES.map((brand) => {
                    const excluded = excludedBrands.includes(brand);
                    return (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleExcludedBrand(brand)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border"
                        style={excluded
                          ? { backgroundColor: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" }
                          : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" }
                        }
                      >
                        {excluded ? "✗ " : ""}{brand}
                      </button>
                    );
                  })}
                </div>
                {excludedBrands.length > 0 && (
                  <p className="text-xs text-red-500 font-semibold mt-3">{excludedBrands.length} marque{excludedBrands.length > 1 ? "s" : ""} exclue{excludedBrands.length > 1 ? "s" : ""}</p>
                )}
                <div className="mt-4 p-3 rounded-xl text-xs" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p className="text-green-700 font-semibold">💡 Conseil</p>
                  <p className="text-green-600 mt-0.5">Les garages avec des marques configurées reçoivent 40% plus de clics car les conducteurs savent qu'ils seront accueillis.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                {r.back}
              </button>
              <button
                onClick={handleStep2}
                disabled={savingConfig}
                className="flex-1 py-3 rounded-xl font-black text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#f97316" }}
              >
                {savingConfig ? t.common.save + "…" : r.next}
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm"
              >
                {r.skip}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ─────────────────────────────────── */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4"
                style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#16a34a" }}>
                {r.garageCreated}
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{r.choosePlan}</h2>
              <p className="text-gray-500">{r.choosePlanSub}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className="text-left rounded-2xl p-6 border-2 transition-all card-hover relative"
                    style={{
                      backgroundColor: plan.color,
                      borderColor: isSelected ? "#f97316" : plan.border,
                      boxShadow: isSelected ? "0 0 0 3px rgba(249,115,22,0.2)" : "none",
                    }}
                  >
                    {plan.tag && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black text-white" style={{ backgroundColor: "#f97316" }}>
                        {plan.tag}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: "#f97316" }}>✓</div>
                    )}
                    <h3 className="font-black text-lg mb-1" style={{ color: plan.textColor }}>{plan.label}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-4xl font-black" style={{ color: plan.textColor }}>{plan.price}</span>
                      <span className="text-sm" style={{ color: plan.textColor, opacity: 0.6 }}>{plan.period}</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm" style={{ color: plan.textColor, opacity: plan.id === "monthly" ? 0.9 : 0.7 }}>
                          <span className="text-green-400 font-bold mt-0.5">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* ROI callout */}
            <div className="rounded-2xl p-5 mb-6 flex items-start gap-4" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
              <span className="text-3xl">💡</span>
              <div>
                <p className="font-black text-gray-900 mb-1">Le retour sur investissement est immédiat</p>
                <p className="text-gray-600 text-sm">À 49 $/mois, il suffit d'<strong>un seul nouveau client par mois</strong> pour rentabiliser votre abonnement. La majorité de nos garages partenaires déclarent avoir récupéré leur investissement dès la première semaine.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                {r.back}
              </button>
              <button
                onClick={() => router.push("/tableau-de-bord/garage")}
                className="flex-1 py-4 rounded-xl font-black text-white text-base transition-all hover:opacity-90"
                style={{ backgroundColor: "#f97316" }}
              >
                {r.toDashboard}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              {r.billingNote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
