import type { NextRequest } from "next/server";

// Robots d'indexation et outils automatiques (Google, Bing, IA, aperçus de liens, sondes) : ils visitent le site
// à toute heure, jour et nuit. Leurs visites ne doivent pas toucher la base : chaque écriture réveille la base
// Neon, qui ne se met en veille qu'après quelques minutes sans requête, et le temps de calcul est facturé.
const BOT_UA =
  /bot|crawl|spider|slurp|crawler|fetch|preview|headless|lighthouse|pagespeed|scrapy|python-requests|curl|wget|httpclient|axios|node-fetch|go-http|java\/|facebookexternalhit|whatsapp|telegram|discord|slack|embedly|bingpreview|gptbot|chatgpt|claude|anthropic|perplexity|bytespider|amazonbot|applebot|yandex|baidu|duckduck|petalbot|semrush|ahrefs|mj12|dotbot|uptime|monitor|pingdom/i;

/** Vrai si la requête vient d'un robot ou d'un outil automatique (ou n'annonce aucun navigateur). */
export function isBotRequest(req: NextRequest): boolean {
  const ua = req.headers.get("user-agent") ?? "";
  return !ua || BOT_UA.test(ua);
}
