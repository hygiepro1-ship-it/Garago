import GaragistesContent from "@/app/garagistes/GaragistesContent";
import { pageMetadata } from "@/lib/alternates";
import "@/app/garagistes/garagistes.css";

export const metadata = pageMetadata({
  path: "/en/garage-owners",
  lang: "en",
  type: "website",
  title: "Online booking for auto repair shops in Quebec | Fewer no-shows | Garago",
  description:
    "Online calendar and booking for auto repair shops: customers book 24/7, get a confirmation and reminder, and you cut missed appointments. 30-day free trial.",
});

export default function GarageOwnersPage() {
  return <GaragistesContent />;
}
