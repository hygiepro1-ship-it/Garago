import WhyGarago from "@/components/WhyGarago";
import { pageMetadata } from "@/lib/alternates";

export const metadata = pageMetadata({
  path: "/en/why-garago",
  lang: "en",
  type: "website",
  title: "Why Garago: online car appointments in Quebec",
  description:
    "Why choose Garago: fewer missed appointments and an online calendar for auto repair shops, and an easy way for Quebec drivers to find and book a garage.",
});

export default function WhyGaragoPage() {
  return <WhyGarago lang="en" />;
}
