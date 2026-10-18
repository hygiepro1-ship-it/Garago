/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import LocalLink from "@/components/LocalLink";
import { ARTICLES, getArticle, getRelatedArticles, articleService } from "@/lib/articles";
import { ArticleImage } from "./ArticleImage";
import { ARTICLES_EN, CATEGORY_EN } from "@/lib/articles-en";
import { ARTICLE_EXTRAS } from "@/lib/articles-extras";
import L, { LDate } from "@/components/L";

// ─── Data ─────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────


// ─── Types ────────────────────────────────────────────────────────────────────

type Article        = Awaited<ReturnType<typeof getArticle>>;
type ArticleSection = NonNullable<Article>["sections"][number];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ArticleSectionBlock({ section, en, categoryColor }: { section: ArticleSection; en: ArticleSection; categoryColor: string }) {
  return (
    <div>
      {section.heading && (
        <h2 className="text-xl font-black mb-3 pb-2"
          style={{ color: "#0b1f3a", borderBottom: `3px solid ${categoryColor}`, display: "inline-block" }}>
          <L fr={section.heading} en={en.heading ?? section.heading} />
        </h2>
      )}

      <p className="text-base leading-relaxed" style={{ color: "#475569" }}>
        <L fr={section.content} en={en.content} />
      </p>

      {section.tips && section.tips.length > 0 && (
        <ul className="mt-4 space-y-2">
          {section.tips.map((tip, j) => (
            <li key={j} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black mt-0.5"
                style={{ background: categoryColor + "22", color: categoryColor }}>
                ✓
              </span>
              <span className="text-sm leading-relaxed" style={{ color: "#334155" }}><L fr={tip} en={en.tips?.[j] ?? tip} /></span>
            </li>
          ))}
        </ul>
      )}

      {section.warning && (
        <div className="mt-4 p-4 rounded-xl flex gap-3"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
          <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#991b1b" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="text-sm leading-relaxed font-semibold" style={{ color: "#991b1b" }}><L fr={section.warning} en={en.warning ?? section.warning} /></p>
        </div>
      )}

      {section.note && (
        <div className="mt-4 p-4 rounded-xl flex gap-3"
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <img src="/icons/pricing/bulb.png" alt="" width={20} height={20}
            className="flex-shrink-0 mt-0.5"
            style={{ filter: "brightness(0) saturate(100%) invert(20%) sepia(80%) saturate(500%) hue-rotate(200deg)" }} />
          <p className="text-sm leading-relaxed" style={{ color: "#1e40af" }}><L fr={section.note} en={en.note ?? section.note} /></p>
        </div>
      )}
    </div>
  );
}

