import type { Metadata } from "next";
import { getArticle } from "@/lib/articles";
import { ARTICLES_EN } from "@/lib/articles-en";
import { ARTICLE_EXTRAS } from "@/lib/articles-extras";
import { languagesFor, type PageLang } from "@/lib/alternates";
import JsonLd from "@/components/JsonLd";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

/** Adresse d'un article dans une langue : /conseils/<slug> en français, /en/tips/<slug> en anglais. */
export const articlePath = (slug: string, lang: PageLang) => (lang === "en" ? `/en/tips/${slug}` : `/conseils/${slug}`);

/** Titre, description, canonique et traductions d'un article, en français ou en anglais. */
export function articleMetadata(slug: string, lang: PageLang): Metadata {
  const article = getArticle(slug);
  if (!article) return { title: lang === "en" ? "Article not found | Garago" : "Article introuvable | Garago", robots: { index: false } };
  const en = lang === "en" ? ARTICLES_EN[slug] : undefined;
  const extra = ARTICLE_EXTRAS[slug];
  const base = en ? en.title : (extra?.metaTitle ?? article.title);
  // Un titre anglais trop long est coupé avant le « : » pour rester sous 60 caractères avec « | Garago »
  const short = base.length > 51 && base.includes(":") ? base.slice(0, base.indexOf(":")).trim() : base;
  const title = `${short} | Garago`;
  const description = en ? en.excerpt : (extra?.metaDescription ?? article.excerpt);
  const path = articlePath(slug, lang);
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}${path}`, languages: languagesFor(path) },
    openGraph: {
      title, description, url: `${BASE_URL}${path}`, siteName: "Garago", locale: lang === "en" ? "en_CA" : "fr_CA", type: "article",
      publishedTime: article.publishedAt,
      images: [{ url: `${BASE_URL}/conseils/${slug}.webp`, width: 1400, height: 700, alt: en?.title ?? article.title }],
    },
  };
}

/** Données structurées d'un article (Article + fil d'Ariane) dans la langue de la page. */
export function ArticleJsonLd({ slug, lang }: { slug: string; lang: PageLang }) {
  const article = getArticle(slug);
  if (!article) return null;
  const en = lang === "en" ? ARTICLES_EN[slug] : undefined;
  const extra = ARTICLE_EXTRAS[slug];
  const url = `${BASE_URL}${articlePath(slug, lang)}`;
  const headline = en?.title ?? article.title;
  return (
    <JsonLd data={{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          headline,
          description: en?.excerpt ?? article.excerpt,
          datePublished: article.publishedAt,
          dateModified: extra?.updatedAt ?? article.publishedAt,
          inLanguage: lang === "en" ? "en-CA" : "fr-CA",
          mainEntityOfPage: url,
          ...(extra ? { citation: extra.sources.map((c) => ({ "@type": "CreativeWork", name: lang === "en" ? (c.labelEn ?? c.label) : c.label, url: c.href })) } : {}),
          image: { "@type": "ImageObject", url: `${BASE_URL}/conseils/${slug}.webp`, width: 1400, height: 700 },
          author: { "@type": "Organization", name: "Garago" },
          publisher: { "@type": "Organization", "@id": "https://garagopro.ca/#organization", name: "Garago", logo: { "@type": "ImageObject", url: `${BASE_URL}/logo-garago-700${lang === "en" ? "-en" : ""}.webp` } },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: lang === "en" ? "Home" : "Accueil", item: lang === "en" ? `${BASE_URL}/en` : BASE_URL },
            { "@type": "ListItem", position: 2, name: lang === "en" ? "Car tips" : "Conseils auto", item: `${BASE_URL}${lang === "en" ? "/en/tips" : "/conseils"}` },
            { "@type": "ListItem", position: 3, name: headline, item: url },
          ],
        },
      ],
    }} />
  );
}
