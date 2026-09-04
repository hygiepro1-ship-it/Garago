/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ARTICLES } from "@/lib/articles";

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
}

function CategoryBadge({ category, dark }: { category: string; dark?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
      style={dark
        ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }
        : { background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
      {CAT_ICONS[category] && (
        <img src={CAT_ICONS[category]} alt="" width={12} height={12}
          style={{ filter: dark ? "brightness(0) invert(1)" : "brightness(0) saturate(100%)", opacity: dark ? 0.7 : 1 }} />
      )}
      {category}
    </span>
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

type Article = typeof ARTICLES[number];

function FeaturedArticle({ article }: { article: Article }) {
  return (
    <article className="rounded-2xl overflow-hidden mb-5 relative"
      style={{ background: "linear-gradient(160deg, #0f2744, #0b1f3a)", boxShadow: "0 8px 40px rgba(11,31,58,0.25)" }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: article.categoryColor }} />
      <div className="p-5 pl-7 sm:p-8 sm:pl-10">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <CategoryBadge category={article.category} dark />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight" style={{ letterSpacing: "-0.02em" }}>
          {article.title}
        </h2>
        <p className="text-base leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.55)" }}>
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
            <ClockIcon />{article.readTime} min de lecture
          </span>
          <Link href={`/conseils/${article.slug}`}
            className="text-sm font-black text-white px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: "#f97316", boxShadow: "0 2px 12px rgba(249,115,22,0.4)" }}>
            Lire l'article →
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
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: article.categoryColor }} />
      <div className="p-4 pl-6 sm:p-7 sm:pl-9">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <CategoryBadge category={article.category} />
          <span className="text-xs font-semibold ml-auto" style={{ color: "#cbd5e1" }}>
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <h2 className="text-xl font-black mb-3 leading-snug" style={{ color: "#0b1f3a", letterSpacing: "-0.02em" }}>
          {article.title}
        </h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "#64748b" }}>{article.excerpt}</p>
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#f1f5f9" }}>
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#94a3b8" }}>
            <ClockIcon />{article.readTime} min de lecture
          </span>
          <Link href={`/conseils/${article.slug}`}
            className="text-sm font-bold transition-all hover:gap-2" style={{ color: "#f97316" }}>
            Lire l'article →
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConseilsPage() {
  const now = new Date();
  const published = ARTICLES
    .filter((a) => new Date(a.publishedAt) <= now)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const [featured, ...rest] = published;
  const categories = Array.from(new Set(ARTICLES.map((a) => a.category)));

  return (
    <main>
      {/* ── Hero ── */}
      <section style={{ background: "#0b1f3a" }} className="py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Prenez soin de votre voiture<br />
            <span style={{ color: "#f97316" }}>toute l'année</span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            Conseils pratiques adaptés aux conducteurs québécois — entretien, sécurité, saisons et économies.
          </p>
        </div>
      </section>

      {/* ── Filtres par catégorie ── */}
      <div className="bg-white border-b" style={{ borderColor: "#e2e8f0" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat) => (
            <span key={cat}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
              style={{ background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }}>
              {CAT_ICONS[cat] && (
                <img src={CAT_ICONS[cat]} alt="" width={13} height={13}
                  style={{ filter: "brightness(0) saturate(100%)" }} />
              )}
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* ── Articles ── */}
      <section className="py-10 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-7" style={{ color: "#94a3b8" }}>
            {published.length} article{published.length !== 1 ? "s" : ""}
          </p>

          {published.length === 0 && (
            <div className="text-center py-20">
              <p className="font-bold text-lg" style={{ color: "#0b1f3a" }}>Aucun conseil publié pour le moment.</p>
              <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>Revenez bientôt — de nouveaux articles arrivent chaque semaine.</p>
            </div>
          )}

          {featured && <FeaturedArticle article={featured} />}

          <div className="flex flex-col gap-4">
            {rest.map((article) => <ArticleCard key={article.slug} article={article} />)}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-14 px-4" style={{ background: "#0b1f3a" }}>
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#f97316" }}>
            Ne manquez rien
          </p>
          <h2 className="text-2xl font-black text-white mb-3">Recevez ces conseils par courriel</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Créez un compte Garago et activez les communications dans vos préférences pour recevoir les conseils chaque semaine.
          </p>
          <Link href="/inscription/conducteur"
            className="inline-block px-8 py-3.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
            style={{ background: "#f97316", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}>
            Créer un compte gratuitement →
          </Link>
        </div>
      </section>
    </main>
  );
}
