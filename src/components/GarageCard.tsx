import Link from "next/link";

interface GarageCardProps {
  garage: {
    slug: string;
    name: string;
    city: string;
    province: string;
    description?: string | null;
    logoUrl?: string | null;
    avgRating: number;
    reviewCount: number;
    subscriptionStatus: string;
    services: Array<{ category: { name: string; icon?: string | null } }>;
    brands: Array<{ brand: string; accepts: boolean }>;
    acceptsWalkIn: boolean;
    appointmentOnly: boolean;
  };
}

export default function GarageCard({ garage }: GarageCardProps) {
  const acceptedBrands = garage.brands.filter((b) => b.accepts).slice(0, 5);
  const services = garage.services.slice(0, 4);

  return (
    <Link href={`/garage/${garage.slug}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
            {garage.logoUrl ? (
              <img src={garage.logoUrl} alt={garage.name} className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              "🔧"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-700 transition-colors truncate">
              {garage.name}
            </h3>
            <p className="text-gray-500 text-sm mt-0.5">📍 {garage.city}, {garage.province}</p>
            <div className="flex items-center gap-2 mt-1">
              {garage.avgRating > 0 ? (
                <>
                  <span className="text-yellow-500 text-sm">{"★".repeat(Math.round(garage.avgRating))}{"☆".repeat(5 - Math.round(garage.avgRating))}</span>
                  <span className="text-sm font-semibold text-gray-700">{garage.avgRating}</span>
                  <span className="text-sm text-gray-500">({garage.reviewCount} avis)</span>
                </>
              ) : (
                <span className="text-sm text-gray-400">Aucun avis encore</span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {garage.description && (
            <p className="text-gray-600 text-sm line-clamp-2">{garage.description}</p>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {s.category.icon && <span>{s.category.icon}</span>}
                    {s.category.name}
                  </span>
                ))}
                {garage.services.length > 4 && (
                  <span className="text-xs text-gray-500 px-2 py-1">+{garage.services.length - 4} autres</span>
                )}
              </div>
            </div>
          )}

          {/* Brands */}
          {acceptedBrands.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marques acceptées</p>
              <div className="flex flex-wrap gap-1.5">
                {acceptedBrands.map((b, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {b.brand}
                  </span>
                ))}
                {garage.brands.filter((b) => b.accepts).length > 5 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{garage.brands.filter((b) => b.accepts).length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center gap-2">
          {garage.acceptsWalkIn && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Sans rendez-vous</span>
          )}
          {garage.appointmentOnly && (
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-medium">Sur rendez-vous</span>
          )}
          <span className="ml-auto text-blue-600 text-sm font-medium group-hover:underline">Voir le profil →</span>
        </div>
      </div>
    </Link>
  );
}
