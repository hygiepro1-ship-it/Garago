"use client";

import AgendaWeekView, { type WeekAppointment, type WeekAvailability } from "@/components/AgendaWeekView";

const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const HOURS: WeekAvailability[] = [
  { dayOfWeek: 0, openTime: "08:00", closeTime: "17:00", isClosed: true },
  ...[1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, openTime: "08:00", closeTime: "17:00", isClosed: false })),
  { dayOfWeek: 6, openTime: "08:00", closeTime: "17:00", isClosed: true },
];

/**
 * Accueil, bloc garagistes : le vrai calendrier du tableau de bord, rempli avec
 * une semaine d'exemple (« Client A », « Client B »…). C'est le composant réel,
 * pas une image : il reste à jour quand l'agenda évolue. Non interactif et
 * ignoré des lecteurs d'écran.
 */
export default function HomeAgendaDemo({ lang }: { lang: string }) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7), 12);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return toDateStr(d); });

  const appt = (id: string, day: number, startTime: string, endTime: string, customerName: string, confirmationStatus: string): WeekAppointment =>
    ({ id, date: days[day], startTime, endTime, customerName, status: "CONFIRMED", confirmationStatus });
  // Noms d'exemple : aucun vrai client.
  const sample: WeekAppointment[] = [
    appt("1", 0, "08:00", "09:00", "Client A", "CONFIRMED"),
    appt("2", 0, "10:30", "11:30", "Client B", "CONFIRMED"),
    appt("3", 1, "09:00", "10:00", "Client C", "CONFIRMED"),
    appt("4", 1, "13:00", "14:30", "Client D", "AWAITING"),
    appt("5", 2, "08:30", "09:30", "Client E", "NO_RESPONSE"),
    appt("6", 2, "11:00", "12:00", "Client F", "CONFIRMED"),
    appt("7", 3, "08:00", "09:00", "Client G", "AWAITING"),
    appt("8", 3, "14:00", "15:30", "Client H", "CONFIRMED"),
    appt("9", 4, "09:30", "10:30", "Client I", "CONFIRMED"),
    appt("10", 4, "15:00", "16:00", "Client J", "AWAITING"),
  ];

  return (
    <figure className="hidden sm:block m-0">
      <div aria-hidden="true" style={{ pointerEvents: "none", userSelect: "none" }}>
        <AgendaWeekView days={days} appointments={sample} availability={HOURS} capacity={1} lang={lang} rowHeight={18}
          onPickSlot={() => {}} onPickAppointment={() => {}} />
      </div>
    </figure>
  );
}
