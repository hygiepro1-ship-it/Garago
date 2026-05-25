/**
 * Comprehensive list of vehicle brands sold in Canada.
 * Logos served from the car-logos-dataset GitHub CDN (MIT-licensed).
 * Wikipedia Commons used for brands not in that dataset.
 * The BrandLogo component falls back to styled initials if any image fails.
 */

const CDN = "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos";
const WP  = "https://upload.wikimedia.org/wikipedia/commons/thumb";

export interface VehicleBrand {
  name:    string;  // Display name (also used as filter key)
  logoUrl: string;  // PNG/SVG URL
  color:   string;  // Brand color — used for initials fallback
}

export const BRANDS: VehicleBrand[] = [
  // ── A ──────────────────────────────────────────────────────────
  { name: "Acura",         logoUrl: `${CDN}/acura/thumb.png`,                                                                    color: "#cc0000" },
  { name: "Alfa Romeo",    logoUrl: `${CDN}/alfa-romeo/thumb.png`,                                                               color: "#a6001a" },
  { name: "Aston Martin",  logoUrl: `${CDN}/aston-martin/thumb.png`,                                                             color: "#004236" },
  { name: "Audi",          logoUrl: `${CDN}/audi/thumb.png`,                                                                     color: "#000000" },

  // ── B ──────────────────────────────────────────────────────────
  { name: "Bentley",       logoUrl: `${CDN}/bentley/thumb.png`,                                                                  color: "#1a1a1a" },
  { name: "BMW",           logoUrl: `${CDN}/bmw/thumb.png`,                                                                      color: "#0066b2" },
  { name: "Buick",         logoUrl: `${CDN}/buick/thumb.png`,                                                                    color: "#8a0000" },
  { name: "BYD",           logoUrl: `${WP}/5/5c/BYD_Auto_logo.svg/240px-BYD_Auto_logo.svg.png`,                                  color: "#1d6bb5" },

  // ── C ──────────────────────────────────────────────────────────
  { name: "Cadillac",      logoUrl: `${CDN}/cadillac/thumb.png`,                                                                  color: "#b8985a" },
  { name: "Chevrolet",     logoUrl: `${CDN}/chevrolet/thumb.png`,                                                                 color: "#d4a017" },
  { name: "Chrysler",      logoUrl: `${CDN}/chrysler/thumb.png`,                                                                  color: "#231f20" },

  // ── D ──────────────────────────────────────────────────────────
  { name: "Dodge",         logoUrl: `${CDN}/dodge/thumb.png`,                                                                    color: "#d01f2b" },

  // ── F ──────────────────────────────────────────────────────────
  { name: "Ferrari",       logoUrl: `${CDN}/ferrari/thumb.png`,                                                                  color: "#cc0000" },
  { name: "Fiat",          logoUrl: `${CDN}/fiat/thumb.png`,                                                                     color: "#c0392b" },
  { name: "Ford",          logoUrl: `${CDN}/ford/thumb.png`,                                                                     color: "#003087" },

  // ── G ──────────────────────────────────────────────────────────
  { name: "Genesis",       logoUrl: `${CDN}/genesis/thumb.png`,                                                                  color: "#111111" },
  { name: "GMC",           logoUrl: `${CDN}/gmc/thumb.png`,                                                                      color: "#cc0000" },

  // ── H ──────────────────────────────────────────────────────────
  { name: "Honda",         logoUrl: `${CDN}/honda/thumb.png`,                                                                    color: "#e40521" },
  { name: "Hyundai",       logoUrl: `${CDN}/hyundai/thumb.png`,                                                                   color: "#003087" },

  // ── I ──────────────────────────────────────────────────────────
  { name: "Infiniti",      logoUrl: `${CDN}/infiniti/thumb.png`,                                                                  color: "#111111" },

  // ── J ──────────────────────────────────────────────────────────
  { name: "Jaguar",        logoUrl: `${CDN}/jaguar/thumb.png`,                                                                   color: "#1a1a1a" },
  { name: "Jeep",          logoUrl: `${CDN}/jeep/thumb.png`,                                                                     color: "#1a1a1a" },

  // ── K ──────────────────────────────────────────────────────────
  { name: "Kia",           logoUrl: `${CDN}/kia/thumb.png`,                                                                      color: "#bb162b" },

  // ── L ──────────────────────────────────────────────────────────
  { name: "Lamborghini",   logoUrl: `${CDN}/lamborghini/thumb.png`,                                                               color: "#c9a227" },
  { name: "Land Rover",    logoUrl: `${CDN}/land-rover/thumb.png`,                                                                color: "#005a2b" },
  { name: "Lexus",         logoUrl: `${CDN}/lexus/thumb.png`,                                                                    color: "#1a1a1a" },
  { name: "Lincoln",       logoUrl: `${CDN}/lincoln/thumb.png`,                                                                   color: "#111111" },
  { name: "Lotus",         logoUrl: `${WP}/3/35/Lotus_logo.svg/240px-Lotus_logo.svg.png`,                                        color: "#007a3e" },
  { name: "Lucid",         logoUrl: `${WP}/1/12/Lucid_Motors_logo.svg/240px-Lucid_Motors_logo.svg.png`,                          color: "#0a0a0a" },

  // ── M ──────────────────────────────────────────────────────────
  { name: "Maserati",      logoUrl: `${CDN}/maserati/thumb.png`,                                                                  color: "#003087" },
  { name: "Mazda",         logoUrl: `${CDN}/mazda/thumb.png`,                                                                    color: "#910000" },
  { name: "McLaren",       logoUrl: `${WP}/2/25/McLaren_logo.svg/240px-McLaren_logo.svg.png`,                                    color: "#e47216" },
  { name: "Mercedes-Benz", logoUrl: `${CDN}/mercedes-benz/thumb.png`,                                                            color: "#111111" },
  { name: "MINI",          logoUrl: `${CDN}/mini/thumb.png`,                                                                     color: "#000000" },
  { name: "Mitsubishi",    logoUrl: `${CDN}/mitsubishi/thumb.png`,                                                                color: "#e60012" },

  // ── N ──────────────────────────────────────────────────────────
  { name: "Nissan",        logoUrl: `${CDN}/nissan/thumb.png`,                                                                   color: "#c3002f" },

  // ── P ──────────────────────────────────────────────────────────
  { name: "Polestar",      logoUrl: `${WP}/c/c6/Polestar_logo.svg/240px-Polestar_logo.svg.png`,                                  color: "#0a0a0a" },
  { name: "Porsche",       logoUrl: `${CDN}/porsche/thumb.png`,                                                                   color: "#c9a227" },

  // ── R ──────────────────────────────────────────────────────────
  { name: "RAM",           logoUrl: `${CDN}/ram/thumb.png`,                                                                      color: "#c8102e" },
  { name: "Rivian",        logoUrl: `${WP}/8/8b/Rivian_logo.svg/240px-Rivian_logo.svg.png`,                                      color: "#00b050" },
  { name: "Rolls-Royce",   logoUrl: `${CDN}/rolls-royce/thumb.png`,                                                               color: "#6e1a36" },

  // ── S ──────────────────────────────────────────────────────────
  { name: "Subaru",        logoUrl: `${CDN}/subaru/thumb.png`,                                                                   color: "#003087" },

  // ── T ──────────────────────────────────────────────────────────
  { name: "Tesla",         logoUrl: `${CDN}/tesla/thumb.png`,                                                                    color: "#e82127" },
  { name: "Toyota",        logoUrl: `${CDN}/toyota/thumb.png`,                                                                   color: "#eb0a1e" },

  // ── V ──────────────────────────────────────────────────────────
  { name: "Volkswagen",    logoUrl: `${CDN}/volkswagen/thumb.png`,                                                                color: "#001e50" },
  { name: "Volvo",         logoUrl: `${CDN}/volvo/thumb.png`,                                                                    color: "#003e7e" },
];

/** Flat array of brand names — used as the make filter in search & selectors. */
export const VEHICLE_MAKES: string[] = BRANDS.map((b) => b.name);

/** Quick lookup by name. */
export const BRAND_MAP = new Map<string, VehicleBrand>(
  BRANDS.map((b) => [b.name, b]),
);
