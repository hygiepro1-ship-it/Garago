"use client";

// ─── SVG icons ────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ReactNode> = {
  oil: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  "tires-winter": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>
      <polyline points="10 8 12 6 14 8"/><polyline points="14 16 12 18 10 16"/>
      <polyline points="8 10 6 12 8 14"/><polyline points="16 14 18 12 16 10"/>
    </svg>
  ),
  "tires-summer": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
    </svg>
  ),
  brakes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
      <line x1="4.22" y1="4.22" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.78" y2="19.78"/>
      <line x1="4.22" y1="19.78" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.78" y2="4.22"/>
    </svg>
  ),
  ac: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
    </svg>
  ),
  engine: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  inspection: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <path d="M8 11l2 2 4-4"/>
    </svg>
  ),
  battery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="18" height="12" rx="2"/>
      <line x1="23" y1="11" x2="23" y2="13"/>
      <line x1="7" y1="12" x2="11" y2="12"/>
      <line x1="9" y1="10" x2="9" y2="14"/>
    </svg>
  ),
  transmission: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
      <path d="M13 6h3a2 2 0 0 1 2 2v7"/>
      <line x1="6" y1="9" x2="6" y2="21"/>
    </svg>
  ),
  bodywork: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/>
      <circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/>
    </svg>
  ),
  alignment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="1"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  suspension: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  electrical: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  exhaust: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8c.5 1.5 1.5 2 2.5 2s2-.5 2.5-2 1.5-2 2.5-2 2 .5 2.5 2"/>
      <path d="M5 16c.5 1.5 1.5 2 2.5 2s2-.5 2.5-2 1.5-2 2.5-2 2 .5 2.5 2"/>
    </svg>
  ),
  cooling: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  detailing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.87L20 10l-4.6 4.47 1.1 6.53L12 18l-4.5 3 1.1-6.53L4 10l6.1-1.13z"/>
    </svg>
  ),
  ev: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="12" y1="18" x2="12" y2="18.01"/>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  glass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="14" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <polyline points="9 21 12 17 15 21"/>
    </svg>
  ),
  timing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  clutch: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-6.6"/>
    </svg>
  ),
  preventive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M9 16l2 2 4-4"/>
    </svg>
  ),
  bearing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  fuel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="15" y2="22"/>
      <line x1="4" y1="9" x2="14" y2="9"/>
      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/>
      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>
    </svg>
  ),
  rust: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  diagnostic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <path d="M8 10l2 2 4-4"/>
    </svg>
  ),
};

const FALLBACK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

// Name → id mapping (French + English)
const NAME_TO_ID: Record<string, string> = {
  "Vidange d'huile": "oil", "Oil Change": "oil",
  "Pneus d'hiver": "tires-winter", "Winter Tires": "tires-winter",
  "Pneus d'été / toutes saisons": "tires-summer", "Summer / All-Season Tires": "tires-summer",
  "Freins": "brakes", "Brakes": "brakes",
  "Climatisation": "ac", "Air Conditioning": "ac",
  "Mécanique générale": "engine", "General Mechanics": "engine",
  "Inspection mécanique": "inspection", "Mechanical Inspection": "inspection",
  "Batterie": "battery", "Battery": "battery",
  "Transmission": "transmission",
  "Carrosserie": "bodywork", "Bodywork": "bodywork",
  "Alignement": "alignment", "Wheel Alignment": "alignment",
  "Suspension & direction": "suspension", "Suspension & Steering": "suspension",
  "Électrique / Électronique": "electrical", "Electrical / Electronics": "electrical",
  "Système d'échappement": "exhaust", "Exhaust System": "exhaust",
  "Système de refroidissement": "cooling", "Cooling System": "cooling",
  "Détailing & lavage": "detailing", "Detailing & Wash": "detailing",
  "Véhicule électrique (VE)": "ev", "Electric Vehicle (EV)": "ev",
  "Vitres & pare-brise": "glass", "Windows & Windshield": "glass",
  "Courroie de distribution": "timing", "Timing Belt / Chain": "timing",
  "Embrayage": "clutch", "Clutch": "clutch",
  "Entretien préventif": "preventive", "Preventive Maintenance": "preventive",
  "Roulements de roue": "bearing", "Wheel Bearings": "bearing",
  "Système de carburant": "fuel", "Fuel System": "fuel",
  "Protection contre la rouille": "rust", "Rust Protection": "rust",
  "Diagnostic": "diagnostic",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ServiceIconProps {
  id?: string;
  name?: string;
  size?: number;
  className?: string;
}

export default function ServiceIcon({ id, name, size = 16, className = "" }: ServiceIconProps) {
  const resolvedId = id ?? (name ? NAME_TO_ID[name] : undefined);
  const icon = (resolvedId ? ICONS[resolvedId] : null) ?? FALLBACK;
  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}
