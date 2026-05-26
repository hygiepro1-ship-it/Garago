"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";


export default function Footer() {
  const { lang, t } = useLang();
  const f = t.footer;

  return (
    <footer style={{ backgroundColor: "#071428" }} className="text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-white" style={{ backgroundColor: "#f97316" }}>
                G
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-black text-lg tracking-tight">GARAGO</span>
                <span className="text-xs font-bold tracking-widest" style={{ color: "#f97316" }}>CANADA</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-gray-500">{f.tagline}</p>
            <div className="flex items-center gap-2 mt-5 px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <span className="text-yellow-400">★★★★★</span>
              <span className="text-white font-bold">4.7/5</span>
              <span className="text-gray-500">— 8 000+ {lang === "en" ? "reviews" : "avis"}</span>
            </div>
          </div>

          {/* Conducteurs / Drivers */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4">{f.drivers}</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: f.findGarage,   href: "/rechercher" },
                { label: f.autoService,  href: "/rechercher?service=engine" },
                { label: f.tireChange,   href: "/rechercher?service=tires-winter" },
                { label: f.brakes,       href: "/rechercher?service=brakes" },
                { label: f.myAccount,    href: "/tableau-de-bord/conducteur" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Garages */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4">{f.garages}</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: f.registerFree, href: "/inscription/garage" },
                { label: f.pricing,      href: "/tarifs" },
                { label: f.dashboard,    href: "/tableau-de-bord/garage" },
                { label: f.signIn,       href: "/connexion" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services populaires */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4">{f.popularServices}</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: `🛢️ ${f.oilChange}`,    href: "/rechercher?service=oil" },
                { label: `❄️ ${f.winterTires}`,  href: "/rechercher?service=tires-winter" },
                { label: `🔴 ${f.brakes}`,       href: "/rechercher?service=brakes" },
                { label: `💨 ${f.ac}`,           href: "/rechercher?service=ac" },
                { label: `⚡ ${f.diagnostic}`,   href: "/rechercher?service=electrical" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Garago. {f.rights}</p>
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <span>{f.madeWith}</span>
            <Link href="/tarifs" className="hover:text-gray-400 transition-colors">{f.pricing}</Link>
            <span className="text-gray-700">{f.privacy}</span>
            <span className="text-gray-700">{f.terms}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
