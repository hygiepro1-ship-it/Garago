import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "@/components/JsonLd";
import StickyCta from "@/components/StickyCta";
import { pageMetadata, type PageLang } from "@/lib/alternates";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export interface GuideLink { label: string; href: string }
export interface GuideSection {
  h2: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Image affichée sous le titre de la section (capture de Garago). */
  image?: { src: string; alt: string; width: number; height: number; caption?: string };
  /** Tableau comparatif (en-têtes, lignes, note de source sous le tableau). */
  table?: { headers: string[]; rows: string[][]; note?: string };
  /** Fichiers à télécharger (modèles), affichés en boutons. */
  downloads?: (GuideLink & { note?: string })[];
}

/** Contenu d'une page-guide dans une langue. */
export interface Guide {
  path: string;
  title: string;
  description: string;
  ogDescription?: string;
  h1: string;
  intro: string;
  sections: GuideSection[];
  faq: { q: string; a: string }[];
  ctaTitle: string;
  ctaText: string;
  related: GuideLink[];
  datePublished: string;
  /** Sources citées dans le texte, listées en bas de page. */
  sources?: GuideLink[];
  crumb?: GuideLink;
  cta?: GuideLink & { secondary: GuideLink };
  heroCta?: GuideLink;
  /** Public visé : les garages par défaut, ou les conducteurs (change la barre d'appel à l'action). */
  audience?: "garages" | "drivers";
}

const UI = {
  fr: {
    home: { label: "Accueil", href: "/" },
    breadcrumb: "Fil d'Ariane", faq: "Questions fréquentes", related: "À lire aussi", relatedAria: "Guides liés", sources: "Sources",
    // Page parente réelle des guides /garagistes/… : le lien ramène à la page d'où l'on vient.
    crumb: { label: "Pour les garages", href: "/garagistes" },
    cta: { label: "Commencer l'essai gratuit", href: "/inscription/garage", secondary: { label: "Voir les tarifs", href: "/garagistes" } },
    heroCta: { label: "Essayer Garago 30 jours gratuitement", href: "/inscription/garage" },
    sticky: {
      garages: { text: "Garago : réservation en ligne, agenda et confirmations pour votre garage.", primary: { label: "Essai gratuit 30 jours", href: "/inscription/garage" }, secondary: { label: "Tarifs", href: "/garagistes" } },
      drivers: { text: "Trouvez un garage près de chez vous et réservez en ligne, gratuitement.", primary: { label: "Trouver un garage", href: "/rechercher" }, secondary: { label: "Par ville", href: "/garages" } },
    },
    inLanguage: "fr-CA",
  },
  en: {
    home: { label: "Home", href: "/en" },
    breadcrumb: "Breadcrumb", faq: "Frequently asked questions", related: "Related guides", relatedAria: "Related guides", sources: "Sources",
    crumb: { label: "For garages", href: "/en/garage-owners" },
    cta: { label: "Start the free trial", href: "/inscription/garage", secondary: { label: "See pricing", href: "/en/garage-owners" } },
    heroCta: { label: "Try Garago free for 30 days", href: "/inscription/garage" },
    sticky: {
      garages: { text: "Garago: online booking, calendar and confirmations for your shop.", primary: { label: "Free 30-day trial", href: "/inscription/garage" }, secondary: { label: "Pricing", href: "/en/garage-owners" } },
      drivers: { text: "Find a garage near you and book online, for free.", primary: { label: "Find a garage", href: "/rechercher" }, secondary: { label: "By city", href: "/garages" } },
    },
    inLanguage: "en-CA",
  },
} as const;

/**
 * Page-guide éditoriale (référencement) : titre, introduction, sections, questions fréquentes, appel à l'action.
 * Les données structurées (fil d'Ariane, FAQ, article) sont émises ici pour garder toutes les pages cohérentes.
 */
