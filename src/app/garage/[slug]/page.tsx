"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import StarRating from "@/components/StarRating";
import BookingWidget from "@/components/BookingWidget";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { formatPriceRange, getDayName } from "@/lib/utils";

function parseImgPos(raw: string | null | undefined): { tx: number; ty: number; zoom: number } {
  const d = { tx: 0, ty: 0, zoom: 1 };
  if (!raw) return d;
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object") {
      if ("tx" in p) return { tx: Number(p.tx) || 0, ty: Number(p.ty) || 0, zoom: Math.max(0.1, Number(p.zoom) || 1) };
      if ("x"  in p) return { tx: (Number(p.x) || 50) - 50, ty: (Number(p.y) || 50) - 50, zoom: Math.max(0.1, Number(p.zoom) || 1) };
    }
  } catch { /**/ }
  if (raw === "top")    return { tx: 0, ty: -20, zoom: 1 };
  if (raw === "bottom") return { tx: 0, ty:  20, zoom: 1 };
  return d;
}

export default function GarageProfilePage() {
  const { slug } = useParams() as { slug: string };
  const { data: session } = useSession();
  const router = useRouter();
  const [garage, setGarage]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [isFav, setIsFav]       = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewService, setReviewService] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/garages/${slug}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setGarage({ error: d.error ?? "Erreur serveur" });
        } else {
          setGarage(d);
        }
        setLoading(false);
      })
      .catch(() => { setGarage({ error: "Erreur réseau" }); setLoading(false); });
  }, [slug]);

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
      body: JSON.stringify({
        garageId: garage.id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
        service: reviewService,
      }),
    });
    if (res.ok) {
      const review = await res.json();
      setGarage((g: any) => ({ ...g, reviews: [review, ...g.reviews] }));
      setShowReviewForm(false);
      setReviewTitle("");
      setReviewComment("");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!garage || garage.error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Garage introuvable</h1>
        <Link href="/rechercher" className="hover:underline" style={{ color: "#f97316" }}>← Retour à la recherche</Link>
      </div>
    );
  }

  const coverP = parseImgPos(garage.coverPosition);
  const logoP  = parseImgPos(garage.logoPosition);

  const acceptedBrands = garage.brands?.filter((b: any) => b.accepts) ?? [];
  const refusedBrands = garage.brands?.filter((b: any) => !b.accepts) ?? [];
  const servicesByCategory = garage.services?.reduce((acc: any, s: any) => {
    const cat = s.category?.name;
    if (!cat) return acc;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {}) ?? {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-semibold mb-6 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        style={{ color: "#0b1f3a" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        {garage.coverUrl ? (
          <div className="h-32 relative overflow-hidden">
            <img
              src={garage.coverUrl}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `translate(${coverP.tx}%, ${coverP.ty}%) scale(${coverP.zoom})`,
                transformOrigin: "center center",
                userSelect: "none",
              }}
            />
          </div>
        ) : (
          <div className="h-32" style={{ background: "linear-gradient(90deg, #071428 0%, #0b1f3a 60%, #f97316 100%)" }} />
        )}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-4xl overflow-hidden relative">
              {garage.logoUrl ? (
                <img
                  src={garage.logoUrl}
                  alt={garage.name}
                  draggable={false}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: `translate(${logoP.tx}%, ${logoP.ty}%) scale(${logoP.zoom})`,
                    transformOrigin: "center center",
                    userSelect: "none",
                  }}
                />
              ) : "🔧"}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">{garage.name}</h1>
                  <p className="text-gray-500">📍 {garage.address}, {garage.city}, {garage.province} {garage.postalCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  {garage.subscriptionStatus === "TRIAL" && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Période d'essai</span>
                  )}
                  {session?.user && (
                    <button
                      onClick={toggleFav}
                      disabled={favLoading}
                      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50"
                      style={isFav
                        ? { background: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" }
                        : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }}
                    >
                      {isFav ? "♥ Favori" : "♡ Favori"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rating + badges */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              {(() => {
                const stars = Math.min(5, Math.max(0, Math.round(Number(garage.avgRating) || 0)));
                return <span className="text-yellow-400 text-lg">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>;
              })()}
              <span className="font-bold text-gray-900">{garage.avgRating ?? 0}</span>
              <span className="text-gray-500 text-sm">({garage.reviewCount ?? 0} avis)</span>
            </div>
            {garage.acceptsWalkIn && <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">Sans rendez-vous</span>}
            {garage.appointmentOnly && <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium">Sur rendez-vous</span>}
          </div>

          {/* Contact */}
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${garage.phone}`} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm" style={{ background: "#f97316" }}>
              📞 {garage.phone}
            </a>
            {garage.email && (
              <a href={`mailto:${garage.email}`} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
                ✉️ {garage.email}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {garage.description && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-3">À propos</h2>
              <p className="text-gray-600 leading-relaxed">{garage.description}</p>
            </div>
          )}

          {/* Services */}
          {Object.keys(servicesByCategory).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Services offerts</h2>
              <div className="space-y-4">
                {Object.entries(servicesByCategory).map(([cat, svcs]: [string, any]) => (
                  <div key={cat}>
                    <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                      <span>{SERVICE_CATEGORIES.find((s) => s.name === cat)?.icon}</span>
                      {cat}
                    </h3>
                    <div className="space-y-2 pl-6">
                      {svcs.map((s: any) => (
                        <div key={s.id} className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{s.name}</p>
                            {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                            {s.durationMin && <p className="text-xs text-gray-400">⏱ ~{s.durationMin} min</p>}
                          </div>
                          <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "#f97316" }}>
                            {formatPriceRange(s.priceMin, s.priceMax)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brands */}
          {acceptedBrands.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Marques de véhicules</h2>
              {acceptedBrands.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-green-700 mb-2">✓ Acceptées</p>
                  <div className="flex flex-wrap gap-2">
                    {acceptedBrands.map((b: any) => (
                      <span key={b.brand} className="text-sm bg-green-50 text-green-800 border border-green-200 px-3 py-1 rounded-full">{b.brand}</span>
                    ))}
                  </div>
                </div>
              )}
              {refusedBrands.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-2">✗ Non acceptées</p>
                  <div className="flex flex-wrap gap-2">
                    {refusedBrands.map((b: any) => (
                      <span key={b.brand} className="text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full">{b.brand}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">Avis clients ({garage.reviewCount ?? 0})</h2>
              {session && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-sm text-white px-4 py-2 rounded-xl transition-colors font-medium" style={{ background: "#f97316" }}
                >
                  ✍️ Laisser un avis
                </button>
              )}
              {!session && (
                <Link href="/connexion" className="text-sm hover:underline" style={{ color: "#f97316" }}>
                  Connectez-vous pour laisser un avis
                </Link>
              )}
            </div>

            {showReviewForm && (
              <form onSubmit={submitReview} className="rounded-xl p-4 mb-5 space-y-3" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Note</label>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Service utilisé</label>
                  <select
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={reviewService}
                    onChange={(e) => setReviewService(e.target.value)}
                  >
                    <option value="">Choisir un service</option>
                    {SERVICE_CATEGORIES.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Titre</label>
                  <input
                    type="text"
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Résumé de votre expérience"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Commentaire</label>
                  <textarea
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[80px]"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Décrivez votre expérience..."
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>
                    {submitting ? "Envoi..." : "Publier mon avis"}
                  </button>
                  <button type="button" onClick={() => setShowReviewForm(false)} className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {garage.reviews?.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun avis pour l'instant. Soyez le premier!</p>
            ) : (
              <div className="space-y-4">
                {garage.reviews?.map((review: any) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Widget de réservation */}
          <BookingWidget
            garageId={garage.id}
            garageSlug={slug}
            garageName={garage.name}
            garageAddress={garage.address}
            garageCity={garage.city}
            services={garage.services ?? []}
          />

          {/* Horaires */}
          {garage.availability?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">🕐 Horaires</h3>
              <div className="space-y-1.5">
                {garage.availability.map((a: any) => (
                  <div key={a.dayOfWeek} className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">{getDayName(a.dayOfWeek)}</span>
                    {a.isClosed ? (
                      <span className="text-red-500">Fermé</span>
                    ) : (
                      <span className="text-gray-900">{a.openTime} – {a.closeTime}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Infos */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">ℹ️ Informations</h3>
            <div className="space-y-2 text-sm">
              {garage.yearFounded && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fondé en</span>
                  <span className="font-medium text-gray-900">{garage.yearFounded}</span>
                </div>
              )}
              {garage.employeeCount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Employés</span>
                  <span className="font-medium text-gray-900">{garage.employeeCount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Sans rendez-vous</span>
                <span className="font-medium text-gray-900">{garage.acceptsWalkIn ? "Oui ✓" : "Non"}</span>
              </div>
              {garage.languages && (() => {
                try {
                  const langs = typeof garage.languages === "string"
                    ? JSON.parse(garage.languages)
                    : garage.languages;
                  if (!Array.isArray(langs) || langs.length === 0) return null;
                  return (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Langues</span>
                      <span className="font-medium text-gray-900">
                        {langs.map((l: string) => l === "fr" ? "Français" : "English").join(", ")}
                      </span>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
