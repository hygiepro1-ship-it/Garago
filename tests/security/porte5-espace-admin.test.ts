// Porte 5 — Espace admin : la page et toutes les routes d'administration exigent un compte ADMIN,
// vérifié par le serveur. Un contrôle fait seulement dans le navigateur se contourne en quelques secondes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? routes(p) : name === "route.ts" ? [p] : [];
  });
}

test("la page /tableau-de-bord/admin est protégée côté serveur", () => {
  const layout = "src/app/tableau-de-bord/admin/layout.tsx";
  assert.ok(existsSync(layout), "aucun contrôle serveur : seule la page (navigateur) vérifie le rôle");
  const src = readFileSync(layout, "utf8");
  assert.doesNotMatch(src, /^\s*["']use client["']/m, "le contrôle doit tourner sur le serveur");
  assert.match(src, /getServerSession\(/);
  assert.match(src, /role\s*!==\s*["']ADMIN["']/);
  assert.match(src, /redirect\(/);
});

test("chaque route /api/admin vérifie le rôle ADMIN avec la session du serveur", () => {
  const files = routes("src/app/api/admin");
  assert.ok(files.length > 0);
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    assert.match(src, /getServerSession\(/, `${f} : aucune session vérifiée`);
    assert.match(src, /role\s*!==\s*["']ADMIN["']|role\s*===\s*["']ADMIN["']/, `${f} : rôle ADMIN non vérifié`);
  }
});
