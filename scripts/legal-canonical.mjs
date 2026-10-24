import fs from "node:fs";
import path from "node:path";

/** Next adds a trailing slash. The legal canonicals stay on SITE_URL without one. */
const source = fs.readFileSync(path.resolve("src/lib/site.ts"), "utf8");
const site = source.match(/SITE_URL = "([^"]+)"/);
if (!site) throw new Error("SITE_URL missing");

const pages = ["privacy", "terms", "mentions-legales"];
for (const page of pages) {
  const file = path.join("out", page, "index.html");
  const html = fs.readFileSync(file, "utf8");
  const from = `${site[1]}/${page}/`;
  const to = `${site[1]}/${page}`;
  const next = html.replaceAll(from, to);
  if (next === html || !next.includes(`href="${to}"`)) {
    throw new Error(`canonical not rewritten for ${page}`);
  }
  fs.writeFileSync(file, next);
}

console.log("legal canonicals: https://lingumaster.app/<path>");
