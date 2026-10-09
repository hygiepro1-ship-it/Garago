import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Inscrire mon garage, essai gratuit de 30 jours | Garago",
  description: "Inscrivez votre garage sur Garago : profil, agenda en ligne et rendez-vous. 30 jours d'essai gratuit, aucun frais avant la fin de l'essai.",
  alternates: { canonical: `${BASE_URL}/inscription/garage` },
  openGraph: { title: "Inscrire mon garage, essai gratuit de 30 jours | Garago", description: "Inscrivez votre garage sur Garago : profil, agenda en ligne et rendez-vous. 30 jours d'essai gratuit, aucun frais avant la fin de l'essai.", url: `${BASE_URL}/inscription/garage`, siteName: "Garago", locale: "fr_CA", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
