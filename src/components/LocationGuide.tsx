"use client";

import { useState } from "react";

type Platform = "ios" | "android";

interface Step { text: string; image?: string }

// Les images sont de vraies captures d'écran à déposer dans public/guide-localisation/ ;
// tant qu'un fichier n'existe pas, l'étape s'affiche simplement sans image.
const STEPS: Record<Platform, Step[]> = {
  ios: [
    { text: "Ouvrez Réglages › Confidentialité et sécurité › Service de localisation et vérifiez qu'il est activé.", image: "/guide-localisation/ios-1.jpg" },
    { text: "Descendez et touchez « Sites web de Safari ».", image: "/guide-localisation/ios-2.jpg" },
    { text: "Choisissez « Lors de l'utilisation de l'app ou des widgets » et activez « Position précise ».", image: "/guide-localisation/ios-3.jpg" },
    { text: "Revenez sur Garago et touchez « Actualiser ma position ». La précision doit afficher quelques mètres.", image: "/guide-localisation/ios-4.jpg" },
  ],
  android: [
    { text: "Ouvrez Réglages › Position et vérifiez qu'elle est activée.", image: "/guide-localisation/android-1.jpg" },
    { text: "Réglages › Applications › Chrome › Autorisations › Position : choisissez « Autoriser » et activez « Utiliser la position précise ».", image: "/guide-localisation/android-2.jpg" },
    { text: "Dans Chrome, touchez le cadenas à côté de l'adresse › Autorisations › Position › Autoriser.", image: "/guide-localisation/android-3.jpg" },
    { text: "Revenez sur Garago et touchez « Actualiser ma position ».", image: "/guide-localisation/android-4.jpg" },
  ],
};

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "ios";
  return /android/i.test(navigator.userAgent) ? "android" : "ios";
}

export default function LocationGuide({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("ios");

  function show() {
    setPlatform(detectPlatform());
    setOpen(true);
  }

  return (
    <>
      <button type="button" onClick={show} className={`font-bold underline ${className}`} style={{ color: "#0b1f3a" }}>
        Guide localisation
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(11,31,58,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h3 className="font-bold text-gray-900">Activer la localisation précise</h3>
              <button onClick={() => setOpen(false)} aria-label="Fermer"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 font-bold text-lg">×</button>
            </div>

            <div className="px-5 pt-4 flex gap-2">
              {(["ios", "android"] as Platform[]).map((p) => (
                <button key={p} onClick={() => setPlatform(p)}
                  className="px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors"
                  style={platform === p
                    ? { background: "#0b1f3a", color: "#fff", borderColor: "#0b1f3a" }
                    : { background: "#fff", color: "#0b1f3a", borderColor: "#e2e8f0" }}>
                  {p === "ios" ? "iPhone" : "Android"}
                </button>
              ))}
            </div>

            <ol className="overflow-y-auto px-5 py-4 space-y-5">
              {STEPS[platform].map((step, i) => (
                <li key={`${platform}-${i}`} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-white" style={{ background: "#f97316" }}>{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 leading-relaxed">{step.text}</p>
                    {step.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={step.image} alt={`Étape ${i + 1}`} loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        className="mt-2 rounded-xl border border-gray-200 max-h-80 w-auto max-w-full" />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
