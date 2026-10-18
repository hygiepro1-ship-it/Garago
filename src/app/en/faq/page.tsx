import { pageMetadata } from "@/lib/alternates";
import FaqJsonLd from "@/app/faq/faq-jsonld";
import FAQPage from "@/app/faq/page";

export const metadata = pageMetadata({
  path: "/en/faq",
  lang: "en",
  type: "website",
  title: "Frequently asked questions | Garago",
  description: "Answers for drivers and auto repair shops: booking, appointment confirmations, reviews, subscription and signing up on Garago.",
});

// Même page que /faq : les textes passent en anglais selon l'adresse (/en/...).
export default function EnFaqPage() {
  return (
    <>
      <FaqJsonLd lang="en" />
      <FAQPage />
    </>
  );
}
