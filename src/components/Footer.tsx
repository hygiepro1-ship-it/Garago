"use client";

import Link from "next/link";

const DRIVER_LINKS = [
  { label: "Rechercher un garage",  href: "/rechercher" },
  { label: "Vidange d'huile",       href: "/rechercher?service=oil" },
  { label: "Pneus d'hiver",         href: "/rechercher?service=tires-winter" },
  { label: "Freins",                href: "/rechercher?service=brakes" },
  { label: "Climatisation",         href: "/rechercher?service=ac" },
  { label: "Mon espace conducteur", href: "/tableau-de-bord/conducteur" },
];

const GARAGE_LINKS = [
  { label: "Inscrire mon garage",   href: "/inscription/garage" },
  { label: "Voir les tarifs",       href: "/tarifs" },
  { label: "Tableau de bord",       href: "/tableau-de-bord/garage" },
  { label: "Connexion",             href: "/connexion" },
];

const SERVICE_LINKS = [
  { label: "🛢️  Vidange d'huile",   href: "/rechercher?service=oil" },
  { label: "❄️  Pneus d'hiver",     href: "/rechercher?service=tires-winter" },
  { label: "🔴  Freins",            href: "/rechercher?service=brakes" },
  { label: "💨  Climatisation",     href: "/rechercher?service=ac" },
  { label: "⚡  Diagnostic élec.", href: "/rechercher?service=electrical" },
  { label: "🔍  Inspection",        href: "/rechercher?service=inspection" },
];

export default function Footer() {
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
              La plateforme de référence pour trouver, comparer et réserver un garage au Québec.
              Prix affichés, avis vérifiés, réservation en ligne.
            </p>
            <div className="flex items-center gap-2 mt-5 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <span style={{ color: "#f59e0b" }}>★★★★★</span>
              <span className="text-white font-black text-sm">4.7/5</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>— 8 000+ avis</span>
            </div>
          </div>

          {/* Conducteurs */}
          <div>
            <h4 className="font-black text-white text-sm mb-4">Conducteurs</h4>
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
            <h4 className="font-black text-white text-sm mb-4">Garages</h4>
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
            <h4 className="font-black text-white text-sm mb-4">Services populaires</h4>
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
            © {new Date().getFullYear()} Garago Technologies Inc. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            <span className="cursor-pointer hover:text-white transition-colors">Confidentialité</span>
            <span className="cursor-pointer hover:text-white transition-colors">Conditions</span>
            <Link href="/tarifs" className="hover:text-white transition-colors">Tarifs</Link>
            <span style={{ color: "#f97316" }}>Fait avec ❤️ au Québec</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
