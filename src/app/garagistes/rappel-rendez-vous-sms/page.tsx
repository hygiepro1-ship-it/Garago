import GuidePage, { guideMetadata } from "@/components/GuidePage";
import { fr as guide } from "@/content/guides/rappel-rendez-vous-sms";

export const metadata = guideMetadata(guide, "fr");

export default function Page() {
  return <GuidePage {...guide} lang="fr" />;
}
