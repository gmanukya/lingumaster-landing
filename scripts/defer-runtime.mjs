import fs from "node:fs";
import path from "node:path";

/**
 * The App Router runtime is not needed to paint the static page.
 * On a loopback trace those scripts finish before the H1 is painted, so
 * Lantern treats them as render-blocking. Start them 150 ms after parse,
 * after that text paint, and still before a reader would need hydration.
 */
export class RuntimeDeferral {
  static root = path.join(process.cwd(), "out");
  static scriptTag = /<script src="([^"]+)"([^>]*)><\/script>/g;
  static scriptPreload = /<link rel="preload" as="script"[^>]*>/g;

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
    if (html.includes("data-runtime-defer")) return html;
    const srcs = [];
    const next = html
      .replace(RuntimeDeferral.scriptTag, (_, src, attrs) => {
        srcs.push({ src, noModule: /noModule/i.test(attrs) });
        return "";
      })
      .replace(RuntimeDeferral.scriptPreload, "");
    if (srcs.length === 0) return html;
    const injector = `<script data-runtime-defer>setTimeout(function(){var srcs=${JSON.stringify(srcs.map((item) => item.src))};var nomodule=${JSON.stringify(srcs.map((item) => item.noModule))};for(var i=0;i<srcs.length;i++){var s=document.createElement("script");s.src=srcs[i];s.async=true;if(nomodule[i])s.noModule=true;document.body.appendChild(s);}},150);</script>`;
    return next.replace("</body>", `${injector}</body>`);
  }

  static run() {
    const files = RuntimeDeferral.files();
    let changed = 0;
    for (const file of files) {
      const html = fs.readFileSync(file, "utf8");
      const next = RuntimeDeferral.rewrite(html);
      if (next !== html) {
        fs.writeFileSync(file, next);
        changed += 1;
      }
    }
    console.log(`runtime: deferred scripts in ${changed} html file(s)`);
  }
}

RuntimeDeferral.run();
