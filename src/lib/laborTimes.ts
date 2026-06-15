/**
 * Temps barèmes par catégorie de service (en heures de main-d'œuvre).
 * Basé sur les standards des garages indépendants québécois.
 *
 * Multiplicateurs par classe de véhicule :
 *   compact  × 0.85   (Yaris, Fit, Accent...)
 *   regular  × 1.00   (Civic, Corolla, Accord, Camry...)
 *   suv      × 1.15   (RAV4, CR-V, Highlander, Tiguan...)
 *   truck    × 1.20   (F-150, Silverado, RAM, Tacoma...)
 *   luxury   × 1.35   (BMW, Mercedes, Audi, Lexus...)
 */

export type VehicleClass = "compact" | "regular" | "suv" | "truck" | "luxury";

const CLASS_MULTIPLIER: Record<VehicleClass, number> = {
  compact: 0.85,
  regular: 1.00,
  suv:     1.15,
  truck:   1.20,
  luxury:  1.35,
};

interface LaborEntry {
  baseHours: number;     // heures à taux × 1.00 (véhicule regular)
  partsMin:  number;     // estimation pièces min (CAD)
  partsMax:  number;     // estimation pièces max (CAD)
  note?:     string;     // ex. "Freins avant seulement"
}

// Clés = id de SERVICE_CATEGORIES dans src/lib/services.ts
export const LABOR_CATALOG: Record<string, LaborEntry> = {
  "oil":          { baseHours: 0.5,  partsMin: 30,  partsMax: 60,  note: "Huile + filtre" },
  "tires-winter": { baseHours: 1.0,  partsMin: 20,  partsMax: 40,  note: "Montage + balancement 4 pneus" },
  "tires-summer": { baseHours: 1.0,  partsMin: 20,  partsMax: 40,  note: "Montage + balancement 4 pneus" },
  "brakes":       { baseHours: 1.2,  partsMin: 80,  partsMax: 200, note: "Plaquettes avant" },
  "ac":           { baseHours: 1.0,  partsMin: 80,  partsMax: 130, note: "Recharge réfrigérant" },
  "inspection":   { baseHours: 1.2,  partsMin: 0,   partsMax: 0,   note: "Inspection mécanique complète" },
  "battery":      { baseHours: 0.5,  partsMin: 150, partsMax: 280, note: "Batterie incluse" },
  "transmission": { baseHours: 1.0,  partsMin: 80,  partsMax: 160, note: "Vidange + fluide" },
  "alignment":    { baseHours: 0.6,  partsMin: 0,   partsMax: 0,   note: "Alignement 4 roues" },
  "suspension":   { baseHours: 2.0,  partsMin: 200, partsMax: 450, note: "Par amortisseur" },
  "electrical":   { baseHours: 1.0,  partsMin: 0,   partsMax: 0,   note: "Diagnostic électronique" },
  "exhaust":      { baseHours: 1.2,  partsMin: 200, partsMax: 450, note: "Section d'échappement" },
  "cooling":      { baseHours: 0.8,  partsMin: 40,  partsMax: 90,  note: "Rinçage + liquide" },
  "timing":       { baseHours: 4.5,  partsMin: 200, partsMax: 450, note: "Courroie + tendeur + galet" },
  "clutch":       { baseHours: 5.0,  partsMin: 400, partsMax: 750, note: "Kit embrayage complet" },
  "preventive":   { baseHours: 1.5,  partsMin: 100, partsMax: 220, note: "Révision + filtres + fluides" },
  "bearing":      { baseHours: 1.8,  partsMin: 150, partsMax: 280, note: "Roulement de roue" },
  "fuel":         { baseHours: 1.0,  partsMin: 60,  partsMax: 120, note: "Nettoyage injecteurs" },
  "rust":         { baseHours: 2.5,  partsMin: 150, partsMax: 280, note: "Traitement antirouille complet" },
  "detailing":    { baseHours: 2.5,  partsMin: 50,  partsMax: 100, note: "Nettoyage intérieur + extérieur" },
  "glass":        { baseHours: 1.5,  partsMin: 250, partsMax: 550, note: "Pare-brise" },
  "engine":       { baseHours: 2.0,  partsMin: 200, partsMax: 600, note: "Varie selon la réparation" },
  "ev":           { baseHours: 1.5,  partsMin: 0,   partsMax: 0,   note: "Diagnostic VE" },
};

