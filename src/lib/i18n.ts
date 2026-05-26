/**
 * Traductions FR / EN — Garago
 * Toutes les chaînes de l'interface, organisées par section.
 */

export type Lang = "fr" | "en";

export const translations = {
  fr: {
    // ── Navigation ─────────────────────────────────────────────────────────
    nav: {
      autoService:   "Entretien auto",
      tires:         "Pneus",
      brakes:        "Freins",
      findGarage:    "Nos garages",
      registerGarage:"Inscrire mon garage",
      signIn:        "Connexion",
      signUp:        "S'inscrire",
      dashboard:     "Mon tableau de bord",
      signOut:       "Se déconnecter",
      signedInAs:    "Connecté en tant que",
    },

    // ── Pied de page ──────────────────────────────────────────────────────
    footer: {
      tagline:       "La plateforme canadienne qui connecte les conducteurs avec les meilleurs garages de leur région. Avis vérifiés, prix transparents, recherche par véhicule exact.",
      drivers:       "Conducteurs",
      garages:       "Garages",
      popularServices:"Services populaires",
      findGarage:    "Trouver un garage",
      oilChange:     "Vidange d'huile",
      winterTires:   "Pneus d'hiver",
      brakes:        "Freins",
      ac:            "Climatisation",
      diagnostic:    "Diagnostic",
      autoService:   "Entretien auto",
      tireChange:    "Changement de pneus",
      myAccount:     "Mon espace",
      registerFree:  "S'inscrire (30j gratuit)",
      pricing:       "Tarifs",
      dashboard:     "Tableau de bord",
      signIn:        "Connexion",
      madeWith:      "Fait avec ❤️ au Canada 🍁",
      privacy:       "Confidentialité",
      terms:         "CGU",
      rights:        "Tous droits réservés.",
    },

    // ── Agenda ────────────────────────────────────────────────────────────
    agenda: {
      title:           "Agenda",
      todayBtn:        "Auj.",
      today:           "Aujourd'hui",
      appointments:    "rendez-vous",
      cancelled_one:   "annulé",
      cancelled_many:  "annulés",
      noAppts:         "Aucun rendez-vous ce jour",
      noApptsSub:      "Profitez-en ou ajoutez un client ci-dessous.",
      cancelled:       "Annulés",
      loading:         "Chargement...",
      newAppt:         "+ Nouveau rendez-vous",
      // Statuts
      pending:         "En attente",
      confirmed:       "Confirmé",
      completed:       "Complété",
      cancelledStatus: "Annulé",
      sourceOnline:    "En ligne",
      // Formulaire
      formTitle:       "Nouveau RDV",
      client:          "Client",
      fullName:        "Nom complet *",
      phone:           "Téléphone *",
      email:           "Courriel (optionnel)",
      vehicle:         "Véhicule",
      year:            "Année",
      make:            "Marque",
      model:           "Modèle",
      serviceTime:     "Service & heure",
      servicePlaceholder: "Service (ex: Vidange, Freins…)",
      time:            "Heure *",
      notes:           "Notes internes (optionnel)",
      saveBtn:         "Confirmer le rendez-vous",
      saving:          "Sauvegarde…",
      // Actions
      confirm:         "✓ Confirmer",
      complete:        "✓ Complété",
      cancel:          "Annuler",
      backToDash:      "Tableau de bord",
      addToHome:       "Astuce : ouvrez ce lien sur votre téléphone et ajoutez-le à votre écran d'accueil.",
    },

    // ── Dashboard garage ──────────────────────────────────────────────────
    dash: {
      overview:        "Aperçu",
      services:        "Services",
      brands:          "Marques",
      hours:           "Horaires",
      profile:         "Profil",
      appointments:    "Rendez-vous",
      loading:         "Chargement…",
      noGarage:        "Aucun garage trouvé.",
      mobileAgenda:    "Agenda mobile",
      mobileAgendaSub: "Gérez vos rendez-vous depuis votre téléphone — ajoutez des clients en 10 secondes, confirmez ou annulez en un tap.",
      openAgenda:      "📅 Ouvrir l'agenda →",
      addToHome:       "Astuce : ouvrez ce lien sur votre téléphone et ajoutez-le à votre écran d'accueil.",
      save:            "Sauvegarder le profil",
      saving:          "Sauvegarde…",
    },

    // ── Auth ──────────────────────────────────────────────────────────────
    auth: {
      signIn:          "Connexion à Garago",
      signInSub:       "Accédez à votre espace conducteur ou garage",
      email:           "Adresse courriel",
      password:        "Mot de passe",
      emailPlaceholder:"vous@exemple.com",
      pwdPlaceholder:  "Votre mot de passe",
      signInBtn:       "Se connecter",
      signingIn:       "Connexion en cours…",
      invalidCreds:    "Courriel ou mot de passe invalide.",
      noAccount:       "Pas encore de compte ?",
      signUpDriver:    "S'inscrire comme conducteur",
      garageOwner:     "Propriétaire d'un garage ?",
      registerGarage:  "Inscrire mon garage",
    },

    // ── Commun ────────────────────────────────────────────────────────────
    common: {
      save:            "Sauvegarder",
      cancel:          "Annuler",
      loading:         "Chargement…",
      error:           "Une erreur est survenue.",
      close:           "Fermer",
      yes:             "Oui",
      no:              "Non",
    },
  },

  // ════════════════════════════════════════════════════════════════════════
  en: {
    // ── Navigation ─────────────────────────────────────────────────────────
    nav: {
      autoService:   "Auto Service",
      tires:         "Tires",
      brakes:        "Brakes",
      findGarage:    "Find a Garage",
      registerGarage:"Register my Garage",
      signIn:        "Sign In",
      signUp:        "Sign Up",
      dashboard:     "My Dashboard",
      signOut:       "Sign Out",
      signedInAs:    "Signed in as",
    },

    // ── Pied de page ──────────────────────────────────────────────────────
    footer: {
      tagline:       "The Canadian platform connecting drivers with the best garages in their area. Verified reviews, transparent pricing, search by exact vehicle.",
      drivers:       "Drivers",
      garages:       "Garages",
      popularServices:"Popular Services",
      findGarage:    "Find a Garage",
      oilChange:     "Oil Change",
      winterTires:   "Winter Tires",
      brakes:        "Brakes",
      ac:            "Air Conditioning",
      diagnostic:    "Diagnostics",
      autoService:   "Auto Service",
      tireChange:    "Tire Change",
      myAccount:     "My Account",
      registerFree:  "Register (30d free)",
      pricing:       "Pricing",
      dashboard:     "Dashboard",
      signIn:        "Sign In",
      madeWith:      "Made with ❤️ in Canada 🍁",
      privacy:       "Privacy",
      terms:         "Terms",
      rights:        "All rights reserved.",
    },

    // ── Agenda ────────────────────────────────────────────────────────────
    agenda: {
      title:           "Schedule",
      todayBtn:        "Today",
      today:           "Today",
      appointments:    "appointment(s)",
      cancelled_one:   "cancelled",
      cancelled_many:  "cancelled",
      noAppts:         "No appointments today",
      noApptsSub:      "Enjoy the break, or add a client below.",
      cancelled:       "Cancelled",
      loading:         "Loading…",
      newAppt:         "+ New Appointment",
      // Statuses
      pending:         "Pending",
      confirmed:       "Confirmed",
      completed:       "Completed",
      cancelledStatus: "Cancelled",
      sourceOnline:    "Online",
      // Form
      formTitle:       "New Appointment",
      client:          "Client",
      fullName:        "Full name *",
      phone:           "Phone *",
      email:           "Email (optional)",
      vehicle:         "Vehicle",
      year:            "Year",
      make:            "Make",
      model:           "Model",
      serviceTime:     "Service & time",
      servicePlaceholder: "Service (e.g. Oil Change, Brakes…)",
      time:            "Time *",
      notes:           "Internal notes (optional)",
      saveBtn:         "Confirm appointment",
      saving:          "Saving…",
      // Actions
      confirm:         "✓ Confirm",
      complete:        "✓ Complete",
      cancel:          "Cancel",
      backToDash:      "Dashboard",
      addToHome:       "Tip: open this link on your phone and add it to your home screen.",
    },

    // ── Dashboard garage ──────────────────────────────────────────────────
    dash: {
      overview:        "Overview",
      services:        "Services",
      brands:          "Brands",
      hours:           "Hours",
      profile:         "Profile",
      appointments:    "Appointments",
      loading:         "Loading…",
      noGarage:        "No garage found.",
      mobileAgenda:    "Mobile Schedule",
      mobileAgendaSub: "Manage appointments from your phone — add clients in 10 seconds, confirm or cancel in one tap.",
      openAgenda:      "📅 Open Schedule →",
      addToHome:       "Tip: open this link on your phone and add it to your home screen.",
      save:            "Save profile",
      saving:          "Saving…",
    },

    // ── Auth ──────────────────────────────────────────────────────────────
    auth: {
      signIn:          "Sign in to Garago",
      signInSub:       "Access your driver or garage account",
      email:           "Email address",
      password:        "Password",
      emailPlaceholder:"you@example.com",
      pwdPlaceholder:  "Your password",
      signInBtn:       "Sign in",
      signingIn:       "Signing in…",
      invalidCreds:    "Invalid email or password.",
      noAccount:       "Don't have an account?",
      signUpDriver:    "Sign up as a driver",
      garageOwner:     "Own a garage?",
      registerGarage:  "Register my garage",
    },

    // ── Commun ────────────────────────────────────────────────────────────
    common: {
      save:            "Save",
      cancel:          "Cancel",
      loading:         "Loading…",
      error:           "An error occurred.",
      close:           "Close",
      yes:             "Yes",
      no:              "No",
    },
  },
};

export type Translations = (typeof translations)[Lang];
