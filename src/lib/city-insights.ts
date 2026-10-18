// Contenu propre à chaque page de ville, calculé à partir de ses garages (rien d'inventé) : rues où ils se
// trouvent, codes postaux couverts et types de garages selon leur nom.

export type GarageType = "carrosserie" | "pneus" | "transmission" | "silencieux" | "mecanique";

export const GARAGE_TYPE_LABEL: Record<GarageType, string> = {
  mecanique: "Mécanique générale",
  carrosserie: "Carrosserie",
  pneus: "Pneus",
  transmission: "Transmission",
  silencieux: "Silencieux et échappement",
};

/** Type d'un garage déduit de son nom (« Carrosserie Genile » → carrosserie) ; sinon mécanique générale. */
export function garageType(name: string): GarageType {
  const n = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/carrosserie|debosselage|collision|body/.test(n)) return "carrosserie";
  if (/pneu|tire/.test(n)) return "pneus";
  if (/transmission/.test(n)) return "transmission";
  if (/silencieux|muffler|exhaust/.test(n)) return "silencieux";
  return "mecanique";
}

/** Rue d'une adresse, sans le numéro civique : « 1123, rue Hickson » → « rue Hickson ». */
export function streetOf(address: string): string {
  return address
    .replace(/^\s*\d+[A-Za-z]?(?:-\d+[A-Za-z]?)?\s*,?\s*/, "")
    .replace(/\s*(?:#|bureau|local|suite|app\.?)\s*\S+$/i, "")
    .trim()
    // Type de voie en minuscules, comme au milieu d'une phrase : « Rue Hickson » → « rue Hickson »
    .replace(/^(rue|boulevard|boul\.?|bd|avenue|av\.?|chemin|ch\.|place|montée|rang|route|côte)(?=\s)/i, (t) => t.toLowerCase());
}

const key = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export interface CityInsights {
  streets: { name: string; count: number }[];
  postalPrefixes: string[];
  types: { type: GarageType; label: string; count: number }[];
}

export function cityInsights(garages: { name: string; address: string; postalCode: string | null }[]): CityInsights {
  const streets = new Map<string, { name: string; count: number }>();
  for (const g of garages) {
    const s = streetOf(g.address);
    if (!s) continue;
    const k = key(s);
    const cur = streets.get(k);
    if (cur) cur.count++;
    else streets.set(k, { name: s, count: 1 });
  }
  const types = new Map<GarageType, number>();
  for (const g of garages) types.set(garageType(g.name), (types.get(garageType(g.name)) ?? 0) + 1);
  const prefixes = new Set(garages.map((g) => (g.postalCode ?? "").replace(/\s/g, "").slice(0, 3).toUpperCase()).filter((p) => /^[A-Z]\d[A-Z]$/.test(p)));
  return {
    // Rues qui ont au moins deux garages, les plus fournies d'abord
    streets: [...streets.values()].filter((s) => s.count >= 2).sort((a, b) => b.count - a.count).slice(0, 5),
    postalPrefixes: [...prefixes].sort(),
    types: [...types.entries()].map(([type, count]) => ({ type, label: GARAGE_TYPE_LABEL[type], count })).sort((a, b) => b.count - a.count),
  };
}
