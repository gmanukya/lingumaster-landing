import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { appStoreUrl, campaignInlineScript, getSrc } from "./campaign";

const DIRECT =
  "https://apps.apple.com/fr/app/id6504011014?pt=107400811&ct=landing_direct&mt=8";
const TIKTOK =
  "https://apps.apple.com/fr/app/id6504011014?pt=107400811&ct=tiktok_bio&mt=8";
const APPLE_SHA = "86b6a05f6c8ac9e9a0637edf4f15420d06c8c7bc69662792a46793c1f948b023";

test("tiktok_bio maps to the tiktok campaign url", () => {
  assert.equal(getSrc("?src=tiktok_bio"), "tiktok_bio");
  assert.equal(appStoreUrl("hero", "?src=tiktok_bio"), TIKTOK);
  assert.equal(appStoreUrl("final", "?src=tiktok_bio"), TIKTOK);
});

test("an absent src stays landing_direct", () => {
  assert.equal(getSrc(""), "landing_direct");
  assert.equal(getSrc("?"), "landing_direct");
  assert.equal(getSrc("?src="), "landing_direct");
  assert.equal(appStoreUrl("hero"), DIRECT);
  assert.equal(appStoreUrl("final", ""), DIRECT);
});

test("an unknown src stays landing_direct", () => {
  assert.equal(getSrc("?src=foo"), "landing_direct");
  assert.equal(appStoreUrl("hero", "?src=foo"), DIRECT);
  assert.equal(appStoreUrl("final", "?src=foo"), DIRECT);
});

test("a script src is not reflected into the url", () => {
  const samples = ["?src=<script>", "?src=%3Cscript%3E", "?src=<script>alert(1)</script>"];
  for (const sample of samples) {
    assert.equal(getSrc(sample), "landing_direct");
    const url = appStoreUrl("final", sample);
    assert.equal(url, DIRECT);
    assert.equal(url.includes("<"), false);
    assert.equal(url.includes("script"), false);
    assert.equal(url.includes("alert"), false);
  }
});

test("getSrc reads location.search when no argument is passed", () => {
  const previous = globalThis.location;
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { search: "?src=tiktok_bio" },
  });
  try {
    assert.equal(getSrc(), "tiktok_bio");
  } finally {
    if (previous === undefined) {
      delete (globalThis as { location?: Location }).location;
    } else {
      Object.defineProperty(globalThis, "location", {
        configurable: true,
        value: previous,
      });
    }
  }
});

test("the inline campaign script is at most 1 KB and does not write src into the DOM", () => {
  const script = campaignInlineScript();
  assert.ok(Buffer.byteLength(script, "utf8") <= 1024);
  assert.match(script, /!=="tiktok_bio"/);
  assert.equal(script.includes("innerHTML"), false);
  assert.equal(script.includes("document.write"), false);
  assert.equal(script.includes("eval("), false);
  assert.equal(script.includes("src="), false);
});

test("the committed badge matches Apple's sha256 and the mockup file is absent", () => {
  const svgPath = path.join(process.cwd(), "assets/badge-fr-black-official.svg");
  const hashPath = path.join(process.cwd(), "assets/badge-fr-black-official.svg.sha256");
  const bytes = readFileSync(svgPath);
  const actual = createHash("sha256").update(bytes).digest("hex");
  const recorded = readFileSync(hashPath, "utf8").trim().split(/\s+/)[0];
  assert.equal(actual, APPLE_SHA);
  assert.equal(recorded, APPLE_SHA);
  assert.equal(existsSync(path.join(process.cwd(), "assets/badge-fr-black.svg")), false);
  assert.equal(existsSync(path.join(process.cwd(), "public/badge-fr-black.svg")), false);
  assert.equal(existsSync(path.join(process.cwd(), "badge-fr-black.svg")), false);
});
