import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { BandCheck } from "./band-check.mjs";
import {
  COPY_D16_VALUE,
  RAW_FILENAMES,
  RAW_HASHES,
  RETIRED_SLOTS,
  SLOTS,
  parseCaptures,
} from "./capture-slots.mjs";

/**
 * Capture and copy-lock gates for check:launch.
 * Kept out of scripts/check-launch.mjs so the legal-marker rule stays untouched.
 */
const TEXT = new Set([".md", ".html", ".txt", ".css", ".json", ".js", ".mjs", ".ts", ".tsx", ".svg", ".xml", ".toml"]);
const SKIP_DIRS = new Set(["node_modules", ".git", ".next"]);
const SELF = new Set([
  path.resolve("scripts/capture-slots.mjs"),
  path.resolve("scripts/launch-gates.mjs"),
  path.resolve("scripts/launch-gates.test.mjs"),
]);

const FORBIDDEN_LANGUAGES = [
  "russe",
  "russian",
  "chinois",
  "chinese",
  "mandarin",
  "japonais",
  "japanese",
  "coréen",
  "coreen",
  "korean",
  "arabe",
  "arabic",
  "néerlandais",
  "neerlandais",
  "dutch",
  "polonais",
  "polish",
  "suédois",
  "suedois",
  "swedish",
  "grec",
  "greek",
  "turc",
  "turkish",
  "hindi",
  "ukrainien",
  "ukrainian",
  "roumain",
  "romanian",
  "tchèque",
  "tcheque",
  "czech",
  "danois",
  "danish",
  "finnois",
  "finnish",
  "norvégien",
  "norvegien",
  "norwegian",
  "hébreu",
  "hebreu",
  "hebrew",
  "thaï",
  "thai",
  "vietnamien",
  "vietnamese",
  "indonésien",
  "indonesien",
  "indonesian",
  "malais",
  "malay",
  "catalan",
  "hongrois",
  "hungarian",
  "swahili",
];

