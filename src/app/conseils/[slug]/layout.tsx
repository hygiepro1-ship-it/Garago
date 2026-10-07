import type { Metadata } from "next";
import { getArticle } from "@/lib/articles";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article introuvable — Garago", robots: { index: false } };
  const title = `${article.title} — Garago`;
  return {
    title,
    description: article.excerpt,
    alternates: { canonical: `${BASE_URL}/conseils/${slug}` },
    openGraph: { title, description: article.excerpt, url: `${BASE_URL}/conseils/${slug}`, siteName: "Garago", locale: "fr_CA", type: "article", publishedTime: article.publishedAt },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
