import GuidePage, { guideMetadata } from "@/components/GuidePage";
import { en as guide } from "@/content/guides/agenda-en-ligne";

export const metadata = guideMetadata(guide, "en");

export default function Page() {
  return <GuidePage {...guide} lang="en" />;
}
