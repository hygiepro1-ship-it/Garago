import GuidePage, { guideMetadata } from "@/components/GuidePage";
import { fr as guide } from "@/content/guides/logiciel-garage-automobile";

export const metadata = guideMetadata(guide, "fr");

export default function Page() {
  return <GuidePage {...guide} lang="fr" />;
}
