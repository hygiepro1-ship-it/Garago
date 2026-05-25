import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

interface GarageCardProps {
  garage: {
    slug: string;
    name: string;
    city: string;
    province: string;
    address?: string;
    description?: string | null;
    logoUrl?: string | null;
    avgRating: number;
    reviewCount: number;
    subscriptionStatus: string;
    services: Array<{ category: { name: string; icon?: string | null }; priceMin?: number | null; priceMax?: number | null }>;
    brands: Array<{ brand: string; accepts: boolean }>;
    acceptsWalkIn: boolean;
    appointmentOnly: boolean;
  };
  highlightService?: string;
  distance?: string;          // e.g. "3.2 km"
}

export default function GarageCard({ garage, highlightService, distance }: GarageCardProps) {
  const acceptedBrands = garage.brands.filter((b) => b.accepts).slice(0, 6);
  const services = garage.services.slice(0, 3);

  // Find the highlighted service price
  const highlightedSvc = highlightService
    ? garage.services.find((s) => s.category.name.toLowerCase().includes(highlightService.toLowerCase()))
    : null;

  // Round rating to 1 decimal
  const rating = Math.round(garage.avgRating * 10) / 10;
  const ratingFull = Math.round(rating);

  return (
    <Link href={`/garage/${garage.slug}`} className="block group">
      <div
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden card-hover h-full"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        {/* Top accent line */}
        <div className="h-1" style={{ background: "linear-gradient(90deg, #0b1f3a, #f97316)" }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Logo */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 font-black"
              style={{ backgroundColor: "#f8fafc", border: "2px solid #e2e8f0" }}
            >
              {garage.logoUrl
                ? <img src={garage.logoUrl} alt={garage.name} className="w-12 h-12 object-cover rounded-lg" />
                : garage.name.slice(0, 2).toUpperCase()
              }
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className="font-black text-gray-900 text-base leading-tight mb-0.5 group-hover:transition-colors truncate"
                style={{ color: "#0b1f3a" }}
              >
                {garage.name}
              </h3>
              <p className="text-gray-500 text-xs flex items-center gap-1.5">
                📍 {garage.city}, {garage.province}
                {distance && (
                  <span className="font-semibold px-1.5 py-0.5 rounded-md text-xs" style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}>
                    {distance}
                  </span>
                )}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="text-sm" style={{ color: i <= ratingFull ? "#f59e0b" : "#d1d5db" }}>★</span>
                  ))}
                </div>
                {garage.reviewCount > 0 ? (
                  <>
                    <span className="text-sm font-black text-gray-900">{rating}</span>
                    <span className="text-xs text-gray-400">({garage.reviewCount} avis)</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">Nouveau garage</span>
                )}
              </div>
            </div>

            {/* Price highlight if service selected */}
            {highlightedSvc && (
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-gray-400 leading-none">À partir de</p>
                <p className="text-xl font-black mt-0.5" style={{ color: "#f97316" }}>
                  {highlightedSvc.priceMin ? `${highlightedSvc.priceMin} $` : "Sur devis"}
                </p>
              </div>
            )}
          </div>

          {/* Services chips */}
          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {services.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
                >
                  {s.category.icon && <span>{s.category.icon}</span>}
                  {s.category.name}
                  {s.priceMin && (
                    <span className="ml-1 font-black" style={{ color: "#f97316" }}>{s.priceMin}$</span>
                  )}
                </span>
              ))}
              {garage.services.length > 3 && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-gray-500 bg-gray-100">
                  +{garage.services.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Brands — logos */}
          {acceptedBrands.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {acceptedBrands.map((b, i) => (
                <div key={i} title={b.brand} className="flex items-center justify-center w-7 h-7 rounded-md border border-gray-100 bg-white p-0.5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <BrandLogo brand={b.brand} size={22} />
                </div>
              ))}
              {garage.brands.filter((b) => b.accepts).length > 6 && (
                <span className="text-xs px-2 py-0.5 rounded-md text-gray-400 bg-gray-50 border border-gray-100">
                  +{garage.brands.filter((b) => b.accepts).length - 6}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex gap-2">
              {garage.acceptsWalkIn && (
                <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                  Sans RDV
                </span>
              )}
              {garage.appointmentOnly && (
                <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>
                  Sur RDV
                </span>
              )}
            </div>
            <span
              className="text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
              style={{ color: "#f97316" }}
            >
              Voir le profil <span>→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
