import Link from "next/link";
import { ARTICLES } from "@/lib/articles";
import { ARTICLES_EN, CATEGORY_EN } from "@/lib/articles-en";
import L from "@/components/L";
import ConseilsListe, { type ArticleListe } from "./ConseilsListe";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConseilsPage() {
  const now = new Date();
  const published = ARTICLES
    .filter((a) => new Date(a.publishedAt) <= now)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const articles: ArticleListe[] = published.map((a) => ({
    slug: a.slug, title: a.title, titleEn: ARTICLES_EN[a.slug]?.title, excerpt: a.excerpt, excerptEn: ARTICLES_EN[a.slug]?.excerpt,
    category: a.category, categoryEn: CATEGORY_EN[a.category], categoryColor: a.categoryColor, readTime: a.readTime, publishedAt: a.publishedAt,
  }));
  // Seulement les catégories qui ont au moins un article publié
  const categories = Array.from(new Set(ARTICLES.filter((a) => published.includes(a)).map((a) => a.category))).map((c) => ({ fr: c, en: CATEGORY_EN[c] ?? c }));

  return (
    <main>
      {/* ── Hero ── */}
      <section style={{ background: "#0b1f3a" }} className="py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            <L fr="Prenez soin de votre voiture" en="Take care of your car" /><br />
            <span style={{ color: "#f97316" }}><L fr="toute l'année" en="all year round" /></span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            <L fr="Conseils pratiques pour les conducteurs du Québec : entretien, sécurité et saisons." en="Practical advice for Quebec drivers: maintenance, safety and seasons." />
          </p>
        </div>
      </section>

      <ConseilsListe articles={articles} categories={categories} />

      {/* ── Newsletter ── */}
      <section className="py-14 px-4" style={{ background: "#0b1f3a" }}>
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#f97316" }}>
            <L fr="Ne manquez rien" en="Don't miss a thing" />
          </p>
          <h2 className="text-2xl font-black text-white mb-3"><L fr="Recevez ces conseils par courriel" en="Get these tips by email" /></h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            <L fr="Créez un compte Garago et activez les communications dans vos préférences pour recevoir les conseils chaque semaine." en="Create a Garago account and turn on communications in your preferences to receive the tips every week." />
          </p>
          <Link href="/inscription/conducteur"
            className="inline-block px-8 py-3.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
            style={{ background: "#e0600c" }}>
            <L fr="Créer un compte gratuitement" en="Create a free account" />
          </Link>
        </div>
      </section>
    </main>
  );
}
