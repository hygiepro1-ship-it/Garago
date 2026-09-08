"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.1)" }}>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ color: "#0b1f3a" }}>Une erreur est survenue</h1>
        <p className="text-sm mb-8" style={{ color: "#94a3b8" }}>
          Quelque chose s'est mal passé. Veuillez réessayer.
        </p>
        <button onClick={reset} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-transform active:scale-[0.98]"
          style={{ background: "#f97316" }}>
          Réessayer
        </button>
      </div>
    </div>
  );
}
