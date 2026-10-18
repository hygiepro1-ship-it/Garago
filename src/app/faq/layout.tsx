import { pageMetadata } from "@/lib/alternates";
import FaqJsonLd from "./faq-jsonld";

export const metadata = pageMetadata({
  path: "/faq",
  lang: "fr",
  type: "website",
  title: "Questions fréquentes | Garago",
  description: "Réponses aux questions des conducteurs et des garagistes : réservation, confirmation des rendez-vous, avis, abonnement et inscription sur Garago.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FaqJsonLd lang="fr" />
      {children}
    </>
  );
}
