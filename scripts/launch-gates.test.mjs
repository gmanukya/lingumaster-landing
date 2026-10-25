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
import { RuntimeDeferral } from "./defer-runtime.mjs";
import { CaptureGates } from "./launch-gates.mjs";

const EXAMPLE_WEBSITE_ID = "50533390-5f46-4f32-b670-f4a9db0627ca";
const GOOD_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self'; font-src 'self'; style-src 'self'; connect-src 'self' https://gateway.umami.is; script-src 'self' 'sha256-jDoilTXt2672yl6/ZkU7UxAf+cNiTalm42YM1aMWaw4=' https://cloud.umami.is";

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

function analyticsFixture(overrides = {}) {
  return {
    analytics: "umami",
    websiteId: EXAMPLE_WEBSITE_ID,
    domainsOverride: "",
    html: fs.readFileSync(path.join(fixtures, "analytics/good-script.html"), "utf8"),
    indexPresent: true,
    csp: GOOD_CSP,
    testEventSeen: { by: "Gor", at: "2026-10-25" },
    registry: "function selectAdapter(){ return noopAdapter }",
    debugInOutput: false,
    toml: "# env vars are set in the Netlify production context\n",
    ...overrides,
  };
}

test("check:launch analytics passes on the good build fixture", () => {
  assert.deepEqual(LaunchCheck.analyticsProblems(analyticsFixture()), []);
});

test("check:launch analytics fails when the production env var is missing", () => {
  const hits = LaunchCheck.analyticsProblems(analyticsFixture({ analytics: undefined, websiteId: undefined }));
  assert.equal(hits.length, 1);
  assert.match(hits[0], /production env var missing/);
  assert.match(hits[0], /Netlify production context/);
});

test("check:launch analytics fails on an invalid website UUID", () => {
  const hits = LaunchCheck.analyticsProblems(
    analyticsFixture({
      websiteId: "not-a-uuid",
      html: fs.readFileSync(path.join(fixtures, "analytics/invalid-uuid.html"), "utf8"),
    }),
  );
  assert.ok(hits.some((hit) => hit.includes("NEXT_PUBLIC_UMAMI_WEBSITE_ID is not a UUID")));
  assert.ok(hits.some((hit) => hit.includes("data-website-id is missing or not a UUID")));
  assert.equal(hits.some((hit) => hit.includes("production env var missing")), false);
});

test("check:launch analytics fails when the script tag is missing from out/index.html", () => {
  const hits = LaunchCheck.analyticsProblems(
    analyticsFixture({
      html: fs.readFileSync(path.join(fixtures, "analytics/missing-script.html"), "utf8"),
    }),
  );
  assert.deepEqual(hits, ["analytics: script tag missing from out/index.html"]);
});

test("check:launch analytics fails when the CSP lacks the two Umami origins", () => {
  const hits = LaunchCheck.analyticsProblems(
    analyticsFixture({
      csp: "default-src 'self'; connect-src 'self'; script-src 'self' 'sha256-jDoilTXt2672yl6/ZkU7UxAf+cNiTalm42YM1aMWaw4='",
    }),
  );
  assert.ok(hits.some((hit) => hit.includes("script-src is missing https://cloud.umami.is")));
  assert.ok(hits.some((hit) => hit.includes("connect-src is missing https://gateway.umami.is")));
  const swapped = LaunchCheck.analyticsProblems(
    analyticsFixture({
      csp: "connect-src 'self' https://cloud.umami.is; script-src 'self' https://gateway.umami.is",
    }),
  );
  assert.ok(swapped.some((hit) => hit.includes("script-src is missing https://cloud.umami.is")));
  assert.ok(swapped.some((hit) => hit.includes("connect-src is missing https://gateway.umami.is")));
});

test("check:launch analytics fails when data-domains is not lingumaster.app", () => {
  const hits = LaunchCheck.analyticsProblems(
    analyticsFixture({
      html: fs.readFileSync(path.join(fixtures, "analytics/domains.html"), "utf8"),
      domainsOverride: "localhost",
    }),
  );
  assert.ok(hits.some((hit) => hit === "analytics: data-domains is not lingumaster.app"));
  assert.equal(hits.filter((hit) => hit.includes("data-domains")).length >= 1, true);
});

test("check:launch analytics fails when data-do-not-track is present", () => {
  const hits = LaunchCheck.analyticsProblems(
    analyticsFixture({
      html: fs.readFileSync(path.join(fixtures, "analytics/do-not-track.html"), "utf8"),
    }),
  );
  assert.deepEqual(hits, ["analytics: data-do-not-track is present"]);
});

test("check:launch analytics fails when testEventSeen is unset", () => {
  const hits = LaunchCheck.analyticsProblems(analyticsFixture({ testEventSeen: null }));
  assert.equal(hits.length, 1);
  assert.match(hits[0], /testEventSeen is unset/);
});

