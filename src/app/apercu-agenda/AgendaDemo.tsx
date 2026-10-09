"use client";

import { useMemo, useState } from "react";
import GarageAgenda, { type AgendaAppointment } from "@/components/GarageAgenda";
import GarageCustomers from "@/components/GarageCustomers";
import type { CustomerMatch, CustomerPage } from "@/lib/customers";

const NAMES = ["Tremblay", "Gagnon", "Roy", "Côté", "Bouchard", "Gauthier", "Morin", "Lavoie", "Fortin", "Gagné", "Ouellet", "Pelletier", "Bélanger", "Lévesque", "Bergeron", "Leblanc", "Paquette", "Girard", "Simard", "Boucher", "Caron", "Beaulieu", "Cloutier", "Dubé", "Poirier", "Fournier", "Lapointe", "Nguyen", "Diallo", "Haddad"];
const FIRST = ["Marc", "Julie", "Sylvie", "Alain", "Luc", "Patrick", "Chantal", "Nadia", "Denis", "Émilie"];
const JOBS: [string, number][] = [["Changement de pneus", 30], ["Changement de pneus", 30], ["Changement de pneus", 60], ["Pneus + alignement", 60], ["Vidange", 30], ["Freins avant", 90], ["Diagnostic", 60], ["Freins complets", 120]];

const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toHHMM = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

// Lundi au vendredi 8 h à 17 h, samedi 8 h à 12 h, fermé le dimanche.
const AVAILABILITY = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, openTime: "08:00", closeTime: d === 6 ? "12:00" : "17:00", isClosed: d === 0 }));

/** Trois semaines de rendez-vous fictifs (la semaine en cours et les deux suivantes), toujours les mêmes. */
function fakeAppointments(posts: number): AgendaAppointment[] {
  let seed = 20261012;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];

  const monday = new Date();
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const today = toDateStr(new Date());

  const out: AgendaAppointment[] = [];
  for (let i = 0; i < 21; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const hours = AVAILABILITY[day.getDay()];
    if (hours.isClosed) continue;
    const date = toDateStr(day);
    const close = Number(hours.closeTime.slice(0, 2)) * 60;
    // De plus en plus calme à mesure qu'on s'éloigne : les semaines à venir se remplissent encore.
    const busy = [0.42, 0.5, 0.36, 0.46, 0.58, 0.72][day.getDay() - 1] * (i < 7 ? 1 : i < 14 ? 0.7 : 0.35);
    for (let post = 0; post < posts; post++) {
      let m = 8 * 60;
      while (m < close) {
        if (rnd() > busy) { m += 30; continue; }
        const [serviceName, length] = pick(JOBS);
        const end = Math.min(m + length, close);
        const r = rnd();
        const past = date < today;
        out.push({
          id: `demo-${out.length}`,
          customerName: `${pick(FIRST)} ${pick(NAMES)}`,
          customerPhone: `514-555-01${pad(Math.floor(rnd() * 100))}`,
          serviceName, date, startTime: toHHMM(m), endTime: toHHMM(end),
          status: past ? (r < 0.93 ? "COMPLETED" : "NO_SHOW") : "CONFIRMED",
          source: "MANUAL", confirmTier: "MANUAL", contactChannel: "SMS", language: "fr",
          confirmationStatus: past || r < 0.55 ? "CONFIRMED" : r < 0.8 ? "SCHEDULED" : r < 0.985 ? "AWAITING" : "NO_RESPONSE",
          confirmedVia: "LINK",
        });
        m = end;
      }
    }
  }
  return out;
}

// Carnet de clients fictif, gardé en mémoire le temps de l'aperçu.
const CARS: [number, string, string][] = [[2019, "Honda", "Civic"], [2021, "Toyota", "RAV4"], [2017, "Ford", "F-150"], [2020, "Hyundai", "Elantra"], [2015, "Mazda", "3"], [2022, "Subaru", "Outback"]];
const DEMO_CUSTOMERS: CustomerMatch[] = Array.from({ length: 64 }, (_, i) => {
  const first = FIRST[(i * 7) % FIRST.length], last = NAMES[(i * 11) % NAMES.length];
  const car = CARS[i % CARS.length];
  const plain = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return {
    id: `demo-client-${i}`, name: `${first} ${last}`, phone: `(514) 555-01${pad(i)}`,
    email: i % 4 === 3 ? null : `${plain(first)}.${plain(last)}@${["gmail.com", "hotmail.com", "videotron.ca"][i % 3]}`,
    language: i % 9 === 0 ? "en" : "fr", contactChannel: i % 5 === 0 ? "EMAIL" : i % 13 === 0 ? "NONE" : "SMS",
    visits: 1 + (i % 6), lastDate: `2026-0${1 + (i % 9)}-${pad(1 + (i % 27))}`, lastService: "Changement de pneus",
    vehicles: i % 8 === 0 ? [] : i % 6 === 0 ? [{ year: car[0], make: car[1], model: car[2] }, { year: 2012, make: "Kia", model: "Rio" }] : [{ year: car[0], make: car[1], model: car[2] }],
  };
}).sort((a, b) => a.name.localeCompare(b.name, "fr"));

async function demoFetchPage(q: string, page: number): Promise<CustomerPage> {
  const needle = q.toLowerCase();
  const found = DEMO_CUSTOMERS.filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.phone.includes(needle) || (c.email ?? "").includes(needle));
  return { customers: found.slice((page - 1) * 25, page * 25), total: found.length, page, pageSize: 25 };
}

async function demoSave(edit: { id: string; name: string; phone: string; email: string; language: string; contactChannel: string }): Promise<string | null> {
  const c = DEMO_CUSTOMERS.find((x) => x.id === edit.id);
  if (c) Object.assign(c, { name: edit.name, phone: edit.phone, email: edit.email || null, language: edit.language, contactChannel: edit.contactChannel || "NONE" });
  return null;
}

export default function AgendaDemo() {
  const [posts, setPosts] = useState(8);
  const appointments = useMemo(() => fakeAppointments(posts), [posts]);
  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
      <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a" }}>
        <p className="font-bold">Aperçu avec des rendez-vous fictifs</p>
        <p>Rien n&apos;est enregistré ici : le bouton « Enregistrer » du formulaire ne fonctionne pas dans cet aperçu.</p>
        <label className="flex items-center gap-2 mt-2 font-semibold" htmlFor="demo-posts">
          Nombre de postes du garage
          <input id="demo-posts" type="number" inputMode="numeric" min={1} max={50} value={posts}
            onChange={(e) => setPosts(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            className="w-20 border border-blue-200 rounded-lg px-2 py-1 bg-white text-gray-900" />
        </label>
      </div>
      <GarageAgenda
        appointments={appointments}
        services={[]}
        availability={AVAILABILITY}
        capacity={posts}
        blocked={[]}
        lang="fr"
        onReload={() => {}}
      />
      <hr className="border-gray-200" />
      <GarageCustomers fetchPage={demoFetchPage} save={demoSave} />
    </div>
  );
}
