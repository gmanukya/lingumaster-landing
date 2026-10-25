import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { LaunchCheck } from "./check-launch.mjs";
import { CopyDiff } from "./diff-copy.mjs";

const slots = ["notFound.title", "notFound.body", "notFound.cta"];

function page(copy, extra = "") {
  return `<!doctype html><html lang="fr"><head><title>${copy.title}</title><meta name="robots" content="noindex"></head><body><main><h1>${copy.title}</h1><p>${copy.body}</p><a href="/">${copy.cta}</a></main>${extra}</body></html>`;
}

test("the 404 slots in fr.ts match the copy file", () => {
  const expected = CopyDiff.fromMarkdown();
  const actual = CopyDiff.fromSource();
  for (const slot of slots) {
    assert.equal(actual.get(slot), expected.get(slot), slot);
    assert.equal(actual.get(slot).includes("\u2019"), true, slot);
    assert.equal(actual.get(slot).includes("'"), false, slot);
  }
});

test("the page source does not retype the 404 strings", () => {
  const copy = LaunchCheck.notFoundCopy();
  assert.ok(copy);
  const files = [
    "src/components/NotFoundPage.tsx",
    "src/app/not-found.tsx",
    "scripts/check-launch.mjs",
    "scripts/not-found-page.test.mjs",
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.resolve(file), "utf8");
    for (const value of Object.values(copy)) {
      assert.equal(source.includes(value), false, file);
    }
  }
});

test("a 404 document passes only when it matches the content file", () => {
  const copy = LaunchCheck.notFoundCopy();
  assert.deepEqual(LaunchCheck.notFoundProblems(page(copy), copy), []);

  const missing = page({ ...copy, body: "autre" });
  assert.ok(LaunchCheck.notFoundProblems(missing, copy).some((hit) => hit.includes("notFound.body")));

  const twoLinks = page(copy, '<a href="/privacy">Confidentialité</a>');
  assert.ok(LaunchCheck.notFoundProblems(twoLinks, copy).some((hit) => hit.includes("expected one <a>")));

  const canonical = page(copy).replace("</head>", '<link rel="canonical" href="https://lingumaster.app"></head>');
  assert.ok(LaunchCheck.notFoundProblems(canonical, copy).some((hit) => hit.includes("canonical")));

  const ogUrl = page(copy).replace("</head>", '<meta property="og:url" content="https://lingumaster.app"></head>');
  assert.ok(LaunchCheck.notFoundProblems(ogUrl, copy).some((hit) => hit.includes("og:url")));

  const marker = page(copy).replace(copy.title, "[copy: notFound.title]");
  assert.ok(LaunchCheck.notFoundProblems(marker, copy).some((hit) => hit.includes("[copy:")));

  const priced = page(copy, "9,99 €");
  assert.ok(LaunchCheck.notFoundProblems(priced, copy).some((hit) => hit.includes("€")));
  assert.ok(LaunchCheck.notFoundProblems(page(copy, " essai "), copy).some((hit) => hit.includes("essai")));
  assert.ok(LaunchCheck.notFoundProblems(page(copy, " gratuit "), copy).some((hit) => hit.includes("gratuit")));
  assert.ok(LaunchCheck.notFoundProblems(page(copy, " IA "), copy).some((hit) => hit.includes("IA")));
  assert.deepEqual(
    LaunchCheck.notFoundProblems(page(copy, " essentiellement "), copy).filter((hit) => hit.includes("essai")),
    [],
  );

  const indexed = page(copy).replace('content="noindex"', 'content="index"');
  assert.ok(LaunchCheck.notFoundProblems(indexed, copy).some((hit) => hit.includes("noindex")));
  assert.ok(LaunchCheck.notFoundProblems(page(copy, "<header></header>"), copy).some((hit) => hit.includes("header")));
  assert.ok(LaunchCheck.notFoundProblems(page(copy, "<footer></footer>"), copy).some((hit) => hit.includes("footer")));
});

test("built out/404.html matches the content file", (t) => {
  const file = path.resolve("out/404.html");
  if (!fs.existsSync(file)) {
    if (process.env.REQUIRE_BUILT_404 === "1") assert.fail("out/404.html is missing");
    t.skip("out/404.html is produced by npm run build");
    return;
  }
  const copy = LaunchCheck.notFoundCopy();
  const html = fs.readFileSync(file, "utf8");
  assert.deepEqual(LaunchCheck.notFoundProblems(html, copy), []);
  for (const value of Object.values(copy)) assert.equal(html.includes(value), true);
  const sitemap = fs.readFileSync(path.resolve("out/sitemap.xml"), "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);
  assert.equal(locs.some((loc) => /404|not-found/i.test(loc)), false);
});