const LANGUAGE_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${FORBIDDEN_LANGUAGES.map((word) => word.normalize("NFC").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}_])`,
  "giu",
);

export class CaptureGates {
  static rel(file) {
    return path.relative(process.cwd(), file) || file;
  }

  static hash(file) {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  }

  static walk(dir, found = [], { skipFixtures = true, extensions = null } = {}) {
    if (!fs.existsSync(dir)) return found;
    for (const name of fs.readdirSync(dir)) {
      if (SKIP_DIRS.has(name)) continue;
      const full = path.join(dir, name);
      if (skipFixtures && full === path.resolve("scripts/fixtures")) continue;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        CaptureGates.walk(full, found, { skipFixtures, extensions });
        continue;
      }
      if (!stat.isFile()) continue;
      if (extensions && !extensions.has(path.extname(name))) continue;
      found.push(full);
    }
    return found;
  }

  static copyD16Problems(source) {
    const match = source.match(/COPY_D16\s*(?::[^=]+)?=\s*"([^"]+)"/);
    if (!match) return ["copy-lock: COPY_D16 is missing"];
    if (match[1] !== COPY_D16_VALUE) {
      return [`copy-lock: COPY_D16 is "${match[1]}", expected "${COPY_D16_VALUE}"`];
    }
    return [];
  }

  static markdownSections(file) {
    const sections = new Map();
    let current = null;
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (line.startsWith("## ")) {
        current = line.slice(3).trim();
        sections.set(current, []);
        continue;
      }
      if (!current || !line.startsWith("|") || /^\|\s*-+/.test(line)) continue;
      const cells = line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());
      if (!cells[0] || cells[0] === "Slot") continue;
      sections.get(current).push(cells[1]);
    }
    return sections;
  }

  static section(sections, prefix) {
    for (const [heading, values] of sections) {
      if (heading === prefix || heading.startsWith(`${prefix} (`)) return values;
    }
    return null;
  }

  static decode(value) {
    return value
      .replace(/&#x202f;/gi, "\u202f")
      .replace(/&#8239;/g, "\u202f")
      .replace(/&nbsp;/g, "\u00a0")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  }

  static text(fragment) {
    return CaptureGates.decode(fragment.replace(/<[^>]+>/g, "")).replace(/[ \t\n\r]+/g, " ").trim();
  }

  static meta(html, key, value) {
    for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
      const attrs = {};
      for (const found of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[found[1]] = CaptureGates.decode(found[2]);
      if (attrs[key] === value && typeof attrs.content === "string") return attrs.content;
    }
    return null;
  }

  static renderedProblems(html, sections) {
    const hits = [];
    const hero = CaptureGates.section(sections, "Hero");
    const captions = CaptureGates.section(sections, "Légendes des captures");
    const alts = CaptureGates.section(sections, "Alt text des écrans");
    const languages = CaptureGates.section(sections, "Ligne langues");
    const trust = CaptureGates.section(sections, "Ligne de confiance");
    const meta = CaptureGates.section(sections, "Meta / partage");
    if (!hero || !captions || !alts || !languages || !trust || !meta) {
      return ["copy-lock: copy-new-v1.md is missing a rendered section"];
    }
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const h1Text = h1 ? CaptureGates.text(h1[1]) : "";
    if (h1Text !== hero[0]) hits.push(`copy-lock: H1 is ${JSON.stringify(h1Text)}`);
    const title = html.match(/<title>([\s\S]*?)<\/title>/i);
    const titleText = title ? CaptureGates.text(title[1]) : "";
    if (titleText !== meta[0]) hits.push(`copy-lock: title is ${JSON.stringify(titleText)}`);
    const description = CaptureGates.meta(html, "name", "description");
    if (description !== meta[1]) hits.push("copy-lock: meta description does not match copy-new-v1.md");
    const ogTitle = CaptureGates.meta(html, "property", "og:title");
    if (ogTitle !== meta[2]) hits.push("copy-lock: og:title does not match copy-new-v1.md");
    const ogDescription = CaptureGates.meta(html, "property", "og:description");
    if (ogDescription !== meta[3]) hits.push("copy-lock: og:description does not match copy-new-v1.md");
    if (!html.includes(hero[1])) hits.push("copy-lock: subline is missing from the rendered page");
    const figs = [...html.matchAll(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/gi)].map((found) =>
      CaptureGates.text(found[1]),
    );
    if (figs[0] !== captions[0] || figs[1] !== captions[1]) {
      hits.push(`copy-lock: captions are ${JSON.stringify(figs.slice(0, 2))}`);
    }
    for (const alt of alts) {
      if (!html.includes(alt)) hits.push(`copy-lock: alt missing ${JSON.stringify(alt)}`);
    }
    if (!html.includes(languages[0])) hits.push("copy-lock: languages line is missing");
    if (!html.includes(trust[0])) hits.push("copy-lock: trust line is missing");
    return hits;
  }

  static framingProblems(htmlFiles) {
    const hits = [];
    for (const file of htmlFiles) {
      const text = CaptureGates.decode(fs.readFileSync(file, "utf8"));
      if (/en\s+fran[cç]ais/iu.test(text)) hits.push(`copy-lock: ${CaptureGates.rel(file)} frames the app with « en français »`);
      const languages = text.match(LANGUAGE_PATTERN);
      if (languages) {
        const unique = [...new Set(languages.map((word) => word.toLowerCase()))];
        hits.push(`copy-lock: ${CaptureGates.rel(file)} names ${unique.join(", ")}`);
      }
    }
    return hits;
  }

  static capturesMarkdown() {
    const file = path.resolve("src/assets/screens/CAPTURES.md");
    if (!fs.existsSync(file)) return { hits: ["captures: src/assets/screens/CAPTURES.md is missing"], rows: [] };
    return { hits: [], rows: parseCaptures(fs.readFileSync(file, "utf8")), file };
  }

  static signoffProblems() {
    const { hits, rows } = CaptureGates.capturesMarkdown();
    if (hits.length > 0) return hits;
    if (rows.length !== SLOTS.length) {
      hits.push(`captures: CAPTURES.md has ${rows.length} rows, expected ${SLOTS.length}`);
    }
    for (const slot of SLOTS) {
      const row = rows.find((item) => item.slot === slot.name);
      if (!row) {
        hits.push(`captures: CAPTURES.md has no row for ${slot.name}`);
        continue;
      }
      if (row.raw !== slot.raw) hits.push(`captures: ${slot.name} raw file is ${row.raw || "empty"}`);
      if (row.master !== slot.master) hits.push(`captures: ${slot.name} master is ${row.master || "empty"}`);
      if (row.sha256 !== slot.sha256) hits.push(`captures: ${slot.name} sha256 does not match the cleaned master`);
      if (!row.statusBar.includes("blank band")) hits.push(`captures: ${slot.name} status bar is not a blank band`);
      if (row.provisional !== "no") hits.push(`captures: ${slot.name} provisional: ${row.provisional || "empty"}`);
      if (!row.designer) hits.push(`captures: ${slot.name} Designer sign-off is empty`);
      if (!row.gor) hits.push(`captures: ${slot.name} Gor approval is empty`);
    }
    for (const row of rows) {
      if (!SLOTS.some((slot) => slot.name === row.slot)) hits.push(`captures: unexpected row ${row.slot}`);
    }
    return hits;
  }

  static screenDir() {
    const out = path.resolve("out/screens");
    if (fs.existsSync(out)) return out;
    const pub = path.resolve("public/screens");
    if (fs.existsSync(pub)) return pub;
    return null;
  }

  static async exportProblems() {
    const hits = [];
    const dir = CaptureGates.screenDir();
    if (!dir) return ["captures: screen exports are missing"];
    const names = fs.readdirSync(dir);
    for (const name of names) {
      if (/shot-today|hero-library|shot3|shot5-clean/i.test(name)) hits.push(`captures: unexpected export ${name}`);
    }
    for (const slot of SLOTS) {
      for (const width of slot.widths) {
        for (const ext of ["avif", "webp"]) {
          if (!names.includes(`${slot.name}-${width}.${ext}`)) {
            hits.push(`captures: missing ${slot.name}-${width}.${ext}`);
          }
        }
      }
      const sidecar = path.join(dir, `${slot.name}.sha256`);
      if (!fs.existsSync(sidecar)) {
        hits.push(`captures: sidecar ${slot.name}.sha256 is missing`);
        continue;
      }
      const recorded = fs.readFileSync(sidecar, "utf8").trim().split(/\s+/)[0];
      if (recorded !== slot.sha256) hits.push(`captures: ${slot.name} sidecar sha256 does not match the cleaned master`);
      const master = path.resolve("src/assets/screens/masters", slot.master);
      if (!fs.existsSync(master)) {
        hits.push(`captures: master ${slot.master} is missing`);
        continue;
      }
      if (CaptureGates.hash(master) !== slot.sha256) {
        hits.push(`captures: ${slot.master} bytes do not match the signed sha256`);
      }
      const largest = slot.widths.at(-1);
      for (const ext of ["avif", "webp"]) {
        const file = path.join(dir, `${slot.name}-${largest}.${ext}`);
        if (!fs.existsSync(file)) continue;
        const report = await BandCheck.inspect(file);
        if (report.aspectDelta > 0.002) {
          hits.push(`captures: ${slot.name}-${largest}.${ext} aspect is not 1290:2796`);
        }
        hits.push(...(await BandCheck.problems(file, `${slot.name}-${largest}.${ext}`)));
      }
    }
    return hits;
  }

  static markupProblems() {
    const index = path.resolve("out/index.html");
    if (!fs.existsSync(index)) return ["captures: out/index.html is missing"];
    const html = fs.readFileSync(index, "utf8");
    const hits = [];
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((found) => found[0]);
    for (const slot of SLOTS) {
      const tag = imgs.find((img) => img.includes(`${slot.name}-`));
      if (!tag) {
        hits.push(`captures: ${slot.name} img is missing`);
        continue;
      }
      if (!/\bwidth="1290"/.test(tag) || !/\bheight="2796"/.test(tag)) {
        hits.push(`captures: ${slot.name} img is not width="1290" height="2796"`);
      }
      if (!tag.includes(slot.sizes)) hits.push(`captures: ${slot.name} sizes do not match the Designer spec`);
      if (slot.priority) {
        if (/loading="lazy"/i.test(tag)) hits.push("captures: hero-reader is lazy");
        if (!/fetchpriority="high"/i.test(tag)) hits.push("captures: hero-reader is not fetchpriority=high");
      } else if (!/loading="lazy"/i.test(tag)) {
        hits.push(`captures: ${slot.name} is not lazy`);
      }
    }
    if (!/rel="preload"[^>]*as="image"|as="image"[^>]*rel="preload"/.test(html) || !html.includes("hero-reader-")) {
      hits.push("captures: hero image is not preloaded");
    }
    if (!/fetchpriority="high"/i.test(html)) hits.push("captures: hero preload is missing fetchpriority=high");
    const css = fs.readFileSync(path.resolve("src/components/Screen.module.css"), "utf8");
    if (!css.includes("object-fit: cover")) hits.push("captures: object-fit is not cover");
    if (!css.includes("object-position: 50% 0")) hits.push("captures: object-position is not 50% 0");
    return hits;
  }

  static provisionalAttributeProblems() {
    const out = path.resolve("out");
    if (!fs.existsSync(out)) return ["provisional: out/ is missing"];
    const hits = [];
    for (const file of CaptureGates.walk(out, [], { extensions: new Set([".html"]) })) {
      const text = fs.readFileSync(file, "utf8");
      if (text.includes('data-provisional="true"') || text.includes("data-provisional='true'")) {
        hits.push(`provisional: ${CaptureGates.rel(file)} has data-provisional="true"`);
      }
    }
    return hits;
  }

  static rawProblems(root, { skipFixtures = true, hashes = RAW_HASHES } = {}) {
    const denylist = new Map(Object.entries(hashes).map(([label, digest]) => [digest, label]));
    const names = new Set(RAW_FILENAMES);
    const hits = [];
    for (const file of CaptureGates.walk(root, [], { skipFixtures })) {
      const base = path.basename(file);
      if (names.has(base)) hits.push(`raw: name ${CaptureGates.rel(file)}`);
      const digest = CaptureGates.hash(file);
      if (denylist.has(digest)) hits.push(`raw: hash ${CaptureGates.rel(file)} ${denylist.get(digest)}`);
    }
    return hits;
  }

  static retiredProblems() {
    const hits = [];
    const roots = [path.resolve("src"), path.resolve("copy"), path.resolve("public"), path.resolve("out")].filter((dir) =>
      fs.existsSync(dir),
    );
    roots.push(path.resolve("README.md"), path.resolve("LAUNCH.md"));
    for (const root of roots) {
      const files = fs.statSync(root).isDirectory()
        ? CaptureGates.walk(root, [], { extensions: TEXT })
        : [root];
      for (const file of files) {
        if (SELF.has(path.resolve(file))) continue;
        const text = fs.readFileSync(file, "utf8");
        for (const slot of RETIRED_SLOTS) {
          if (text.includes(slot)) hits.push(`retired: ${CaptureGates.rel(file)} contains ${slot}`);
        }
      }
    }
    return hits;
  }

  static async run() {
    const hits = [];
    const sourceFile = path.resolve("src/content/fr.ts");
    hits.push(...CaptureGates.copyD16Problems(fs.readFileSync(sourceFile, "utf8")));
    const copyFile = path.resolve("copy/copy-new-v1.md");
    const sections = fs.existsSync(copyFile) ? CaptureGates.markdownSections(copyFile) : null;
    const index = path.resolve("out/index.html");
    if (!sections) hits.push("copy-lock: copy/copy-new-v1.md is missing");
    else if (!fs.existsSync(index)) hits.push("copy-lock: out/index.html is missing");
    else hits.push(...CaptureGates.renderedProblems(fs.readFileSync(index, "utf8"), sections));
    const out = path.resolve("out");
    if (fs.existsSync(out)) {
      hits.push(...CaptureGates.framingProblems(CaptureGates.walk(out, [], { extensions: new Set([".html"]) })));
    }
    hits.push(...CaptureGates.signoffProblems());
    hits.push(...(await CaptureGates.exportProblems()));
    hits.push(...CaptureGates.markupProblems());
    hits.push(...CaptureGates.provisionalAttributeProblems());
    hits.push(...CaptureGates.rawProblems(process.cwd()));
    hits.push(...CaptureGates.retiredProblems());
    return hits;
  }
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry.endsWith(`${path.sep}launch-gates.mjs`)) {
  const flag = process.argv.indexOf("--root");
  if (flag !== -1) {
    const root = process.argv[flag + 1];
    if (!root || !fs.existsSync(root)) {
      console.error(`launch-gates: missing ${root ?? "--root"}`);
      process.exit(1);
    }
    const hits = CaptureGates.rawProblems(path.resolve(root), { skipFixtures: false });
    if (hits.length === 0) {
      console.log("launch-gates: ok");
      process.exit(0);
    }
    console.error(`launch-gates: ${hits.length} problem(s)`);
    for (const hit of hits) console.error(`  ${hit}`);
    process.exit(1);
  }
  const hits = await CaptureGates.run();
  if (hits.length === 0) {
    console.log("launch-gates: ok");
    process.exit(0);
  }
  console.error(`launch-gates: ${hits.length} problem(s)`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
