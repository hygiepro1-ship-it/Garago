"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import StarRating from "@/components/StarRating";
import BookingWidget from "@/components/BookingWidget";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { formatPriceRange, getDayName } from "@/lib/utils";

export default function GarageProfilePage() {
  const { slug } = useParams() as { slug: string };
  const { data: session } = useSession();
  const [garage, setGarage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewService, setReviewService] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/garages/${slug}`)
      .then((r) => r.json())
      .then((d) => { setGarage(d); setLoading(false); });
  }, [slug]);

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
        <Link href="/rechercher" className="text-blue-600 hover:underline">← Retour à la recherche</Link>
      </div>
    );
  }

  const acceptedBrands = garage.brands?.filter((b: any) => b.accepts) ?? [];
  const refusedBrands = garage.brands?.filter((b: any) => !b.accepts) ?? [];
  const servicesByCategory = garage.services?.reduce((acc: any, s: any) => {
    const cat = s.category.name;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {}) ?? {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/rechercher" className="text-blue-600 hover:underline text-sm mb-6 inline-block">
        ← Retour aux résultats
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-4xl">
              {garage.logoUrl ? <img src={garage.logoUrl} alt={garage.name} className="w-16 h-16 object-cover rounded-xl" /> : "🔧"}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">{garage.name}</h1>
                  <p className="text-gray-500">📍 {garage.address}, {garage.city}, {garage.province} {garage.postalCode}</p>
                </div>
                {garage.subscriptionStatus === "TRIAL" && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Période d'essai</span>
                )}
              </div>
            </div>
          </div>

          {/* Rating + badges */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-lg">{"★".repeat(Math.round(garage.avgRating ?? 0))}{"☆".repeat(5 - Math.round(garage.avgRating ?? 0))}</span>
              <span className="font-bold text-gray-900">{garage.avgRating ?? 0}</span>
              <span className="text-gray-500 text-sm">({garage.reviewCount ?? 0} avis)</span>
            </div>
            {garage.acceptsWalkIn && <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">Sans rendez-vous</span>}
            {garage.appointmentOnly && <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium">Sur rendez-vous</span>}
          </div>

          {/* Contact */}
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${garage.phone}`} className="flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-800 transition-colors text-sm">
              📞 {garage.phone}
            </a>
            {garage.email && (
              <a href={`mailto:${garage.email}`} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
                ✉️ {garage.email}
              </a>
            )}
            {garage.website && (
              <a href={garage.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
                🌐 Site web
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
                          <span className="text-sm font-semibold text-blue-700 whitespace-nowrap">
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
                  className="text-sm bg-blue-700 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors font-medium"
                >
                  ✍️ Laisser un avis
                </button>
              )}
              {!session && (
                <Link href="/connexion" className="text-sm text-blue-600 hover:underline">
                  Connectez-vous pour laisser un avis
                </Link>
              )}
            </div>

            {showReviewForm && (
              <form onSubmit={submitReview} className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 space-y-3">
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
                  <button type="submit" disabled={submitting} className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
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
          {/* Booking widget */}
          <BookingWidget
            garageId={garage.id}
            garageSlug={slug}
            garageName={garage.name}
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
              {garage.languages && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Langues</span>
                  <span className="font-medium text-gray-900">
                    {JSON.parse(garage.languages).map((l: string) => l === "fr" ? "Français" : "English").join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
