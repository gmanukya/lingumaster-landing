import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Launch gate.
 * `--root` keeps the marker scan used by the legal fixtures, and also fails
 * when an HTML file under that root still has data-placeholder="true".
 * The default run (the repo) applies every launch gate.
 */
export class LaunchCheck {
  static marker = "[\u00c0 COMPL\u00c9TER";
  static copyMarker = "[copy:";
  static text = new Set([".md", ".html", ".txt", ".css", ".json", ".js", ".mjs", ".ts", ".tsx", ".svg", ".xml", ".toml"]);
  static forbiddenHashes = new Set([
    "11149a34297bf60334715a28492d525e2a50fb74368a02ff2884fa1a184107d6",
    "07b91a6c1bcf874ebf4c8cf417faf8e01b3ec7cee0e53a53a8a7c4e728af8383",
  ]);
  static priceNeedles = [
    ["€", /€/],
    ["9,99", /(?<![0-9.])9,99(?![0-9])/],
    ["59,99", /(?<![0-9.])59,99(?![0-9])/],
    ["/mois", /\/mois/],
    ["/an", /\/an/],
  ];
  static screenNames = ["hero-library", "shot-library", "shot-reader"];
  static ogMark = "placeholder\0check:launch";

  static walk(dir, found = [], extensions = null) {
    if (!fs.existsSync(dir)) return found;
    for (const name of fs.readdirSync(dir)) {
      if (name === "node_modules" || name === ".next" || name === ".git") continue;
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        LaunchCheck.walk(full, found, extensions);
        continue;
      }
      if (!extensions || extensions.has(path.extname(name))) found.push(full);
    }
    return found;
  }

  static rel(file) {
    return path.relative(process.cwd(), file) || file;
  }

  static markers(root) {
    if (!fs.existsSync(root)) return [];
    const hits = [];
    for (const file of LaunchCheck.walk(root, [], LaunchCheck.text)) {
      const text = fs.readFileSync(file, "utf8");
      if (text.includes(LaunchCheck.marker)) hits.push(`markers: ${LaunchCheck.rel(file)}`);
    }
    return hits;
  }

  static markerCheck(roots) {
    return roots.flatMap((root) => LaunchCheck.markers(root));
  }

  static placeholderCheck(roots) {
    const hits = [];
    for (const root of roots) {
      for (const file of LaunchCheck.walk(root, [], new Set([".html"]))) {
        const text = fs.readFileSync(file, "utf8");
        if (text.includes('data-placeholder="true"') || text.includes("data-placeholder='true'")) {
          hits.push(`placeholders: ${LaunchCheck.rel(file)} has data-placeholder="true"`);
        }
      }
    }
    return hits;
  }

  static checks = [LaunchCheck.markerCheck, LaunchCheck.placeholderCheck];

  static read(file) {
    return fs.readFileSync(path.resolve(file), "utf8");
  }

  static copyStatus() {
    const match = LaunchCheck.read("src/content/fr.ts").match(/COPY_STATUS[^=]*=\s*"([^"]+)"/);
    if (!match || match[1] !== "approved") {
      return [`copy-status: COPY_STATUS is ${match?.[1] ?? "missing"}, expected "approved"`];
    }
    return [];
  }

  static copyMarkers() {
    const hits = [];
    const src = path.resolve("src");
    if (fs.existsSync(src)) {
      for (const file of LaunchCheck.walk(src, [], LaunchCheck.text)) {
        if (file.endsWith(`${path.sep}Copy.ts`)) continue;
        if (file.endsWith(".test.ts")) continue;
        const text = fs.readFileSync(file, "utf8");
        if (text.includes(LaunchCheck.copyMarker)) hits.push(`copy-markers: ${LaunchCheck.rel(file)}`);
      }
    }
    // Compiled JS and the flight payload repeat Copy.ts's fallback template
    // (`[copy: ${slot}]`) even when every approved slot is filled. The gate
    // looks at rendered HTML, where a missing slot is visible text.
    const out = path.resolve("out");
    if (fs.existsSync(out)) {
      for (const file of LaunchCheck.walk(out, [], new Set([".html"]))) {
        const text = fs.readFileSync(file, "utf8");
        if (text.includes(LaunchCheck.copyMarker)) hits.push(`copy-markers: ${LaunchCheck.rel(file)}`);
      }
    }
    return hits;
  }

  static captures() {
    const dir = path.resolve("out/screens");
    if (!fs.existsSync(dir)) return ["captures: out/screens is missing"];
    const names = fs.readdirSync(dir);
    const hits = [];
    for (const slot of LaunchCheck.screenNames) {
      const avif = names.some((name) => name.startsWith(`${slot}-`) && name.endsWith(".avif"));
      const webp = names.some((name) => name.startsWith(`${slot}-`) && name.endsWith(".webp"));
      if (!avif || !webp) hits.push(`captures: ${slot} is not a real AVIF and WebP set`);
    }
    return hits;
  }

  static og() {
    const file = fs.existsSync(path.resolve("out/og.png"))
      ? path.resolve("out/og.png")
      : path.resolve("public/og.png");
    if (!fs.existsSync(file)) return ["og: image is missing"];
    const bytes = fs.readFileSync(file);
    if (bytes.includes(LaunchCheck.ogMark)) return [`og: ${LaunchCheck.rel(file)} is the temporary placeholder`];
    return [];
  }

  static prices() {
    const dir = path.resolve("out");
    if (!fs.existsSync(dir)) return ["price: out/ is missing"];
    const hits = [];
    for (const file of LaunchCheck.walk(dir, [], LaunchCheck.text)) {
      const text = fs.readFileSync(file, "utf8");
      for (const [needle, pattern] of LaunchCheck.priceNeedles) {
        if (pattern.test(text)) hits.push(`price: ${LaunchCheck.rel(file)} contains ${needle}`);
      }
    }
    return hits;
  }

  static liveHashes() {
    const hits = [];
    const roots = [process.cwd(), path.resolve("out")];
    const seen = new Set();
    for (const root of roots) {
      if (!fs.existsSync(root)) continue;
      for (const file of LaunchCheck.walk(root)) {
        if (seen.has(file)) continue;
        seen.add(file);
        const base = path.basename(file);
        if (/(^|[^a-z0-9])(live3|ss3)([^a-z0-9]|$)/i.test(base)) {
          hits.push(`live3: name ${LaunchCheck.rel(file)}`);
        }
        const digest = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
        if (LaunchCheck.forbiddenHashes.has(digest)) hits.push(`live3: hash ${LaunchCheck.rel(file)}`);
      }
    }
    return hits;
  }

  static siteUrl() {
    const hits = [];
    const match = LaunchCheck.read("src/lib/site.ts").match(/SITE_URL = "([^"]+)"/);
    if (!match || match[1] !== "https://lingumaster.app") {
      hits.push(`site-url: SITE_URL is ${match?.[1] ?? "missing"}`);
    }
    const out = path.resolve("out");
    if (!fs.existsSync(out)) {
      hits.push("site-url: out/ is missing");
      return hits;
    }
    for (const file of LaunchCheck.walk(out, [], LaunchCheck.text)) {
      const text = fs.readFileSync(file, "utf8");
      if (text.includes("netlify.app")) hits.push(`site-url: ${LaunchCheck.rel(file)} contains netlify.app`);
    }
    return hits;
  }

  static parseToml(text) {
    const doc = { headers: [], redirects: [], values: {} };
    let current = doc.values;
    let pendingHeader = null;
    const lines = text.split(/\n/);
    for (let index = 0; index < lines.length; index += 1) {
      let line = lines[index];
      let quote = null;
      let cut = line.length;
      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (quote) {
          if (char === quote) quote = null;
          continue;
        }
        if (char === '"' || char === "'") {
          quote = char;
          continue;
        }
        if (char === "#") {
          cut = i;
          break;
        }
      }
      line = line.slice(0, cut).trim();
      if (!line) continue;
      const array = /^\[\[([A-Za-z0-9_.-]+)\]\]$/.exec(line);
      if (array) {
        const item = {};
        if (array[1] === "headers") {
          doc.headers.push(item);
          pendingHeader = item;
        } else if (array[1] === "redirects") {
          doc.redirects.push(item);
          pendingHeader = null;
        } else {
          throw new Error(`unsupported array ${array[1]} at line ${index + 1}`);
        }
        current = item;
        continue;
      }
      const table = /^\[([A-Za-z0-9_.-]+)\]$/.exec(line);
      if (table) {
        const name = table[1];
        if (name === "headers.values" && pendingHeader) {
          pendingHeader.values = {};
          current = pendingHeader.values;
          continue;
        }
        const parts = name.split(".");
        let cursor = doc.values;
        for (const part of parts) {
          cursor[part] = cursor[part] && typeof cursor[part] === "object" ? cursor[part] : {};
          cursor = cursor[part];
        }
        current = cursor;
        pendingHeader = null;
        continue;
      }
      const pair = /^([A-Za-z0-9_-]+)\s*=\s*(.*)$/.exec(line);
      if (!pair) throw new Error(`cannot parse line ${index + 1}`);
      current[pair[1]] = LaunchCheck.tomlValue(pair[2].trim());
    }
    return doc;
  }

  static tomlValue(raw) {
    if (raw === "true") return true;
    if (raw === "false") return false;
    if (/^-?\d+$/.test(raw)) return Number(raw);
    if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1).replaceAll('\\"', '"');
    if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1);
    throw new Error(`unsupported TOML value ${raw}`);
  }

  static ctHash() {
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "./scripts/register-ts.mjs",
        "--input-type=module",
        "-e",
        'import { campaignInlineScript } from "./src/lib/campaign.ts"; import crypto from "node:crypto"; const body = campaignInlineScript(); if (Buffer.byteLength(body) > 1024) process.exit(2); process.stdout.write(crypto.createHash("sha256").update(body).digest("base64"));',
      ],
      { encoding: "utf8" },
    );
    if (result.status !== 0) return null;
    return result.stdout.trim();
  }

  static netlify() {
    const file = path.resolve("netlify.toml");
    if (!fs.existsSync(file)) return ["netlify.toml: missing"];
    const text = fs.readFileSync(file, "utf8");
    const hits = [];
    if (/Set-Cookie/i.test(text)) hits.push("netlify.toml: Set-Cookie is set");
    if (/AKIA|ghp_|xox[baprs]-|sk_live|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|Bearer [A-Za-z0-9]/i.test(text)) {
      hits.push("netlify.toml: secret-like value");
    }
    let doc;
    try {
      doc = LaunchCheck.parseToml(text);
    } catch (error) {
      return [`netlify.toml: ${error.message}`];
    }
    const build = doc.values.build ?? {};
    const env = build.environment ?? {};
    const production = doc.values.context?.production?.environment ?? {};
    if (build.command !== "npm run build") hits.push("netlify.toml: build command is not npm run build");
    if (build.publish !== "out") hits.push("netlify.toml: publish is not out");
    const nvm = fs.existsSync(".nvmrc") ? fs.readFileSync(".nvmrc", "utf8").trim() : "22.23.4";
    if (env.NODE_VERSION !== nvm) hits.push(`netlify.toml: NODE_VERSION is not ${nvm}`);
    if (env.SITE_URL !== "https://lingumaster.app") hits.push("netlify.toml: SITE_URL is not https://lingumaster.app");
    if (production.SITE_URL !== "https://lingumaster.app") {
      hits.push("netlify.toml: production SITE_URL is not https://lingumaster.app");
    }
    const star = doc.headers.find((header) => header.for === "/*");
    const values = star?.values ?? {};
    const required = {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
    };
    for (const [key, value] of Object.entries(required)) {
      if (values[key] !== value) hits.push(`netlify.toml: ${key} is missing`);
    }
    if (!values["Permissions-Policy"]) hits.push("netlify.toml: Permissions-Policy is missing");
    const csp = String(values["Content-Security-Policy"] ?? "");
    if (!csp.includes("'self'")) hits.push("netlify.toml: CSP is missing 'self'");
    const hash = LaunchCheck.ctHash();
    if (!hash) hits.push("netlify.toml: ct script hash could not be computed");
    else if (!csp.includes(`'sha256-${hash}'`)) hits.push("netlify.toml: CSP is missing the ct script hash");
    if (String(values["Strict-Transport-Security"] ?? "").includes("preload")) {
      hits.push("netlify.toml: HSTS preload is set");
    }
    if (!String(values["Cache-Control"] ?? "").includes("max-age=0") || !String(values["Cache-Control"]).includes("must-revalidate")) {
      hits.push("netlify.toml: HTML cache is not must-revalidate");
    }
    for (const prefix of ["/_next/static/*", "/assets/*", "/fonts/*", "/screens/*"]) {
      const rule = doc.headers.find((header) => header.for === prefix);
      const cache = String(rule?.values?.["Cache-Control"] ?? "");
      if (!cache.includes("immutable") || !cache.includes("31536000")) {
        hits.push(`netlify.toml: ${prefix} is not immutable`);
      }
    }
    for (const redirect of doc.redirects) {
      const from = String(redirect.from ?? "");
      const status = Number(redirect.status);
      const to = String(redirect.to ?? "");
      if (from.includes("*") || (status === 200 && to.includes("index.html"))) {
        hits.push(`netlify.toml: catch-all rewrite ${from} -> ${to}`);
      }
    }
    const index = doc.redirects.find((redirect) => redirect.from === "/index.html");
    if (!index || index.to !== "/" || Number(index.status) !== 301) {
      hits.push("netlify.toml: /index.html -> / 301 is missing");
    }
    for (const [key, value] of LaunchCheck.flatten(doc)) {
      if (/(token|secret|password|api[_-]?key|private[_-]?key|credential)/i.test(key) && String(value).length > 0) {
        hits.push(`netlify.toml: secret key ${key}`);
      }
    }
    return hits;
  }

  static flatten(doc) {
    const pairs = [];
    const visit = (value, prefix) => {
      if (!value || typeof value !== "object") return;
      for (const [key, inner] of Object.entries(value)) {
        if (inner && typeof inner === "object") visit(inner, key);
        else pairs.push([prefix ? `${prefix}.${key}` : key, inner]);
      }
    };
    visit(doc.values, "");
    for (const header of doc.headers) visit(header.values ?? {}, "header");
    for (const redirect of doc.redirects) visit(redirect, "redirect");
    return pairs;
  }

  static analytics() {
    const hits = [];
    if (process.env.NEXT_PUBLIC_ANALYTICS === "debug") hits.push("analytics: adapter is debug");
    const registry = LaunchCheck.read("src/lib/analytics/registry.ts");
    if (!registry.includes("return noopAdapter")) hits.push("analytics: default is not noop");
    const out = path.resolve("out");
    if (!fs.existsSync(out)) return hits;
    for (const file of LaunchCheck.walk(out, [], new Set([".js", ".html"]))) {
      const text = fs.readFileSync(file, "utf8");
      if (text.includes('selectAdapter("debug")') || text.includes("selectAdapter('debug')")) {
        hits.push(`analytics: ${LaunchCheck.rel(file)} selects debug`);
      }
    }
    return hits;
  }

  static contact() {
    const config = LaunchCheck.read("src/config.ts");
    const href = /contactHref:\s*string\s*\|\s*null\s*=\s*([^;\n]+)/.exec(config);
    const hrefSet = Boolean(href && href[1].trim() !== "null");
    const accepted = process.env.ACCEPT_NO_CONTACT === "true";
    const note = /acceptNoContact:\s*\{[^}]*by:\s*"([^"]+)"[^}]*at:\s*"([^"]+)"/.exec(config);
    const noted = Boolean(note && note[1].trim() && note[2].trim());
    if (hrefSet) return [];
    if (accepted && noted) return [];
    return ["contact: contactHref is unset and ACCEPT_NO_CONTACT is not recorded with who and when"];
  }

  static publisher() {
    const facts = LaunchCheck.read("src/content/legal/facts.ts");
    if (!facts.includes('PUBLISHER_NAME = "Aleksandr Manukyan"')) {
      return ["publisher: name is not Aleksandr Manukyan"];
    }
    const hits = [];
    for (const page of ["privacy", "terms", "mentions-legales"]) {
      const file = path.resolve("out", page, "index.html");
      if (!fs.existsSync(file)) continue;
      if (!fs.readFileSync(file, "utf8").includes("Aleksandr Manukyan")) {
        hits.push(`publisher: ${page} does not name Aleksandr Manukyan`);
      }
    }
    return hits;
  }

  static badge() {
    const source = path.resolve("assets/badge-fr-black-official.svg");
    const hashFile = path.resolve("assets/badge-fr-black-official.svg.sha256");
    if (!fs.existsSync(source) || !fs.existsSync(hashFile)) return ["badge: official svg or sha256 file is missing"];
    const expected = fs.readFileSync(hashFile, "utf8").trim().split(/\s+/)[0];
    const actual = crypto.createHash("sha256").update(fs.readFileSync(source)).digest("hex");
    if (expected !== actual) return ["badge: svg hash does not match assets/badge-fr-black-official.svg.sha256"];
    return [];
  }

  static projectGates() {
    return [
      LaunchCheck.copyStatus,
      LaunchCheck.copyMarkers,
      LaunchCheck.captures,
      LaunchCheck.og,
      LaunchCheck.prices,
      LaunchCheck.liveHashes,
      LaunchCheck.siteUrl,
      LaunchCheck.netlify,
      LaunchCheck.analytics,
      LaunchCheck.contact,
      LaunchCheck.publisher,
      LaunchCheck.badge,
    ].flatMap((gate) => gate());
  }

  static defaultRoots() {
    const src = path.resolve("src");
    const out = path.resolve("out");
    if (!fs.existsSync(src)) {
      console.error("check:launch: missing src/");
      return null;
    }
    return fs.existsSync(out) ? [src, out] : [src];
  }

  static run(roots, project) {
    const problems = [];
    for (const check of LaunchCheck.checks) problems.push(...check(roots));
    if (project) problems.push(...LaunchCheck.projectGates());
    if (problems.length > 0) {
      console.error(`check:launch: ${problems.length} problem(s)`);
      for (const problem of problems) console.error(`  ${problem}`);
      return 1;
    }
    console.log("check:launch: ok");
    return 0;
  }
}

function rootsFromArgv(argv) {
  const flag = argv.indexOf("--root");
  if (flag === -1) return { roots: LaunchCheck.defaultRoots(), project: true };
  const root = argv[flag + 1];
  if (!root || !fs.existsSync(root)) {
    console.error(`check:launch: missing ${root ?? "--root"}`);
    return { roots: null, project: false };
  }
  return { roots: [path.resolve(root)], project: false };
}

const { roots, project } = rootsFromArgv(process.argv.slice(2));
if (!roots) process.exit(1);
process.exit(LaunchCheck.run(roots, project));
