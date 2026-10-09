/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

// Quartiers de Montréal mis en avant sur l'accueil : chaque lien ouvre la
// recherche centrée sur le quartier (coordonnées approximatives de son centre).
const NEIGHBOURHOODS: { name: string; lat: number; lng: number }[] = [
  { name: "Rosemont",            lat: 45.5540, lng: -73.5760 },
  { name: "Villeray",            lat: 45.5450, lng: -73.6200 },
  { name: "Plateau-Mont-Royal",  lat: 45.5230, lng: -73.5810 },
  { name: "Hochelaga",           lat: 45.5430, lng: -73.5420 },
  { name: "Verdun",              lat: 45.4590, lng: -73.5720 },
  { name: "Ahuntsic",            lat: 45.5560, lng: -73.6620 },
];

interface Season { title: string; body: string; service: string; image?: { src: string; alt: string } }

/**
 * Sujet de saison propre au Québec. Les pneus d'hiver y sont obligatoires du
 * 1er décembre au 15 mars : on en parle à l'automne, et de la repose des pneus
 * d'été au printemps. Le reste de l'année, seuls les quartiers s'affichent.
 */
function currentSeason(lang: string, now = new Date()): Season | null {
  const fr = lang === "fr";
  const m = now.getMonth(); // 0 = janvier
  if (m >= 8 && m <= 10) {
    return {
      title: fr ? "Pneus d'hiver : date limite le 1er décembre" : "Winter tires: deadline December 1",
      body: fr ? "Les garages se remplissent vite à l'automne. Voyez qui a encore de la place dans votre quartier."
               : "Garages fill up fast in the fall. See who still has room in your neighbourhood.",
      service: "tires-winter",
      image: {
        src: "/saison-pneus.webp",
        // Photo Freepik (senivpetro), n° 13781719. Affichée sans mention d'auteur à la demande
        // du propriétaire du site : la licence gratuite l'exige, un abonnement Premium en dispense.
        alt: fr ? "Un mécanicien serre les écrous d'une roue chaussée d'un pneu d'hiver" : "A mechanic tightens the nuts of a wheel fitted with a winter tire",
      },
    };
  }
  if (m >= 2 && m <= 4) {
    return {
      title: fr ? "Pneus d'été : vous pouvez les remettre à partir du 16 mars" : "Summer tires: you can put them back on from March 16",
      body: fr ? "Voyez les garages qui ont de la place dans votre quartier." : "See which garages have room in your neighbourhood.",
      service: "tires-summer",
    };
  }
  return null;
}

/** Accueil : sujet de saison et accès direct par quartier de Montréal. */
export default function HomeLocalSeason({ lang }: { lang: string }) {
  const fr = lang === "fr";
  const season = currentSeason(lang);
  return (
    <section className="bg-white py-10 sm:py-14" style={{ borderTop: "1px solid #e2e8f0" }} aria-labelledby="local-title">
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${season?.image ? "grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10 items-center" : ""}`}>
        {season?.image && (
          <figure className="md:col-span-2 m-0">
            <img src={season.image.src} alt={season.image.alt} width={1200} height={800} loading="lazy" decoding="async"
              className="w-full h-auto rounded-xl" style={{ aspectRatio: "3 / 2", objectFit: "cover" }} />
          </figure>
        )}
        <div className={season?.image ? "md:col-span-3" : ""}>
          <h2 id="local-title" className="text-xl sm:text-2xl font-black mb-2" style={{ color: "#0b1f3a" }}>
            {season ? season.title : (fr ? "Trouvez un garage dans votre quartier" : "Find a garage in your neighbourhood")}
          </h2>
          <p className="text-sm sm:text-base mb-5 max-w-2xl" style={{ color: "#64748b" }}>
            {season ? season.body : (fr ? "Choisissez votre quartier de Montréal pour voir les garages autour." : "Pick your Montréal neighbourhood to see the garages around it.")}
          </p>
          <ul className="flex flex-wrap gap-2">
            {NEIGHBOURHOODS.map((n) => (
              <li key={n.name}>
                <Link href={`/rechercher?lat=${n.lat}&lng=${n.lng}${season ? `&service=${season.service}` : ""}`}
                  className="inline-block px-4 py-2.5 rounded-xl text-sm font-bold border hover:bg-orange-50"
                  style={{ color: "#0b1f3a", borderColor: "#cbd5e1" }}>
                  {n.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
