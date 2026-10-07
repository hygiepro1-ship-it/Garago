import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Prestations automobiles : vidange, pneus, freins — Garago",
  description: "Découvrez les prestations offertes par les garages de Garago : vidange d'huile, pneus d'hiver, freins, climatisation, diagnostic et plus. Comparez et réservez en ligne.",
  alternates: { canonical: `${BASE_URL}/prestations` },
  openGraph: { title: "Prestations automobiles : vidange, pneus, freins — Garago", description: "Découvrez les prestations offertes par les garages de Garago : vidange d'huile, pneus d'hiver, freins, climatisation, diagnostic et plus. Comparez et réservez en ligne.", url: `${BASE_URL}/prestations`, siteName: "Garago", locale: "fr_CA", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
