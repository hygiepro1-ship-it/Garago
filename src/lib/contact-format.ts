// Aide à la saisie des coordonnées d'un client (formulaire de rendez-vous du garage) :
// un seul format de téléphone, et des fins d'adresse courriel proposées, pour limiter
// les fautes de frappe qui empêchent ensuite de joindre le client.

/** Téléphone mis en forme au fil de la frappe : « (514) 555-0123 ». Tout ce qui n'est pas un chiffre est ignoré. */
export function formatPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("1")) d = d.slice(1); // indicatif « 1 » devant le numéro : aucun indicatif régional ne commence par 1
  d = d.slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Le seul format accepté : (000) 000-0000. */
export const PHONE_PATTERN = "\\(\\d{3}\\) \\d{3}-\\d{4}";
export const isFormattedPhone = (value: string) => new RegExp(`^${PHONE_PATTERN}$`).test(value);

/** Boîtes courriel courantes au Québec, les plus fréquentes d'abord. */
export const EMAIL_DOMAINS = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.ca", "videotron.ca", "icloud.com", "hotmail.ca",
  "yahoo.com", "live.ca", "outlook.fr", "hotmail.fr", "yahoo.fr", "live.com", "sympatico.ca", "bell.net",
  "msn.com", "me.com", "cogeco.ca", "telus.net", "rogers.com", "protonmail.com", "aol.com",
];

/** Adresses complètes à proposer pour ce qui est déjà tapé (« marc@g » → « marc@gmail.com »). */
export function emailSuggestions(value: string, max = 8): string[] {
  const [local, domain, ...rest] = value.trim().split("@");
  if (!local || rest.length > 0) return [];
  const typed = (domain ?? "").toLowerCase();
  return EMAIL_DOMAINS
    .filter((d) => d.startsWith(typed) && d !== typed)
    .slice(0, max)
    .map((d) => `${local}@${d}`);
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = keep;
    }
  }
  return row[b.length];
}

/** Faute de frappe probable dans la fin de l'adresse (« gmial.com ») : l'adresse corrigée, sinon null. */
export function emailTypoFix(value: string): string | null {
  const [local, domain, ...rest] = value.trim().split("@");
  if (!local || !domain || rest.length > 0 || !domain.includes(".")) return null;
  const typed = domain.toLowerCase();
  if (EMAIL_DOMAINS.includes(typed)) return null;
  const close = EMAIL_DOMAINS.find((d) => distance(typed, d) <= 2 && Math.abs(typed.length - d.length) <= 2 && typed[0] === d[0]);
  return close ? `${local}@${close}` : null;
}
