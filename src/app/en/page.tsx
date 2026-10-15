import HomeContent from "@/components/HomeContent";
import { pageMetadata } from "@/lib/alternates";

export const metadata = pageMetadata({
  path: "/en",
  lang: "en",
  type: "website",
  title: "Garago | Find an auto repair shop and book online in Quebec",
  description:
    "Find a garage near you in Quebec: driver reviews, winter tires, oil changes, brakes and repairs. Filter by make, service and availability, then book online.",
});

export default function Page() {
  return <HomeContent />;
}
