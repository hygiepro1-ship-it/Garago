"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLang();
  const f = t.footer;

  // Stats live (null = sous le seuil, ne pas afficher)
  const [liveReviews, setLiveReviews] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/stats/homepage")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.reviews) setLiveReviews(d.reviews); })
      .catch(() => {});
  }, []);

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
    { label: f.pricing,      href: "/tarifs" },
    { label: f.dashboard,    href: "/tableau-de-bord/garage" },
    { label: f.signIn,       href: "/connexion" },
  ];

  const SERVICE_LINKS = [
    { label: `🛢️  ${f.oilChange}`,   href: "/rechercher?service=oil" },
    { label: `❄️  ${f.winterTires}`, href: "/rechercher?service=tires-winter" },
    { label: `🔴  ${f.brakes}`,      href: "/rechercher?service=brakes" },
    { label: `💨  ${f.ac}`,          href: "/rechercher?service=ac" },
    { label: `⚡  ${f.diagnostic}`,  href: "/rechercher?service=electrical" },
    { label: `🔍  ${f.autoService}`, href: "/rechercher?service=inspection" },
  ];

  return (
    <footer style={{ background: "#071428", color: "#475569" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex mb-5">
              <div className="bg-white rounded-xl px-3 py-1.5">
                <img src="/logo-garago.png" alt="Garago" className="h-10 w-auto object-contain" />
              </div>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
              {f.tagline}
            </p>
            <div className="flex items-center gap-2 mt-5 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <span style={{ color: "#f59e0b" }}>★★★★★</span>
              <span className="text-white font-black text-sm">4.7/5</span>
              {liveReviews && (
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
                  — {liveReviews} avis
                </span>
              )}
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

          {/* Services */}
          <div>
            <h4 className="font-black text-white text-sm mb-4">{f.popularServices}</h4>
            <ul className="space-y-2.5 text-sm">
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            © {new Date().getFullYear()} Garago Technologies Inc. {f.rights}
          </p>
          <div className="flex items-center gap-6 text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            <span className="cursor-pointer hover:text-white transition-colors">{f.privacy}</span>
            <span className="cursor-pointer hover:text-white transition-colors">{f.terms}</span>
            <Link href="/faq" className="hover:text-white transition-colors">{f.faq}</Link>
            <Link href="/tarifs" className="hover:text-white transition-colors">{f.pricing}</Link>
            <Link href="/suggestions" className="hover:text-white transition-colors">💡 Suggestions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
