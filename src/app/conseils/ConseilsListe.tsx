"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import L, { LDate } from "@/components/L";
import { ArticleImage } from "./[slug]/ArticleImage";

/** Données d'un article utiles à la liste (le texte complet reste côté serveur). */
export interface ArticleListe {
  slug: string; title: string; titleEn?: string; excerpt: string; excerptEn?: string;
  category: string; categoryEn?: string; categoryColor: string; readTime: number; publishedAt: string;
}
type Article = ArticleListe;

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

// ─── Helpers ──────────────────────────────────────────────────────────────────


function CategoryBadge({ category, categoryEn, dark }: { category: string; categoryEn?: string; dark?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
      style={dark
        ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }
        : { background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
      {CAT_ICONS[category] && (
        <img src={CAT_ICONS[category]} alt="" width={12} height={12}
          style={{ filter: dark ? "brightness(0) invert(1)" : "brightness(0) saturate(100%)", opacity: dark ? 0.7 : 1 }} />
      )}
      <L fr={category} en={categoryEn ?? category} />
    </span>
  );
}

// Photo de l'article. Si son fichier manque (nouvel article sans photo), l'image se masque
// et le fond bleu avec l'icône de la catégorie reste visible, comme avant les photos.
// Chaque photo existe en 1400 px (/conseils/<slug>.webp) et en 700 px (/conseils/<slug>-700.webp) pour les vignettes.
function ArticlePhoto({ article, iconSize, lazy, sizes }: { article: Article; iconSize: number; lazy?: boolean; sizes: string }) {
  return (
    <div className="relative w-full h-full" style={{ aspectRatio: "2 / 1", background: "linear-gradient(135deg, #1e3a5f, #0b1f3a)" }}>
      {CAT_ICONS[article.category] && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.15 }}>
          <img src={CAT_ICONS[article.category]} alt="" width={iconSize} height={iconSize}
            style={{ filter: "brightness(0) invert(1)" }} />
        </div>
      )}
      <ArticleImage src={`/conseils/${article.slug}-700.webp`} srcSet={`/conseils/${article.slug}-700.webp 700w, /conseils/${article.slug}.webp 1400w`} sizes={sizes}
        alt="" width={1400} height={700} loading={lazy ? "lazy" : undefined} fetchPriority={lazy ? undefined : "high"}
        className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────



function FeaturedArticle({ article }: { article: Article }) {
  return (
    <article className="rounded-2xl overflow-hidden mb-5 relative"
      style={{ background: "linear-gradient(160deg, #0f2744, #0b1f3a)", boxShadow: "0 8px 40px rgba(11,31,58,0.25)" }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-10" style={{ background: article.categoryColor }} />
      <Link href={`/conseils/${article.slug}`} tabIndex={-1} aria-hidden="true" className="block">
        <ArticlePhoto article={article} iconSize={120} sizes="(min-width: 896px) 896px, 100vw" />
      </Link>
      <div className="p-5 pl-7 sm:p-8 sm:pl-10">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <CategoryBadge category={article.category} categoryEn={article.categoryEn} dark />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <LDate iso={article.publishedAt} />
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight" style={{ letterSpacing: "-0.02em" }}>
          <L fr={article.title} en={article.titleEn ?? article.title} />
        </h2>
        <p className="text-base leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.55)" }}>
          <L fr={article.excerpt} en={article.excerptEn ?? article.excerpt} />
        </p>
        <div className="flex items-center justify-between pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
            <ClockIcon />{article.readTime} <L fr="min de lecture" en="min read" />
          </span>
          <Link href={`/conseils/${article.slug}`}
            className="text-sm font-black text-white px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: "#e0600c" }}>
            <L fr="Lire l'article" en="Read the article" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="bg-white rounded-2xl relative overflow-hidden transition-all hover:shadow-md"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(11,31,58,0.05)" }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-10" style={{ background: article.categoryColor }} />
      <div className="sm:flex">
      <Link href={`/conseils/${article.slug}`} tabIndex={-1} aria-hidden="true" className="block sm:w-60 sm:flex-shrink-0">
        <ArticlePhoto article={article} iconSize={56} lazy sizes="(min-width: 640px) 240px, 100vw" />
      </Link>
      <div className="p-4 pl-6 sm:p-7 sm:pl-7 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <CategoryBadge category={article.category} categoryEn={article.categoryEn} />
          <span className="text-xs font-semibold ml-auto" style={{ color: "#64748b" }}>
            <LDate iso={article.publishedAt} />
          </span>
        </div>
        <h2 className="text-xl font-black mb-3 leading-snug" style={{ color: "#0b1f3a", letterSpacing: "-0.02em" }}>
          <L fr={article.title} en={article.titleEn ?? article.title} />
        </h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "#64748b" }}><L fr={article.excerpt} en={article.excerptEn ?? article.excerpt} /></p>
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#f1f5f9" }}>
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#64748b" }}>
            <ClockIcon />{article.readTime} <L fr="min de lecture" en="min read" />
          </span>
          <Link href={`/conseils/${article.slug}`}
            className="text-sm font-bold transition-all hover:gap-2 inline-flex items-center min-h-[44px]" style={{ color: "#c2410c" }}>
            <L fr="Lire l'article" en="Read the article" />
          </Link>
        </div>
      </div>
      </div>
    </article>
  );
}

