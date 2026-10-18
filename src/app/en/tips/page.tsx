import { pageMetadata } from "@/lib/alternates";
import ConseilsPage from "@/app/conseils/page";

export const metadata = pageMetadata({
  path: "/en/tips",
  lang: "en",
  type: "website",
  title: "Car tips for Quebec drivers: maintenance and tires | Garago",
  description: "Check engine light, car won't start, winter tires, oil changes, SAAQ inspection: clear, sourced car tips for Quebec drivers.",
});

// Même page que /conseils : les textes passent en anglais selon l'adresse (/en/...).
export default function TipsPage() {
  return <ConseilsPage />;
}
