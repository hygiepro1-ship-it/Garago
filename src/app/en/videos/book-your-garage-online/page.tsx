import VideoWatchPage, { videoMetadata } from "@/components/VideoWatchPage";
import { VIDEOS } from "@/content/videos";

const video = VIDEOS.reserver.en;
export const metadata = videoMetadata(video, "en");

export default function Page() {
  return <VideoWatchPage video={video} lang="en" audience="drivers" />;
}
