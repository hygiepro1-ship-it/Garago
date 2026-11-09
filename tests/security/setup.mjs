// Chargé avant chaque test de sécurité : aucune connexion possible à la vraie base.
// Les tests n'ont pas besoin de base ; si l'un d'eux en touchait une par erreur,
// il échouerait sur cette adresse inexistante au lieu d'écrire en production.
process.env.DATABASE_URL = "postgresql://tests@127.0.0.1:1/aucune_base";
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.NEXTAUTH_SECRET = "secret-de-test-uniquement";
