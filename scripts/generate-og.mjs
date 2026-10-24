import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Copies the Designer OG bytes. Does not resize or re-encode. */
export class OgImage {
  static master = path.resolve("src/assets/og/og-1200x630.png");
  static hashFile = path.resolve("src/assets/og/og-1200x630.png.sha256");
  static dest = path.resolve("public/og.png");
  static width = 1200;
  static height = 630;
  static placeholderMark = "placeholder\0check:launch";
  static placeholderHash = "8815fccb0cfd3478a7731b3854defb58da9a2c691e51816a031751f8776e4cbc";

  static recorded() {
    const hash = fs.readFileSync(OgImage.hashFile, "utf8").trim().split(/\s+/)[0] ?? "";
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error(`og sha256 file is not a 64-character hex digest: ${OgImage.hashFile}`);
    }
    return hash;
  }

  static digest(bytes) {
    return crypto.createHash("sha256").update(bytes).digest("hex");
  }

  static dimensions(png) {
    const ihdr = png.subarray(12, 16).toString("ascii");
    if (png.length < 24 || png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || ihdr !== "IHDR") {
      throw new Error("og master is not a PNG");
    }
    return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  }

  static install() {
    const bytes = fs.readFileSync(OgImage.master);
    const expected = OgImage.recorded();
    const actual = OgImage.digest(bytes);
    if (actual !== expected) {
      throw new Error(`og hash mismatch\n  expected ${expected}\n  actual   ${actual}`);
    }
    if (bytes.includes(OgImage.placeholderMark) || actual === OgImage.placeholderHash) {
      throw new Error("og master is the temporary placeholder");
    }
    const { width, height } = OgImage.dimensions(bytes);
    if (width !== OgImage.width || height !== OgImage.height) {
      throw new Error(`og image is ${width}x${height}`);
    }
    fs.copyFileSync(OgImage.master, OgImage.dest);
    const copied = fs.readFileSync(OgImage.dest);
    if (!copied.equals(bytes)) throw new Error("og copy changed bytes");
    console.log(`og: ${width}x${height} ${actual} ${OgImage.dest}`);
  }
}

await OgImage.install();
