import { pageMetadata } from "@/lib/alternates";
import CitiesIndex from "@/app/garages/page";

export const revalidate = 86400;

export const metadata = pageMetadata({
  path: "/en/garages",
  lang: "en",
  type: "website",
  title: "Auto repair shops in Montréal, by area | Garago",
  description: "Auto repair shops in Montréal and the surrounding area, by borough and city: addresses, phone numbers and reviews. Or search around your postal code.",
});

// Même page que /garages : les textes passent en anglais selon l'adresse (/en/...).
export default function EnGaragesPage() {
  return <CitiesIndex />;
}
