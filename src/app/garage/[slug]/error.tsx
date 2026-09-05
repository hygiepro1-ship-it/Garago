"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GarageProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GarageProfile] Error:", error);
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ background: "#fff7ed" }}>
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Une erreur s'est produite</h1>
      <p className="text-gray-500 mb-2 text-sm">{error?.message || "Erreur inconnue"}</p>
      {error?.digest && (
        <p className="text-gray-400 text-xs mb-6 font-mono">ID: {error.digest}</p>
      )}
      <div className="flex justify-center gap-3 flex-wrap">
        <button
          onClick={reset}
          className="text-white px-5 py-2 rounded-xl font-semibold text-sm"
          style={{ background: "#f97316" }}
        >
          Réessayer
        </button>
        <Link
          href="/rechercher"
          className="border border-gray-300 text-gray-700 px-5 py-2 rounded-xl font-semibold text-sm hover:bg-gray-50"
        >
          ← Retour à la recherche
        </Link>
      </div>
    </div>
  );
}
