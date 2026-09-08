/** Converts a civic address to GPS coordinates using Nominatim (OpenStreetMap). */
export async function geocodeAddress(
  address: string,
  city: string,
  province = "Québec",
  country = "Canada",
): Promise<{ latitude: number; longitude: number } | null> {
  if (!address || !city) return null;

  const query = encodeURIComponent(`${address}, ${city}, ${province}, ${country}`);
  const url   = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=ca`;

  try {
    const res  = await fetch(url, {
      headers: { "User-Agent": "Garago/1.0 (garagopro.ca)" },
      signal:  AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const { lat, lon } = data[0];
    const latitude  = parseFloat(lat);
    const longitude = parseFloat(lon);
    if (isNaN(latitude) || isNaN(longitude)) return null;

    return { latitude, longitude };
  } catch {
    return null;
  }
}
