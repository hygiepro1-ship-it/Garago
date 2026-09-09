"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f8fafc" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ textAlign: "center", maxWidth: 380 }}>
            <div style={{ margin: "0 auto 24px", width: 64, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.1)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: "#0b1f3a" }}>Une erreur est survenue</h1>
            <p style={{ fontSize: 14, marginBottom: 32, color: "#94a3b8" }}>
              Quelque chose s&apos;est mal passé. Veuillez réessayer.
            </p>
            <button onClick={reset} style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14,
              color: "#fff", background: "#f97316", border: "none", cursor: "pointer",
            }}>
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
