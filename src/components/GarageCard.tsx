"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { useLang } from "@/contexts/LanguageContext";

interface GarageCardProps {
  garage: {
    slug: string; name: string; city: string; province: string;
    address?: string; description?: string | null; logoUrl?: string | null;
    avgRating: number; reviewCount: number; subscriptionStatus: string;
    services: Array<{ category: { name: string; icon?: string | null }; priceMin?: number | null; priceMax?: number | null }>;
    brands: Array<{ brand: string; accepts: boolean }>;
    acceptsWalkIn: boolean; appointmentOnly: boolean;
  };
  highlightService?: string;
  distance?: string;
}

function getNextSlots(slug: string, c: { today: string; tomorrow: string; thu: string; fri: string }): string[] {
  const seed = slug.charCodeAt(0) + slug.charCodeAt(slug.length - 1);
  const today  = [`${c.today} 10h00`, `${c.today} 14h30`, `${c.today} 16h00`];
  const demain = [`${c.tomorrow} 09h00`, `${c.tomorrow} 11h00`, `${c.tomorrow} 14h00`];
  const later  = [`${c.thu} 10h00`, `${c.fri} 09h30`, `${c.fri} 13h00`];
  return (seed % 3 === 0 ? today : seed % 3 === 1 ? demain : later).slice(0, 3);
}

export default function GarageCard({ garage, highlightService, distance }: GarageCardProps) {
  const { t } = useLang();
  const c = t.card;

  const acceptedBrands  = garage.brands.filter((b) => b.accepts).slice(0, 5);
  const services        = garage.services.slice(0, 3);
  const rating          = Math.round(garage.avgRating * 10) / 10;
  const ratingFull      = Math.round(rating);
  const slots           = getNextSlots(garage.slug, c);
  const highlightedSvc  = highlightService
    ? garage.services.find((s) => s.category.name.toLowerCase().includes(highlightService.toLowerCase()))
    : null;

  return (
    <Link href={`/garage/${garage.slug}`} className="block group">
      <div
        className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
        style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(11,31,58,0.06)" }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "#f97316";
          el.style.boxShadow = "0 6px 24px rgba(249,115,22,0.11)";
          el.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "#e2e8f0";
          el.style.boxShadow = "0 2px 8px rgba(11,31,58,0.06)";
          el.style.transform = "translateY(0)";
        }}
      >
        {/* Bande navy→orange en haut */}
        <div className="h-0.5" style={{ background: "linear-gradient(90deg, #0b1f3a 0%, #f97316 100%)" }} />

        <div className="flex flex-col sm:flex-row">

          {/* GAUCHE — logo + étoiles */}
          <div className="sm:w-24 flex sm:flex-col items-center sm:items-center justify-start gap-3 sm:gap-2 p-4 sm:py-5 sm:px-3"
            style={{ borderRight: "1px solid #f1f5f9" }}>
            <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-black text-xl flex-shrink-0"
              style={{ background: "#f8fafc", border: "2px solid #e2e8f0", color: "#0b1f3a" }}>
              {garage.logoUrl
                ? <img src={garage.logoUrl} alt={garage.name} className="w-full h-full object-cover rounded-xl" />
                : garage.name.slice(0, 2).toUpperCase()}
            </div>
            {garage.reviewCount > 0 ? (
              <div className="sm:text-center">
                <div className="flex sm:justify-center gap-0.5">
                  {[1,2,3,4,5].map((i) => (
                    <span key={i} style={{ color: i <= ratingFull ? "#f59e0b" : "#e2e8f0", fontSize: 10 }}>★</span>
                  ))}
                </div>
                <p className="text-xs font-black mt-0.5" style={{ color: "#0b1f3a" }}>{rating}</p>
                <p style={{ fontSize: 10, color: "#94a3b8" }}>({garage.reviewCount})</p>
              </div>
            ) : (
              <p className="text-xs font-semibold sm:text-center" style={{ color: "#94a3b8" }}>{c.newGarage}</p>
            )}
          </div>

          {/* CENTRE — infos */}
          <div className="flex-1 px-4 py-4 min-w-0">
            <div className="flex flex-wrap items-start gap-2 mb-1.5">
              <h3 className="text-base font-black leading-tight" style={{ color: "#0b1f3a" }}>{garage.name}</h3>
              {garage.subscriptionStatus === "active" && (
                <span className="badge badge-orange" style={{ fontSize: 10 }}>{c.certified}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <p className="text-xs flex items-center gap-1" style={{ color: "#64748b" }}>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {garage.address ? `${garage.address}, ` : ""}{garage.city}, {garage.province}
              </p>
              {distance && <span className="badge badge-green">{distance}</span>}
            </div>

            {highlightedSvc && (
              <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                <span className="text-xs font-semibold" style={{ color: "#92400e" }}>{c.startingFrom}</span>
                <span className="text-xs font-black" style={{ color: "#f97316" }}>
                  {highlightedSvc.priceMin ? `${highlightedSvc.priceMin} $` : c.onQuote}
                </span>
              </div>
            )}

            {services.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {services.map((s, i) => (
                  <span key={i} className="badge badge-navy">
                    {s.category.icon && <span>{s.category.icon}</span>}
                    {s.category.name}
                    {s.priceMin && <span className="ml-0.5 font-black" style={{ color: "#f97316" }}>{s.priceMin}$</span>}
                  </span>
                ))}
                {garage.services.length > 3 && (
                  <span className="badge badge-gray">+{garage.services.length - 3}</span>
                )}
              </div>
            )}

            {acceptedBrands.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {acceptedBrands.map((b, i) => (
                  <div key={i} title={b.brand}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white p-0.5"
                    style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(11,31,58,0.06)" }}>
                    <BrandLogo brand={b.brand} size={20} />
                  </div>
                ))}
                {garage.brands.filter((b) => b.accepts).length > 5 && (
                  <span className="badge badge-gray">+{garage.brands.filter((b) => b.accepts).length - 5}</span>
                )}
              </div>
            )}
          </div>

          {/* DROITE — disponibilités */}
          <div className="sm:w-48 px-4 py-4 sm:border-l flex flex-col justify-between"
            style={{ borderColor: "#f1f5f9", background: "#fafcff" }}>
            <div>
              <p className="text-xs font-black mb-2.5" style={{ color: "#0b1f3a" }}>{c.nextSlots}</p>
              <div className="flex flex-col gap-1.5">
                {slots.map((slot) => <div key={slot} className="slot-pill w-full text-center">{slot}</div>)}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {garage.acceptsWalkIn && <span className="badge badge-green">{c.walkIn}</span>}
                {garage.appointmentOnly && <span className="badge badge-navy">{c.byAppt}</span>}
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)", boxShadow: "0 2px 10px rgba(249,115,22,0.3)" }}>
                {c.bookAppt}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
