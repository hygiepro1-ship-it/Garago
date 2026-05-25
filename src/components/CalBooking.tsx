"use client";

import { useEffect } from "react";

interface CalBookingProps {
  calLink: string; // ex: "mon-garage/rendez-vous" (chemin relatif Calendly)
}

/**
 * Embed Calendly inline — s'affiche sur le profil du garage.
 * Le lien est auto-rempli par le webhook quand le garagiste accepte l'invitation.
 */
export default function CalBooking({ calLink }: CalBookingProps) {
  // Charger le script Calendly une seule fois
  useEffect(() => {
    if (document.getElementById("calendly-script")) return;
    const script = document.createElement("script");
    script.id  = "calendly-script";
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const url = `https://calendly.com/${calLink}?hide_gdpr_banner=1&primary_color=f97316`;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
          Prendre rendez-vous
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>📅</span> Choisissez une date et un créneau disponible
        </p>
      </div>

      {/* Calendly inline widget */}
      <div
        className="calendly-inline-widget"
        data-url={url}
        style={{ minWidth: 280, height: 660 }}
      />
    </div>
  );
}