// ── Marques classées "luxe" ────────────────────────────────────────────────────
const LUXURY_MAKES = new Set([
  "BMW", "Mercedes-Benz", "Audi", "Volvo", "Jaguar", "Land Rover", "Porsche",
  "Lexus", "Acura", "Infiniti", "Cadillac", "Lincoln", "Genesis", "Maserati",
  "Bentley", "Rolls-Royce", "Lamborghini", "McLaren", "Lucid", "Polestar",
  "Aston Martin", "Alfa Romeo",
]);

// ── Modèles camionnettes ───────────────────────────────────────────────────────
const TRUCK_KEYWORDS = [
  "f-150","f-250","f-350","f150","f250","f350",
  "silverado","sierra","ram 1500","ram 1500 classic","ram 2500","ram 3500",
  "tacoma","tundra","titan","maverick","colorado","canyon","frontier","ridgeline",
];

// ── Modèles VUS ────────────────────────────────────────────────────────────────
const SUV_KEYWORDS = [
  "rav4","cr-v","crv","escape","equinox","rogue","tucson","sportage","cx-5",
  "forester","outback","tiguan","compass","cherokee","grand cherokee","wrangler",
  "4runner","highlander","pilot","explorer","edge","blazer","traverse","pathfinder",
  "murano","santa fe","sorento","telluride","palisade","atlas","crosstrek","ascent",
  "odyssey","sienna","pacifica","expedition","suburban","tahoe","yukon","durango",
  "navigator","escalade","qx60","qx80","gx","lx","mdx","rdx","rx","nx","ux",
  "gle","glc","glb","gls","x5","x3","x1","q7","q5","q3","cayenne","macan",
  "xc90","xc60","xc40","f-pace","e-pace","i-pace","defender","discovery","range rover",
  "cayenne","urus","ioniq 5","id.4","bz4x","cx-50","cx-90","kona","venue",
];

export function getVehicleClass(make: string, model: string): VehicleClass {
  const m = make.trim();
  const mod = model.toLowerCase().trim();

  if (LUXURY_MAKES.has(m)) return "luxury";
  if (TRUCK_KEYWORDS.some(k => mod.includes(k))) return "truck";
  if (SUV_KEYWORDS.some(k => mod.includes(k))) return "suv";

  // Petits véhicules par mot-clé modèle
  const compactKeywords = ["yaris","fit","accent","micra","mirage","rio","versa","spark","sonic","fiesta","aveo","swift","city","jazz"];
  if (compactKeywords.some(k => mod.includes(k))) return "compact";

  return "regular";
}

export interface QuoteEstimate {
  laborHours: number;
  laborCost:  number;
  partsMin:   number;
  partsMax:   number;
  totalMin:   number;
  totalMax:   number;
  note:       string;
}

/**
 * Calcule un devis estimatif pour une prestation donnée.
 * @param categoryId  - id de la catégorie (ex. "oil", "brakes")
 * @param hourlyRate  - taux horaire du garage ($/h)
 * @param vehicleClass - classe du véhicule
 */
export function estimateQuote(
  categoryId:   string,
  hourlyRate:   number,
  vehicleClass: VehicleClass,
): QuoteEstimate | null {
  const entry = LABOR_CATALOG[categoryId];
  if (!entry) return null;

  const multiplier = CLASS_MULTIPLIER[vehicleClass];
  const laborHours = Math.round(entry.baseHours * multiplier * 10) / 10;
  const laborCost  = Math.round(laborHours * hourlyRate);
  const partsMin   = Math.round(entry.partsMin  * (vehicleClass === "luxury" ? 1.3 : vehicleClass === "truck" ? 1.1 : 1.0));
  const partsMax   = Math.round(entry.partsMax  * (vehicleClass === "luxury" ? 1.4 : vehicleClass === "truck" ? 1.15 : 1.0));

  return {
    laborHours,
    laborCost,
    partsMin,
    partsMax,
    totalMin: laborCost + partsMin,
    totalMax: laborCost + partsMax,
    note:     entry.note ?? "",
  };
}