test("check:launch analytics fails when the adapter is debug", () => {
  const hits = LaunchCheck.analyticsProblems(analyticsFixture({ analytics: "debug", debugInOutput: true }));
  assert.ok(hits.some((hit) => hit === "analytics: adapter is debug"));
  assert.ok(hits.some((hit) => hit.includes("production env var missing")));
});

test("check:launch analytics rejects a CSP wildcard, unsafe-inline, and committed env vars", () => {
  const wildcard = LaunchCheck.analyticsProblems(
    analyticsFixture({
      csp: GOOD_CSP.replace("script-src 'self'", "script-src 'self' *"),
    }),
  );
  assert.ok(wildcard.some((hit) => hit.includes("wildcard")));
  const inline = LaunchCheck.analyticsProblems(
    analyticsFixture({
      csp: GOOD_CSP.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"),
    }),
  );
  assert.ok(inline.some((hit) => hit.includes("unsafe-inline")));
  const committed = LaunchCheck.analyticsProblems(
    analyticsFixture({ toml: 'NEXT_PUBLIC_ANALYTICS = "umami"\nNEXT_PUBLIC_UMAMI_WEBSITE_ID = "50533390-5f46-4f32-b670-f4a9db0627ca"\n' }),
  );
  assert.ok(committed.some((hit) => hit.includes("committed in netlify.toml")));
});

test("the repo does not commit the Umami env vars, and testEventSeen is still unset", () => {
  const toml = fs.readFileSync(path.resolve("netlify.toml"), "utf8");
  assert.equal(toml.includes("NEXT_PUBLIC_ANALYTICS"), false);
  assert.equal(toml.includes("NEXT_PUBLIC_UMAMI_WEBSITE_ID"), false);
  assert.equal(toml.includes("NEXT_PUBLIC_UMAMI_DOMAINS"), false);
  assert.equal(toml.includes(EXAMPLE_WEBSITE_ID), false);
  const doc = LaunchCheck.parseToml(toml);
  const csp = String(doc.headers.find((header) => header.for === "/*")?.values?.["Content-Security-Policy"] ?? "");
  assert.equal(csp.includes("*"), false);
  assert.equal(/unsafe-inline/i.test(csp), false);
  assert.match(toml, /https:\/\/cloud\.umami\.is/);
  assert.match(toml, /https:\/\/gateway\.umami\.is/);
  assert.match(toml, /sha256-jDoilTXt2672yl6\/ZkU7UxAf\+cNiTalm42YM1aMWaw4=/);
  const seen = LaunchCheck.readTestEventSeen(fs.readFileSync(path.resolve("src/config.ts"), "utf8"));
  assert.equal(seen, null);
  const filled = LaunchCheck.readTestEventSeen(
    'class SiteConfig { static readonly analytics = {\n  testEventSeen: { by: "Gor", at: "2026-10-26" },\n}; }',
  );
  assert.deepEqual(filled, { by: "Gor", at: "2026-10-26" });
});

test("the runtime deferral leaves the static Umami script in the HTML", () => {
  const tag = fs.readFileSync(path.join(fixtures, "analytics/good-script.html"), "utf8").trim();
  const html = `<!doctype html><html><body><script id="campaign-ct">void 0</script><script src="/_next/static/chunks/app.js"></script>${tag}</body></html>`;
  const parts = RuntimeDeferral.rewrite(html);
  assert.ok(parts);
  assert.match(parts.html, /src="https:\/\/cloud\.umami\.is\/script\.js"/);
  assert.match(parts.html, /defer/);
  assert.match(parts.html, /data-domains="lingumaster.app"/);
  assert.match(parts.html, /data-auto-pageview="false"/);
  assert.match(parts.html, new RegExp(EXAMPLE_WEBSITE_ID));
  assert.equal(parts.html.includes("/_next/static/chunks/app.js"), false);
  assert.equal(parts.html.includes('id="campaign-ct"'), true);
  assert.deepEqual(
    parts.external.map((item) => item.src),
    ["/_next/static/chunks/app.js"],
  );
});

test("the raw master in out/ fails the brand gate", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "brand-master-"));
  const hash = LaunchCheck.recordedMasterHash();
  assert.equal(hash, "1b986819db39800c86398e90a4bf2a4ddb05db936fb1a1e4e37699e398ef8d63");
  fs.copyFileSync(path.resolve("src/assets/brand/lingumaster-logo-official.jpg"), path.join(dir, "renamed.jpg"));
  const hits = LaunchCheck.shippedMasterProblems(dir, hash);
  assert.equal(hits.length, 1);
  assert.match(hits[0], /raw master shipped/);
  assert.deepEqual(LaunchCheck.shippedMasterProblems(dir, "a".repeat(64)), []);
});

