import GuidePage, { guideMetadata } from "@/components/GuidePage";
import { en as guide } from "@/content/guides/attirer-clients-garage";

export const metadata = guideMetadata(guide, "en");

export default function Page() {
  return <GuidePage {...guide} lang="en" />;
}
