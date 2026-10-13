import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { translations } from "@/lib/i18n";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export const metadata: Metadata = {
  title: "Questions fréquentes | Garago",
  description: "Réponses aux questions des conducteurs et des garagistes : réservation, confirmation des rendez-vous, avis, abonnement et inscription sur Garago.",
  alternates: { canonical: `${BASE_URL}/faq` },
  openGraph: { title: "Questions fréquentes | Garago", description: "Réponses aux questions des conducteurs et des garagistes : réservation, confirmation des rendez-vous, avis, abonnement et inscription sur Garago.", url: `${BASE_URL}/faq`, siteName: "Garago", locale: "fr_CA", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const f = translations.fr.faq;
  const entries = [...f.driverFaq, ...f.garageFaq].map((x) => ({
    "@type": "Question",
    name: x.q,
    acceptedAnswer: { "@type": "Answer", text: x.a },
  }));
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: entries }} />
      {children}
    </>
  );
}
