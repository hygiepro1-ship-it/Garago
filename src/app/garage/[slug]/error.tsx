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
      <div className="text-5xl mb-4">⚠️</div>
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
