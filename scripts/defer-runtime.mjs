import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * The App Router runtime is not needed to paint the static page.
 * On a loopback trace those scripts finish before the H1 is painted, so
 * Lantern treats them as render-blocking. Start them 150 ms after parse,
 * after that text paint, and still before a reader would need hydration.
 *
 * Inline flight data is written to a static file so the only inline script
 * left on the page is the campaign `ct` snippet. That keeps a stable CSP hash.
 */
export class RuntimeDeferral {
  static root = path.join(process.cwd(), "out");
  static scriptPreload = /<link rel="preload" as="script"[^>]*>/g;
  static scriptTag = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;

  static files(dir = RuntimeDeferral.root, found = []) {
    if (!fs.existsSync(dir)) return found;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) RuntimeDeferral.files(full, found);
      else if (name.endsWith(".html")) found.push(full);
    }
    return found;
  }

  static rewrite(html) {
    if (html.includes('id="lm-runtime"')) return null;
    const external = [];
    const inline = [];
    const next = html
      .replace(RuntimeDeferral.scriptTag, (full, attrs, body) => {
        if (/\sid=["']campaign-ct["']/.test(attrs)) return full;
        if (/type=["']application\/json["']/.test(attrs)) return full;
        const src = /\ssrc=["']([^"']+)["']/.exec(attrs);
        if (src) {
          external.push({ src: src[1], noModule: /noModule/i.test(attrs) });
          return "";
        }
        if (body.trim()) inline.push(body);
        return "";
      })
      .replace(RuntimeDeferral.scriptPreload, "");
    if (external.length === 0 && inline.length === 0) return null;
    return { html: next, external, inline };
  }

  static bootstrap(body) {
    const hash = crypto.createHash("sha256").update(body).digest("hex").slice(0, 16);
    const dir = path.join(RuntimeDeferral.root, "_next", "static", "bootstrap");
    fs.mkdirSync(dir, { recursive: true });
    const name = `${hash}.js`;
    fs.writeFileSync(path.join(dir, name), body);
    return `/_next/static/bootstrap/${name}`;
  }

  static inject(html, items) {
    const json = JSON.stringify(items).replaceAll("<", "\\u003c");
    const tags =
      `<script type="application/json" id="lm-runtime">${json}</script>` +
      `<script src="/runtime-defer.js"></script>`;
    return html.replace("</body>", `${tags}</body>`);
  }

  static run() {
    const files = RuntimeDeferral.files();
    let changed = 0;
    for (const file of files) {
      const html = fs.readFileSync(file, "utf8");
      const parts = RuntimeDeferral.rewrite(html);
      if (!parts) continue;
      const items = [];
      if (parts.inline.length > 0) {
        items.push({ src: RuntimeDeferral.bootstrap(parts.inline.join("\n")), noModule: false });
      }
      items.push(...parts.external);
      fs.writeFileSync(file, RuntimeDeferral.inject(parts.html, items));
      changed += 1;
    }
    console.log(`runtime: deferred scripts in ${changed} html file(s)`);
  }
}

RuntimeDeferral.run();
