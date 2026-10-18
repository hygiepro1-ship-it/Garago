import type { Metadata } from "next";
import { articleMetadata, ArticleJsonLd } from "./article-seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return articleMetadata(slug, "fr");
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      {/* Données structurées : Google comprend qu'il s'agit d'un article de conseils, et où il se situe dans le site. */}
      <ArticleJsonLd slug={slug} lang="fr" />
      {children}
    </>
  );
}
