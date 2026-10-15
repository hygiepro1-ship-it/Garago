import Link from "next/link";

interface CtaLink { label: string; href: string }

/**
 * Barre fixée en bas de l'écran sur les guides : le lien vers Garago reste visible
 * pendant toute la lecture. Un espace de même hauteur évite qu'elle cache le pied de page.
 */
export default function StickyCta({ text, primary, secondary }: { text: string; primary: CtaLink; secondary?: CtaLink }) {
  return (
    <>
      <div aria-hidden="true" className="h-20 sm:h-16" />
      <aside
        aria-label={text}
        className="fixed inset-x-0 bottom-0 z-40 border-t"
        style={{ background: "rgba(11,31,58,0.97)", borderColor: "rgba(255,255,255,0.12)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <p className="hidden sm:block flex-1 min-w-0 text-sm font-semibold text-white">{text}</p>
          <div className="flex flex-1 sm:flex-none gap-2">
            {secondary && (
              <Link href={secondary.href}
                className="flex-1 sm:flex-none inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl text-sm font-bold text-white border border-white/40">
                {secondary.label}
              </Link>
            )}
            <Link href={primary.href}
              className="flex-1 sm:flex-none inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl text-sm font-bold text-white" style={{ background: "#e0600c" }}>
              {primary.label}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
