import type { Metadata } from "next";
import { articleMetadata, ArticleJsonLd } from "@/app/conseils/[slug]/article-seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return articleMetadata(slug, "en");
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <ArticleJsonLd slug={slug} lang="en" />
      {children}
    </>
  );
}
