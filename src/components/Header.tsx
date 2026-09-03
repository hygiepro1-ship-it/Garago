"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLang } from "@/contexts/LanguageContext";
import type { Lang } from "@/lib/i18n";
import type { Session } from "next-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "GARAGE_OWNER" | "DRIVER" | undefined;

function getUserRole(session: Session | null): UserRole {
  return (session?.user as any)?.role as UserRole;
}

function getDashboardHref(role: UserRole): string {
  return role === "GARAGE_OWNER" ? "/tableau-de-bord/garage" : "/tableau-de-bord/conducteur";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useClickOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);
  return ref;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SearchBar() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/rechercher?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit}
      className="hidden md:flex flex-1 max-w-sm items-center rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
      <span className="pl-3 flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Service, marque, garage…"
        className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none"
        style={{ color: "white" }}
      />
      <button type="submit" className="px-4 py-2.5 text-sm font-bold text-white flex-shrink-0"
        style={{ background: "#f97316" }}>
        Chercher
      </button>
    </form>
  );
}

interface UserMenuProps {
  session: Session;
  role:    UserRole;
}

function UserMenu({ session, role }: UserMenuProps) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const initial = session.user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)" }}>
          {initial}
        </div>
        <span className="hidden md:block text-sm font-semibold text-white">
          {session.user?.name?.split(" ")[0]}
        </span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ color: "rgba(255,255,255,0.4)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl py-2 z-50 animate-slide-down"
          style={{ boxShadow: "0 12px 40px rgba(11,31,58,0.18)", border: "1px solid #e2e8f0" }}>
          <div className="px-4 py-3 border-b border-gray-100 mb-1">
            <p className="text-xs font-semibold text-gray-400">{t.nav.signedInAs}</p>
            <p className="text-sm font-bold truncate" style={{ color: "#0b1f3a" }}>{session.user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
          </div>
          <Link
            href={getDashboardHref(role)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(false)}>
            <span className="w-6 h-6 flex items-center justify-center rounded-lg text-xs"
              style={{ background: "#fff4ed", color: "#f97316" }}>📊</span>
            {t.nav.dashboard}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
            <span className="w-6 h-6 flex items-center justify-center rounded-lg text-xs bg-red-50">↩</span>
            {t.nav.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

interface MobileMenuProps {
  open:     boolean;
  session:  Session | null;
  navItems: { label: string; href: string }[];
  onClose:  () => void;
}

function MobileMenu({ open, session, navItems, onClose }: MobileMenuProps) {
  const { t } = useLang();
  if (!open) return null;

  return (
    <div style={{ background: "#0b1f3a", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}
            className="block px-4 py-3 text-sm font-semibold rounded-xl"
            style={{ color: "rgba(255,255,255,0.75)" }}
            onClick={onClose}>
            {item.label}
          </Link>
        ))}

        <div className="pt-3 border-t space-y-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {!session ? (
            <>
              <Link href="/connexion"
                className="block px-4 py-3 text-sm font-bold text-center rounded-xl border"
                style={{ color: "#f97316", borderColor: "#f97316" }}
                onClick={onClose}>{t.nav.signIn}</Link>
              <Link href="/inscription/conducteur"
                className="block px-4 py-3 text-sm font-bold text-center rounded-xl text-white"
                style={{ background: "#f97316" }}
                onClick={onClose}>{t.nav.signUp}</Link>
              <Link href="/inscription/garage"
                className="block px-4 py-3 text-sm font-semibold text-center rounded-xl"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onClick={onClose}>🔧 {t.nav.registerGarage}</Link>
            </>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full px-4 py-3 text-sm font-semibold text-center text-red-400">
              {t.nav.signOut}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header() {
  const { data: session } = useSession();
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const role    = getUserRole(session);
  const isHome  = pathname === "/";

  const NAV = [
    { label: t.nav.findGarage, href: "/rechercher" },
    { label: t.nav.catalog,    href: "/prestations" },
    { label: t.nav.tips,       href: "/conseils" },
    { label: t.nav.pricing,    href: "/tarifs" },
  ];

  return (
    <header className="sticky top-0 z-50"
      style={{ background: "#0b1f3a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-5 h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img src="/garago_logo_transparent_1.png" alt="Garago" className="h-11 w-auto object-contain" />
          </Link>

          {/* Search — hidden on homepage */}
          {!isHome && <SearchBar />}

          <div className="flex-1" />

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className="px-3 py-2 text-sm font-semibold rounded-lg transition-colors"
                style={{ color: pathname === item.href ? "#f97316" : "rgba(255,255,255,0.6)" }}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr" as Lang)}
            className="hidden sm:block text-xs font-black px-2 py-1 rounded-lg border transition-colors"
            style={{ color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.12)" }}>
            {lang === "fr" ? "EN" : "FR"}
          </button>

          {/* Auth */}
          {session ? (
            <UserMenu session={session} role={role} />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/connexion"
                className="hidden md:block text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                style={{ color: "rgba(255,255,255,0.65)" }}>
                {t.nav.signIn}
              </Link>
              <Link href="/inscription/conducteur"
                className="text-sm font-bold px-4 py-2 rounded-lg text-white"
                style={{ background: "#f97316", boxShadow: "0 2px 10px rgba(249,115,22,0.4)" }}>
                {t.nav.signUp}
              </Link>
              <Link href="/inscription/garage"
                className="hidden lg:flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg border transition-colors"
                style={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.15)" }}>
                🔧 {t.nav.registerGarage}
              </Link>
            </div>
          )}

          {/* Hamburger */}
          <button className="lg:hidden p-2 rounded-xl" style={{ color: "rgba(255,255,255,0.7)" }}
            onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>

        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        session={session}
        navItems={NAV}
        onClose={() => setMenuOpen(false)}
      />
    </header>
  );
}
