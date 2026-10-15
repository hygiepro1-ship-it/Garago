import GuidePage, { guideMetadata } from "@/components/GuidePage";
import { fr as guide } from "@/content/guides/agenda-en-ligne";

export const metadata = guideMetadata(guide, "fr");

export default function Page() {
  return <GuidePage {...guide} lang="fr" />;
}
