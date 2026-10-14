import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "@/components/JsonLd";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export interface GuideSection { h2: string; paragraphs?: string[]; bullets?: string[] }

/**
 * Page-guide éditoriale (référencement) : titre, introduction, sections, questions fréquentes, appel à l'action.
 * Les données structurées (fil d'Ariane, FAQ, article) sont émises ici pour garder toutes les pages cohérentes.
 */
export default function GuidePage({
  path, h1, intro, sections, faq, ctaTitle, ctaText, related, datePublished,
  crumb = { label: "Pour les garages", href: "/garagistes" },
  cta = { label: "Commencer l'essai gratuit", href: "/inscription/garage", secondary: { label: "Voir les tarifs", href: "/garagistes" } },
  heroCta = { label: "Essayer Garago 30 jours gratuitement", href: "/inscription/garage" },
  media,
}: {
  path: string;
  h1: string;
  intro: string;
  sections: GuideSection[];
  faq: { q: string; a: string }[];
  ctaTitle: string;
  ctaText: string;
  related: { href: string; label: string }[];
  datePublished: string;
  crumb?: { label: string; href: string };
  cta?: { label: string; href: string; secondary: { label: string; href: string } };
  heroCta?: { label: string; href: string };
  /** Contenu affiché sous l'introduction (par exemple une vidéo). */
  media?: ReactNode;
}) {
  const url = `${BASE_URL}${path}`;
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
              { "@type": "ListItem", position: 2, name: crumb.label, item: `${BASE_URL}${crumb.href}` },
              { "@type": "ListItem", position: 3, name: h1, item: url },
            ],
          },
          {
            "@type": "Article",
            headline: h1,
            description: intro,
            datePublished,
            dateModified: datePublished,
            inLanguage: "fr-CA",
            mainEntityOfPage: url,
            author: { "@type": "Organization", name: "Garago" },
            publisher: { "@type": "Organization", name: "Garago", logo: { "@type": "ImageObject", url: `${BASE_URL}/logo-garago-700.webp` } },
          },
          {
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ],
      }} />

      <section style={{ background: "linear-gradient(135deg,#071428 0%,#0b1f3a 60%,#1a3a6b 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
          <nav aria-label="Fil d'Ariane" className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            <Link href="/" className="hover:underline">Accueil</Link> › <Link href="/pourquoi-garago" className="hover:underline">Pourquoi Garago</Link> › <Link href={crumb.href} className="hover:underline">{crumb.label}</Link>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight" style={{ textWrap: "balance" }}>{h1}</h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{intro}</p>
          <Link href={heroCta.href}
            className="inline-flex items-center mt-6 px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>
            {heroCta.label}
          </Link>
          {media}
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-10">
        {sections.map((s) => (
          <section key={s.h2} className="mb-10">
            <h2 className="text-2xl font-black mb-3" style={{ color: "#0b1f3a" }}>{s.h2}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p} className="text-base leading-relaxed text-gray-700 mb-3">{p}</p>
            ))}
            {s.bullets && (
              <ul className="list-disc pl-5 space-y-2 text-base leading-relaxed text-gray-700">
                {s.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        <section className="mb-10">
          <h2 className="text-2xl font-black mb-4" style={{ color: "#0b1f3a" }}>Questions fréquentes</h2>
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
            <Link href={cta.href} className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>
              {cta.label}
            </Link>
            <Link href={cta.secondary.href} className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold border border-gray-300 bg-white text-gray-800">
              {cta.secondary.label}
            </Link>
          </div>
        </section>

        <nav aria-label="Guides liés" className="mt-10">
          <h2 className="text-base font-black mb-3" style={{ color: "#0b1f3a" }}>À lire aussi</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="inline-flex items-center min-h-[44px] sm:min-h-0 text-sm font-semibold underline" style={{ color: "#c2410c" }}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </>
  );
}
