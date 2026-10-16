import { guideMetadata } from "@/components/GuidePage";
import DriverBookingGuide from "@/components/DriverBookingGuide";
import { en as guide } from "@/content/guides/reserver-garage-en-ligne";

export const metadata = guideMetadata(guide, "en");

export default function Page() {
  return <DriverBookingGuide lang="en" />;
}
