/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import StarRating from "@/components/StarRating";
import BookingWidget from "@/components/BookingWidget";
import ServiceIcon from "@/components/ServiceIcon";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { getDayName } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));
  const cls = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={cls} viewBox="0 0 24 24" fill={i <= filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth={1.5}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  );
}

function parseGarageLangs(raw: unknown): string[] | null {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch { return null; }
}

function parseImgPos(raw: string | null | undefined): { tx: number; ty: number; zoom: number; color?: string } {
  const d = { tx: 0, ty: 0, zoom: 1 };
  if (!raw) return d;
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object") {
      const color = typeof p.color === "string" && p.color ? p.color : undefined;
      if ("tx" in p) return { tx: Number(p.tx) || 0, ty: Number(p.ty) || 0, zoom: Math.max(0.1, Number(p.zoom) || 1), color };
      if ("x"  in p) return { tx: (Number(p.x) || 50) - 50, ty: (Number(p.y) || 50) - 50, zoom: Math.max(0.1, Number(p.zoom) || 1), color };
    }
  } catch { /**/ }
  return d;
}

export default function GarageProfilePage() {
  const { slug } = useParams() as { slug: string };
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDashboard = searchParams.get("from") === "dashboard";
  const { t } = useLang();
  const g = t.garage;

  const [garage, setGarage]         = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [isFav, setIsFav]           = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating]     = useState(5);
  const [reviewTitle, setReviewTitle]       = useState("");
  const [reviewComment, setReviewComment]   = useState("");
  const [reviewService, setReviewService]   = useState("");
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => {
    fetch(`/api/garages/${slug}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setGarage({ error: d.error ?? "Erreur serveur" });
        } else {
          setGarage(d);
          const userId = (session?.user as any)?.id;
          if (d.id && d.ownerId !== userId) {
            fetch("/api/garage/view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ garageId: d.id }) }).catch(() => {});
          }
        }
        setLoading(false);
      })
      .catch(() => { setGarage({ error: "Erreur réseau" }); setLoading(false); });
  }, [slug, session]);

  const isOwner = !!(session?.user && garage?.ownerId && session.user.id === garage.ownerId);

  useEffect(() => {
    if (!session?.user || !garage?.id) return;
    fetch("/api/favorites")
      .then(r => r.json())
      .then((favs: any[]) => setIsFav(favs.some(f => f.garageId === garage.id)));
  }, [session, garage?.id]);

  async function toggleFav() {
    if (!session?.user) return;
    setFavLoading(true);
    if (isFav) {
      await fetch(`/api/favorites/${garage.id}`, { method: "DELETE" });
      setIsFav(false);
    } else {
      await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ garageId: garage.id }) });
      setIsFav(true);
    }
    setFavLoading(false);
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ garageId: garage.id, rating: reviewRating, title: reviewTitle, comment: reviewComment, service: reviewService }),
    });
    if (res.ok) {
      const review = await res.json();
      setGarage((g: any) => ({ ...g, reviews: [review, ...g.reviews] }));
      setShowReviewForm(false);
      setReviewTitle(""); setReviewComment("");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-56 bg-gray-200 rounded-2xl" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="h-32 bg-gray-200 rounded-2xl col-span-2" />
            <div className="h-32 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!garage || garage.error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <svg className="w-14 h-14 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{g.notFound}</h1>
        <Link href="/rechercher" className="hover:underline font-semibold" style={{ color: "#f97316" }}>{g.backToSearch}</Link>
      </div>
    );
  }

  const coverP = parseImgPos(garage.coverPosition);
  const logoP  = parseImgPos(garage.logoPosition);
  const acceptedBrands = garage.brands?.filter((b: any) =>  b.accepts) ?? [];
  const refusedBrands  = garage.brands?.filter((b: any) => !b.accepts) ?? [];
  const garageLangs    = parseGarageLangs(garage.languages);

  // Unique service categories offered by this garage
  const offeredCategories = SERVICE_CATEGORIES.filter(sc =>
    garage.services?.some((s: any) => s.categoryId === sc.id || s.category?.name === sc.name)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

      {/* Back button */}
      {fromDashboard ? (
        <Link href="/tableau-de-bord/garage"
          className="inline-flex items-center gap-2 text-sm font-semibold mb-6 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          style={{ color: "#0b1f3a" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Tableau de bord
        </Link>
      ) : (
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold mb-6 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          style={{ color: "#0b1f3a" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          {g.back}
        </button>
      )}

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        {/* Cover image */}
        <div className="relative h-44 sm:h-56 overflow-hidden">
          {garage.coverUrl ? (
            <>
              {coverP.color ? (
                <div style={{ position: "absolute", inset: 0, background: coverP.color }} />
              ) : (
                <div style={{
                  position: "absolute", inset: "-20px",
                  backgroundImage: `url(${garage.coverUrl})`,
                  backgroundSize: "cover", backgroundPosition: "center",
                  filter: "blur(18px) brightness(0.85)",
                }} />
              )}
              <img src={garage.coverUrl} alt={`Photo de ${garage.name}`} draggable={false}
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "contain",
                  transform: `translate(${coverP.tx}%, ${coverP.ty}%) scale(${coverP.zoom})`,
                  transformOrigin: "center center", userSelect: "none",
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 55%, #1a3a6b 75%, #f97316 140%)" }} />
          )}
          {/* Gradient overlay at bottom for smooth transition */}
          <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.95))" }} />
        </div>

        {/* Identity row */}
        <div className="px-5 sm:px-8 pb-6 -mt-10 relative z-10">
          <div className="flex items-end gap-4 mb-4">
            {/* Logo avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center overflow-hidden relative bg-gray-100 flex-shrink-0"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              {garage.logoUrl ? (
                <>
                  {logoP.color ? (
                    <div style={{ position: "absolute", inset: 0, background: logoP.color }} />
                  ) : (
                    <div style={{
                      position: "absolute", inset: "-10px",
                      backgroundImage: `url(${garage.logoUrl})`,
                      backgroundSize: "cover", backgroundPosition: "center",
                      filter: "blur(12px)",
                    }} />
                  )}
                  <img src={garage.logoUrl} alt={garage.name} draggable={false}
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%",
                      objectFit: "contain",
                      transform: `translate(${logoP.tx}%, ${logoP.ty}%) scale(${logoP.zoom})`,
                      transformOrigin: "center center", userSelect: "none",
                    }}
                  />
                </>
              ) : (
                <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
              )}
            </div>

            {/* Name + ambassador badge */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{garage.name}</h1>
                {(garage as any).isAmbassador && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-black flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #1f2e67 0%, #f97316 100%)" }}>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Ambassadeur Garago
                  </span>
                )}
              </div>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${garage.address}, ${garage.city}, ${garage.province} ${garage.postalCode}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-gray-500 hover:text-orange-500 transition-colors text-sm group">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="group-hover:underline">{garage.address}, {garage.city}, {garage.province} {garage.postalCode}</span>
              </a>
            </div>

            {/* Fav button (desktop) */}
            {session?.user && (
              <button onClick={toggleFav} disabled={favLoading}
                title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 flex-shrink-0"
                style={isFav
                  ? { background: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" }
                  : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                {g.favourite}
              </button>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-gray-100">
            {/* Rating */}
            <div className="flex items-center gap-2">
              <StarDisplay rating={Number(garage.avgRating) || 0} />
              <span className="font-bold text-gray-900 text-sm">{Number(garage.avgRating) > 0 ? Number(garage.avgRating).toFixed(1) : "—"}</span>
              <span className="text-gray-400 text-sm">({garage.reviewCount ?? 0} {g.reviewsCount})</span>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            {/* Badges */}
            {garage.acceptsWalkIn && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                {g.walkIn}
              </span>
            )}
            {garage.appointmentOnly && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {g.byAppt}
              </span>
            )}
            {garage.subscriptionStatus === "TRIAL" && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium border border-yellow-200">{g.trial}</span>
            )}

            {/* Phone (mobile-first CTA) */}
            <a href={`tel:${garage.phone}`}
              className="ml-auto flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm flex-shrink-0"
              style={{ background: "#f97316" }}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.99 1.18 2 2 0 013 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              {garage.phone}
            </a>

            {/* Fav button (mobile) */}
            {session?.user && (
              <button onClick={toggleFav} disabled={favLoading}
                className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50"
                style={isFav ? { background: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" } : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT GRID ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Description */}
          {garage.description && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                {g.about}
              </h2>
              <p className="text-gray-600 leading-relaxed">{garage.description}</p>
            </div>
          )}

          {/* Services */}
          {offeredCategories.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
                {g.servicesOffered}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {offeredCategories.map((sc) => {
                  const svc = garage.services?.find((s: any) => s.categoryId === sc.id || s.category?.name === sc.name);
                  return (
                    <div key={sc.id}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:border-orange-200 hover:bg-orange-50 transition-colors group">
                      <span className="text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0">
                        <ServiceIcon id={sc.id} size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{sc.name}</p>
                        {svc?.durationMin && (
                          <p className="text-xs text-gray-400 mt-0.5">{svc.durationMin} min</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brands */}
          {(acceptedBrands.length > 0 || refusedBrands.length > 0) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
                {g.vehicleBrands}
              </h2>
              {acceptedBrands.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">{g.accepted}</p>
                  <div className="flex flex-wrap gap-2">
                    {acceptedBrands.map((b: any) => (
                      <span key={b.brand} className="text-sm bg-green-50 text-green-800 border border-green-200 px-3 py-1 rounded-full font-medium">{b.brand}</span>
                    ))}
                  </div>
                </div>
              )}
              {refusedBrands.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">{g.refused}</p>
                  <div className="flex flex-wrap gap-2">
                    {refusedBrands.map((b: any) => (
                      <span key={b.brand} className="text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full font-medium">{b.brand}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                {g.reviews}
                <span className="text-gray-400 font-normal text-base">({garage.reviewCount ?? 0})</span>
              </h2>
              {session && !isOwner && (
                <button onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-sm text-white px-4 py-2 rounded-xl font-semibold transition-colors flex-shrink-0"
                  style={{ background: "#f97316" }}>
                  {g.leaveReview}
                </button>
              )}
              {!session && (
                <Link href="/connexion" className="text-sm font-semibold hover:underline flex-shrink-0" style={{ color: "#f97316" }}>
                  {g.signInToReview}
                </Link>
              )}
            </div>

            {showReviewForm && (
              <form onSubmit={submitReview} className="rounded-2xl p-5 mb-6 space-y-4" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{g.ratingLabel}</label>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{g.serviceUsed}</label>
                  <select className="block w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={reviewService} onChange={(e) => setReviewService(e.target.value)}>
                    <option value="">{g.chooseService}</option>
                    {SERVICE_CATEGORIES.map((sc) => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{g.titleLabel}</label>
                  <input type="text"
                    className="block w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder={g.titlePlaceholder} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{g.commentLabel}</label>
                  <textarea
                    className="block w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[80px]"
                    value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={g.commentPlaceholder} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={submitting}
                    className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    style={{ background: "#f97316" }}>
                    {submitting ? g.submitting : g.submitReview}
                  </button>
                  <button type="button" onClick={() => setShowReviewForm(false)}
                    className="border border-gray-300 px-5 py-2 rounded-xl text-sm hover:bg-gray-50">
                    {t.common.cancel}
                  </button>
                </div>
              </form>
            )}

            {garage.reviews?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p className="text-sm">{g.noReviews}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {garage.reviews?.map((review: any) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">

          {/* Booking widget */}
          <div className="lg:sticky lg:top-6">
            <div style={isOwner ? { opacity: 0.5, pointerEvents: "none", userSelect: "none" } : undefined}>
              {isOwner && (
                <p className="text-center text-xs text-gray-400 mb-2 italic">Aperçu uniquement — vous ne pouvez pas prendre rendez-vous avec vous-même.</p>
              )}
              <BookingWidget
                garageId={garage.id}
                garageSlug={slug}
                garageName={garage.name}
                garageAddress={garage.address}
                garageCity={garage.city}
                services={garage.services ?? []}
              />
            </div>

            {/* Hours */}
            {garage.availability?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mt-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {g.hoursTitle}
                </h3>
                <div className="space-y-1.5">
                  {garage.availability.map((a: any) => (
                    <div key={a.dayOfWeek} className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">{getDayName(a.dayOfWeek)}</span>
                      {a.isClosed ? (
                        <span className="text-red-500 font-medium">{g.closed}</span>
                      ) : (
                        <span className="text-gray-900 font-semibold">{a.openTime} – {a.closeTime}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mt-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {g.infoTitle}
              </h3>
              <div className="space-y-2.5 text-sm">
                {garage.yearFounded && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{g.founded}</span>
                    <span className="font-semibold text-gray-900">{garage.yearFounded}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">{g.walkIn}</span>
                  <span className="font-semibold text-gray-900">{garage.acceptsWalkIn ? g.walkInYes : g.walkInNo}</span>
                </div>
                {(garage as any).emailPublic && garage.email && (
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 flex-shrink-0">Courriel</span>
                    <a href={`mailto:${garage.email}`} className="font-semibold text-orange-600 hover:underline truncate text-right">{garage.email}</a>
                  </div>
                )}
                {garageLangs && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{g.languages}</span>
                    <span className="font-semibold text-gray-900">
                      {garageLangs.map((l: string) => l === "fr" ? "Français" : "English").join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
