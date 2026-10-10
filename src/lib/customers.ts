// Carnet de clients d'un garage. Chaque rendez-vous saisi par le garage y laisse
// (ou met à jour) la fiche du client ; quand le garage retape son nom des mois
// plus tard, ses coordonnées et ses véhicules reviennent d'eux-mêmes.
//
// Un client est reconnu par son téléphone ET son nom : deux personnes d'un même
// foyer qui partagent un numéro gardent chacune leur fiche.

import { prisma } from "@/lib/prisma";
import { cleanText } from "@/lib/abuse";

/** Nom en minuscules, sans accents ni espaces superflus — clé de recherche. */
export function nameKey(raw: unknown): string {
  return cleanText(raw, 80).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Chiffres du téléphone (les 10 derniers : « 1 514… » et « 514… » sont le même client). */
export function phoneKey(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string | null;
  language: string;
  /** Moyen choisi pour ce rendez-vous ; null = le client ne veut aucun message. */
  contactChannel: "SMS" | "EMAIL" | null;
}

/**
 * Enregistre le client d'un rendez-vous saisi par le garage et retourne l'id de
 * sa fiche. `customerId` = la fiche que le garage a choisie dans les suggestions :
 * elle est alors mise à jour (nouveau numéro, nouveau courriel…).
 */
export async function rememberCustomer(garageId: string, input: CustomerInput, customerId?: string | null): Promise<string> {
  const name = cleanText(input.name, 80);
  const phone = cleanText(input.phone, 30);
  const fields = {
    name, nameKey: nameKey(name),
    phone, phoneKey: phoneKey(phone),
    // Un courriel laissé vide cette fois-ci n'efface pas celui déjà connu.
    ...(input.email ? { email: String(input.email).toLowerCase() } : {}),
    language: input.language === "en" ? "en" : "fr",
    contactChannel: input.contactChannel ?? "NONE",
  };

  if (customerId) {
    try {
      const updated = await prisma.customer.updateMany({ where: { id: customerId, garageId }, data: fields });
      if (updated.count > 0) return customerId;
    } catch {
      // Nom et téléphone désormais identiques à une autre fiche : on retombe sur celle-là.
    }
  }

  const customer = await prisma.customer.upsert({
    where: { garageId_phoneKey_nameKey: { garageId, phoneKey: fields.phoneKey, nameKey: fields.nameKey } },
    create: { garageId, ...fields },
    update: fields,
  });
  return customer.id;
}

/**
 * Rattache à une fiche client les rendez-vous qui n'en ont pas encore : ceux
 * d'avant le carnet de clients, et les réservations faites en ligne. Ne coûte
 * qu'une requête quand il n'y a rien à faire.
 */
export async function linkOrphanAppointments(garageId: string): Promise<void> {
  for (let pass = 0; pass < 5; pass++) {
    // Du plus récent au plus ancien : ce sont les coordonnées les plus récentes qui font la fiche.
    const orphans = await prisma.appointment.findMany({
      where: { garageId, customerId: null },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 500,
      select: { id: true, customerName: true, customerPhone: true, customerEmail: true, language: true, contactChannel: true, source: true },
    });
    if (orphans.length === 0) return;

    const groups = new Map<string, { name: string; nameKey: string; phone: string; phoneKey: string; email: string | null; language: string; contactChannel: string | null; ids: string[] }>();
    for (const a of orphans) {
      const nk = nameKey(a.customerName);
      const pk = phoneKey(a.customerPhone);
      const key = `${pk}|${nk}`;
      const group = groups.get(key);
      if (group) {
        group.ids.push(a.id);
        group.email ??= a.customerEmail;
      } else {
        groups.set(key, {
          name: cleanText(a.customerName, 80), nameKey: nk,
          phone: cleanText(a.customerPhone, 30), phoneKey: pk,
          email: a.customerEmail,
          language: a.language === "en" ? "en" : "fr",
          // Une réservation en ligne ne dit rien du moyen préféré du client.
          contactChannel: a.source === "MANUAL" ? (a.contactChannel ?? "NONE") : null,
          ids: [a.id],
        });
      }
    }

    await prisma.customer.createMany({
      data: [...groups.values()].map((g) => ({
        garageId, name: g.name, nameKey: g.nameKey, phone: g.phone, phoneKey: g.phoneKey,
        email: g.email, language: g.language, contactChannel: g.contactChannel,
      })),
      skipDuplicates: true,
    });
    const customers = await prisma.customer.findMany({
      where: { garageId, phoneKey: { in: [...new Set([...groups.values()].map((g) => g.phoneKey))] } },
      select: { id: true, phoneKey: true, nameKey: true },
    });
    const idOf = new Map(customers.map((c) => [`${c.phoneKey}|${c.nameKey}`, c.id]));

    const updates = [...groups.entries()].flatMap(([key, g]) => {
      const customerId = idOf.get(key);
      return customerId ? [prisma.appointment.updateMany({ where: { id: { in: g.ids } }, data: { customerId } })] : [];
    });
    if (updates.length === 0) return;
    await prisma.$transaction(updates);
  }
}

export interface CustomerMatch {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  language: string;
  contactChannel: string | null;
  visits: number;
  lastDate: string | null;
  lastService: string | null;
  /** Véhicules déjà vus au garage, du plus récent au plus ancien. */
  vehicles: { year: number | null; make: string | null; model: string | null }[];
}

// Ce qu'on lit d'un client pour l'afficher : ses derniers rendez-vous donnent ses véhicules et sa dernière visite.
const MATCH_INCLUDE = {
  _count: { select: { appointments: true } },
  appointments: {
    where: { status: { not: "CANCELLED" } },
    orderBy: [{ date: "desc" as const }, { startTime: "desc" as const }],
    take: 12,
    select: { date: true, serviceName: true, vehicleYear: true, vehicleMake: true, vehicleModel: true },
  },
};

function toMatch(c: {
  id: string; name: string; phone: string; email: string | null; language: string; contactChannel: string | null;
  _count: { appointments: number };
  appointments: { date: string; serviceName: string | null; vehicleYear: number | null; vehicleMake: string | null; vehicleModel: string | null }[];
}): CustomerMatch {
  const seen = new Set<string>();
  const vehicles: CustomerMatch["vehicles"] = [];
  for (const a of c.appointments) {
    if (!a.vehicleMake && !a.vehicleModel) continue;
    const key = `${a.vehicleYear ?? ""}|${a.vehicleMake ?? ""}|${a.vehicleModel ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    vehicles.push({ year: a.vehicleYear, make: a.vehicleMake, model: a.vehicleModel });
  }
  return {
    id: c.id, name: c.name, phone: c.phone, email: c.email,
    language: c.language, contactChannel: c.contactChannel,
    visits: c._count.appointments,
    lastDate: c.appointments[0]?.date ?? null,
    lastService: c.appointments[0]?.serviceName ?? null,
    vehicles,
  };
}

/** Clients du garage dont le nom (ou le téléphone) contient ce que le garage est en train de taper. */
export async function searchCustomers(garageId: string, query: string, limit = 6): Promise<CustomerMatch[]> {
  const nk = nameKey(query);
  if (nk.length < 2) return [];
  const digits = query.replace(/\D/g, "");

  const customers = await prisma.customer.findMany({
    where: {
      garageId,
      OR: [{ nameKey: { contains: nk } }, ...(digits.length >= 3 ? [{ phoneKey: { contains: digits } }] : [])],
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: MATCH_INCLUDE,
  });

  // Les noms qui commencent par ce qui est tapé (le prénom) passent devant.
  const rank = (key: string) => (key.startsWith(nk) ? 0 : key.includes(` ${nk}`) ? 1 : 2);
  return customers
    .sort((a, b) => rank(a.nameKey) - rank(b.nameKey))
    .slice(0, limit)
    .map(toMatch);
}

export interface CustomerPage { customers: CustomerMatch[]; total: number; page: number; pageSize: number }

/** Page du carnet de clients d'un garage, par ordre alphabétique, filtrée par nom, téléphone ou courriel. */
export async function listCustomers(garageId: string, query: string, page: number, pageSize = 25): Promise<CustomerPage> {
  const nk = nameKey(query);
  const digits = query.replace(/\D/g, "");
  const where = {
    garageId,
    ...(nk.length > 0 ? {
      OR: [
        { nameKey: { contains: nk } },
        { email: { contains: query.trim().toLowerCase() } },
        ...(digits.length >= 3 ? [{ phoneKey: { contains: digits } }] : []),
      ],
    } : {}),
  };
  const total = await prisma.customer.count({ where });
  const current = Math.min(Math.max(1, Math.floor(page) || 1), Math.max(1, Math.ceil(total / pageSize)));
  const customers = await prisma.customer.findMany({
    where,
    orderBy: [{ nameKey: "asc" }, { id: "asc" }],
    skip: (current - 1) * pageSize,
    take: pageSize,
    include: MATCH_INCLUDE,
  });
  return { customers: customers.map(toMatch), total, page: current, pageSize };
}

export interface CustomerEdit { name: string; phone: string; email: string | null; language: string; contactChannel: "SMS" | "EMAIL" | "NONE" }

/**
 * Corrige la fiche d'un client depuis le carnet. Ses rendez-vous à venir suivent (nom, téléphone,
 * courriel, langue), pour que la demande de confirmation parte aux bonnes coordonnées ; les
 * rendez-vous passés gardent ce qui avait été saisi. Retourne false si la fiche n'est pas à ce
 * garage ; lève l'erreur Prisma P2002 si une autre fiche porte déjà ce nom et ce numéro.
 */
export async function updateCustomer(garageId: string, customerId: string, edit: CustomerEdit, today: string): Promise<boolean> {
  const fields = {
    name: edit.name, nameKey: nameKey(edit.name),
    phone: edit.phone, phoneKey: phoneKey(edit.phone),
    email: edit.email,
    language: edit.language === "en" ? "en" : "fr",
    contactChannel: edit.contactChannel,
  };
  const updated = await prisma.customer.updateMany({ where: { id: customerId, garageId }, data: fields });
  if (updated.count === 0) return false;
  await prisma.appointment.updateMany({
    where: { customerId, garageId, date: { gte: today }, status: { in: ["PENDING", "CONFIRMED"] } },
    data: { customerName: fields.name, customerPhone: fields.phone, customerEmail: fields.email, language: fields.language },
  });
  return true;
}