export default function GuidePage({
  path, h1, intro, sections, faq, ctaTitle, ctaText, related, datePublished, sources,
  lang = "fr", crumb, cta, heroCta, media, audience = "garages",
}: Guide & {
  lang?: PageLang;
  /** Contenu affiché sous l'introduction (par exemple une vidéo). */
  media?: ReactNode;
}) {
  const ui = UI[lang];
  const c = crumb ?? ui.crumb;
  const action = cta ?? ui.cta;
  const hero = heroCta ?? ui.heroCta;
  const url = `${BASE_URL}${path}`;
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: ui.home.label, item: `${BASE_URL}${ui.home.href === "/" ? "" : ui.home.href}` },
              { "@type": "ListItem", position: 2, name: c.label, item: `${BASE_URL}${c.href}` },
              { "@type": "ListItem", position: 3, name: h1, item: url },
            ],
          },
          {
            "@type": "Article",
            headline: h1,
            description: intro,
            datePublished,
            dateModified: datePublished,
            inLanguage: ui.inLanguage,
            mainEntityOfPage: url,
            author: { "@type": "Organization", name: "Garago" },
            publisher: { "@type": "Organization", "@id": "https://garagopro.ca/#organization", name: "Garago", logo: { "@type": "ImageObject", url: `${BASE_URL}/logo-garago-700${lang === "en" ? "-en" : ""}.webp` } },
          },
          {
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ],
      }} />

      <section style={{ background: "linear-gradient(135deg,#071428 0%,#0b1f3a 60%,#1a3a6b 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
          <nav aria-label={ui.breadcrumb} className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            <Link href={ui.home.href} className="hover:underline">{ui.home.label}</Link> › <Link href={c.href} className="hover:underline">{c.label}</Link> › <span aria-current="page">{h1}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight" style={{ textWrap: "balance" }}>{h1}</h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{intro}</p>
          {/\.\w{3,4}$/.test(hero.href) ? (
            // Un fichier à télécharger (modèle) : lien direct, pas une navigation entre pages.
            <a href={hero.href} download
              className="inline-flex items-center mt-6 px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>
              {hero.label}
            </a>
          ) : (
            <Link href={hero.href}
              className="inline-flex items-center mt-6 px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>
              {hero.label}
            </Link>
          )}
          {media}
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-10">
        {sections.map((s) => (
          <section key={s.h2} className="mb-10">
            <h2 className="text-2xl font-black mb-3" style={{ color: "#0b1f3a" }}>{s.h2}</h2>
            {s.image && (
              <figure className="mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- image statique déjà optimisée (webp) */}
                <img src={s.image.src} alt={s.image.alt} width={s.image.width} height={s.image.height} loading="lazy" decoding="async"
                  className="w-full h-auto rounded-xl border border-gray-200" style={{ boxShadow: "0 10px 30px rgba(11,31,58,0.10)" }} />
                {s.image.caption && <figcaption className="mt-2 text-sm text-gray-500">{s.image.caption}</figcaption>}
              </figure>
            )}
            {s.paragraphs?.map((p) => (
              <p key={p} className="text-base leading-relaxed text-gray-700 mb-3">{p}</p>
            ))}
            {s.bullets && (
              <ul className="list-disc pl-5 space-y-2 text-base leading-relaxed text-gray-700">
                {s.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
            {s.table && (
              <div className="mt-2 mb-3">
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-sm text-left" style={{ minWidth: 560 }}>
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>{s.table.headers.map((h) => <th key={h} scope="col" className="px-3 py-2.5 font-black" style={{ color: "#0b1f3a" }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {s.table.rows.map((r) => (
                        <tr key={r[0]} className="border-t border-gray-100 align-top">
                          {r.map((c, i) => i === 0
                            ? <th key={i} scope="row" className="px-3 py-2.5 font-bold text-gray-900">{c}</th>
                            : <td key={i} className="px-3 py-2.5 text-gray-700">{c}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {s.table.note && <p className="mt-2 text-xs text-gray-500">{s.table.note}</p>}
              </div>
            )}
            {s.downloads && (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {s.downloads.map((d) => (
                  <li key={d.href}>
                    <a href={d.href} download
                      className="flex h-full flex-col rounded-xl border-2 p-4 hover:shadow-sm transition" style={{ borderColor: "#fed7aa", background: "#fff7ed" }}>
                      <span className="flex items-center gap-2 font-black" style={{ color: "#0b1f3a" }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#c2410c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
                        </svg>
                        {d.label}
                      </span>
                      {d.note && <span className="mt-1 text-sm text-gray-600">{d.note}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="mb-10">
          <h2 className="text-2xl font-black mb-4" style={{ color: "#0b1f3a" }}>{ui.faq}</h2>
          <div className="space-y-3">
            {faq.map((f) => (
              <details key={f.q} className="rounded-xl border border-gray-200 bg-white p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-2xl p-6" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
          <h2 className="text-xl font-black" style={{ color: "#0b1f3a" }}>{ctaTitle}</h2>
          <p className="mt-1 text-sm text-gray-700">{ctaText}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={action.href} className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>
              {action.label}
            </Link>
            <Link href={action.secondary.href} className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold border border-gray-300 bg-white text-gray-800">
              {action.secondary.label}
            </Link>
          </div>
        </section>

        <nav aria-label={ui.relatedAria} className="mt-10">
          <h2 className="text-base font-black mb-3" style={{ color: "#0b1f3a" }}>{ui.related}</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="inline-flex items-center min-h-[44px] sm:min-h-0 text-sm font-semibold underline" style={{ color: "#c2410c" }}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {sources && sources.length > 0 && (
          <section className="mt-10 border-t border-gray-200 pt-6">
            <h2 className="text-base font-black mb-3" style={{ color: "#0b1f3a" }}>{ui.sources}</h2>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {sources.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] sm:min-h-0 underline">{s.label}</a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
      <StickyCta {...ui.sticky[audience]} />
    </>
  );
}

/** Métadonnées d'une page-guide (titre, description, canonique, traductions pour Google). */
export function guideMetadata(g: Guide, lang: PageLang) {
  return pageMetadata({ path: g.path, lang, title: g.title, description: g.description, ogDescription: g.ogDescription });
}
