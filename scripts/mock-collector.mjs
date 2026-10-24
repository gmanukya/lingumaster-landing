import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

/**
 * Dev-only receiver for the debug adapter's beacon.
 * Not part of the production build and not a Netlify function.
 * It stores the JSON body and nothing else: no cookie, no IP, no user agent.
 *
 *   node scripts/mock-collector.mjs
 *   PORT=4174 ANALYTICS_FILE=/tmp/lm-events.json node scripts/mock-collector.mjs
 *
 * POST /collect   record one beacon
 * GET  /events    recorded bodies
 * POST /reset     clear the log
 */
export class MockCollector {
  static port = Number(process.env.PORT ?? 4174);
  static file =
    process.env.ANALYTICS_FILE ?? path.join(os.tmpdir(), "lingumaster-analytics-events.json");
  static events = [];
  static limit = 2048;

  static save() {
    const dir = path.dirname(MockCollector.file);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${MockCollector.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(MockCollector.events, null, 2));
    fs.renameSync(tmp, MockCollector.file);
  }

  static reset() {
    MockCollector.events = [];
    MockCollector.save();
  }

  static record(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return false;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    MockCollector.events.push(parsed);
    MockCollector.save();
    return true;
  }

  static async body(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MockCollector.limit) return null;
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }

  static headers(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Cache-Control", "no-store");
  }

  static async handle(req, res) {
    MockCollector.headers(res);
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === "GET" && url.pathname === "/events") {
      const body = JSON.stringify(MockCollector.events);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(body);
      return;
    }
    if (req.method === "POST" && url.pathname === "/reset") {
      MockCollector.reset();
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === "POST" && url.pathname === "/collect") {
      const text = await MockCollector.body(req);
      if (text === null || !MockCollector.record(text)) {
        res.writeHead(400);
        res.end();
        return;
      }
      res.writeHead(204);
      res.end();
      return;
    }
    res.writeHead(404);
    res.end();
  }

  static start() {
    MockCollector.reset();
    const server = http.createServer((req, res) => {
      void MockCollector.handle(req, res).catch(() => {
        if (!res.headersSent) res.writeHead(400);
        res.end();
      });
    });
    server.listen(MockCollector.port, "127.0.0.1");
    console.log(
      `mock collector on http://127.0.0.1:${MockCollector.port}/collect → ${MockCollector.file}`,
    );
    return server;
  }
}

MockCollector.start();
