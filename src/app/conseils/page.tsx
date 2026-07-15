"use client";

import { useState } from "react";
import Link from "next/link";
import { ARTICLES } from "@/lib/articles";

const ALL_CATEGORIES = ["Tous", ...Array.from(new Set(ARTICLES.map((a) => a.category)))];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ConseilsPage() {
  const [activeCategory, setActiveCategory] = useState("Tous");

  const filtered =
    activeCategory === "Tous"
      ? ARTICLES
      : ARTICLES.filter((a) => a.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: "#0b1f3a" }} className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span
            className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-5"
            style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}
          >
            📖 Conseils auto
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Comprendre votre véhicule
            <br />
            <span style={{ color: "#f97316" }}>sans être mécanicien</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Diagnostics, entretien, pannes courantes — nos guides clairs pour
            conducteurs québécois qui veulent prendre de meilleures décisions.
          </p>
        </div>
      </section>

      {/* ── Category filter ───────────────────────────────────────────────── */}
      <section
        style={{
          background: "#0d2347",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          position: "sticky",
          top: 64,
          zIndex: 30,
        }}
        className="py-4 px-4"
      >
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: active ? "#f97316" : "rgba(255,255,255,0.07)",
                  color: active ? "white" : "rgba(255,255,255,0.55)",
                  border: `2px solid ${active ? "#f97316" : "rgba(255,255,255,0.1)"}`,
                  boxShadow: active ? "0 4px 15px rgba(249,115,22,0.35)" : "none",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      <section className="py-12 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto">

          {filtered.length === 0 && (
            <p className="text-center py-16" style={{ color: "#94a3b8" }}>
              Aucun article dans cette catégorie pour l'instant.
            </p>
          )}

          {/* ── Featured article ── */}
          {featured && (
            <Link href={`/conseils/${featured.slug}`} className="group block mb-10">
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  boxShadow: "0 4px 24px rgba(11,31,58,0.10)",
                  border: "1px solid #e2e8f0",
                }}
              >
                {/* Photo */}
                <div
                  className="relative"
                  style={{
                    height: 320,
                    background: "linear-gradient(135deg, #1e3a5f, #0b1f3a)",
                  }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center text-8xl"
                    style={{ opacity: 0.12 }}
                  >
                    {featured.icon}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://source.unsplash.com/${featured.imageId}/1200x600`}
                    alt={featured.title}
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: "cover", opacity: 0, transition: "opacity 0.4s" }}
                    onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(11,31,58,0.75) 0%, rgba(11,31,58,0.15) 60%, transparent 100%)" }}
                  />
                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <span
                      className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{ background: featured.categoryColor, color: "white" }}
                    >
                      {featured.category}
                    </span>
                  </div>
                  {/* Title over photo */}
                  <div className="absolute bottom-0 inset-x-0 p-6">
                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 group-hover:text-orange-300 transition-colors">
                      {featured.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                      <span>{formatDate(featured.publishedAt)}</span>
                      <span>·</span>
                      <span>{featured.readTime} min de lecture</span>
                    </div>
                  </div>
                </div>
                {/* Excerpt */}
                <div className="bg-white p-6">
                  <p className="text-base leading-relaxed" style={{ color: "#475569" }}>
                    {featured.excerpt}
                  </p>
                  <span
                    className="inline-block mt-4 text-sm font-black"
                    style={{ color: "#f97316" }}
                  >
                    Lire l'article →
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* ── Article grid ── */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((article) => (
                <Link
                  key={article.slug}
                  href={`/conseils/${article.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5"
                  style={{
                    boxShadow: "0 2px 12px rgba(11,31,58,0.06)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {/* Photo */}
                  <div
                    className="relative flex-shrink-0"
                    style={{
                      height: 160,
                      background: "linear-gradient(135deg, #1e3a5f, #0b1f3a)",
                    }}
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center text-5xl"
                      style={{ opacity: 0.15 }}
                    >
                      {article.icon}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://source.unsplash.com/${article.imageId}/800x400`}
                      alt={article.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full"
                      style={{ objectFit: "cover", opacity: 0, transition: "opacity 0.4s" }}
                      onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(11,31,58,0.5), transparent 60%)" }}
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className="text-xs font-black uppercase tracking-wide px-2 py-1 rounded-full"
                        style={{ background: article.categoryColor, color: "white" }}
                      >
                        {article.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h2
                      className="font-black text-sm leading-snug mb-2 group-hover:text-orange-500 transition-colors"
                      style={{ color: "#0b1f3a" }}
                    >
                      {article.title}
                    </h2>
                    <p
                      className="text-xs leading-relaxed flex-1"
                      style={{ color: "#64748b" }}
                    >
                      {article.excerpt}
                    </p>
                    <div
                      className="flex items-center justify-between mt-3 pt-3"
                      style={{ borderTop: "1px solid #f1f5f9" }}
                    >
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        {article.readTime} min
                      </span>
                      <span
                        className="text-xs font-black"
                        style={{ color: "#f97316" }}
                      >
                        Lire →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-14 px-4" style={{ background: "#0b1f3a" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-3">
            Votre mécanicien vous a dit quelque chose que vous ne comprenez pas ?
          </h2>
          <p className="mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Trouvez un garage de confiance près de chez vous et prenez rendez-vous en ligne.
          </p>
          <Link
            href="/rechercher"
            className="inline-block px-8 py-3.5 rounded-xl text-base font-black text-white"
            style={{ background: "#f97316", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}
          >
            Trouver un garage près de moi →
          </Link>
        </div>
      </section>
    </main>
  );
}
