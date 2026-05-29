"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import type { Lang } from "@/lib/i18n";

export default function Header() {
  const { data: session } = useSession();
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const role = (session?.user as any)?.role;
  const [topServices, setTopServices] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/stats/popular-services")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTopServices(data); })
      .catch(() => {});
  }, []);

  const serviceItems =
    topServices.length >= 2
      ? [
          { label: topServices[0].name, href: `/rechercher?service=${topServices[0].id}` },
          { label: topServices[1].name, href: `/rechercher?service=${topServices[1].id}` },
        ]
      : []; // On n'affiche rien tant que l'API n'a pas répondu

  const navItems = [
    ...serviceItems,
    { label: lang === "fr" ? "Garages vedettes" : "Top Garages", href: "/rechercher?sort=popular" },
    { label: t.nav.pricing, href: "/tarifs" },
  ];

  function toggleLang() {
    setLang(lang === "fr" ? "en" : "fr" as Lang);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: "#0b1f3a" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f97316" }}>
              <span className="text-white font-black text-sm">G</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-black text-xl tracking-tight">GARAGO</span>
              <span className="text-xs font-semibold tracking-widest" style={{ color: "#f97316" }}>CANADA</span>
            </div>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-sm font-semibold text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Toggle FR / EN */}
            <button
              onClick={toggleLang}
              aria-label="Switch language"
              className="flex items-center gap-0.5 text-xs font-black rounded-lg px-2 py-1.5 transition-colors border border-white/20 hover:bg-white/10"
              style={{ touchAction: "manipulation" }}
            >
              <span className={lang === "fr" ? "text-white" : "text-blue-400"}>FR</span>
              <span className="text-blue-600 mx-0.5">|</span>
              <span className={lang === "en" ? "text-white" : "text-blue-400"}>EN</span>
            </button>

            {!session ? (
              <>
                <Link
                  href="/inscription/garage"
                  className="hidden md:flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all text-white border border-white/20 hover:bg-white/10"
                >
                  <span>🔧</span> {t.nav.registerGarage}
                </Link>
                <Link
                  href="/connexion"
                  className="hidden md:block text-sm font-semibold px-4 py-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all"
                >
                  {t.nav.signIn}
                </Link>
                <Link
                  href="/inscription/conducteur"
                  className="text-sm font-bold px-4 py-2 rounded-lg transition-all text-white"
                  style={{ backgroundColor: "#f97316" }}
                >
                  {t.nav.signUp}
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white"
                    style={{ backgroundColor: "#f97316" }}
                  >
                    {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-white">{session.user?.name}</span>
                  <svg className="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs text-gray-500">{t.nav.signedInAs}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{session.user?.name}</p>
                    </div>
                    <Link
                      href={role === "GARAGE_OWNER" ? "/tableau-de-bord/garage" : "/tableau-de-bord/conducteur"}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserOpen(false)}
                    >
                      <span>📊</span> {t.nav.dashboard}
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span>↩</span> {t.nav.signOut}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ touchAction: "manipulation" }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-white/10 py-3 space-y-1 pb-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2.5 text-sm font-semibold text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-3 mt-2 space-y-2">
              {!session ? (
                <>
                  <Link href="/inscription/garage" className="block px-4 py-2.5 text-sm font-semibold text-white border border-white/20 rounded-lg hover:bg-white/10 text-center" onClick={() => setMenuOpen(false)}>
                    {t.nav.registerGarage}
                  </Link>
                  <Link href="/connexion" className="block px-4 py-2.5 text-sm font-semibold text-blue-100 text-center" onClick={() => setMenuOpen(false)}>
                    {t.nav.signIn}
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block w-full px-4 py-2.5 text-sm text-red-300 hover:text-white text-center"
                >
                  {t.nav.signOut}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
