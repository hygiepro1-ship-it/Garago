// Garages du projet pilote. Seuls ceux-ci apparaissent dans l'onglet « Projet pilote »
// de l'administration et dans ses statistiques. On n'y ajoute un garage que sur
// décision explicite : un garage qui saisit des rendez-vous n'en fait pas partie d'office.

export const PILOT_GARAGE_SLUGS: string[] = [
  "garage-mecanique-m-vidal",
];

export function isPilotGarage(slug: string | null | undefined): boolean {
  return !!slug && PILOT_GARAGE_SLUGS.includes(slug);
}
