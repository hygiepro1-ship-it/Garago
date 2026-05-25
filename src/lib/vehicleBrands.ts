/**
 * Official car brand logos — all served from Wikimedia Commons CDN.
 * URLs use the stable thumb format:
 *   https://upload.wikimedia.org/wikipedia/commons/thumb/{a}/{ab}/{File.svg}/{w}px-{File.svg}.png
 * BrandLogo component falls back to styled initials on any error.
 */

const W = "https://upload.wikimedia.org/wikipedia/commons/thumb";

export interface VehicleBrand {
  name:    string;
  logoUrl: string;
  color:   string; // fallback background for initials
}

export const BRANDS: VehicleBrand[] = [
  // ── A ─────────────────────────────────────────────────────────────────────
  {
    name:    "Acura",
    logoUrl: `${W}/0/0e/Acura_logo.svg/240px-Acura_logo.svg.png`,
    color:   "#cc0000",
  },
  {
    name:    "Alfa Romeo",
    logoUrl: `${W}/2/24/Alfa_Romeo_Logo.svg/240px-Alfa_Romeo_Logo.svg.png`,
    color:   "#a6001a",
  },
  {
    name:    "Aston Martin",
    logoUrl: `${W}/2/28/Aston_Martin_logo_2021.svg/240px-Aston_Martin_logo_2021.svg.png`,
    color:   "#004236",
  },
  {
    name:    "Audi",
    logoUrl: `${W}/9/92/Audi-Logo_2016.svg/240px-Audi-Logo_2016.svg.png`,
    color:   "#000000",
  },

  // ── B ─────────────────────────────────────────────────────────────────────
  {
    name:    "Bentley",
    logoUrl: `${W}/b/bf/Bentley_logo.svg/240px-Bentley_logo.svg.png`,
    color:   "#1a1a1a",
  },
  {
    name:    "BMW",
    logoUrl: `${W}/4/44/BMW.svg/240px-BMW.svg.png`,
    color:   "#0066b2",
  },
  {
    name:    "Buick",
    logoUrl: `${W}/6/65/Buick_logo.svg/240px-Buick_logo.svg.png`,
    color:   "#8a0000",
  },
  {
    name:    "BYD",
    logoUrl: `${W}/5/5c/BYD_Auto_logo.svg/240px-BYD_Auto_logo.svg.png`,
    color:   "#1d6bb5",
  },

  // ── C ─────────────────────────────────────────────────────────────────────
  {
    name:    "Cadillac",
    logoUrl: `${W}/d/dd/Cadillac_logo.svg/240px-Cadillac_logo.svg.png`,
    color:   "#b8985a",
  },
  {
    name:    "Chevrolet",
    logoUrl: `${W}/1/14/Chevrolet_logo.svg/240px-Chevrolet_logo.svg.png`,
    color:   "#d4a017",
  },
  {
    name:    "Chrysler",
    logoUrl: `${W}/5/58/Chrysler_logo.svg/240px-Chrysler_logo.svg.png`,
    color:   "#231f20",
  },

  // ── D ─────────────────────────────────────────────────────────────────────
  {
    name:    "Dodge",
    logoUrl: `${W}/f/f7/Dodge_logo.svg/240px-Dodge_logo.svg.png`,
    color:   "#d01f2b",
  },

  // ── F ─────────────────────────────────────────────────────────────────────
  {
    name:    "Ferrari",
    logoUrl: `${W}/d/d4/Ferrari_Logo.svg/240px-Ferrari_Logo.svg.png`,
    color:   "#cc0000",
  },
  {
    name:    "Fiat",
    logoUrl: `${W}/6/6a/Fiat_Logo2.svg/240px-Fiat_Logo2.svg.png`,
    color:   "#c0392b",
  },
  {
    name:    "Ford",
    logoUrl: `${W}/3/3e/Ford_Motor_Company_Logo.svg/240px-Ford_Motor_Company_Logo.svg.png`,
    color:   "#003087",
  },

  // ── G ─────────────────────────────────────────────────────────────────────
  {
    name:    "Genesis",
    logoUrl: `${W}/4/44/Genesis_Logo_2020.svg/240px-Genesis_Logo_2020.svg.png`,
    color:   "#111111",
  },
  {
    name:    "GMC",
    logoUrl: `${W}/3/3e/GMC_2019_logo.svg/240px-GMC_2019_logo.svg.png`,
    color:   "#cc0000",
  },

  // ── H ─────────────────────────────────────────────────────────────────────
  {
    name:    "Honda",
    logoUrl: `${W}/7/7b/Honda_Logo.svg/240px-Honda_Logo.svg.png`,
    color:   "#e40521",
  },
  {
    name:    "Hyundai",
    logoUrl: `${W}/f/f3/Hyundai_Motor_Company_logo.svg/240px-Hyundai_Motor_Company_logo.svg.png`,
    color:   "#003087",
  },

  // ── I ─────────────────────────────────────────────────────────────────────
  {
    name:    "Infiniti",
    logoUrl: `${W}/8/8b/Infiniti_logo.svg/240px-Infiniti_logo.svg.png`,
    color:   "#111111",
  },

  // ── J ─────────────────────────────────────────────────────────────────────
  {
    name:    "Jaguar",
    logoUrl: `${W}/0/08/Jaguar_logo.svg/240px-Jaguar_logo.svg.png`,
    color:   "#1a1a1a",
  },
  {
    name:    "Jeep",
    logoUrl: `${W}/8/83/Jeep_logo.svg/240px-Jeep_logo.svg.png`,
    color:   "#1a1a1a",
  },

  // ── K ─────────────────────────────────────────────────────────────────────
  {
    name:    "Kia",
    logoUrl: `${W}/1/13/Kia_logo2.svg/240px-Kia_logo2.svg.png`,
    color:   "#bb162b",
  },

  // ── L ─────────────────────────────────────────────────────────────────────
  {
    name:    "Lamborghini",
    logoUrl: `${W}/d/d9/Lamborghini_Logo.svg/240px-Lamborghini_Logo.svg.png`,
    color:   "#c9a227",
  },
  {
    name:    "Land Rover",
    logoUrl: `${W}/b/b9/Land_Rover_logo.svg/240px-Land_Rover_logo.svg.png`,
    color:   "#005a2b",
  },
  {
    name:    "Lexus",
    logoUrl: `${W}/f/fb/Lexus_Division_wordmark.svg/240px-Lexus_Division_wordmark.svg.png`,
    color:   "#1a1a1a",
  },
  {
    name:    "Lincoln",
    logoUrl: `${W}/5/55/Lincoln_Motor_Company_logo.svg/240px-Lincoln_Motor_Company_logo.svg.png`,
    color:   "#111111",
  },
  {
    name:    "Lotus",
    logoUrl: `${W}/3/35/Lotus_logo.svg/240px-Lotus_logo.svg.png`,
    color:   "#007a3e",
  },
  {
    name:    "Lucid",
    logoUrl: `${W}/1/12/Lucid_Motors_logo.svg/240px-Lucid_Motors_logo.svg.png`,
    color:   "#0a0a0a",
  },

  // ── M ─────────────────────────────────────────────────────────────────────
  {
    name:    "Maserati",
    logoUrl: `${W}/8/89/Maserati_logo.svg/240px-Maserati_logo.svg.png`,
    color:   "#003087",
  },
  {
    name:    "Mazda",
    logoUrl: `${W}/1/19/Mazda_logo.svg/240px-Mazda_logo.svg.png`,
    color:   "#910000",
  },
  {
    name:    "McLaren",
    logoUrl: `${W}/2/25/McLaren_logo.svg/240px-McLaren_logo.svg.png`,
    color:   "#e47216",
  },
  {
    name:    "Mercedes-Benz",
    logoUrl: `${W}/9/90/Mercedes-Benz_Logo_2010_cropped.svg/240px-Mercedes-Benz_Logo_2010_cropped.svg.png`,
    color:   "#111111",
  },
  {
    name:    "MINI",
    logoUrl: `${W}/8/8b/Mini_logo.svg/240px-Mini_logo.svg.png`,
    color:   "#000000",
  },
  {
    name:    "Mitsubishi",
    logoUrl: `${W}/8/8e/Mitsubishi_Motors_new_logo.svg/240px-Mitsubishi_Motors_new_logo.svg.png`,
    color:   "#e60012",
  },

  // ── N ─────────────────────────────────────────────────────────────────────
  {
    name:    "Nissan",
    logoUrl: `${W}/8/8e/Nissan_2020_logo.svg/240px-Nissan_2020_logo.svg.png`,
    color:   "#c3002f",
  },

  // ── P ─────────────────────────────────────────────────────────────────────
  {
    name:    "Polestar",
    logoUrl: `${W}/c/c6/Polestar_logo.svg/240px-Polestar_logo.svg.png`,
    color:   "#0a0a0a",
  },
  {
    name:    "Porsche",
    logoUrl: `${W}/f/f8/Porsche_logo.svg/240px-Porsche_logo.svg.png`,
    color:   "#c9a227",
  },

  // ── R ─────────────────────────────────────────────────────────────────────
  {
    name:    "RAM",
    logoUrl: `${W}/d/d8/Ram_trucks_logo.svg/240px-Ram_trucks_logo.svg.png`,
    color:   "#c8102e",
  },
  {
    name:    "Rivian",
    logoUrl: `${W}/8/8b/Rivian_logo.svg/240px-Rivian_logo.svg.png`,
    color:   "#00b050",
  },
  {
    name:    "Rolls-Royce",
    logoUrl: `${W}/e/ef/Rolls-Royce_Motor_Cars_logo.svg/240px-Rolls-Royce_Motor_Cars_logo.svg.png`,
    color:   "#6e1a36",
  },

  // ── S ─────────────────────────────────────────────────────────────────────
  {
    name:    "Subaru",
    logoUrl: `${W}/1/1e/Subaru_Corporation_logo.svg/240px-Subaru_Corporation_logo.svg.png`,
    color:   "#003087",
  },

  // ── T ─────────────────────────────────────────────────────────────────────
  {
    name:    "Tesla",
    logoUrl: `${W}/b/bd/Tesla_Motors.svg/240px-Tesla_Motors.svg.png`,
    color:   "#e82127",
  },
  {
    name:    "Toyota",
    logoUrl: `${W}/9/9d/Toyota_carlogo.svg/240px-Toyota_carlogo.svg.png`,
    color:   "#eb0a1e",
  },

  // ── V ─────────────────────────────────────────────────────────────────────
  {
    name:    "Volkswagen",
    logoUrl: `${W}/6/6d/Volkswagen_logo_2019.svg/240px-Volkswagen_logo_2019.svg.png`,
    color:   "#001e50",
  },
  {
    name:    "Volvo",
    logoUrl: `${W}/8/88/Volvo_logo.svg/240px-Volvo_logo.svg.png`,
    color:   "#003e7e",
  },
];

/** Flat array of brand names — used as the make filter in search & selectors. */
export const VEHICLE_MAKES: string[] = BRANDS.map((b) => b.name);

/** Quick lookup by name. */
export const BRAND_MAP = new Map<string, VehicleBrand>(
  BRANDS.map((b) => [b.name, b]),
);
