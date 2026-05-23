export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Montréal":                 { lat: 45.5017, lng: -73.5673 },
  "Québec":                   { lat: 46.8139, lng: -71.2082 },
  "Laval":                    { lat: 45.6066, lng: -73.7124 },
  "Longueuil":                { lat: 45.5315, lng: -73.5182 },
  "Sherbrooke":               { lat: 45.4042, lng: -71.8929 },
  "Saguenay":                 { lat: 48.4268, lng: -71.0647 },
  "Lévis":                    { lat: 46.8035, lng: -71.1785 },
  "Trois-Rivières":           { lat: 46.3432, lng: -72.5431 },
  "Terrebonne":               { lat: 45.7050, lng: -73.6382 },
  "Saint-Jean-sur-Richelieu": { lat: 45.3154, lng: -73.2632 },
  "Repentigny":               { lat: 45.7404, lng: -73.4541 },
  "Brossard":                 { lat: 45.4570, lng: -73.4648 },
  "Drummondville":            { lat: 45.8842, lng: -72.4837 },
  "Saint-Jérôme":             { lat: 45.7787, lng: -74.0007 },
  "Blainville":               { lat: 45.6718, lng: -73.8830 },
  "Granby":                   { lat: 45.4018, lng: -72.7330 },
  "Mirabel":                  { lat: 45.6500, lng: -74.0900 },
  "Châteauguay":              { lat: 45.3819, lng: -73.7503 },
  "Mascouche":                { lat: 45.7531, lng: -73.6015 },
  "Victoriaville":            { lat: 46.0566, lng: -71.9682 },
  "Saint-Hyacinthe":          { lat: 45.6258, lng: -72.9517 },
  "Dollard-des-Ormeaux":      { lat: 45.4957, lng: -73.8174 },
  "Rimouski":                 { lat: 48.4491, lng: -68.5234 },
  "Rouyn-Noranda":            { lat: 48.2392, lng: -79.0127 },
  "Val-d'Or":                 { lat: 48.0973, lng: -77.7975 },
  "Gatineau":                 { lat: 45.4765, lng: -75.7013 },
  "Alma":                     { lat: 48.5498, lng: -71.6540 },
  "Baie-Comeau":              { lat: 49.2171, lng: -68.1503 },
  "Sept-Îles":                { lat: 50.2168, lng: -66.3811 },
  "Shawinigan":               { lat: 46.5699, lng: -72.7459 },
  "Joliette":                 { lat: 46.0170, lng: -73.4390 },
  "Sorel-Tracy":              { lat: 46.0494, lng: -73.1179 },
  "Rivière-du-Loup":          { lat: 47.8333, lng: -69.5333 },
  "Thetford Mines":           { lat: 46.1000, lng: -71.3000 },
};

/** Haversine distance in km between two GPS points. */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format km distance into a readable string. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
