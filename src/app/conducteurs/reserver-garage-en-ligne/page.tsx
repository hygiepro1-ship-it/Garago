import { guideMetadata } from "@/components/GuidePage";
import DriverBookingGuide from "@/components/DriverBookingGuide";
import { fr as guide } from "@/content/guides/reserver-garage-en-ligne";

export const metadata = guideMetadata(guide, "fr");

export default function Page() {
  return <DriverBookingGuide lang="fr" />;
}
