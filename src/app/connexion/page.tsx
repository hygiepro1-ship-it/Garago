/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

// ─── Sub-components ───────────────────────────────────────────────────────────

function LeftPanel({ labels }: { labels: ReturnType<typeof useLang>["t"]["auth"] }) {
  const a = labels;
  const features = [
    { icon: (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>), text: a.secureLogin },
    { icon: (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>), text: a.appointmentHistory },
    { icon: (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>), text: a.savedFavorites },
    { icon: (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>), text: a.customReminders },
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

        <h2 className="text-3xl font-black text-white leading-snug mb-4">
          {a.welcomeTitle.split("Garago.")[0]}<br />
          <span style={{ color: "#f97316" }}>Garago.</span>
        </h2>
        <p className="text-sm leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.4)" }}>
          {a.welcomeSub}
        </p>

        <div className="space-y-4">
          {features.map((feat) => (
            <div key={feat.text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)" }}>
                {feat.icon}
              </div>
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>{feat.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative p-4 rounded-xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-1 mb-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: "#f59e0b", fontSize: 13 }}>★</span>
          ))}
          <span className="text-white font-black text-sm ml-1">4.7 / 5</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
          &ldquo;J'ai trouvé un super garage pour mon BMW en 2 minutes. Réservation simple, service impeccable. Incroyable.&rdquo;
        </p>
        <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>— Pierre G., Montréal</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConnexionPage() {
  const router = useRouter();
  const { t } = useLang();
  const a = t.auth;
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPwd,  setShowPwd]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError(a.invalidCreds);
      setLoading(false);
    } else {
      const session = await fetch("/api/auth/session").then((r) => r.json());
      const role = session?.user?.role;
      router.push(role === "GARAGE_OWNER" ? "/tableau-de-bord/garage" : "/tableau-de-bord/conducteur");
    }
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel labels={a} />

      {/* Panel droit — formulaire */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-sm">

          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex justify-center items-center px-4 py-2 rounded-2xl"
              style={{ background: "#0b1f3a" }}>
              <img src="/garago_logo_transparent_1.png" alt="Garago" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          <h1 className="text-2xl font-black mb-1" style={{ color: "#0b1f3a" }}>{a.signIn}</h1>
          <p className="text-sm mb-8" style={{ color: "#94a3b8" }}>
            {a.noAccount}{" "}
            <Link href="/inscription/conducteur" className="font-bold" style={{ color: "#f97316" }}>
              {a.signUpFree}
            </Link>
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
            <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" }}>ou continuer avec e-mail</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#0b1f3a" }}>{a.email}</label>
              <input type="email" required className="garago-input" placeholder={a.emailPlaceholder}
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold" style={{ color: "#0b1f3a" }}>{a.password}</label>
                <Link href="/mot-de-passe-oublie" className="text-xs font-semibold" style={{ color: "#f97316" }}>
                  {a.forgotPwd}
                </Link>
              </div>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} required className="garago-input pr-10"
                  placeholder={a.pwdPlaceholder}
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={showPwd
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      }/>
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg> {a.signingIn}
                  </span>
                : a.signInBtn
              }
            </button>
          </form>

          <div className="mt-8 pt-6 text-center" style={{ borderTop: "1px solid #e2e8f0" }}>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              {a.garageOwner}{" "}
              <Link href="/inscription/garage" className="font-bold" style={{ color: "#f97316" }}>
                {a.registerGarage} →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
