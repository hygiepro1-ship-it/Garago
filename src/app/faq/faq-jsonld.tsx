import JsonLd from "@/components/JsonLd";
import { translations } from "@/lib/i18n";
import type { PageLang } from "@/lib/alternates";

/** Questions et réponses de la FAQ (conducteurs et garages) en données structurées, dans la langue de la page. */
export default function FaqJsonLd({ lang }: { lang: PageLang }) {
  const f = translations[lang].faq;
  const entries = [...f.driverFaq, ...f.garageFaq].map((x) => ({
    "@type": "Question",
    name: x.q,
    acceptedAnswer: { "@type": "Answer", text: x.a },
  }));
  return <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: lang === "en" ? "en-CA" : "fr-CA", mainEntity: entries }} />;
}
