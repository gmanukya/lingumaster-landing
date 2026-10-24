import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { BandCheck } from "./band-check.mjs";
import { RAW_HASHES } from "./capture-slots.mjs";
import { CaptureGates } from "./launch-gates.mjs";

const fixtures = path.resolve("scripts/fixtures");

test("COPY_D16 pending fails the copy lock", () => {
  const source = fs.readFileSync(path.join(fixtures, "copy-d16/pending.ts"), "utf8");
  const hits = CaptureGates.copyD16Problems(source);
  assert.equal(hits.length, 1);
  assert.match(hits[0], /pending/);
  assert.match(hits[0], /v2-opt1/);
});

test("COPY_D16 v2-opt2 fails the copy lock", () => {
  const source = fs.readFileSync(path.join(fixtures, "copy-d16/opt2.ts"), "utf8");
  const hits = CaptureGates.copyD16Problems(source);
  assert.equal(hits.length, 1);
  assert.match(hits[0], /v2-opt2/);
});

test("COPY_D16 v2-opt1 passes the value check", () => {
  const source = fs.readFileSync(path.resolve("src/content/fr.ts"), "utf8");
  assert.deepEqual(CaptureGates.copyD16Problems(source), []);
});

test("a flat band passes and a raw-like band or a green pixel fails", async () => {
  assert.deepEqual(await BandCheck.problems(path.join(fixtures, "band/flat.png"), "flat.png"), []);
  const uneven = await BandCheck.problems(path.join(fixtures, "band/uneven.png"), "uneven.png");
  assert.ok(uneven.some((hit) => hit.includes("not one flat colour")));
  const green = await BandCheck.problems(path.join(fixtures, "band/green.png"), "green.png");
  assert.ok(green.some((hit) => hit.includes("saturated-green")));
});

test("the three cleaned masters pass the band check", async () => {
  for (const name of ["shot6-clean.png", "shot7-clean.png", "shot9-library-clean.png"]) {
    const file = path.resolve("src/assets/screens/masters", name);
    assert.deepEqual(await BandCheck.problems(file, name), [], name);
  }
});

test("a fixture named shot2.png fails the raw-file gate", () => {
  const result = spawnSync(process.execPath, ["scripts/launch-gates.mjs", "--root", path.join(fixtures, "raw-shot2")], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /shot2\.png/);
});

test("the published raw shot2 hash is denied, and a file with a listed hash fails", () => {
  assert.equal(RAW_HASHES.shot2, "257df4b0fff3d4c266426c20f71d71097cb86959d584cd0fda5b3ca2dbbd7e35");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "raw-hash-"));
  const file = path.join(dir, "renamed.png");
  fs.writeFileSync(file, "not-the-real-capture");
  const digest = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const hits = CaptureGates.rawProblems(dir, {
    skipFixtures: false,
    hashes: { shot2: digest },
  });
  assert.ok(hits.some((hit) => hit.includes("shot2") && hit.includes("renamed.png")));
});

test("a provisional CAPTURES row is not signed off", () => {
  const markdown = fs.readFileSync(path.resolve("src/assets/screens/CAPTURES.md"), "utf8");
  assert.match(markdown, /\| yes \|/);
  const hits = CaptureGates.signoffProblems();
  assert.ok(hits.some((hit) => hit.includes("hero-reader") && hit.includes("provisional: yes")));
  assert.ok(hits.some((hit) => hit.includes("shot-library") && hit.includes("Designer sign-off")));
  assert.ok(hits.some((hit) => hit.includes("shot-reader") && hit.includes("Gor approval")));
});
