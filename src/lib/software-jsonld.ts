import type { PageLang } from "@/lib/alternates";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

/** Garago décrit comme logiciel pour Google (page « Pour les garages ») : prix réels, essai de 30 jours. */
export function softwareJsonLd(lang: PageLang) {
  const en = lang === "en";
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Garago",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${BASE_URL}${en ? "/en/garage-owners" : "/garagistes"}`,
    inLanguage: en ? "en-CA" : "fr-CA",
    description: en
      ? "Online booking, calendar and appointment confirmations for auto repair shops in Quebec."
      : "Prise de rendez-vous en ligne, agenda et confirmations de rendez-vous pour les garages du Québec.",
    publisher: { "@id": "https://garagopro.ca/#organization" },
    offers: [
      {
        "@type": "Offer",
        name: en ? "Monthly" : "Mensuel",
        price: "109.99",
        priceCurrency: "CAD",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "109.99", priceCurrency: "CAD", unitCode: "MON", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" } },
        description: en ? "30-day free trial, cancel anytime." : "Essai gratuit de 30 jours, sans engagement.",
      },
      {
        "@type": "Offer",
        name: en ? "Annual" : "Annuel",
        price: "1055.90",
        priceCurrency: "CAD",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "1055.90", priceCurrency: "CAD", unitCode: "ANN", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "ANN" } },
        description: en ? "30-day free trial, one payment per year." : "Essai gratuit de 30 jours, un seul paiement par année.",
      },
    ],
  };
}
