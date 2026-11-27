// Tâches planifiées (src/app/api/cron/*) : seul un appel avec le bon CRON_SECRET passe.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { isCronAuthorized } from "../../src/lib/cron-auth";

const req = (auth?: string) => ({ headers: { get: (n: string) => (n === "authorization" ? auth ?? null : null) } });

test("bon secret accepté ; mauvais, absent ou secret non configuré refusés", () => {
  process.env.CRON_SECRET = "secret-cron-de-test";
  assert.equal(isCronAuthorized(req("Bearer secret-cron-de-test")), true);
  assert.equal(isCronAuthorized(req("Bearer secret-cron-de-tesT")), false);
  assert.equal(isCronAuthorized(req("Bearer ")), false);
  assert.equal(isCronAuthorized(req()), false);
  delete process.env.CRON_SECRET;
  assert.equal(isCronAuthorized(req("Bearer undefined")), false);
  assert.equal(isCronAuthorized(req("Bearer ")), false);
});

test("chaque tâche planifiée vérifie le secret avant tout traitement", () => {
  for (const dir of readdirSync("src/app/api/cron")) {
    const src = readFileSync(`src/app/api/cron/${dir}/route.ts`, "utf8");
    assert.match(src, /if \(!isCronAuthorized\(/, `${dir} : secret non vérifié`);
  }
});
