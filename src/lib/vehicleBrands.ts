/**
 * Car brand logos — two sources:
 *
 *  CDN  : cdn.jsdelivr.net mirror of filippofilip95/car-logos-dataset (stable brands)
 *  WIKI : upload.wikimedia.org — SVG logos for recently-rebranded makes (2019-2026)
 *  WP   : commons.wikimedia.org/wiki/Special:FilePath — when only filename is known
 *
 * Fallback: BrandLogo component shows styled initials on any load error.
 */

const CDN  = "https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@latest/logos/optimized";
const WIKI = "https://upload.wikimedia.org/wikipedia/commons";
const WP   = "https://commons.wikimedia.org/wiki/Special:FilePath";

export interface VehicleBrand {
  name:    string;
  logoUrl: string;
  color:   string;
}

export const BRANDS: VehicleBrand[] = [
  // ── A ─────────────────────────────────────────────────────────────────────
  { name: "Acura",        logoUrl: `${CDN}/acura.png`,                                              color: "#cc0000" },
  { name: "Alfa Romeo",   logoUrl: `${CDN}/alfa-romeo.png`,                                         color: "#a6001a" },
  { name: "Aston Martin", logoUrl: `${CDN}/aston-martin.png`,                                       color: "#004236" },
  { name: "Audi",         logoUrl: `${CDN}/audi.png`,                                               color: "#000000" },

  // ── B ─────────────────────────────────────────────────────────────────────
  { name: "Bentley", logoUrl: `${CDN}/bentley.png`,           color: "#1a1a1a" },
  // BMW 2020 — transparent flat badge (SVG Wikimedia)
  { name: "BMW",     logoUrl: `${WIKI}/4/44/BMW.svg`,         color: "#0066b2" },
  { name: "Buick",   logoUrl: `${CDN}/buick.png`,             color: "#8a0000" },

  // ── C ─────────────────────────────────────────────────────────────────────
  // Cadillac 2021 — new flat crest
  { name: "Cadillac",  logoUrl: `${WP}/Cadillac_Logo_2021.svg`,  color: "#b8985a" },
  // Chevrolet 2023 — modern flat bowtie
  { name: "Chevrolet", logoUrl: `${WP}/Chevrolet_bowtie_2023.svg`, color: "#d4a017" },
  { name: "Chrysler",  logoUrl: `${CDN}/chrysler.png`,             color: "#231f20" },

  // ── D ─────────────────────────────────────────────────────────────────────
  { name: "Dodge", logoUrl: `${CDN}/dodge.png`, color: "#d01f2b" },

  // ── F ─────────────────────────────────────────────────────────────────────
  { name: "Ferrari", logoUrl: `${CDN}/ferrari.png`,                           color: "#cc0000" },
  // Fiat 2020 — new serif wordmark (SVG Wikimedia)
  { name: "Fiat",    logoUrl: `${WIKI}/b/b5/FIAT_logo_%282020%29.svg`,        color: "#c0392b" },
  { name: "Ford",    logoUrl: `${CDN}/ford.png`,                              color: "#003087" },

  // ── G ─────────────────────────────────────────────────────────────────────
  // Genesis 2021 — new G crest
  { name: "Genesis", logoUrl: `${WP}/Genesis_Logo.svg`,   color: "#111111" },
  // GMC 2021 — updated logo
  { name: "GMC",     logoUrl: `${WP}/GMC-Logo.svg`,       color: "#cc0000" },

  // ── H ─────────────────────────────────────────────────────────────────────
  { name: "Honda",   logoUrl: `${CDN}/honda.png`,                        color: "#e40521" },
  // Hyundai 2021 — new geometric H
  { name: "Hyundai", logoUrl: `${WP}/Hyundai_logo.svg`,                  color: "#003087" },

  // ── I ─────────────────────────────────────────────────────────────────────
  { name: "Infiniti", logoUrl: `${CDN}/infiniti.png`, color: "#111111" },

  // ── J ─────────────────────────────────────────────────────────────────────
  // Jaguar 2024 — completely redesigned logo
  { name: "Jaguar", logoUrl: `${WP}/Jaguar_2024.svg`,              color: "#1a1a1a" },
  // Jeep 2022 — flat logo (SVG Wikimedia)
  { name: "Jeep",   logoUrl: `${WIKI}/0/0d/Jeep_logo.svg`,         color: "#3a6b35" },

  // ── K ─────────────────────────────────────────────────────────────────────
  // Kia 2021 — new angular KIA lettering
  { name: "Kia", logoUrl: `${WP}/KIA_logo3.svg`, color: "#bb162b" },

  // ── L ─────────────────────────────────────────────────────────────────────
  { name: "Lamborghini", logoUrl: `${CDN}/lamborghini.png`, color: "#c9a227" },
  { name: "Land Rover",  logoUrl: `${CDN}/land-rover.png`,  color: "#005a2b" },
  // Lexus — current L mark
  { name: "Lexus",       logoUrl: `${WP}/Lexus.svg`,        color: "#1a1a1a" },
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
  // Nissan 2020 — flat 2D logo (SVG Wikimedia)
  { name: "Nissan", logoUrl: `${WIKI}/2/23/Nissan_2020_logo.svg`, color: "#c3002f" },

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
  // Volkswagen 2019 — flat design (SVG Wikimedia)
  { name: "Volkswagen", logoUrl: `${WIKI}/6/6d/Volkswagen_logo_2019.svg`, color: "#001e50" },
  // Volvo 2021 — iron mark
  { name: "Volvo",      logoUrl: `${WP}/Volvo-Iron-Mark-Black.svg`,       color: "#003e7e" },
];

/** Flat array of brand names — used as the make filter in search & selectors. */
export const VEHICLE_MAKES: string[] = BRANDS.map((b) => b.name);

/** Quick lookup by name. */
export const BRAND_MAP = new Map<string, VehicleBrand>(
  BRANDS.map((b) => [b.name, b]),
);
