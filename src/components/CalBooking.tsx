"use client";

import { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

interface CalBookingProps {
  calLink: string; // ex: "mon-garage/rdv"
}

/**
 * Inline Cal.com booking embed — couleurs adaptées au thème du site.
 * Le garage configure son lien dans son tableau de bord (Profil → Lien Cal.com).
 */
export default function CalBooking({ calLink }: CalBookingProps) {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "rdv" });
      cal("ui", {
        theme: "light",
        styles: {
          branding: { brandColor: "#f97316" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Prendre rendez-vous</p>
        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
          <span>📅</span> Sélectionnez une date et un créneau disponible
        </p>
      </div>

      {/* Cal embed */}
      <div
        data-cal-namespace="rdv"
        data-cal-link={calLink}
        data-cal-config='{"layout":"month_view"}'
        style={{ width: "100%", minHeight: 480, overflow: "hidden" }}
      />
    </div>
  );
}
