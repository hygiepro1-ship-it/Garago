// Porte 6 — Limites : un garage ne doit pas pouvoir épuiser à lui seul le budget de textos du site.
// Chaque texto est facturé à Garago (Twilio). Sans plafond par garage, un compte de garage piraté
// peut envoyer jusqu'au plafond du site entier (1000 par jour) et faire suspendre le compte Twilio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { smsQuotas, SMS_PER_GARAGE_DAILY } from "@/lib/sms";

test("un texto envoyé au nom d'un garage est compté dans le plafond de ce garage", () => {
  const quotas = smsQuotas("+15145550123", "garage_abc");
  const garage = quotas.find((q) => q.key === "smsgarage:garage_abc");
  assert.ok(garage, "aucun plafond par garage");
  assert.equal(garage.max, SMS_PER_GARAGE_DAILY);
});

test("le plafond par garage est plus bas que celui du site entier", () => {
  const quotas = smsQuotas("+15145550123", "garage_abc");
  const site = quotas.find((q) => q.key === "smsall");
  assert.ok(site);
  assert.ok(SMS_PER_GARAGE_DAILY < site.max, "un seul garage pourrait encore vider le quota du site");
});

test("les plafonds par numéro et pour le site restent en place", () => {
  const keys = smsQuotas("+15145550123", "garage_abc").map((q) => q.key);
  assert.ok(keys.includes("smsto:+15145550123"));
  assert.ok(keys.includes("smsall"));
});
