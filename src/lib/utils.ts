import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export function formatPriceRange(min?: number | null, max?: number | null): string {
  if (!min && !max) return "Prix sur demande";
  if (min && max) {
    if (min === max) return `${min} $`;
    return `${min} $ – ${max} $`;
  }
  if (min) return `À partir de ${min} $`;
  if (max) return `Jusqu'à ${max} $`;
  return "Prix sur demande";
}

export function ratingToStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(diff / 2592000000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours} h`;
  if (days < 30) return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  return `Il y a ${months} mois`;
}

export function getDayName(dayOfWeek: number): string {
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  return days[dayOfWeek] ?? "";
}
