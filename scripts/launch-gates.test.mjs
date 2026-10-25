import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { BandCheck } from "./band-check.mjs";
import { RAW_HASHES } from "./capture-slots.mjs";
import { LaunchCheck } from "./check-launch.mjs";
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

test("Designer sign-off is recorded and provisional rows still block launch", () => {
  const markdown = fs.readFileSync(path.resolve("src/assets/screens/CAPTURES.md"), "utf8");
  const signoff = "Designer PASS, 24 Oct 2026, PR #5 fadd7b4: sha256 = master, band blank, uncropped, slot correct";
  for (const slot of ["hero-reader", "shot-library", "shot-reader"]) {
    assert.match(markdown, new RegExp(`\\| ${slot} \\|[^\\n]*\\| yes \\| ${signoff.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\|`));
  }
  const hits = CaptureGates.signoffProblems();
  assert.ok(hits.some((hit) => hit.includes("hero-reader") && hit.includes("provisional: yes")));
  assert.ok(hits.some((hit) => hit.includes("shot-library") && hit.includes("provisional: yes")));
  assert.ok(hits.some((hit) => hit.includes("shot-reader") && hit.includes("Gor approval")));
  assert.equal(hits.some((hit) => hit.includes("Designer sign-off is empty")), false);
});

test("the Designer OG passes and the temporary wordmark fails", () => {
  const designerHash = "69a74e43310f5346b0ccbeb100a3224ac8ce27931c62838596e0124f305e08ab";
  const master = fs.readFileSync(path.resolve("src/assets/og/og-1200x630.png"));
  const sidecar = fs.readFileSync(path.resolve("src/assets/og/og-1200x630.png.sha256"), "utf8").trim().split(/\s+/)[0];
  const note = fs.readFileSync(path.resolve("src/assets/og/OG.md"), "utf8");
  assert.equal(crypto.createHash("sha256").update(master).digest("hex"), designerHash);
  assert.equal(sidecar, designerHash);
  assert.equal(LaunchCheck.designerOgHash(), designerHash);
  assert.match(note, new RegExp(designerHash));
  assert.equal(master.readUInt32BE(16), 1200);
  assert.equal(master.readUInt32BE(20), 630);
  assert.deepEqual(LaunchCheck.ogProblems(master, "out/og.png"), []);

  const placeholder = fs.readFileSync(path.join(fixtures, "og/placeholder.png"));
  assert.equal(crypto.createHash("sha256").update(placeholder).digest("hex"), LaunchCheck.ogPlaceholderHash);
  assert.match(LaunchCheck.ogProblems(placeholder, "out/og.png")[0], /temporary placeholder/);

  const marked = Buffer.concat([master, Buffer.from("placeholder\0check:launch")]);
  assert.match(LaunchCheck.ogProblems(marked, "out/og.png")[0], /temporary placeholder/);

  const changed = Buffer.from("not-the-designer-image");
  const changedHit = LaunchCheck.ogProblems(changed, "out/og.png")[0];
  assert.match(changedHit, /does not match/);
  assert.match(changedHit, new RegExp(designerHash));
});

test("one leftover data-placeholder fails check:launch", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-placeholder-"));
  fs.writeFileSync(path.join(dir, "index.html"), '<main><svg data-placeholder="true"></svg></main>');
  const result = spawnSync(process.execPath, ["scripts/check-launch.mjs", "--root", dir], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /data-placeholder="true"/);
  assert.match(result.stderr, /index\.html/);
});
