// Type de garage déduit de son nom, pour les filtres de la liste des pages de ville.

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
