import fs from "node:fs";
import path from "node:path";

/** Next adds a trailing slash. Canonicals and the sitemap stay on SITE_URL. */
const source = fs.readFileSync(path.resolve("src/lib/site.ts"), "utf8");
const site = source.match(/SITE_URL = "([^"]+)"/);
if (!site) throw new Error("SITE_URL missing");
const origin = site[1];

const pages = ["privacy", "terms", "mentions-legales"];
for (const page of pages) {
  const file = path.join("out", page, "index.html");
  const html = fs.readFileSync(file, "utf8");
  const from = `${origin}/${page}/`;
  const to = `${origin}/${page}`;
  const next = html.replaceAll(from, to);
  if (!next.includes(`href="${to}"`)) {
    throw new Error(`canonical not rewritten for ${page}`);
  }
  fs.writeFileSync(file, next);
}

const homePath = path.join("out", "index.html");
let home = fs.readFileSync(homePath, "utf8");
home = home.replaceAll(`${origin}/"`, `${origin}"`);
if (!home.includes(`rel="canonical" href="${origin}"`)) {
  throw new Error("home canonical is not the bare SITE_URL");
}
if (!home.includes(`property="og:url" content="${origin}"`)) {
  throw new Error("home og:url is not the bare SITE_URL");
}
if (!home.includes(`property="og:image" content="${origin}/og.png"`)) {
  throw new Error("home og:image is not absolute");
}
fs.writeFileSync(homePath, home);

const robotsPath = path.join("out", "robots.txt");
const robots = fs.readFileSync(robotsPath, "utf8").replace(/\r\n/g, "\n").trimEnd();
const lines = robots.split("\n").filter((line) => !line.startsWith("Sitemap:") && !line.startsWith("Host:"));
while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
lines.push("", `Sitemap: ${origin}/sitemap.xml`);
const robotsNext = `${lines.join("\n")}\n`;
if (!robotsNext.endsWith(`Sitemap: ${origin}/sitemap.xml\n`)) {
  throw new Error("robots.txt sitemap line missing");
}
fs.writeFileSync(robotsPath, robotsNext);

const sitemapPath = path.join("out", "sitemap.xml");
const sitemap = fs.readFileSync(sitemapPath, "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);
const badLoc = locs.find(
  (loc) =>
    loc.includes("?") ||
    loc.includes("netlify.app") ||
    (loc !== origin && !loc.startsWith(`${origin}/`)),
);
if (locs.length === 0 || badLoc) {
  throw new Error(`sitemap.xml is not absolute${badLoc ? `: ${badLoc}` : ""}`);
}
fs.writeFileSync(sitemapPath, sitemap);

console.log("canonicals: https://lingumaster.app");
