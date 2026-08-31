import { notFound } from "next/navigation";
import Link from "next/link";
import { ARTICLES, getArticle, getRelatedArticles } from "@/lib/articles";
import { ArticleImage } from "./ArticleImage";

const CAT_ICONS: Record<string, string> = {
  "Freins":        "/icons/brakes.png",
  "Pneus":         "/icons/tires-winter.png",
  "Électronique":  "/icons/electrical.png",
  "Entretien":     "/icons/filter-entretien.png",
  "Électrique":    "/icons/ev.png",
  "Moteur":        "/icons/engine.png",
  "Protection":    "/icons/bodywork.png",
  "Climatisation": "/icons/ac.png",
};

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article, 3);

  return (
    <main>
      {/* ── Hero image ────────────────────────────────────────────────────── */}
      <div
        className="relative"
        style={{
          height: 380,
          background: "linear-gradient(135deg, #1e3a5f 0%, #0b1f3a 100%)",
        }}
      >
        {/* Icon fallback */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.08 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {CAT_ICONS[article.category] && <img src={CAT_ICONS[article.category]} alt="" width={160} height={160} style={{ filter: "brightness(0) invert(1)" }} />}
        </div>
        <ArticleImage
          src={`https://source.unsplash.com/${article.imageId}/1400x700`}
          alt={article.title}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover" }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(11,31,58,0.85) 0%, rgba(11,31,58,0.3) 50%, rgba(11,31,58,0.5) 100%)",
          }}
        />
        {/* Breadcrumb */}
        <div className="absolute top-6 left-0 right-0 px-4">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
              <span>/</span>
              <Link href="/conseils" className="hover:text-white transition-colors">Conseils auto</Link>
              <span>/</span>
              <span style={{ color: "rgba(255,255,255,0.35)" }} className="truncate max-w-xs">{article.title}</span>
            </nav>
          </div>
        </div>
        {/* Title */}
        <div className="absolute bottom-0 inset-x-0 px-4 pb-8">
          <div className="max-w-3xl mx-auto">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3"
              style={{ background: article.categoryColor, color: "white" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {CAT_ICONS[article.category] && <img src={CAT_ICONS[article.category]} alt="" width={13} height={13} style={{ filter: "brightness(0) invert(1)" }} />}
              {article.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Meta bar ──────────────────────────────────────────────────────── */}
      <div
        style={{ background: "#0d2347", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        className="py-3 px-4"
      >
        <div className="max-w-3xl mx-auto flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span className="flex items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/pricing/calendar.png" alt="" width={12} height={12} style={{ filter: "brightness(0) invert(1)", opacity: 0.5 }} />
            {formatDate(article.publishedAt)}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {article.readTime} min de lecture
          </span>
          <span>·</span>
          <Link href="/conseils" className="hover:text-orange-400 transition-colors">
            ← Tous les conseils
          </Link>
        </div>
      </div>

      {/* ── Article body ──────────────────────────────────────────────────── */}
      <article className="py-12 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-3xl mx-auto">

          {/* Excerpt / lead */}
          <p
            className="text-lg leading-relaxed mb-10 pb-8 font-medium"
            style={{
              color: "#334155",
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            {article.excerpt}
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {article.sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h2
                    className="text-xl font-black mb-3 pb-2"
                    style={{
                      color: "#0b1f3a",
                      borderBottom: `3px solid ${article.categoryColor}`,
                      display: "inline-block",
                    }}
                  >
                    {section.heading}
                  </h2>
                )}

                <p className="text-base leading-relaxed" style={{ color: "#475569" }}>
                  {section.content}
                </p>

                {/* Tips list */}
                {section.tips && section.tips.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {section.tips.map((tip, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black mt-0.5"
                          style={{ background: article.categoryColor + "22", color: article.categoryColor }}
                        >
                          ✓
                        </span>
                        <span className="text-sm leading-relaxed" style={{ color: "#334155" }}>
                          {tip}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Warning box */}
                {section.warning && (
                  <div
                    className="mt-4 p-4 rounded-xl flex gap-3"
                    style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
                  >
                    <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <p className="text-sm leading-relaxed font-semibold" style={{ color: "#991b1b" }}>
                      {section.warning}
                    </p>
                  </div>
                )}

                {/* Note box */}
                {section.note && (
                  <div
                    className="mt-4 p-4 rounded-xl flex gap-3"
                    style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/pricing/bulb.png" alt="" width={20} height={20} className="flex-shrink-0 mt-0.5" style={{ filter: "brightness(0) saturate(100%) invert(20%) sepia(80%) saturate(500%) hue-rotate(200deg)" }} />
                    <p className="text-sm leading-relaxed" style={{ color: "#1e40af" }}>
                      {section.note}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── CTA inline ── */}
          <div
            className="mt-12 p-6 rounded-2xl text-center"
            style={{ background: "#0b1f3a" }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              Un garage près de chez vous peut s'en occuper
            </p>
            <h3 className="text-xl font-black text-white mb-4">
              Obtenez un devis ou prenez rendez-vous en ligne
            </h3>
            <Link
              href={`/rechercher?service=${article.category.toLowerCase()}`}
              className="inline-block px-6 py-3 rounded-xl text-sm font-black text-white"
              style={{ background: "#f97316", boxShadow: "0 4px 15px rgba(249,115,22,0.4)" }}
            >
              Trouver un garage →
            </Link>
          </div>
        </div>
      </article>

      {/* ── Related articles ──────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="py-12 px-4" style={{ background: "#f1f5f9" }}>
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-xl font-black mb-6"
              style={{ color: "#0b1f3a" }}
            >
              Articles similaires
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/conseils/${rel.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform"
                  style={{
                    boxShadow: "0 2px 10px rgba(11,31,58,0.06)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    className="relative flex-shrink-0"
                    style={{
                      height: 130,
                      background: "linear-gradient(135deg, #1e3a5f, #0b1f3a)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.12 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {CAT_ICONS[rel.category] && <img src={CAT_ICONS[rel.category]} alt="" width={48} height={48} style={{ filter: "brightness(0) invert(1)" }} />}
                    </div>
                    <ArticleImage
                      src={`https://source.unsplash.com/${rel.imageId}/600x300`}
                      alt={rel.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full"
                      style={{ objectFit: "cover" }}
                    />
                    <div className="absolute top-2 left-2">
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded-full"
                        style={{ background: rel.categoryColor, color: "white" }}
                      >
                        {rel.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <p
                      className="text-sm font-black leading-snug group-hover:text-orange-500 transition-colors"
                      style={{ color: "#0b1f3a" }}
                    >
                      {rel.title}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                      {rel.readTime} min
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
