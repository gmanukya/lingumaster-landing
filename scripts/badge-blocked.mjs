/**
 * Browser checks for the Umami tag. Run against a local production build that
 * was produced with NEXT_PUBLIC_ANALYTICS=umami and NEXT_PUBLIC_UMAMI_WEBSITE_ID
 * set to the example id. data-domains stays lingumaster.app, so 127.0.0.1 sends
 * nothing. Requires playwright-core and the system Chrome. Not part of npm test.
 *
 *   PLAYWRIGHT_CORE=/path/to/playwright-core/index.js node --test scripts/badge-blocked.mjs
 *
 * Never point this at https://lingumaster.app. Gateway requests are aborted.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { LaunchCheck } from "./check-launch.mjs";

const chrome = "/usr/bin/google-chrome";
const applePrefix = "https://apps.apple.com/fr/app/id6504011014";
const root = path.resolve("out");

function csp() {
  const toml = fs.readFileSync(path.resolve("netlify.toml"), "utf8");
  const doc = LaunchCheck.parseToml(toml);
  const star = doc.headers.find((header) => header.for === "/*");
  return String(star?.values?.["Content-Security-Policy"] ?? "");
}

function startServer(header) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const candidates = rel === "" ? ["index.html"] : [rel, path.join(rel, "index.html")];
    if (rel && !path.extname(rel)) candidates.push(`${rel}.html`);
    let file = null;
    for (const candidate of candidates) {
      const full = path.resolve(root, candidate);
      if (full.startsWith(root + path.sep) && fs.existsSync(full) && fs.statSync(full).isFile()) {
        file = full;
        break;
      }
    }
    const status = file ? 200 : 404;
    const body = fs.readFileSync(file ?? path.join(root, "404.html"));
    const ext = file ? path.extname(file) : ".html";
    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".svg": "image/svg+xml",
      ".woff2": "font/woff2",
      ".png": "image/png",
      ".webp": "image/webp",
      ".avif": "image/avif",
      ".ico": "image/x-icon",
    };
    const type = types[ext] ?? "application/octet-stream";
    res.writeHead(status, {
      "Content-Type": type,
      "Content-Length": body.length,
      "Cache-Control": "no-store",
      "Content-Security-Policy": header,
    });
    res.end(body);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function openBrowser() {
  const specifier = process.env.PLAYWRIGHT_CORE;
  const loaded = specifier ? await import(pathToFileURL(specifier).href) : await import("playwright-core");
  const chromium = loaded.chromium ?? loaded.default?.chromium;
  if (!chromium) throw new Error("playwright-core did not export chromium");
  return chromium.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
}

function installApple(page, seen) {
  return page.route("https://apps.apple.com/**", async (route) => {
    seen.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>app-store</title><p>app store</p>",
    });
  });
}

async function tap(page, placement, ct) {
  const link = page.locator(`[data-placement="${placement}"]`);
  const href = await link.getAttribute("href");
  assert.ok(href?.startsWith(applePrefix), href ?? "");
  assert.equal(new URL(href).searchParams.get("ct"), ct);
  const started = Date.now();
  const errors = [];
  page.once("pageerror", (error) => errors.push(String(error)));
  await link.click();
  const elapsed = Date.now() - started;
  assert.ok(page.url().startsWith(applePrefix), page.url());
  const opened = new URL(page.url());
  assert.equal(opened.searchParams.get("ct"), ct);
  assert.equal(opened.searchParams.get("pt"), "107400811");
  assert.equal(opened.searchParams.get("mt"), "8");
  assert.ok(elapsed < 1000, `navigation took ${elapsed}ms`);
  assert.deepEqual(errors, []);
  return elapsed;
}

test("the production build has the Umami script tag before the browser checks", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const tags = LaunchCheck.umamiScriptTags(html);
  assert.equal(tags.length, 1, "rebuild with NEXT_PUBLIC_ANALYTICS=umami and the example website id");
  assert.deepEqual(LaunchCheck.umamiTagProblems(tags[0]), []);
});

test("a blocked, aborted, or 500 Umami script still opens the App Store immediately", async () => {
  const policy = csp();
  assert.match(policy, /https:\/\/cloud\.umami\.is/);
  assert.match(policy, /https:\/\/gateway\.umami\.is/);
  const { server, origin } = await startServer(policy);
  let browser;
  const modes = [
    {
      name: "aborted",
      arm(page) {
        return Promise.all([
          page.route("https://cloud.umami.is/**", (route) => route.abort()),
          page.route("https://gateway.umami.is/**", (route) => route.abort()),
        ]);
      },
    },
    {
      name: "status-500",
      arm(page) {
        return Promise.all([
          page.route("https://cloud.umami.is/**", (route) =>
            route.fulfill({ status: 500, contentType: "text/plain", body: "unavailable" }),
          ),
          page.route("https://gateway.umami.is/**", (route) => route.abort()),
        ]);
      },
    },
  ];
  try {
    browser = await openBrowser();
    for (const mode of modes) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const apple = [];
      await installApple(page, apple);
      await mode.arm(page);
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(String(error)));
      await page.goto(`${origin}/`, { waitUntil: "load", timeout: 15000 });
      await tap(page, "hero", "landing_direct");
      await page.goto(`${origin}/`, { waitUntil: "load", timeout: 15000 });
      await tap(page, "final", "landing_direct");
      await page.goto(`${origin}/?src=tiktok_bio`, { waitUntil: "load", timeout: 15000 });
      await page.waitForFunction(
        () => document.querySelector('[data-placement="hero"]')?.getAttribute("href")?.includes("ct=tiktok_bio"),
      );
      await tap(page, "hero", "tiktok_bio");
      assert.equal(pageErrors.length, 0, pageErrors.join("\n"));
      assert.equal(apple.length, 3, mode.name);
      await context.close();
    }

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const apple = [];
    await installApple(page, apple);
    await page.route("https://cloud.umami.is/**", (route) => route.abort());
    await page.route("https://gateway.umami.is/**", (route) => route.abort());
    await page.goto(`${origin}/`, { waitUntil: "load", timeout: 15000 });
    await context.setOffline(true);
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await tap(page, "hero", "landing_direct");
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("local host writes no cookies or storage and sends no Umami event", async () => {
  const policy = csp();
  const { server, origin } = await startServer(policy);
  let browser;
  try {
    browser = await openBrowser();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const gateway = [];
    const scriptHeaders = [];
    page.on("response", (response) => {
      if (response.url().startsWith("https://cloud.umami.is/script.js")) {
        scriptHeaders.push(response.headers());
      }
    });
    await page.route("https://gateway.umami.is/**", (route) => {
      gateway.push(route.request().method() + " " + route.request().url());
      return route.abort();
    });
    const apple = [];
    await installApple(page, apple);
    const cspViolations = [];
    const pageErrors = [];
    page.on("console", (message) => {
      const text = message.text();
      if (/content security policy|refused to/i.test(text)) cspViolations.push(text);
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    const response = await page.goto(`${origin}/`, { waitUntil: "load", timeout: 15000 });
    assert.equal(response?.headers()["content-security-policy"]?.includes("https://cloud.umami.is"), true);
    assert.equal(response?.headers()["content-security-policy"]?.includes("https://gateway.umami.is"), true);
    assert.equal(response?.headers()["content-security-policy"]?.includes("*"), false);
    await page.waitForTimeout(800);
    const before = await storageOf(page);
    await page.locator('[data-placement="hero"]').click();
    assert.ok(page.url().startsWith(applePrefix));
    await page.goto(`${origin}/`, { waitUntil: "load", timeout: 15000 });
    const after = await storageOf(page);
    assert.deepEqual(before, { cookies: "", local: [], session: [] });
    assert.deepEqual(after, { cookies: "", local: [], session: [] });
    assert.equal((await context.cookies()).length, 0);
    assert.deepEqual(gateway, []);
    assert.equal(scriptHeaders.length >= 1, true);
    assert.equal(scriptHeaders.some((headers) => headers["set-cookie"]), false);
    assert.deepEqual(cspViolations, []);
    assert.deepEqual(pageErrors, []);

    gateway.length = 0;
    const missing = await page.goto(`${origin}/this-page-is-not-real`, { waitUntil: "load", timeout: 15000 });
    assert.equal(missing?.status(), 404);
    await page.waitForTimeout(800);
    assert.deepEqual(gateway, []);
    const notFoundText = await page.locator("h1").innerText();
    assert.equal(notFoundText.length > 0, true);
    assert.equal(await page.locator("[data-placement]").count(), 0);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});

async function storageOf(page) {
  return page.evaluate(() => ({
    cookies: document.cookie,
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
}
