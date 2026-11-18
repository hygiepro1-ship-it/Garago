import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

// Seuls Google et Bing peuvent parcourir le site : tous les autres robots (moteurs IA, outils SEO, aspirateurs)
// parcouraient les 900+ pages sans amener de visiteurs et consommaient du temps de calcul chez l'hébergeur.
// Décision de novembre 2026, à rouvrir plus tard (par exemple GPTBot, ClaudeBot, PerplexityBot pour être cité
// par les moteurs IA, ou DataForSeoBot pour les audits SEO).
const DISALLOWED = ["/api/", "/tableau-de-bord/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["Googlebot", "Bingbot"], allow: "/", disallow: DISALLOWED },
      { userAgent: "*", disallow: "/" },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
