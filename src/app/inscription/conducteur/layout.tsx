import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Créer un compte conducteur | Garago",
  description: "Créez gratuitement votre compte conducteur pour réserver chez les garages du Québec et suivre l'entretien de vos véhicules.",
  alternates: { canonical: `${BASE_URL}/inscription/conducteur` },
  openGraph: { title: "Créer un compte conducteur | Garago", description: "Créez gratuitement votre compte conducteur pour réserver chez les garages du Québec et suivre l'entretien de vos véhicules.", url: `${BASE_URL}/inscription/conducteur`, siteName: "Garago", locale: "fr_CA", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
