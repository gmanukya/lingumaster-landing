import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Copy } from "../Copy";
import { LegalDocument } from "./document";
import { LEGAL_UPDATED, PUBLISHER_NAME } from "./facts";
import { LegalGuards } from "./guards";
import { SITE_URL } from "../../lib/site";

const root = path.resolve("src/content/legal");
const slugs = ["privacy", "terms", "mentions"] as const;
const forbidden = ["Mindflow", "mailto:", "@", "netlify.app"];

function readLegal(): string[] {
  return slugs.map((slug) => fs.readFileSync(path.join(root, `${slug}.md`), "utf8"));
}

function replaceMarker(value: string): string {
  return value.split(LegalGuards.marker).join("validé");
}

test("publisher name is a single constant", () => {
  assert.equal(PUBLISHER_NAME, "Aleksandr Manukyan");
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const name of fs.readdirSync(dir)) {
      if (name === "node_modules" || name === ".next" || name === "out") continue;
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (name.endsWith(".test.ts")) continue;
      if (!/\.(?:md|ts|tsx)$/.test(name)) continue;
      if (full.endsWith(`${path.sep}content${path.sep}legal${path.sep}facts.ts`)) continue;
      if (fs.readFileSync(full, "utf8").includes(PUBLISHER_NAME)) hits.push(full);
    }
  };
  walk(path.resolve("src"));
  assert.deepEqual(hits, []);
});

test("the footer is the Apple credit only and has nothing focusable", () => {
  const footer = fs.readFileSync(path.resolve("src/components/Footer.tsx"), "utf8");
  assert.match(footer, /legal\.appleCredit/);
  assert.equal(footer.includes("<a"), false);
  assert.equal(footer.includes("href"), false);
  assert.equal(footer.includes("<button"), false);
  assert.equal(footer.includes("tabIndex"), false);
  assert.equal(footer.includes("PUBLISHER_NAME"), false);
  assert.equal(Copy.status(), "approved");
  assert.equal(Copy.isDraft(), false);
});

test("legal pages are noindex while markers remain, independent of COPY_STATUS", () => {
  const parts = [...readLegal(), LEGAL_UPDATED];
  assert.equal(LegalGuards.incomplete(parts), true);
  assert.equal(LegalGuards.robots(parts), "noindex");
  assert.equal(LegalGuards.robotsMeta(parts), '<meta name="robots" content="noindex">');
  for (const slug of slugs) {
    const doc = LegalDocument.compose(slug, fs.readFileSync(path.join(root, `${slug}.md`), "utf8"), {
      publisher: PUBLISHER_NAME,
      siteUrl: SITE_URL,
      updated: LEGAL_UPDATED,
    });
    assert.equal(doc.robots, "noindex");
    assert.equal(doc.canonical, `${SITE_URL}/${slug === "mentions" ? "mentions-legales" : slug}`);
    assert.equal(doc.blocks.filter((block) => block.kind === "heading" && block.level === 1).length, 1);
    assert.match(JSON.stringify(doc.blocks), new RegExp(PUBLISHER_NAME));
    const flat = JSON.stringify(doc);
    for (const word of forbidden) assert.equal(flat.includes(word), false, `${slug} ${word}`);
  }
  const privacy = LegalDocument.compose("privacy", fs.readFileSync(path.join(root, "privacy.md"), "utf8"), {
    publisher: PUBLISHER_NAME,
    siteUrl: SITE_URL,
    updated: LEGAL_UPDATED,
  });
  const table = privacy.blocks.find((block) => block.kind === "table");
  assert.ok(table && table.kind === "table");
  assert.equal(table.rows.length, 8);
  assert.match(table.rows[0]?.[0] ?? "", /^Apple/);
});

test("legal sources do not contain a contact address or a dropped template", () => {
  const combined = readLegal().join("\n");
  for (const word of forbidden) {
    assert.equal(combined.includes(word), false, word);
  }
  const marker = (rest: string) => `${LegalGuards.marker}${rest}`;
  assert.equal(combined.includes(marker(" : e-mail de l'éditeur (D12)]")), true);
  assert.equal(combined.includes(marker(" : moyen d'exercer ses droits, adresse à fournir (D12)]")), true);
  assert.equal(
    combined.includes(
      marker(" : entité Netlify exacte, adresse, téléphone, à vérifier sur les sources officielles de Netlify]"),
    ),
    true,
  );
  assert.equal(combined.includes(marker(" : mention Apple, texte de (b)]")), true);
  assert.equal(combined.includes(marker(" : adresse de l'éditeur (D11)]")), true);
  assert.equal(combined.includes(marker(" : processeur d’analyse d’audience (D3)]")), true);
  assert.equal(combined.includes(marker(" : registrar du nom de domaine (D14)]")), true);
});

test("check:launch fails while source markers remain", () => {
  const result = spawnSync(process.execPath, ["scripts/check-launch.mjs"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /privacy\.md/);
});

test("clean fixture passes check:launch", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/check-launch.mjs", "--root", "scripts/fixtures/launch-clean"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
});

test("replacing markers clears check:launch and removes noindex", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-clean-"));
  const sources = readLegal();
  const updated = LEGAL_UPDATED;
  assert.equal(LegalGuards.robots([...sources, updated]), "noindex");
  const cleaned = [...sources, updated].map(replaceMarker);
  assert.equal(LegalGuards.robots(cleaned), null);
  assert.equal(LegalGuards.robotsMeta(cleaned), "");
  slugs.forEach((slug, index) => {
    fs.writeFileSync(path.join(dir, `${slug}.md`), cleaned[index] ?? "");
  });
  const out = path.join(dir, "out");
  fs.mkdirSync(out);
  fs.writeFileSync(path.join(out, "privacy.html"), `<article>${cleaned[0]}</article><p>${cleaned[3]}</p>`);
  const result = spawnSync(process.execPath, ["scripts/check-launch.mjs", "--root", dir], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  for (const slug of slugs) {
    const doc = LegalDocument.compose(slug, cleaned[slugs.indexOf(slug)] ?? "", {
      publisher: PUBLISHER_NAME,
      siteUrl: SITE_URL,
      updated: cleaned[3] ?? "",
    });
    assert.equal(doc.robots, null);
  }
});

test("a marker left in out/ fails check:launch", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-out-"));
  const out = path.join(dir, "out");
  fs.mkdirSync(out);
  fs.writeFileSync(path.join(out, "index.html"), `<p>${LegalGuards.marker} : reste]</p>`);
  const result = spawnSync(process.execPath, ["scripts/check-launch.mjs", "--root", dir], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /index\.html/);
});
