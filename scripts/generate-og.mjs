import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/** Temporary share image: the wordmark on bg, flagged for check:launch. */
export class OgPlaceholder {
  static dest = path.resolve("public/og.png");
  static width = 1200;
  static height = 630;
  static mark = "placeholder\0check:launch";

  static wordmark() {
    const source = fs.readFileSync(path.resolve("src/content/fr.ts"), "utf8");
    const match = source.match(/wordmark:\s*"([^"]+)"/);
    if (!match) throw new Error("wordmark missing from src/content/fr.ts");
    return match[1];
  }

  static svg(text) {
    const safe = text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OgPlaceholder.width}" height="${OgPlaceholder.height}" viewBox="0 0 ${OgPlaceholder.width} ${OgPlaceholder.height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="600" y="345" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600" font-size="92" fill="#1d1d1f">${safe}</text>
</svg>`;
  }

  static crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }
    return (~crc) >>> 0;
  }

  static textChunk(keyword, value) {
    const data = Buffer.from(`${keyword}\0${value}`, "latin1");
    const type = Buffer.from("tEXt");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(OgPlaceholder.crc32(Buffer.concat([type, data])), 0);
    return Buffer.concat([length, type, data, crc]);
  }

  static markPng(png) {
    const end = png.lastIndexOf(Buffer.from("IEND"));
    if (end < 4) throw new Error("PNG IEND missing");
    const at = end - 4;
    const chunk = OgPlaceholder.textChunk("placeholder", "check:launch");
    return Buffer.concat([png.subarray(0, at), chunk, png.subarray(at)]);
  }

  static async build() {
    const text = OgPlaceholder.wordmark();
    const rendered = await sharp(Buffer.from(OgPlaceholder.svg(text)))
      .resize(OgPlaceholder.width, OgPlaceholder.height)
      .png()
      .toBuffer();
    const meta = await sharp(rendered).metadata();
    if (meta.width !== OgPlaceholder.width || meta.height !== OgPlaceholder.height) {
      throw new Error(`og image is ${meta.width}x${meta.height}`);
    }
    const marked = OgPlaceholder.markPng(rendered);
    if (!marked.includes(OgPlaceholder.mark)) throw new Error("og placeholder mark missing");
    fs.writeFileSync(OgPlaceholder.dest, marked);
    console.log(`og: ${OgPlaceholder.width}x${OgPlaceholder.height} placeholder ${OgPlaceholder.dest}`);
  }
}

await OgPlaceholder.build();
