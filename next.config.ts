import type { NextConfig } from "next";

// Politique de sécurité du contenu (CSP) : liste les seuls sites autorisés à charger des scripts, images,
// polices et connexions sur les pages du site. En production elle est APPLIQUÉE (le navigateur bloque le reste) ;
// en développement elle reste en mode rapport, car l'outil de développement de Next.js a besoin d'eval().
//
// 'unsafe-inline' dans script-src est requis : Next.js insère de petits scripts dans chaque page pour démarrer
// l'interface. La politique protège quand même contre le chargement de scripts externes non listés, l'intégration
// du site dans une autre page (frame-ancestors), les formulaires envoyés ailleurs (form-action) et les balises <base>.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://maps.googleapis.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // 'unsafe-inline' requis — le site utilise des style={{}} inline partout
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://tile.openstreetmap.org https://*.googleapis.com https://*.gstatic.com https://*.ggpht.com https://cdn.jsdelivr.net https://upload.wikimedia.org https://commons.wikimedia.org https://source.unsplash.com https://images.unsplash.com",
  "connect-src 'self' data: blob: https://nominatim.openstreetmap.org https://*.googleapis.com https://*.gstatic.com https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const CSP_HEADER = process.env.NODE_ENV === "production" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=()" },
  { key: CSP_HEADER, value: CSP },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // L'ancienne page de tarifs est remplacée par la page « Pour les garages » —
  // la redirection permanente garde les anciens liens et le référencement.
  async redirects() {
    return [
      // Une seule adresse pour le site : www.garagopro.ca renvoie vers garagopro.ca (même chemin).
      { source: "/:path*", has: [{ type: "host", value: "www.garagopro.ca" }], destination: "https://garagopro.ca/:path*", permanent: true },
      { source: "/tarifs", destination: "/garagistes", permanent: true },
      // L'agenda est intégré au tableau de bord du garage (anciens liens des courriels, favoris).
      { source: "/tableau-de-bord/garage/agenda", destination: "/tableau-de-bord/garage", permanent: false },
      // Fiches de garages enregistrées en double (même adresse écrite autrement), fusionnées le 2026-10-16.
      ...[["chirwan-inc-1", "chirwan-inc"], ["garage-deguire-1", "garage-deguire"], ["garage-martin-jacques-1", "garage-martin-jacques"],
          ["kamille-automobiles-1", "kamille-automobiles"], ["r-r-services-1", "r-r-services"],
          ["garage-auto-frah-mecanique-generale-1", "garage-auto-frah-mecanique-generale"], ["mcc-auto-enr-1", "mcc-auto-enr"], ["mecanique-pro-expert-1", "mecanique-pro-expert"], ["napa-autopro-garage-poirier-et-poirier-inc-1", "napa-autopro-garage-poirier-et-poirier-inc"], ["pneus-mecanique-verdun-1", "pneus-mecanique-verdun"], ["solution-auto-mecanique-1", "solution-auto-mecanique"], ["sp-mecanique-1", "sp-mecanique"]]
        .map(([from, to]) => ({ source: `/garage/${from}`, destination: `/garage/${to}`, permanent: true })),
    ];
  },
};

export default nextConfig;
