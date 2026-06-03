"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

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

      {/* Panel gauche — navy Garago */}
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

          <h2 className="text-3xl font-black text-white leading-snug mb-4">
            {a.welcomeTitle.split("Garago.")[0]}<br />
            <span style={{ color: "#f97316" }}>Garago.</span>
          </h2>
          <p className="text-sm leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.4)" }}>
            {a.welcomeSub}
          </p>

          <div className="space-y-4">
            {[
              { icon: "🔒", text: a.secureLogin },
              { icon: "📅", text: a.appointmentHistory },
              { icon: "❤️", text: a.savedFavorites },
              { icon: "🔔", text: a.customReminders },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)" }}>
                  {f.icon}
                </div>
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative p-4 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-1 mb-1.5">
            {[1,2,3,4,5].map(i => <span key={i} style={{ color: "#f59e0b", fontSize: 13 }}>★</span>)}
            <span className="text-white font-black text-sm ml-1">4.7 / 5</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
            &ldquo;J'ai trouvé un super garage pour mon BMW en 2 minutes, avec le prix affiché d'avance. Incroyable.&rdquo;
          </p>
          <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>— Pierre G., Montréal</p>
        </div>
      </div>

      {/* Panel droit — formulaire */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-sm">

          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex justify-center">
              <img src="/logo-garago.png" alt="Garago" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          <h1 className="text-2xl font-black mb-1" style={{ color: "#0b1f3a" }}>{a.signIn}</h1>
          <p className="text-sm mb-8" style={{ color: "#94a3b8" }}>
            {a.noAccount}{" "}
            <Link href="/inscription/conducteur" className="font-bold" style={{ color: "#f97316" }}>
              {a.signUpFree}
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
                ⚠️ {error}
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
                <button type="button" className="text-xs font-semibold" style={{ color: "#f97316" }}>
                  {a.forgotPwd}
                </button>
              </div>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} required className="garago-input pr-10"
                  placeholder={a.pwdPlaceholder}
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
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
