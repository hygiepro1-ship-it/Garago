import { pageMetadata } from "@/lib/alternates";
import AProposPage from "@/app/a-propos/page";

export const metadata = pageMetadata({
  path: "/en/about",
  lang: "en",
  type: "website",
  title: "About | Garago",
  description: "What Garago is, who runs it, the area it covers, how garage listings and reviews work, and how to reach us.",
});

// Même page que /a-propos : les textes passent en anglais selon l'adresse (/en/...).
export default function AboutPage() {
  return <AProposPage />;
}
