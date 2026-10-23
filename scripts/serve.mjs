import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".json": "application/json",
};

export class StaticServer {
  static root = path.resolve("out");

  static safe(rel) {
    const full = path.resolve(StaticServer.root, rel);
    if (full !== StaticServer.root && !full.startsWith(StaticServer.root + path.sep)) {
      return null;
    }
    return full;
  }

  static resolve(urlPath) {
    let decoded = "/";
    try {
      decoded = decodeURIComponent(urlPath.split("?")[0]);
    } catch {
      return null;
    }
    const rel = decoded.replace(/^\/+/, "");
    const candidates = rel === "" ? ["index.html"] : [rel, path.join(rel, "index.html")];
    if (rel !== "" && !path.extname(rel)) candidates.push(`${rel}.html`);
    for (const candidate of candidates) {
      const full = StaticServer.safe(candidate);
      if (full && fs.existsSync(full) && fs.statSync(full).isFile()) return full;
    }
    return null;
  }

  static send(res, status, file) {
    const body = fs.readFileSync(file);
    res.writeHead(status, {
      "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
    });
    res.end(body);
  }

  static start(port) {
    const server = http.createServer((req, res) => {
      const file = StaticServer.resolve(req.url ?? "/");
      if (file) {
        StaticServer.send(res, 200, file);
        return;
      }
      const notFound = path.join(StaticServer.root, "404.html");
      if (!fs.existsSync(notFound)) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }
      StaticServer.send(res, 404, notFound);
    });
    server.listen(port, "127.0.0.1");
    return server;
  }
}

const port = Number(process.env.PORT ?? 4173);
StaticServer.start(port);
console.log(`serving out/ at http://127.0.0.1:${port}`);
