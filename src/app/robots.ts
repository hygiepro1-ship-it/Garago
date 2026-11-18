import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

// Robots d'outils SEO commerciaux et d'aspirateurs de contenu : ils parcourent tout le site (plus de 900 pages)
// sans amener un seul visiteur, et chaque passage consomme du temps de calcul chez l'hébergeur. Google, Bing,
// les moteurs IA (GPTBot, ClaudeBot, PerplexityBot…) et DataForSeoBot (utilisé pour nos propres audits SEO)
// restent autorisés.
const BLOCKED_BOTS = [
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "BLEXBot", "PetalBot", "Bytespider",
  "Barkrowler", "SeekportBot", "serpstatbot", "MegaIndex",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_BOTS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/", "/tableau-de-bord/"] },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
