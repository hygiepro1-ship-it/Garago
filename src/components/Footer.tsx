"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLang();
  const f = t.footer;

  const DRIVER_LINKS = [
    { label: f.findGarage,  href: "/rechercher" },
    { label: f.oilChange,   href: "/rechercher?service=oil" },
    { label: f.winterTires, href: "/rechercher?service=tires-winter" },
    { label: f.brakes,      href: "/rechercher?service=brakes" },
    { label: f.ac,          href: "/rechercher?service=ac" },
    { label: f.myAccount,   href: "/tableau-de-bord/conducteur" },
  ];

  const GARAGE_LINKS = [
    { label: f.registerFree, href: "/inscription/garage" },
    { label: f.pricing,      href: "/garagistes" },
    { label: f.dashboard,    href: "/tableau-de-bord/garage" },
    { label: f.signIn,       href: "/connexion" },
  ];

  const SERVICE_LINKS = [
    { icon: "/icons/oil.png",         label: f.oilChange,   href: "/rechercher?service=oil" },
    { icon: "/icons/tires-winter.png",label: f.winterTires, href: "/rechercher?service=tires-winter" },
    { icon: "/icons/brakes.png",      label: f.brakes,      href: "/rechercher?service=brakes" },
    { icon: "/icons/ac.png",          label: f.ac,          href: "/rechercher?service=ac" },
    { icon: "/icons/electrical.png",  label: f.diagnostic,  href: "/rechercher?service=electrical" },
    { icon: "/icons/inspection.png",  label: f.autoService, href: "/rechercher?service=inspection" },
  ];

  return (
    <footer style={{ background: "#071428", color: "#475569" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-8 md:gap-10 mb-10 md:mb-12">

          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex mb-5">
              <img src="/logo-garago-400.webp" width={400} height={124} alt="Garago" decoding="async" className="h-10 w-auto object-contain" />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
              {f.tagline}
            </p>

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3 mt-5">
              <a href="https://www.linkedin.com/company/garago-canada/" target="_blank" rel="noopener noreferrer"
                aria-label="Garago sur LinkedIn"
                className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#0A66C2"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 11.01-4.13 2.07 2.07 0 01-.01 4.13zM7.12 20.45H3.56V9h3.56v11.45z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/garago.ca" target="_blank" rel="noopener noreferrer"
                aria-label="Garago sur Instagram"
                className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#E1306C"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="3" width="18" height="18" rx="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Conducteurs */}
          <div>
            <h4 className="font-black text-white text-sm mb-4">{f.drivers}</h4>
            <ul className="space-y-2.5 text-sm">
              {DRIVER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Garages */}
          <div>
            <h4 className="font-black text-white text-sm mb-4">{f.garages}</h4>
            <ul className="space-y-2.5 text-sm">
              {GARAGE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services : sur deux colonnes sous les deux autres listes, sur téléphone */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-black text-white text-sm mb-4">{f.popularServices}</h4>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-6 gap-y-2.5 text-sm">
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex items-center gap-2 transition-colors hover:text-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.icon} alt="" width={16} height={16} style={{ filter: "brightness(0) invert(1)", opacity: 0.5, flexShrink: 0 }} />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
            © {new Date().getFullYear()} Garago Technologies Inc. {f.rights}
          </p>
          {/* Les liens passent à la ligne au lieu de déborder de l'écran. */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            <Link href="/confidentialite" className="hover:text-white transition-colors">{f.privacy}</Link>
            <Link href="/conditions" className="hover:text-white transition-colors">{f.terms}</Link>
            <Link href="/a-propos" className="hover:text-white transition-colors">À propos</Link>
            <Link href="/faq" className="hover:text-white transition-colors">{f.faq}</Link>
            <Link href="/garagistes" className="hover:text-white transition-colors">{f.pricing}</Link>
            <Link href="/suggestions" className="hover:text-white transition-colors flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6M12 2a7 7 0 00-4 12.9V17a2 2 0 002 2h4a2 2 0 002-2v-2.1A7 7 0 0012 2z"/>
              </svg>
              Suggestions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