// ─── Filtres ──────────────────────────────────────────────────────────────────

/** Identifiant d'une catégorie dans l'adresse (#freins, #electronique…). */
const ancre = (cat: string) => cat.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Boutons de catégorie (cliquables) et liste des articles de la catégorie choisie. */
export default function ConseilsListe({ articles, categories }: { articles: ArticleListe[]; categories: { fr: string; en: string }[] }) {
  const [cat, setCat] = useState<string | null>(null);

  // Lien direct vers une catégorie : /conseils#freins
  useEffect(() => {
    const lire = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      setCat(categories.find((c) => ancre(c.fr) === h)?.fr ?? null);
    };
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, [categories]);

  const choisir = (c: string | null) => {
    setCat(c);
    history.replaceState(null, "", c ? `#${ancre(c)}` : window.location.pathname);
  };

  const liste = cat ? articles.filter((a) => a.category === cat) : articles;
  const [featured, ...rest] = liste;
  const n = (c: string) => articles.filter((a) => a.category === c).length;

  const bouton = (actif: boolean) => actif
    ? { background: "#0b1f3a", color: "white", borderColor: "#0b1f3a" }
    : { background: "#f8fafc", color: "#475569", borderColor: "#e2e8f0" };

  return (
    <>
      {/* ── Filtres par catégorie ── */}
      <div className="bg-white border-b" style={{ borderColor: "#e2e8f0" }}>
        <div role="group" aria-label="Catégories" className="max-w-4xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <button type="button" onClick={() => choisir(null)} aria-pressed={cat === null}
            className="flex-shrink-0 flex items-center min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer hover:border-slate-400"
            style={bouton(cat === null)}>
            <L fr="Tous" en="All" /><span className="ml-1.5 opacity-60">{articles.length}</span>
          </button>
          {categories.map((c) => (
            <button key={c.fr} type="button" onClick={() => choisir(cat === c.fr ? null : c.fr)} aria-pressed={cat === c.fr}
              className="flex-shrink-0 flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer hover:border-slate-400"
              style={bouton(cat === c.fr)}>
              {CAT_ICONS[c.fr] && (
                <img src={CAT_ICONS[c.fr]} alt="" width={13} height={13}
                  style={{ filter: cat === c.fr ? "brightness(0) invert(1)" : "brightness(0) saturate(100%)" }} />
              )}
              <L fr={c.fr} en={c.en} /><span className="opacity-60">{n(c.fr)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Articles ── */}
      <section className="py-10 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-7" style={{ color: "#64748b" }} aria-live="polite">
            {liste.length} article{liste.length !== 1 ? "s" : ""}
            {cat && <> · <L fr={cat} en={categories.find((c) => c.fr === cat)?.en ?? cat} /></>}
          </p>

          {articles.length === 0 && (
            <div className="text-center py-20">
              <p className="font-bold text-lg" style={{ color: "#0b1f3a" }}><L fr="Aucun conseil publié pour le moment." en="No articles published yet." /></p>
              <p className="text-sm mt-2" style={{ color: "#64748b" }}><L fr="Revenez bientôt, de nouveaux articles arrivent chaque semaine." en="Check back soon: new articles arrive every week." /></p>
            </div>
          )}

          {featured && <FeaturedArticle key={featured.slug} article={featured} />}

          <div className="flex flex-col gap-4">
            {rest.map((article) => <ArticleCard key={article.slug} article={article} />)}
          </div>
        </div>
      </section>
    </>
  );
}
