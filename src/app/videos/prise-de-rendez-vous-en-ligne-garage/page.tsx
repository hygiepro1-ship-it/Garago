import VideoWatchPage, { videoMetadata } from "@/components/VideoWatchPage";
import { VIDEOS } from "@/content/videos";

const video = VIDEOS.garagistes.fr;
export const metadata = videoMetadata(video, "fr");

export default function Page() {
  return <VideoWatchPage video={video} lang="fr" audience="garages" />;
}
