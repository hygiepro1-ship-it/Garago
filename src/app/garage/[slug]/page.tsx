"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import StarRating from "@/components/StarRating";
import BookingWidget from "@/components/BookingWidget";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { formatPriceRange, getDayName } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";
import { getVehicleClass, estimateQuote } from "@/lib/laborTimes";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";

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
  if (raw === "top")    return { tx: 0, ty: -20, zoom: 1 };
  if (raw === "bottom") return { tx: 0, ty:  20, zoom: 1 };
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
  const [garage, setGarage]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [isFav, setIsFav]       = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Devis estimatif
  const [quoteVehicleYear, setQuoteVehicleYear] = useState("");
  const [quoteVehicleMake, setQuoteVehicleMake] = useState("");
  const [quoteVehicleModel, setQuoteVehicleModel] = useState("");
  const [savedVehicles, setSavedVehicles] = useState<any[]>([]);
  const quoteModels = quoteVehicleMake ? getModelsForMake(quoteVehicleMake) : [];
  const quoteYears  = getYears();

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

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/vehicles")
      .then(r => r.json())
      .then(v => { if (Array.isArray(v) && v.length > 0) { setSavedVehicles(v); const def = v[0]; setQuoteVehicleYear(String(def.year)); setQuoteVehicleMake(def.make); setQuoteVehicleModel(def.model); } });
  }, [session]);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{g.notFound}</h1>
        <Link href="/rechercher" className="hover:underline" style={{ color: "#f97316" }}>{g.backToSearch}</Link>
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
      {fromDashboard ? (
        <Link
          href="/tableau-de-bord/garage"
          className="inline-flex items-center gap-2 text-sm font-semibold mb-6 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          style={{ color: "#0b1f3a" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          ← Tableau de bord
        </Link>
      ) : (
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold mb-6 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          style={{ color: "#0b1f3a" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {g.back}
        </button>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        {garage.coverUrl ? (
          <div className="h-32 relative overflow-hidden">
            {/* Background layer — solid colour or blurred image */}
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
            <img
              src={garage.coverUrl}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
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
          <div className="flex items-end gap-4 mb-4">
            <div className="w-20 h-20 -mt-10 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-4xl overflow-hidden relative bg-gray-100">
              {garage.logoUrl ? (
                <>
                  {/* Background layer */}
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
                </>
              ) : "🔧"}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">{garage.name}</h1>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${garage.address}, ${garage.city}, ${garage.province} ${garage.postalCode}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-orange-500 transition-colors text-sm inline-flex items-center gap-1 group"
                    title="Voir sur Google Maps"
                  >
                    📍 <span className="group-hover:underline">{garage.address}, {garage.city}, {garage.province} {garage.postalCode}</span>
                    <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  {garage.subscriptionStatus === "TRIAL" && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">{g.trial}</span>
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
                      {isFav ? `♥ ${g.favourite}` : `♡ ${g.favourite}`}
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
              <span className="text-gray-500 text-sm">({garage.reviewCount ?? 0} {g.reviewsCount})</span>
            </div>
            {garage.acceptsWalkIn && <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">{g.walkIn}</span>}
            {garage.appointmentOnly && <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium">{g.byAppt}</span>}
          </div>

          {/* Contact */}
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${garage.phone}`} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm" style={{ background: "#f97316" }}>
              📞 {garage.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {garage.description && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-3">{g.about}</h2>
              <p className="text-gray-600 leading-relaxed">{garage.description}</p>
            </div>
          )}

          {/* Services */}
          {Object.keys(servicesByCategory).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">{g.servicesOffered}</h2>

              {/* ── Calculateur de devis ── */}
              {garage.hourlyRate && (
                <div className="mb-6 rounded-xl p-4 space-y-3" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧮</span>
                    <p className="font-bold text-gray-900 text-sm">Estimez votre devis</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#f97316", color: "#fff" }}>NOUVEAU</span>
                  </div>
                  <p className="text-xs text-gray-500">Entrez votre véhicule pour voir des prix estimatifs. Ces montants sont approximatifs et peuvent varier selon l&apos;état réel du véhicule.</p>

                  {/* Sélecteur de véhicule */}
                  {savedVehicles.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Vos véhicules enregistrés</label>
                      <div className="flex flex-wrap gap-2">
                        {savedVehicles.map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => { setQuoteVehicleYear(String(v.year)); setQuoteVehicleMake(v.make); setQuoteVehicleModel(v.model); }}
                            className="text-xs px-3 py-1.5 rounded-lg border-2 font-medium transition-all"
                            style={quoteVehicleMake === v.make && quoteVehicleModel === v.model
                              ? { borderColor: "#f97316", background: "#fff7ed", color: "#c2410c" }
                              : { borderColor: "#e5e7eb", background: "#fff", color: "#374151" }}
                          >
                            {v.year} {v.make} {v.model}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Année</label>
                      <select className="block w-full border border-gray-300 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                        value={quoteVehicleYear} onChange={e => setQuoteVehicleYear(e.target.value)}>
                        <option value="">—</option>
                        {quoteYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Marque</label>
                      <select className="block w-full border border-gray-300 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                        value={quoteVehicleMake} onChange={e => { setQuoteVehicleMake(e.target.value); setQuoteVehicleModel(""); }}>
                        <option value="">—</option>
                        {VEHICLE_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Modèle</label>
                      <select className="block w-full border border-gray-300 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                        value={quoteVehicleModel} onChange={e => setQuoteVehicleModel(e.target.value)} disabled={!quoteVehicleMake}>
                        <option value="">—</option>
                        {quoteModels.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  {quoteVehicleMake && quoteVehicleModel && (() => {
                    const cls = getVehicleClass(quoteVehicleMake, quoteVehicleModel);
                    const classLabel: Record<string, string> = { compact: "Compacte", regular: "Berline/Coupé", suv: "VUS/Crossover", truck: "Camionnette", luxury: "Luxe/Européen" };
                    return (
                      <p className="text-xs text-gray-400">
                        Catégorie détectée : <span className="font-semibold text-gray-600">{classLabel[cls]}</span>
                        <span className="ml-2 text-gray-300">· Taux : {garage.hourlyRate}$/h</span>
                      </p>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-4">
                {Object.entries(servicesByCategory).map(([cat, svcs]: [string, any]) => (
                  <div key={cat}>
                    <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                      <span>{SERVICE_CATEGORIES.find((s) => s.name === cat)?.icon}</span>
                      {cat}
                    </h3>
                    <div className="space-y-2 pl-6">
                      {svcs.map((s: any) => {
                        // Calcul du devis estimatif si taux horaire disponible et véhicule sélectionné
                        const categorySlug = SERVICE_CATEGORIES.find(sc => sc.name === s.category?.name)?.id;
                        const estimate = (garage.hourlyRate && quoteVehicleMake && quoteVehicleModel && categorySlug)
                          ? estimateQuote(categorySlug, garage.hourlyRate, getVehicleClass(quoteVehicleMake, quoteVehicleModel))
                          : null;
                        return (
                          <div key={s.id} className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{s.name}</p>
                              {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                              {s.durationMin && <p className="text-xs text-gray-400">⏱ ~{s.durationMin} min</p>}
                              {estimate && (
                                <p className="text-xs mt-0.5" style={{ color: "#9a3412" }}>
                                  🧮 {estimate.note} · {estimate.laborHours}h MO
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              {estimate ? (
                                <div>
                                  <p className="text-sm font-bold" style={{ color: "#f97316" }}>
                                    ~{estimate.totalMin}$ – {estimate.totalMax > estimate.totalMin ? `${estimate.totalMax}$` : ""}
                                  </p>
                                  <p className="text-xs text-gray-400">estimé</p>
                                </div>
                              ) : (
                                <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "#f97316" }}>
                                  {formatPriceRange(s.priceMin, s.priceMax)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brands */}
          {acceptedBrands.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">{g.vehicleBrands}</h2>
              {acceptedBrands.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-green-700 mb-2">{g.accepted}</p>
                  <div className="flex flex-wrap gap-2">
                    {acceptedBrands.map((b: any) => (
                      <span key={b.brand} className="text-sm bg-green-50 text-green-800 border border-green-200 px-3 py-1 rounded-full">{b.brand}</span>
                    ))}
                  </div>
                </div>
              )}
              {refusedBrands.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-2">{g.refused}</p>
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
              <h2 className="font-bold text-gray-900 text-lg">{g.reviews} ({garage.reviewCount ?? 0})</h2>
              {session && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-sm text-white px-4 py-2 rounded-xl transition-colors font-medium" style={{ background: "#f97316" }}
                >
                  {g.leaveReview}
                </button>
              )}
              {!session && (
                <Link href="/connexion" className="text-sm hover:underline" style={{ color: "#f97316" }}>
                  {g.signInToReview}
                </Link>
              )}
            </div>

            {showReviewForm && (
              <form onSubmit={submitReview} className="rounded-xl p-4 mb-5 space-y-3" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{g.ratingLabel}</label>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{g.serviceUsed}</label>
                  <select
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={reviewService}
                    onChange={(e) => setReviewService(e.target.value)}
                  >
                    <option value="">{g.chooseService}</option>
                    {SERVICE_CATEGORIES.map((sc) => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{g.titleLabel}</label>
                  <input
                    type="text"
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder={g.titlePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{g.commentLabel}</label>
                  <textarea
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[80px]"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={g.commentPlaceholder}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>
                    {submitting ? g.submitting : g.submitReview}
                  </button>
                  <button type="button" onClick={() => setShowReviewForm(false)} className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">
                    {t.common.cancel}
                  </button>
                </div>
              </form>
            )}

            {garage.reviews?.length === 0 ? (
              <p className="text-gray-500 text-sm">{g.noReviews}</p>
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
              <h3 className="font-bold text-gray-900 mb-3">{g.hoursTitle}</h3>
              <div className="space-y-1.5">
                {garage.availability.map((a: any) => (
                  <div key={a.dayOfWeek} className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">{getDayName(a.dayOfWeek)}</span>
                    {a.isClosed ? (
                      <span className="text-red-500">{g.closed}</span>
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
            <h3 className="font-bold text-gray-900 mb-3">{g.infoTitle}</h3>
            <div className="space-y-2 text-sm">
              {garage.yearFounded && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{g.founded}</span>
                  <span className="font-medium text-gray-900">{garage.yearFounded}</span>
                </div>
              )}
              {garage.employeeCount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{g.employees}</span>
                  <span className="font-medium text-gray-900">{garage.employeeCount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">{g.walkIn}</span>
                <span className="font-medium text-gray-900">{garage.acceptsWalkIn ? g.walkInYes : g.walkInNo}</span>
              </div>
              {garage.languages && (() => {
                try {
                  const langs = typeof garage.languages === "string"
                    ? JSON.parse(garage.languages)
                    : garage.languages;
                  if (!Array.isArray(langs) || langs.length === 0) return null;
                  return (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{g.languages}</span>
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
