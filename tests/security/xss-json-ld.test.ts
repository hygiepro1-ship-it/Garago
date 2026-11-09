// Injection de script (XSS) par les données structurées JSON-LD : le nom ou la description d'un garage
// est écrit dans une balise <script> de sa fiche. Un nom comme « </script><script>… » fermerait la balise
// et exécuterait du code chez le visiteur — y compris l'admin qui ouvre une fiche en attente de vérification.
import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonLdHtml } from "@/components/JsonLd";

const piege = { "@type": "AutoRepair", name: "</script><script>alert(document.cookie)</script>", description: "<!-- x" };

test("un texte saisi par un garage ne peut pas fermer la balise <script>", () => {
  const html = jsonLdHtml(piege);
  assert.doesNotMatch(html, /</, "un « < » brut reste dans le JSON-LD");
});

test("les données restent intactes pour Google une fois lues", () => {
  assert.deepEqual(JSON.parse(jsonLdHtml(piege)), piege);
});
