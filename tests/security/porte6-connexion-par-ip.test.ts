// Porte 6 — Limites : la connexion doit aussi être limitée par adresse IP.
// La limite par courriel (8 échecs en 15 minutes) n'arrête pas un robot qui essaie,
// depuis une même adresse, une liste de courriels et de mots de passe volés ailleurs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loginIpKey, loginIpFromHeaders, MAX_LOGIN_FAILURES_PER_IP } from "@/lib/auth";

test("une adresse IP a son propre compteur d'échecs de connexion", () => {
  assert.equal(loginIpKey("203.0.113.7"), "li:203.0.113.7");
});

test("le plafond par IP laisse passer un bureau partagé mais arrête un robot", () => {
  assert.ok(MAX_LOGIN_FAILURES_PER_IP >= 20, "trop bas : un garage avec plusieurs employés serait bloqué");
  assert.ok(MAX_LOGIN_FAILURES_PER_IP <= 50, "trop haut : un robot essaie encore des centaines de comptes par heure");
});

test("l'IP lue est la première de x-forwarded-for (celle que Vercel a vue)", () => {
  assert.equal(loginIpFromHeaders({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }), "203.0.113.7");
  assert.equal(loginIpFromHeaders({ "x-real-ip": "198.51.100.2" }), "198.51.100.2");
  assert.equal(loginIpFromHeaders(undefined), "unknown");
});
