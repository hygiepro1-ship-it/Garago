// Fiche Google Business Profile de Garago.
//
// GOOGLE_REVIEW_URL : lien direct pour laisser un avis sur Google (fourni par la fiche, bouton « Demander des avis »).
// GOOGLE_PLACE_ID : identifiant de la fiche, à renseigner pour afficher plus tard les avis Google sur le site
// (API Places, « Place Details » avec le champ reviews, appelée côté serveur avec une clé restreinte).
// Les règles de Google interdisent de récompenser un avis ou de ne le demander qu'aux clients satisfaits :
// on le demande à tous, sans contrepartie.

export const GOOGLE_REVIEW_URL = "https://g.page/r/Cf9X0C3Mdh_UEBM/review";

/** À remplir quand on affichera les avis Google sur le site (ex. « ChIJ… »). */
export const GOOGLE_PLACE_ID: string | null = null;
