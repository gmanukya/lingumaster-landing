import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const FORBIDDEN = {
  live3: "11149a34297bf60334715a28492d525e2a50fb74368a02ff2884fa1a184107d6",
  ss3: "07b91a6c1bcf874ebf4c8cf417faf8e01b3ec7cee0e53a53a8a7c4e728af8383",
};

export class ScreenGuard {
  static skip = new Set([".git", "node_modules", ".next"]);

  static *walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ScreenGuard.skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) yield* ScreenGuard.walk(full);
      else if (entry.isFile()) yield full;
    }
  }

  static hash(file) {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  }

  static check(root = process.cwd()) {
    const forbidden = new Set(Object.values(FORBIDDEN));
    const hits = [];
    let files = 0;
    for (const file of ScreenGuard.walk(root)) {
      files += 1;
      const base = path.basename(file);
      if (/^live/i.test(base) || /(^|[^a-z0-9])(live3|ss3)([^a-z0-9]|$)/i.test(base)) {
        hits.push(`name ${path.relative(root, file)}`);
      }
      const digest = ScreenGuard.hash(file);
      if (forbidden.has(digest)) hits.push(`hash ${path.relative(root, file)} ${digest}`);
    }
    if (hits.length > 0) {
      console.error(hits.join("\n"));
      console.error("screen guard: live* / live3 / ss3 found");
      process.exit(1);
    }
    console.log(`screen guard: ${files} files checked, live* / live3 / ss3 absent`);
  }
}

ScreenGuard.check();