function RelatedArticleCard({ article }: { article: NonNullable<Article> }) {
  return (
    <LocalLink href={`/conseils/${article.slug}`}
      className="group bg-white rounded-2xl overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform"
      style={{ boxShadow: "0 2px 10px rgba(11,31,58,0.06)", border: "1px solid #e2e8f0" }}>
      <div className="relative flex-shrink-0"
        style={{ height: 130, background: "linear-gradient(135deg, #1e3a5f, #0b1f3a)" }}>
        <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.12 }}>
          {CAT_ICONS[article.category] && (
            <img src={CAT_ICONS[article.category]} alt="" width={48} height={48}
              style={{ filter: "brightness(0) invert(1)" }} />
          )}
        </div>
        <ArticleImage src={`/conseils/${article.slug}-700.webp`} alt={article.title} width={700} height={350}
          loading="lazy" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
        <div className="absolute top-2 left-2">
          <span className="text-xs font-black px-2 py-0.5 rounded-full"
            style={{ background: article.categoryColor, color: "white" }}>
            <L fr={article.category} en={CATEGORY_EN[article.category] ?? article.category} />
          </span>
        </div>
      </div>
      <div className="p-4 flex-1">
        <p className="text-sm font-black leading-snug group-hover:text-orange-500 transition-colors"
          style={{ color: "#0b1f3a" }}>
          <L fr={article.title} en={ARTICLES_EN[article.slug]?.title ?? article.title} />
        </p>
        <p className="text-xs mt-1" style={{ color: "#64748b" }}>{article.readTime} min</p>
      </div>
    </LocalLink>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article, 3);
  const en = ARTICLES_EN[article.slug];
  const extra = ARTICLE_EXTRAS[article.slug];
  const title = <L fr={article.title} en={en?.title ?? article.title} />;

  return (
    <main>
      {/* ── Hero image ── */}
      <div className="relative" style={{ height: 380, background: "linear-gradient(135deg, #1e3a5f 0%, #0b1f3a 100%)" }}>
        <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.08 }}>
          {CAT_ICONS[article.category] && (
            <img src={CAT_ICONS[article.category]} alt="" width={160} height={160}
              style={{ filter: "brightness(0) invert(1)" }} />
          )}
        </div>
        {/* Photo d'en-tête : élément principal de la page, chargée en priorité ; 700 px sur téléphone */}
        <ArticleImage src={`/conseils/${article.slug}.webp`} srcSet={`/conseils/${article.slug}-700.webp 700w, /conseils/${article.slug}.webp 1400w`} sizes="100vw"
          alt={article.title} width={1400} height={700} fetchPriority="high"
          className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(11,31,58,0.85) 0%, rgba(11,31,58,0.3) 50%, rgba(11,31,58,0.5) 100%)" }} />

        {/* Breadcrumb */}
        <div className="absolute top-6 left-0 right-0 px-4">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              <LocalLink href="/" className="hover:text-white transition-colors"><L fr="Accueil" en="Home" /></LocalLink>
              <span>/</span>
              <LocalLink href="/conseils" className="hover:text-white transition-colors"><L fr="Conseils auto" en="Car tips" /></LocalLink>
              <span>/</span>
              <span style={{ color: "rgba(255,255,255,0.35)" }} className="truncate max-w-xs">{title}</span>
            </nav>
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 inset-x-0 px-4 pb-8">
          <div className="max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3"
              style={{ background: article.categoryColor, color: "white" }}>
              {CAT_ICONS[article.category] && (
                <img src={CAT_ICONS[article.category]} alt="" width={13} height={13}
                  style={{ filter: "brightness(0) invert(1)" }} />
              )}
              <L fr={article.category} en={CATEGORY_EN[article.category] ?? article.category} />
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{title}</h1>
          </div>
        </div>
      </div>

      {/* ── Meta bar ── */}
      <div style={{ background: "#0d2347", borderBottom: "1px solid rgba(255,255,255,0.07)" }} className="py-3 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span className="flex items-center gap-1">
            <img src="/icons/pricing/calendar.png" alt="" width={12} height={12}
              style={{ filter: "brightness(0) invert(1)", opacity: 0.5 }} />
            <LDate iso={article.publishedAt} />
          </span>
          {extra?.updatedAt && extra.updatedAt !== article.publishedAt && (
            <>
              <span>·</span>
              <span><L fr="Mis à jour le" en="Updated" /> <LDate iso={extra.updatedAt} /></span>
            </>
          )}
          <span>·</span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {article.readTime} <L fr="min de lecture" en="min read" />
          </span>
          <span>·</span>
          <LocalLink href="/conseils" className="hover:text-orange-400 transition-colors"><L fr="Tous les conseils" en="All tips" /></LocalLink>
        </div>
      </div>

      {/* ── Article body ── */}
      <article className="py-12 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-lg leading-relaxed mb-10 pb-8 font-medium"
            style={{ color: "#334155", borderBottom: "2px solid #e2e8f0" }}>
            <L fr={article.excerpt} en={en?.excerpt ?? article.excerpt} />
          </p>

          {/* L'essentiel : la réponse courte, en tête (celle que les moteurs de recherche et d'IA citent) */}
          {extra && (
            <aside className="mb-10 rounded-2xl p-5 sm:p-6" style={{ background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid ${article.categoryColor}` }}>
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#0b1f3a" }}>
                <L fr="L'essentiel" en="The short answer" />
              </p>
              <p className="text-base leading-relaxed" style={{ color: "#334155" }}>
                <L fr={extra.essentiel.fr} en={extra.essentiel.en} />
              </p>
            </aside>
          )}

          <div className="space-y-10">
            {article.sections.map((section, i) => (
              <ArticleSectionBlock key={i} section={section} en={en?.sections[i] ?? section} categoryColor={article.categoryColor} />
            ))}
          </div>

          {/* ── Sources ── */}
          {extra && extra.sources.length > 0 && (
            <section className="mt-12 pt-6" style={{ borderTop: "1px solid #e2e8f0" }}>
              <h2 className="text-base font-black mb-3" style={{ color: "#0b1f3a" }}><L fr="Sources" en="Sources" /></h2>
              <ul className="space-y-1.5 text-sm" style={{ color: "#475569" }}>
                {extra.sources.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] sm:min-h-0 underline hover:text-orange-700">
                      <L fr={s.label} en={s.labelEn ?? s.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── CTA ── */}
          <div className="mt-12 p-6 rounded-2xl text-center" style={{ background: "#0b1f3a" }}>
            <p className="text-sm font-bold mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              <L fr="Un garage près de chez vous peut s'en occuper" en="A garage near you can take care of it" />
            </p>
            <h3 className="text-xl font-black text-white mb-4"><L fr="Obtenez un devis ou prenez rendez-vous en ligne" en="Get a quote or book an appointment online" /></h3>
            <Link href={articleService(article) ? `/rechercher?service=${articleService(article)}` : "/rechercher"}
              className="inline-block px-6 py-3 rounded-xl text-sm font-black text-white"
              style={{ background: "#e0600c" }}>
              <L fr="Trouver un garage" en="Find a garage" />
            </Link>
          </div>
        </div>
      </article>

      {/* ── Related articles ── */}
      {related.length > 0 && (
        <section className="py-12 px-4" style={{ background: "#f1f5f9" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-black mb-6" style={{ color: "#0b1f3a" }}><L fr="Articles similaires" en="Related articles" /></h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((rel) => <RelatedArticleCard key={rel.slug} article={rel} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
