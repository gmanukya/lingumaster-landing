import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Official owl, cropped from the master JPEG. No SVG and no redraw.
 * Square crop is 949×949 from the top-left of the 951×949 master.
 * The tight head crop is the measured box x 110–830, y 30–750.
 * CSS rounds the header mark; no file has an alpha channel.
 */
export class BrandMarks {
  static master = path.resolve("src/assets/brand/lingumaster-logo-official.jpg");
  static hashFile = path.resolve("src/assets/brand/lingumaster-logo-official.jpg.sha256");
  static width = 951;
  static height = 949;
  static square = { left: 0, top: 0, width: 949, height: 949 };
  static head = { left: 110, top: 30, width: 720, height: 720 };
  static webpBudget = 4096;
  static icoBudget = 15 * 1024;
  static iconBudget = 40 * 1024;
  static appleBudget = 60 * 1024;
  static header = [
    ["public/brand/logo-64.webp", 64],
    ["public/brand/logo-80.webp", 80],
    ["public/brand/logo-96.webp", 96],
    ["public/brand/logo-120.webp", 120],
  ];

  static digest(bytes) {
    return crypto.createHash("sha256").update(bytes).digest("hex");
  }

  static recorded() {
    const hash = fs.readFileSync(BrandMarks.hashFile, "utf8").trim().split(/\s+/)[0] ?? "";
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error(`brand sha256 file is not a 64-character hex digest: ${BrandMarks.hashFile}`);
    }
    return hash;
  }

  static assertMaster(bytes, recorded, meta) {
    const actual = BrandMarks.digest(bytes);
    if (actual !== recorded) {
      throw new Error(`brand hash mismatch\n  expected ${recorded}\n  actual   ${actual}`);
    }
    if (meta.width !== BrandMarks.width || meta.height !== BrandMarks.height) {
      throw new Error(`brand master is ${meta.width}x${meta.height}, expected ${BrandMarks.width}x${BrandMarks.height}`);
    }
    if (meta.hasAlpha) throw new Error("brand master has an alpha channel");
    if (BrandMarks.square.width !== BrandMarks.square.height) throw new Error("square crop is not square");
    if (BrandMarks.head.width !== BrandMarks.head.height) throw new Error("head crop is not square");
    if (BrandMarks.square.left + BrandMarks.square.width > meta.width) throw new Error("square crop exceeds the master");
    if (BrandMarks.square.top + BrandMarks.square.height > meta.height) throw new Error("square crop exceeds the master");
    if (BrandMarks.head.left + BrandMarks.head.width > meta.width) throw new Error("head crop exceeds the master");
    if (BrandMarks.head.top + BrandMarks.head.height > meta.height) throw new Error("head crop exceeds the master");
  }

  static async pipeline(sharp, bytes, crop, size) {
    return sharp(bytes).rotate().extract(crop).resize(size, size, { fit: "fill", kernel: "lanczos3" }).flatten({
      background: "#91af93",
    });
  }

  static async webp(sharp, bytes, size) {
    const base = () => BrandMarks.pipeline(sharp, bytes, BrandMarks.square, size);
    const lossless = await (await base()).webp({ lossless: true, effort: 6 }).toBuffer();
    if (lossless.length <= BrandMarks.webpBudget) return lossless;
    for (const quality of [80, 75, 70, 60]) {
      const lossy = await (await base()).webp({ quality, effort: 6, smartSubsample: false }).toBuffer();
      if (lossy.length <= BrandMarks.webpBudget) return lossy;
    }
    const last = await (await base()).webp({ quality: 60, effort: 6 }).toBuffer();
    throw new Error(`logo-${size}.webp is ${last.length} bytes, budget ${BrandMarks.webpBudget}`);
  }

  static async png(image, { palette, colours, quality }) {
    const pipeline = await image;
    const options = { compressionLevel: 9, adaptiveFiltering: true, palette };
    if (palette) {
      options.effort = 10;
      options.colours = colours;
      options.quality = quality;
      options.dither = 0.6;
    }
    return stripOpaqueTrns(await pipeline.png(options).toBuffer());
  }

  static async iconPng(sharp, bytes, size, crop) {
    const make = (options) => BrandMarks.png(BrandMarks.pipeline(sharp, bytes, crop, size), options);
    const lossless = await make({ palette: false });
    if (!pngInfo(lossless).alpha && lossless.length <= BrandMarks.iconBudget) return lossless;
    for (const colours of [256, 192, 128, 96]) {
      const paletted = await make({ palette: true, colours, quality: 90 });
      const info = pngInfo(paletted);
      if (!info.alpha && paletted.length <= BrandMarks.iconBudget) return paletted;
    }
    const last = await make({ palette: true, colours: 64, quality: 70 });
    throw new Error(`icon.png ${size}px is ${last.length} bytes, budget ${BrandMarks.iconBudget}`);
  }

  static async minAlpha(sharp, png) {
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    if (info.channels < 4) return 255;
    let min = 255;
    for (let index = info.channels - 1; index < data.length; index += info.channels) {
      if (data[index] < min) min = data[index];
    }
    return min;
  }

  static async applePng(sharp, bytes) {
    const image = () => BrandMarks.pipeline(sharp, bytes, BrandMarks.square, 180);
    const lossless = await BrandMarks.png(image(), { palette: false });
    const info = pngInfo(lossless);
    if (info.alpha) throw new Error("apple-icon.png has alpha");
    if (info.colorType !== 2) throw new Error(`apple-icon.png color type is ${info.colorType}, expected RGB`);
    if (lossless.length <= BrandMarks.appleBudget) return lossless;
    const paletted = await BrandMarks.png(image(), { palette: true, colours: 256, quality: 95 });
    if (pngInfo(paletted).alpha) throw new Error("apple-icon.png palette has alpha");
    if (paletted.length > BrandMarks.appleBudget) {
      throw new Error(`apple-icon.png is ${paletted.length} bytes, budget ${BrandMarks.appleBudget}`);
    }
    return paletted;
  }

  static async build() {
    const sharp = (await import("sharp")).default;
    const bytes = fs.readFileSync(BrandMarks.master);
    const meta = await sharp(bytes).metadata();
    BrandMarks.assertMaster(bytes, BrandMarks.recorded(), meta);
    fs.mkdirSync(path.resolve("public/brand"), { recursive: true });
    const written = [];
    for (const [rel, size] of BrandMarks.header) {
      const webp = await BrandMarks.webp(sharp, bytes, size);
      const info = await sharp(webp).metadata();
      if (info.width !== size || info.height !== size || info.hasAlpha || info.format !== "webp") {
        throw new Error(`${rel} is ${info.format} ${info.width}x${info.height} alpha=${info.hasAlpha}`);
      }
      const dest = path.resolve(rel);
      fs.writeFileSync(dest, webp);
      written.push([rel, webp.length, `${size}x${size}`]);
    }
    const icoPngs = [];
    for (const size of [16, 32, 48]) {
      // Turbopack's ICO decoder rejects an RGB PNG ("The PNG is not in RGBA format").
      // The alpha channel is 255 for every pixel: nothing is transparent.
      const pipeline = await BrandMarks.pipeline(sharp, bytes, BrandMarks.head, size);
      const png = await pipeline.ensureAlpha(1).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
      const info = pngInfo(png);
      if (!info || info.width !== size || info.height !== size || info.colorType !== 6) {
        throw new Error(`favicon ${size} is not an RGBA ${size}px png`);
      }
      if (await BrandMarks.minAlpha(sharp, png) !== 255) throw new Error(`favicon ${size} has a transparent pixel`);
      icoPngs.push({ width: size, height: size, png });
    }
    const ico = writeIco(icoPngs);
    if (ico.length > BrandMarks.icoBudget) throw new Error(`favicon.ico is ${ico.length} bytes, budget ${BrandMarks.icoBudget}`);
    const icoFile = path.resolve("src/app/favicon.ico");
    fs.writeFileSync(icoFile, ico);
    written.push(["src/app/favicon.ico", ico.length, "16+32+48"]);
    const icon = await BrandMarks.iconPng(sharp, bytes, 192, BrandMarks.head);
    const iconInfo = pngInfo(icon);
    if (!iconInfo || iconInfo.width !== 192 || iconInfo.height !== 192 || iconInfo.alpha) {
      throw new Error("icon.png is not an opaque 192px png");
    }
    fs.writeFileSync(path.resolve("src/app/icon.png"), icon);
    written.push(["src/app/icon.png", icon.length, "192x192"]);
    const apple = await BrandMarks.applePng(sharp, bytes);
    const appleInfo = pngInfo(apple);
    if (!appleInfo || appleInfo.width !== 180 || appleInfo.height !== 180) {
      throw new Error("apple-icon.png is not 180px");
    }
    fs.writeFileSync(path.resolve("src/app/apple-icon.png"), apple);
    written.push(["src/app/apple-icon.png", apple.length, "180x180"]);
    for (const [rel, size, dims] of written) {
      console.log(`brand: ${dims} ${size}B ${rel}`);
    }
    return written;
  }
}

