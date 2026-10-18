import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import StickyCta from "@/components/StickyCta";
import { pageMetadata, type PageLang } from "@/lib/alternates";
import { videoJsonLd, type VideoPage } from "@/content/videos";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

export function videoMetadata(v: VideoPage, lang: PageLang) {
  return pageMetadata({ path: v.path, lang, title: v.title, description: v.description, type: "website" });
}

/** Page de lecture d'une vidéo : la vidéo en grand, sa description et sa transcription. */
export default function VideoWatchPage({ video, lang, audience }: { video: VideoPage; lang: PageLang; audience: "garages" | "drivers" }) {
  const en = lang === "en";
  const home = en ? { label: "Home", href: "/en" } : { label: "Accueil", href: "/" };
  // Il n'y a pas de page « Vidéos » : le fil ramène à la page qui présente la vidéo.
  const parent = audience === "drivers"
    ? (en ? { label: "Guides for drivers", href: "/en/why-garago#drivers" } : { label: "Guides pour les conducteurs", href: "/pourquoi-garago#conducteurs" })
    : (en ? { label: "For garages", href: "/en/garage-owners" } : { label: "Pour les garages", href: "/garagistes" });
  return (
    <>
      <JsonLd data={videoJsonLd(video, lang, BASE_URL)} />
      <section style={{ background: "linear-gradient(135deg,#071428 0%,#0b1f3a 60%,#1a3a6b 100%)" }}>
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <nav aria-label={en ? "Breadcrumb" : "Fil d'Ariane"} className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            <Link href={home.href} className="hover:underline">{home.label}</Link> › <Link href={parent.href} className="hover:underline">{parent.label}</Link> › <span aria-current="page">{video.h1}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight" style={{ textWrap: "balance" }}>{video.h1}</h1>
          <div className="mt-6 overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9", boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}>
            <video src={video.file} poster={video.poster} controls playsInline preload="metadata" className="block h-full w-full"
              aria-label={video.h1} />
          </div>
          <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{video.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={video.cta.href} className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>{video.cta.label}</Link>
            <Link href={video.related.href} className="inline-flex items-center px-5 py-3 rounded-xl text-sm font-bold text-white border border-white/40">{video.related.label}</Link>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-black mb-4" style={{ color: "#0b1f3a" }}>{en ? "Transcript" : "Transcription"}</h2>
        <div className="space-y-2 text-base leading-relaxed text-gray-700">
          {video.transcript.map((line) => <p key={line}>{line}</p>)}
        </div>
      </article>
      <StickyCta
        text={audience === "drivers"
          ? (en ? "Find a garage near you and book online, for free." : "Trouvez un garage près de chez vous et réservez en ligne, gratuitement.")
          : (en ? "Garago: online booking, calendar and confirmations for your shop." : "Garago : réservation en ligne, agenda et confirmations pour votre garage.")}
        primary={video.cta}
        secondary={video.related.href.includes("guide") || video.related.href.includes("drivers") || video.related.href.includes("conducteurs")
          ? { label: en ? "The guide" : "Le guide", href: video.related.href }
          : { label: en ? "Pricing" : "Tarifs", href: video.related.href }}
      />
    </>
  );
}
