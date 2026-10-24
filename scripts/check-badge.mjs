import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Fails the build when the official badge bytes drift from the recorded sha256. */
export class BadgeCheck {
  static source = path.resolve("assets/badge-fr-black-official.svg");
  static hashFile = path.resolve("assets/badge-fr-black-official.svg.sha256");
  static dest = path.resolve("public/assets/badge-fr-black-official.svg");

  static recorded() {
    const text = fs.readFileSync(BadgeCheck.hashFile, "utf8").trim();
    const hash = text.split(/\s+/)[0] ?? "";
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error(`badge sha256 file is not a 64-character hex digest: ${BadgeCheck.hashFile}`);
    }
    return hash;
  }

  static digest(file) {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  }

  static run() {
    const expected = BadgeCheck.recorded();
    const actual = BadgeCheck.digest(BadgeCheck.source);
    if (actual !== expected) {
      console.error(`badge hash mismatch\n  expected ${expected}\n  actual   ${actual}`);
      process.exit(1);
    }
    fs.mkdirSync(path.dirname(BadgeCheck.dest), { recursive: true });
    fs.copyFileSync(BadgeCheck.source, BadgeCheck.dest);
    const copied = BadgeCheck.digest(BadgeCheck.dest);
    if (copied !== expected) {
      console.error(`copied badge hash mismatch\n  expected ${expected}\n  actual   ${copied}`);
      process.exit(1);
    }
    console.log(`badge: sha256 ${actual} matches`);
  }
}

BadgeCheck.run();
