/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatEntry { value: string; label: string }

interface LiveStats { garages: string | null; reviews: string | null; cities: string | null }

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroStats({ stats, labels }: { stats: LiveStats; labels: string[] }) {
  const visible: StatEntry[] = [
    stats.garages ? { value: stats.garages, label: labels[0] } : null,
    stats.reviews ? { value: stats.reviews, label: labels[1] } : null,
    stats.cities  ? { value: stats.cities,  label: labels[2] } : null,
  ].filter((s): s is StatEntry => s !== null);

  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-8 mt-10">
      {visible.map((s) => (
        <div key={s.label} className="text-center">
          <div className="text-3xl font-black text-white">{s.value}</div>
          <div className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ iconPath, title, desc, stat }: { iconPath: string; title: string; desc: string; stat: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 card-hover" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <img src={iconPath} alt="" width={36} height={36} className="mb-4" />
      <h3 className="font-black text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
      <span className="inline-block px-3 py-1 rounded-full text-xs font-black"
        style={{ backgroundColor: "rgba(249,115,22,0.1)", color: "#f97316" }}>
        {stat}
      </span>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: { rating: number; text: string; name: string; garage: string; city: string; months: string } }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 card-hover" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div className="flex mb-3">
        {Array.from({ length: testimonial.rating }).map((_, j) => <span key={j} className="text-yellow-400 text-lg">★</span>)}
      </div>
      <p className="text-gray-700 text-sm leading-relaxed mb-5">"{testimonial.text}"</p>
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm"
          style={{ backgroundColor: "#0b1f3a" }}>
          {testimonial.name[0]}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
          <p className="text-xs text-gray-400">{testimonial.garage} · {testimonial.city}</p>
        </div>
        <span className="ml-auto text-xs px-2 py-1 rounded-full font-medium"
          style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}>
          {testimonial.months}
        </span>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <h3 className="font-bold text-gray-900 mb-2 flex items-start gap-2">
        <span style={{ color: "#f97316" }} className="font-black mt-0.5">Q.</span>
        {q}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed pl-5">{a}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TarifsPage() {
  const { t } = useLang();
  const p = t.pricing;

  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  useEffect(() => {
    fetch("/api/stats/homepage")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setLiveStats({ garages: d.garages ?? null, reviews: d.reviews ?? null, cities: d.cities ?? null });
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative overflow-hidden py-10 sm:py-20"
        style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-40 -top-40 w-[600px] h-[600px] rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            {p.heroTitle1}<br />
            <span style={{ color: "#f97316" }}>{p.heroTitle2}</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            {p.heroSub}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/inscription/garage"
              className="px-8 py-4 rounded-xl font-black text-white text-base transition-all hover:opacity-90"
              style={{ backgroundColor: "#f97316" }}>
              {p.heroCta}
            </Link>
            <a href="#formules"
              className="px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all text-sm"
              style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.2)" }}>
              {p.heroSeePlans}
            </a>
          </div>
          {liveStats && <HeroStats stats={liveStats} labels={p.heroStatLabels} />}
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">{p.painTitle}</h2>
            <p className="text-gray-500 mt-2">{p.painSub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {p.pains.map((pain, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <img src={pain.iconPath} alt="" width={24} height={24} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 leading-relaxed">{pain.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-lg font-black text-gray-900">{p.painCta}</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">{p.featuresTitle}</h2>
            <p className="text-gray-500 mt-2">{p.featuresSub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {p.features.map((f) => (
              <FeatureCard key={f.title} iconPath={f.iconPath} title={f.title} desc={f.desc} stat={f.stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────── */}
      <section id="formules" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">{p.plansTitle}</h2>
            <p className="text-gray-500 mt-2">{p.plansSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-10">
            {/* Essai gratuit */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 sm:p-8">
              <img src="/icons/pricing/gift.png" alt="" width={36} height={36} className="mb-3" />
              <h3 className="text-xl font-black text-gray-900 mb-1">{p.freePlanTitle}</h3>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-5xl font-black text-gray-900">{p.freePlanPrice}</span>
                <span className="text-gray-400">{p.freePlanPer}</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">{p.freePlanDesc}</p>
              <ul className="space-y-2.5 mb-8">
                {p.freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/inscription/garage"
                className="block w-full text-center font-bold py-3 rounded-xl transition-all hover:bg-gray-100 border border-gray-300 text-gray-700">
                {p.freeCta}
              </Link>
            </div>

            {/* Pro Mensuel */}
            <div className="rounded-2xl p-5 sm:p-8 relative"
              style={{ background: "linear-gradient(160deg, #0b1f3a, #0d2a50)", border: "2px solid #f97316" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-black text-white"
                style={{ backgroundColor: "#f97316" }}>
                {p.proBadge}
              </div>
              <img src="/icons/pricing/crown.png" alt="" width={36} height={36} className="mb-3"
                style={{ filter: "brightness(0) invert(1)" }} />
              <h3 className="text-xl font-black text-white mb-1">{p.proMonthlyTitle}</h3>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-5xl font-black text-white">{p.proMonthlyPrice}</span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.proMonthlyPer}</span>
              </div>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>{p.proMonthlyDesc}</p>
              <ul className="space-y-2.5 mb-8">
                {p.proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                    <span className="text-orange-400 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/inscription/garage"
                className="block w-full text-center font-black py-3.5 rounded-xl text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#f97316" }}>
                {p.proCta}
              </Link>
              <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>{p.proNote}</p>
            </div>

            {/* Pro Annuel */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 sm:p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black"
                style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                {p.saveBadge}
              </div>
              <img src="/icons/pricing/calendar.png" alt="" width={36} height={36} className="mb-3" />
              <h3 className="text-xl font-black text-gray-900 mb-1">{p.proAnnualTitle}</h3>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-5xl font-black text-gray-900">{p.proAnnualPrice}</span>
                <span className="text-gray-400">{p.proAnnualPer}</span>
              </div>
              <p className="text-gray-500 text-sm mb-1">{p.proAnnualDesc}</p>
              <p className="text-sm font-bold text-green-600 mb-4">{p.proAnnualSave}</p>
              <ul className="space-y-2.5 mb-8">
                {p.annualFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/inscription/garage"
                className="block w-full text-center font-bold py-3 rounded-xl text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#0b1f3a" }}>
                {p.annualCta}
              </Link>
            </div>
          </div>

          {/* ROI callout */}
          <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5"
            style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)", border: "1px solid #fed7aa" }}>
            <img src="/icons/pricing/bulb.png" alt="" width={60} height={60} className="flex-shrink-0" />
            <div>
              <h3 className="font-black text-gray-900 text-lg mb-1">{p.roiTitle}</h3>
              <p className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: p.roiDesc }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">{p.testimonialsTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {p.testimonials.map((testimonial, i) => (
              <TestimonialCard key={i} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">{p.howTitle}</h2>
            <p className="text-gray-500 mt-2">{p.howSub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {p.howSteps.map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white border-2 shadow-md"
                    style={{ borderColor: "#f97316" }}>
                    <img src={step.iconPath} alt="" width={40} height={40} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow"
                    style={{ backgroundColor: "#f97316" }}>
                    {step.num}
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-10">{p.faqTitle}</h2>
          <div className="space-y-4">
            {p.faq.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────── */}
      <section className="py-10 sm:py-20" style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">{p.finalTitle}</h2>
          <p className="text-lg mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            {p.finalSub}
            <br />
            <strong className="text-white">{p.finalStrong}</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/inscription/garage"
              className="px-10 py-4 rounded-xl font-black text-white text-lg transition-all hover:opacity-90"
              style={{ backgroundColor: "#f97316" }}>
              {p.finalCta}
            </Link>
          </div>
          <p className="text-sm mt-4" style={{ color: "rgba(255,255,255,0.35)" }}>{p.finalNote}</p>
        </div>
      </section>
    </div>
  );
}
