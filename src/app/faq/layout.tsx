import type { Metadata } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Questions fréquentes — Garago",
  description: "Réponses aux questions des conducteurs et des garagistes : réservation, confirmation des rendez-vous, avis, abonnement et inscription sur Garago.",
  alternates: { canonical: `${BASE_URL}/faq` },
  openGraph: { title: "Questions fréquentes — Garago", description: "Réponses aux questions des conducteurs et des garagistes : réservation, confirmation des rendez-vous, avis, abonnement et inscription sur Garago.", url: `${BASE_URL}/faq`, siteName: "Garago", locale: "fr_CA", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
