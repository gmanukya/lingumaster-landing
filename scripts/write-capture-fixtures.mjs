import fs from "node:fs";
import path from "node:path";

const sharp = (await import("sharp")).default;
const root = path.resolve("scripts/fixtures");
const band = path.join(root, "band");
const raw = path.join(root, "raw-shot2");
fs.mkdirSync(band, { recursive: true });
fs.mkdirSync(raw, { recursive: true });

const width = 32;
const height = 2796;
const flat = Buffer.alloc(width * height * 3, 0);
for (let index = 0; index < width * height; index += 1) {
  flat[index * 3] = 10;
  flat[index * 3 + 1] = 10;
  flat[index * 3 + 2] = 14;
}
await sharp(flat, { raw: { width, height, channels: 3 } }).png().toFile(path.join(band, "flat.png"));

const uneven = Buffer.from(flat);
for (let x = 4; x < 20; x += 1) {
  const offset = (40 * width + x) * 3;
  uneven[offset] = 250;
  uneven[offset + 1] = 250;
  uneven[offset + 2] = 250;
}
await sharp(uneven, { raw: { width, height, channels: 3 } }).png().toFile(path.join(band, "uneven.png"));

const green = Buffer.from(flat);
for (let y = 20; y < 40; y += 1) {
  for (let x = 8; x < 16; x += 1) {
    const offset = (y * width + x) * 3;
    green[offset] = 40;
    green[offset + 1] = 220;
    green[offset + 2] = 40;
  }
}
await sharp(green, { raw: { width, height, channels: 3 } }).png().toFile(path.join(band, "green.png"));

await sharp({
  create: { width: 8, height: 8, channels: 3, background: { r: 20, g: 20, b: 20 } },
}).png().toFile(path.join(raw, "shot2.png"));

console.log("capture fixtures written");