test("a favicon image with a transparent pixel fails the brand gate", async () => {
  const sharp = (await import("sharp")).default;
  const { writeIco } = await import("./generate-brand.mjs");
  const png = await sharp({
    create: { width: 16, height: 16, channels: 4, background: { r: 145, g: 175, b: 147, alpha: 0.2 } },
  })
    .png()
    .toBuffer();
  const ico = writeIco([
    { width: 16, height: 16, png },
    { width: 32, height: 32, png: await sharp(png).resize(32, 32).png().toBuffer() },
    { width: 48, height: 48, png: await sharp(png).resize(48, 48).png().toBuffer() },
  ]);
  const hits = await LaunchCheck.icoAlphaProblems(ico, "favicon.ico");
  assert.ok(hits.some((hit) => hit.includes("has alpha")));
});

test("an icon with alpha fails the brand gate", async () => {
  const sharp = (await import("sharp")).default;
  const png = await sharp({
    create: { width: 2, height: 2, channels: 4, background: { r: 145, g: 175, b: 147, alpha: 0.4 } },
  })
    .png()
    .toBuffer();
  const hits = LaunchCheck.iconAlphaProblems(png, "icon.png");
  assert.equal(hits.length, 1);
  assert.match(hits[0], /icon\.png has alpha/);
});

test("a missing apple-icon fails the brand gate", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "brand-apple-"));
  const hits = LaunchCheck.appleIconProblems(dir);
  assert.deepEqual(hits, ["brand: apple-icon is missing"]);
  fs.writeFileSync(path.join(dir, "apple-icon.png"), "png");
  assert.deepEqual(LaunchCheck.appleIconProblems(dir), []);
});

test("a stand-in icon.svg fails the brand gate", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "brand-svg-"));
  fs.writeFileSync(path.join(dir, "icon.svg"), "<svg></svg>");
  const hits = LaunchCheck.standInProblems(dir);
  assert.equal(hits.length, 1);
  assert.match(hits[0], /stand-in icon\.svg/);
  assert.deepEqual(LaunchCheck.standInProblems(fs.mkdtempSync(path.join(os.tmpdir(), "brand-empty-"))), []);
});

test("a header containing an anchor fails the brand gate", () => {
  const wordmark = LaunchCheck.notFoundCopy().wordmark;
  const linked = `<header><a href="/"><img src="/brand/logo-64.webp" alt="" width="32" height="32">${wordmark}</a></header>`;
  const hits = LaunchCheck.homeHeaderProblems(linked, wordmark);
  assert.deepEqual(hits, ["header: the header contains an <a>"]);
  const plain = `<header><img src="/brand/logo-64.webp" alt="" width="32" height="32"><span>${wordmark}</span></header>`;
  assert.deepEqual(LaunchCheck.homeHeaderProblems(plain, wordmark), []);
});

test("an image over 400px fails unless it is the OG or a capture", async () => {
  const sharp = (await import("sharp")).default;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "brand-large-"));
  const png = await sharp({ create: { width: 401, height: 8, channels: 3, background: "#91af93" } }).png().toBuffer();
  fs.writeFileSync(path.join(dir, "wide.png"), png);
  fs.writeFileSync(path.join(dir, "og.png"), png);
  fs.writeFileSync(path.join(dir, "hero-reader-401.png"), png);
  const hits = await LaunchCheck.oversizedImageProblems(dir);
  assert.deepEqual(hits, [`brand: ${path.relative(process.cwd(), path.join(dir, "wide.png"))} is 401x8`]);
});

test("the layout metadata has no icons entry and the CSP img-src is unchanged", () => {
  const layout = fs.readFileSync(path.resolve("src/app/layout.tsx"), "utf8");
  assert.deepEqual(LaunchCheck.layoutIconsProblems(layout), []);
  assert.ok(LaunchCheck.layoutIconsProblems("export const metadata = {\n  icons: { icon: [] },\n};\n").length > 0);
  const toml = fs.readFileSync(path.resolve("netlify.toml"), "utf8");
  const doc = LaunchCheck.parseToml(toml);
  const csp = String(doc.headers.find((header) => header.for === "/*")?.values?.["Content-Security-Policy"] ?? "");
  assert.equal(csp, GOOD_CSP);
  assert.equal(toml.includes('for = "/icon.svg"'), false);
  assert.equal(toml.includes('for = "/apple-touch-icon.png"'), false);
  assert.equal(fs.existsSync(path.resolve("public/icon.svg")), false);
  assert.equal(fs.existsSync(path.resolve("public/favicon.ico")), false);
  assert.equal(fs.existsSync(path.resolve("public/apple-touch-icon.png")), false);
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
