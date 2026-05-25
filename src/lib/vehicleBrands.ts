/**
 * Car brand logos — served from car-logos-dataset (jsDelivr CDN).
 * Only brands with an official dealer network in Canada are listed.
 * Package: https://www.npmjs.com/package/car-logos-dataset
 * CDN base: https://cdn.jsdelivr.net/npm/car-logos-dataset@2.2.3/logos/optimized/
 *
 * Fallback: BrandLogo component shows styled initials on any load error.
 */

const CDN = "https://cdn.jsdelivr.net/npm/car-logos-dataset@2.2.3/logos/optimized";

export interface VehicleBrand {
  name:    string;
  logoUrl: string;
  color:   string; // fallback background for initials
}

export const BRANDS: VehicleBrand[] = [
  // ── A ─────────────────────────────────────────────────────────────────────
  { name: "Acura",        logoUrl: `${CDN}/acura.png`,        color: "#cc0000" },
  { name: "Alfa Romeo",   logoUrl: `${CDN}/alfa-romeo.png`,   color: "#a6001a" },
  { name: "Aston Martin", logoUrl: `${CDN}/aston-martin.png`, color: "#004236" },
  { name: "Audi",         logoUrl: `${CDN}/audi.png`,         color: "#000000" },

  // ── B ─────────────────────────────────────────────────────────────────────
  { name: "Bentley", logoUrl: `${CDN}/bentley.png`, color: "#1a1a1a" },
  { name: "BMW",     logoUrl: `${CDN}/bmw.png`,     color: "#0066b2" },
  { name: "Buick",   logoUrl: `${CDN}/buick.png`,   color: "#8a0000" },

  // ── C ─────────────────────────────────────────────────────────────────────
  { name: "Cadillac",  logoUrl: `${CDN}/cadillac.png`,  color: "#b8985a" },
  { name: "Chevrolet", logoUrl: `${CDN}/chevrolet.png`, color: "#d4a017" },
  { name: "Chrysler",  logoUrl: `${CDN}/chrysler.png`,  color: "#231f20" },

  // ── D ─────────────────────────────────────────────────────────────────────
  { name: "Dodge", logoUrl: `${CDN}/dodge.png`, color: "#d01f2b" },

  // ── F ─────────────────────────────────────────────────────────────────────
  { name: "Ferrari", logoUrl: `${CDN}/ferrari.png`, color: "#cc0000" },
  { name: "Fiat",    logoUrl: `${CDN}/fiat.png`,    color: "#c0392b" },
  { name: "Ford",    logoUrl: `${CDN}/ford.png`,    color: "#003087" },

  // ── G ─────────────────────────────────────────────────────────────────────
  { name: "Genesis", logoUrl: `${CDN}/genesis.png`, color: "#111111" },
  { name: "GMC",     logoUrl: `${CDN}/gmc.png`,     color: "#cc0000" },

  // ── H ─────────────────────────────────────────────────────────────────────
  { name: "Honda",   logoUrl: `${CDN}/honda.png`,   color: "#e40521" },
  { name: "Hyundai", logoUrl: `${CDN}/hyundai.png`, color: "#003087" },

  // ── I ─────────────────────────────────────────────────────────────────────
  { name: "Infiniti", logoUrl: `${CDN}/infiniti.png`, color: "#111111" },

  // ── J ─────────────────────────────────────────────────────────────────────
  { name: "Jaguar", logoUrl: `${CDN}/jaguar.png`, color: "#1a1a1a" },
  { name: "Jeep",   logoUrl: `${CDN}/jeep.png`,   color: "#1a1a1a" },

  // ── K ─────────────────────────────────────────────────────────────────────
  { name: "Kia", logoUrl: `${CDN}/kia.png`, color: "#bb162b" },

  // ── L ─────────────────────────────────────────────────────────────────────
  { name: "Lamborghini", logoUrl: `${CDN}/lamborghini.png`, color: "#c9a227" },
  { name: "Land Rover",  logoUrl: `${CDN}/land-rover.png`,  color: "#005a2b" },
  { name: "Lexus",       logoUrl: `${CDN}/lexus.png`,       color: "#1a1a1a" },
  { name: "Lincoln",     logoUrl: `${CDN}/lincoln.png`,     color: "#111111" },
  { name: "Lotus",       logoUrl: `${CDN}/lotus.png`,       color: "#007a3e" },
  { name: "Lucid",       logoUrl: `${CDN}/lucid.png`,       color: "#0a0a0a" },

  // ── M ─────────────────────────────────────────────────────────────────────
  { name: "Maserati",      logoUrl: `${CDN}/maserati.png`,      color: "#003087" },
  { name: "Mazda",         logoUrl: `${CDN}/mazda.png`,         color: "#910000" },
  { name: "McLaren",       logoUrl: `${CDN}/mclaren.png`,       color: "#e47216" },
  { name: "Mercedes-Benz", logoUrl: `${CDN}/mercedes-benz.png`, color: "#111111" },
  { name: "MINI",          logoUrl: `${CDN}/mini.png`,          color: "#000000" },
  { name: "Mitsubishi",    logoUrl: `${CDN}/mitsubishi.png`,    color: "#e60012" },

  // ── N ─────────────────────────────────────────────────────────────────────
  { name: "Nissan", logoUrl: `${CDN}/nissan.png`, color: "#c3002f" },

  // ── P ─────────────────────────────────────────────────────────────────────
  { name: "Polestar", logoUrl: `${CDN}/polestar.png`, color: "#0a0a0a" },
  { name: "Porsche",  logoUrl: `${CDN}/porsche.png`,  color: "#c9a227" },

  // ── R ─────────────────────────────────────────────────────────────────────
  { name: "RAM",         logoUrl: `${CDN}/ram.png`,         color: "#c8102e" },
  { name: "Rivian",      logoUrl: `${CDN}/rivian.png`,      color: "#00b050" },
  { name: "Rolls-Royce", logoUrl: `${CDN}/rolls-royce.png`, color: "#6e1a36" },

  // ── S ─────────────────────────────────────────────────────────────────────
  { name: "Subaru", logoUrl: `${CDN}/subaru.png`, color: "#003087" },

  // ── T ─────────────────────────────────────────────────────────────────────
  { name: "Tesla",  logoUrl: `${CDN}/tesla.png`,  color: "#e82127" },
  { name: "Toyota", logoUrl: `${CDN}/toyota.png`, color: "#eb0a1e" },

  // ── V ─────────────────────────────────────────────────────────────────────
  { name: "Volkswagen", logoUrl: `${CDN}/volkswagen.png`, color: "#001e50" },
  { name: "Volvo",      logoUrl: `${CDN}/volvo.png`,      color: "#003e7e" },
];

/** Flat array of brand names — used as the make filter in search & selectors. */
export const VEHICLE_MAKES: string[] = BRANDS.map((b) => b.name);

/** Quick lookup by name. */
export const BRAND_MAP = new Map<string, VehicleBrand>(
  BRANDS.map((b) => [b.name, b]),
);
