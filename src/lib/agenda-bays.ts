import type { WeekAppointment } from "@/components/AgendaWeekView";

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

/**
 * Range chaque rendez-vous dans la colonne de son poste. Ceux qui n'ont pas de poste
 * attribué (anciens rendez-vous), ou dont le poste est déjà pris à cette heure, vont
 * sur le premier poste libre, dans l'ordre des heures ; au besoin, une colonne « en surplus ».
 */
export function assignPosts(appts: WeekAppointment[], capacity: number): WeekAppointment[][] {
  const posts: WeekAppointment[][] = Array.from({ length: Math.max(1, capacity) }, () => []);
  const fits = (post: WeekAppointment[], a: WeekAppointment) => post.every((x) => toMin(x.endTime) <= toMin(a.startTime) || toMin(x.startTime) >= toMin(a.endTime));
  const sorted = [...appts].sort((x, y) => x.startTime.localeCompare(y.startTime) || x.endTime.localeCompare(y.endTime));
  const floating: WeekAppointment[] = [];
  for (const appt of sorted) {
    const own = appt.bay && appt.bay >= 1 && appt.bay <= posts.length ? posts[appt.bay - 1] : null;
    if (own && fits(own, appt)) own.push(appt); else floating.push(appt);
  }
  for (const appt of floating) {
    const post = posts.find((p) => fits(p, appt));
    if (post) post.push(appt); else posts.push([appt]);
  }
  return posts.map((p) => p.sort((x, y) => x.startTime.localeCompare(y.startTime)));
}
