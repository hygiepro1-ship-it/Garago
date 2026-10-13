import Link from "next/link";
import L from "@/components/L";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(249,115,22,0.1)" }}>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ color: "#0b1f3a" }}><L fr="Page introuvable" en="Page not found" /></h1>
        <p className="text-sm mb-8" style={{ color: "#94a3b8" }}>
          <L fr="La page que vous cherchez n'existe pas ou a été déplacée." en="The page you are looking for does not exist or has been moved." />
        </p>
        <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-transform active:scale-[0.98]"
          style={{ background: "#e0600c" }}>
          <L fr="Retour à l'accueil" en="Back to home" />
        </Link>
      </div>
    </div>
  );
}
