// Dépendances : versions connues pour avoir des failles publiées (liste tenue à jour à chaque audit).
// Next.js 16.0.0 à 16.4.0 : exécution de code à distance sans connexion (optimisation d'images SVG,
// fonctions « use cache ») et panne provoquée (Server Actions). Prisma jusqu'à 7.10.0 : failles élevées.
// Pour une vérification complète et à jour : `npm audit --omit=dev`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const installed = (pkg: string) => JSON.parse(readFileSync(`node_modules/${pkg}/package.json`, "utf8")).version as string;
const num = (v: string) => v.split("-")[0].split(".").map(Number);
const atLeast = (v: string, min: string) => {
  const a = num(v), b = num(min);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

test("Next.js est à une version corrigée (16.4.1 ou plus)", () => {
  const v = installed("next");
  assert.ok(atLeast(v, "16.4.1"), `next ${v} a des failles critiques publiées`);
});

test("Prisma est à une version corrigée (7.10.1 ou plus), client et moteur alignés", () => {
  for (const p of ["prisma", "@prisma/client", "@prisma/adapter-pg"]) {
    const v = installed(p);
    assert.ok(atLeast(v, "7.10.1"), `${p} ${v} a des failles publiées ou n'est pas aligné`);
  }
});
