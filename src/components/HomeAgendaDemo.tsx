"use client";

import AgendaWeekView, { type WeekAppointment, type WeekAvailability } from "@/components/AgendaWeekView";

const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const HOURS: WeekAvailability[] = [
  { dayOfWeek: 0, openTime: "08:00", closeTime: "17:00", isClosed: true },
  ...[1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, openTime: "08:00", closeTime: "17:00", isClosed: false })),
  { dayOfWeek: 6, openTime: "08:00", closeTime: "17:00", isClosed: true },
];

/**
 * Le vrai calendrier du tableau de bord, rempli avec une semaine d'exemple
 * (« Client A », « Client B »…). C'est le composant réel, pas une image : il
 * reste à jour quand l'agenda évolue. Non interactif et ignoré des lecteurs
 * d'écran. `mobile` affiche aussi, sur téléphone, la liste par jour que le
 * garagiste voit sur le sien (deux jours seulement, pour rester court).
 */
export default function HomeAgendaDemo({ lang, mobile = false }: { lang: string; mobile?: boolean }) {
  const fr = lang === "fr";
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7), 12);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return toDateStr(d); });

  const tires = fr ? "Pneus d'hiver" : "Winter tires";
  const oil = fr ? "Vidange d'huile" : "Oil change";
  const brakes = fr ? "Freins" : "Brakes";
  const appt = (id: string, day: number, startTime: string, endTime: string, customerName: string, confirmationStatus: string, serviceName: string): WeekAppointment =>
    ({ id, date: days[day], startTime, endTime, customerName, status: "CONFIRMED", confirmationStatus, serviceName });
  // Noms d'exemple : aucun vrai client.
  const sample: WeekAppointment[] = [
    appt("1", 0, "08:00", "09:00", "Client A", "CONFIRMED", tires),
    appt("2", 0, "10:30", "11:30", "Client B", "CONFIRMED", oil),
    appt("3", 1, "09:00", "10:00", "Client C", "CONFIRMED", tires),
    appt("4", 1, "13:00", "14:30", "Client D", "AWAITING", brakes),
    appt("5", 2, "08:30", "09:30", "Client E", "NO_RESPONSE", tires),
    appt("6", 2, "11:00", "12:00", "Client F", "CONFIRMED", oil),
    appt("7", 3, "08:00", "09:00", "Client G", "AWAITING", tires),
    appt("8", 3, "14:00", "15:30", "Client H", "CONFIRMED", brakes),
    appt("9", 4, "09:30", "10:30", "Client I", "CONFIRMED", tires),
    appt("10", 4, "15:00", "16:00", "Client J", "AWAITING", oil),
  ];

  // Téléphone : deux jours ouvrables consécutifs, toujours remplis quel que soit le jour de la visite.
  const phoneDays = [days[1], days[2]];
  const frozen = { pointerEvents: "none", userSelect: "none" } as const;

  return (
    <figure className={mobile ? "m-0" : "hidden sm:block m-0"}>
      {mobile && (
        <div className="sm:hidden" aria-hidden="true" style={frozen}>
          <AgendaWeekView days={phoneDays} appointments={sample} availability={HOURS} capacity={1} lang={lang}
            onPickSlot={() => {}} onPickAppointment={() => {}} />
        </div>
      )}
      <div className="hidden sm:block" aria-hidden="true" style={frozen}>
        <AgendaWeekView days={days} appointments={sample} availability={HOURS} capacity={1} lang={lang} rowHeight={18}
          onPickSlot={() => {}} onPickAppointment={() => {}} />
      </div>
    </figure>
  );
}
