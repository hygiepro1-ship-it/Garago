import type { Metadata } from "next";
import { getArticle } from "@/lib/articles";
import JsonLd from "@/components/JsonLd";
import { ARTICLE_EXTRAS } from "@/lib/articles-extras";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article introuvable | Garago", robots: { index: false } };
  const title = `${article.title} | Garago`;
  return {
    title,
    description: article.excerpt,
    alternates: { canonical: `${BASE_URL}/conseils/${slug}` },
    openGraph: { title, description: article.excerpt, url: `${BASE_URL}/conseils/${slug}`, siteName: "Garago", locale: "fr_CA", type: "article", publishedTime: article.publishedAt, images: [{ url: `${BASE_URL}/conseils/${slug}.webp`, width: 1400, height: 700, alt: article.title }] },
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  const url = `${BASE_URL}/conseils/${slug}`;
  return (
    <>
      {/* Données structurées : Google comprend qu'il s'agit d'un article de conseils, et où il se situe dans le site. */}
      {article && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: article.title,
              description: article.excerpt,
              datePublished: article.publishedAt,
              dateModified: ARTICLE_EXTRAS[slug]?.updatedAt ?? article.publishedAt,
              inLanguage: "fr-CA",
              mainEntityOfPage: url,
              ...(ARTICLE_EXTRAS[slug] ? { citation: ARTICLE_EXTRAS[slug].sources.map((c) => ({ "@type": "CreativeWork", name: c.label, url: c.href })) } : {}),
              image: { "@type": "ImageObject", url: `${BASE_URL}/conseils/${slug}.webp`, width: 1400, height: 700 },
              author: { "@type": "Organization", name: "Garago" },
              publisher: { "@type": "Organization", "@id": "https://garagopro.ca/#organization", name: "Garago", logo: { "@type": "ImageObject", url: `${BASE_URL}/logo-garago-700.webp` } },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
                { "@type": "ListItem", position: 2, name: "Conseils auto", item: `${BASE_URL}/conseils` },
                { "@type": "ListItem", position: 3, name: article.title, item: url },
              ],
            },
          ],
        }} />
      )}
      {children}
    </>
  );
}