export function pngInfo(buf) {
  if (buf.length < 26 || buf.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colorType = buf[25];
  let trns = false;
  let offset = 8;
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "tRNS") trns = true;
    if (type === "IEND") break;
    offset += 12 + length;
  }
  return {
    width,
    height,
    colorType,
    alpha: colorType === 4 || colorType === 6 || trns,
  };
}

/** Drops a tRNS chunk when every entry is fully opaque. A real alpha stays. */
export function stripOpaqueTrns(png) {
  const info = pngInfo(png);
  if (!info?.alpha) return png;
  const chunks = [];
  let offset = 8;
  let opaque = true;
  let saw = false;
  while (offset + 8 <= png.length) {
    const length = png.readUInt32BE(offset);
    const end = offset + 12 + length;
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "tRNS") {
      saw = true;
      if ([...data].some((value) => value !== 255)) opaque = false;
    } else {
      chunks.push(png.subarray(offset, end));
    }
    if (type === "IEND") break;
    offset = end;
  }
  if (!saw || !opaque) return png;
  return Buffer.concat([png.subarray(0, 8), ...chunks]);
}

export function writeIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let cursor = 6 + count * 16;
  const entries = [];
  const parts = [header];
  for (const image of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(image.width >= 256 ? 0 : image.width, 0);
    entry.writeUInt8(image.height >= 256 ? 0 : image.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.png.length, 8);
    entry.writeUInt32LE(cursor, 12);
    entries.push(entry);
    cursor += image.png.length;
  }
  parts.push(...entries, ...images.map((image) => image.png));
  return Buffer.concat(parts);
}

export function parseIco(buf) {
  if (buf.length < 6 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) {
    throw new Error("not an ico");
  }
  const count = buf.readUInt16LE(4);
  const images = [];
  for (let index = 0; index < count; index += 1) {
    const base = 6 + index * 16;
    const width = buf[base] || 256;
    const height = buf[base + 1] || 256;
    const bytes = buf.readUInt32LE(base + 8);
    const offset = buf.readUInt32LE(base + 12);
    images.push({ width, height, data: buf.subarray(offset, offset + bytes) });
  }
  return images;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  await BrandMarks.build();
}
