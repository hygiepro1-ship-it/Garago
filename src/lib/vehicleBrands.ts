/**
 * Car brand logos — two sources:
 *
 *  Fichiers hébergés dans public/brands/ (copiés depuis car-logos-dataset et Wikimedia Commons).
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
  { name: "Acura",        logoUrl: "/brands/acura.webp",                                              color: "#cc0000" },
  { name: "Alfa Romeo",   logoUrl: "/brands/alfa-romeo.webp",                                         color: "#a6001a" },
  { name: "Aston Martin", logoUrl: "/brands/aston-martin.webp",                                       color: "#004236" },
  { name: "Audi",         logoUrl: "/brands/audi.webp",                                               color: "#000000" },

  // ── B ─────────────────────────────────────────────────────────────────────
  { name: "Bentley", logoUrl: "/brands/bentley.webp",           color: "#1a1a1a" },
  // BMW 2020 — transparent flat badge (SVG Wikimedia)
  { name: "BMW",     logoUrl: "/brands/bmw.svg",         color: "#0066b2" },
  { name: "Buick",   logoUrl: "/brands/buick.webp",             color: "#8a0000" },

  // ── C ─────────────────────────────────────────────────────────────────────
  // Cadillac 2021 — new flat crest
  { name: "Cadillac",  logoUrl: "/brands/cadillac.svg",  color: "#b8985a" },
  // Chevrolet 2023 — modern flat bowtie
  { name: "Chevrolet", logoUrl: "/brands/chevrolet.svg", color: "#d4a017" },
  { name: "Chrysler",  logoUrl: "/brands/chrysler.webp",             color: "#231f20" },

  // ── D ─────────────────────────────────────────────────────────────────────
  { name: "Dodge", logoUrl: "/brands/dodge.webp", color: "#d01f2b" },

  // ── F ─────────────────────────────────────────────────────────────────────
  { name: "Ferrari", logoUrl: "/brands/ferrari.webp",                           color: "#cc0000" },
  // Fiat 2020 — new serif wordmark (SVG Wikimedia)
  { name: "Fiat",    logoUrl: "/brands/fiat.svg",        color: "#c0392b" },
  { name: "Ford",    logoUrl: "/brands/ford.webp",                              color: "#003087" },

  // ── G ─────────────────────────────────────────────────────────────────────
  // Genesis 2021 — new G crest
  { name: "Genesis", logoUrl: "/brands/genesis.svg",   color: "#111111" },
  // GMC 2021 — updated logo
  { name: "GMC",     logoUrl: "/brands/gmc.svg",       color: "#cc0000" },

  // ── H ─────────────────────────────────────────────────────────────────────
  { name: "Honda",   logoUrl: "/brands/honda.webp",                        color: "#e40521" },
  // Hummer — marque relancée en camion électrique GMC, mais de nombreux VUS
  // Hummer H2/H3 des années 2000 sont encore sur la route et à entretenir.
  { name: "Hummer",  logoUrl: "/brands/hummer.webp",                       color: "#4a4a4a" },
  // Hyundai 2021 — new geometric H
  { name: "Hyundai", logoUrl: "/brands/hyundai.svg",                  color: "#003087" },

  // ── I ─────────────────────────────────────────────────────────────────────
  { name: "Infiniti", logoUrl: "/brands/infiniti.webp", color: "#111111" },
  // Isuzu a quitté le marché nord-américain des véhicules légers en 2009, mais
  // ses camions et VUS (Rodeo, Trooper, Ascender) roulent encore et se réparent.
  { name: "Isuzu",    logoUrl: "/brands/isuzu.webp",    color: "#cc0000" },

  // ── J ─────────────────────────────────────────────────────────────────────
  // Jaguar 2024 — completely redesigned logo
  { name: "Jaguar", logoUrl: "/brands/jaguar.svg", color: "#1a1a1a" },
  // Jeep 2022 — flat logo (SVG Wikimedia)
  { name: "Jeep",   logoUrl: "/brands/jeep.svg", color: "#3a6b35" },

  // ── K ─────────────────────────────────────────────────────────────────────
  // Kia 2021 — new angular KIA lettering
  { name: "Kia", logoUrl: "/brands/kia.svg", color: "#bb162b" },

  // ── L ─────────────────────────────────────────────────────────────────────
  { name: "Lamborghini", logoUrl: "/brands/lamborghini.webp", color: "#c9a227" },
  { name: "Land Rover",  logoUrl: "/brands/land-rover.webp",  color: "#005a2b" },
  // Lexus — current L mark
  { name: "Lexus",       logoUrl: "/brands/lexus.svg",        color: "#1a1a1a" },
  { name: "Lincoln",     logoUrl: "/brands/lincoln.webp",     color: "#111111" },
  { name: "Lotus",       logoUrl: "/brands/lotus.webp",       color: "#007a3e" },
  { name: "Lucid",       logoUrl: "/brands/lucid.webp",       color: "#0a0a0a" },

  // ── M ─────────────────────────────────────────────────────────────────────
  { name: "Maserati",      logoUrl: "/brands/maserati.webp",      color: "#003087" },
  { name: "Mazda",         logoUrl: "/brands/mazda.webp",         color: "#910000" },
  { name: "McLaren",       logoUrl: "/brands/mclaren.webp",       color: "#e47216" },
  { name: "Mercedes-Benz", logoUrl: "/brands/mercedes-benz.webp", color: "#111111" },
  // Mercury a fermé en 2011 — encore beaucoup de Sable, Grand Marquis et
  // Mountaineer sur la route au Canada.
  { name: "Mercury",       logoUrl: "/brands/mercury.webp",       color: "#5a5a5a" },
  { name: "MINI",          logoUrl: "/brands/mini.webp",          color: "#000000" },
  { name: "Mitsubishi",    logoUrl: "/brands/mitsubishi.webp",    color: "#e60012" },

  // ── N ─────────────────────────────────────────────────────────────────────
  // Nissan 2020 — flat 2D logo (SVG Wikimedia)
  { name: "Nissan", logoUrl: "/brands/nissan.svg", color: "#c3002f" },

  // ── O ─────────────────────────────────────────────────────────────────────
  // Oldsmobile a fermé en 2004 — plusieurs modèles encore en circulation.
  { name: "Oldsmobile", logoUrl: "/brands/oldsmobile.webp", color: "#8a0000" },

  // ── P ─────────────────────────────────────────────────────────────────────
  { name: "Polestar", logoUrl: "/brands/polestar.webp", color: "#0a0a0a" },
  // Pontiac a fermé en 2010 — Vibe, G6 et Grand Prix encore courants.
  { name: "Pontiac",  logoUrl: "/brands/pontiac.webp",  color: "#8a0000" },
  { name: "Porsche",  logoUrl: "/brands/porsche.webp",  color: "#c9a227" },

  // ── R ─────────────────────────────────────────────────────────────────────
  { name: "RAM",         logoUrl: "/brands/ram.webp",         color: "#c8102e" },
  { name: "Rivian",      logoUrl: "/brands/rivian.webp",      color: "#00b050" },
  { name: "Rolls-Royce", logoUrl: "/brands/rolls-royce.webp", color: "#6e1a36" },

  // ── S ─────────────────────────────────────────────────────────────────────
  // Saab a fermé en 2011 ; Saturn en 2010 — véhicules encore entretenus.
  { name: "Saab",    logoUrl: "/brands/saab.webp",    color: "#003087" },
  { name: "Saturn",  logoUrl: "/brands/saturn.webp",  color: "#8a0000" },
  // Scion (marque jeunesse de Toyota) a fermé en 2016 — tC, xB, FR-S courants.
  { name: "Scion",   logoUrl: "/brands/scion.webp",   color: "#111111" },
  { name: "Subaru",  logoUrl: "/brands/subaru.webp",  color: "#003087" },
  // Suzuki a quitté le marché automobile nord-américain en 2013, mais Swift,
  // SX4 et Grand Vitara restent nombreux à entretenir.
  { name: "Suzuki",  logoUrl: "/brands/suzuki.webp",  color: "#e30016" },

  // ── T ─────────────────────────────────────────────────────────────────────
  { name: "Tesla",  logoUrl: "/brands/tesla.webp",  color: "#e82127" },
  { name: "Toyota", logoUrl: "/brands/toyota.webp", color: "#eb0a1e" },

  // ── V ─────────────────────────────────────────────────────────────────────
  // Volkswagen 2019 — flat design (SVG Wikimedia)
  { name: "Volkswagen", logoUrl: "/brands/volkswagen.svg", color: "#001e50" },
  // Volvo 2021 — iron mark
  { name: "Volvo",      logoUrl: "/brands/volvo.svg",       color: "#003e7e" },
  // VinFast (Vietnam) est arrivé au Canada en 2024 avec ses VUS électriques.
  { name: "VinFast",    logoUrl: `${WP}/VinFast_logo.svg`,                color: "#0a0a0a" },
];

/** Flat array of brand names — used as the make filter in search & selectors. */
export const VEHICLE_MAKES: string[] = BRANDS.map((b) => b.name);

/** Quick lookup by name. */
export const BRAND_MAP = new Map<string, VehicleBrand>(
  BRANDS.map((b) => [b.name, b]),
);
