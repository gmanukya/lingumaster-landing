import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { FRAME, RAW_HASHES, SLOTS, parseCaptures } from "./capture-slots.mjs";

const LIVE = new Set([
  "11149a34297bf60334715a28492d525e2a50fb74368a02ff2884fa1a184107d6",
  "07b91a6c1bcf874ebf4c8cf417faf8e01b3ec7cee0e53a53a8a7c4e728af8383",
]);

/**
 * AVIF quality 50. WebP quality 84.
 * Quality 75 leaves about 15 pixels in the flat status band 5 levels off
 * the median (libwebp chroma), which fails the ±3 band check. 84 is the
 * lowest quality at which the three largest WebP exports stay inside it.
 */
const AVIF_QUALITY = 50;
const WEBP_QUALITY = 84;

export class ScreenPipeline {
  static root = process.cwd();
  static masterDir = path.join(process.cwd(), "src", "assets", "screens", "masters");
  static capturesPath = path.join(process.cwd(), "src", "assets", "screens", "CAPTURES.md");
  static outDir = path.join(process.cwd(), "public", "screens");
  static manifestPath = path.join(process.cwd(), "src", "generated", "screens.json");

  static hash(file) {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  }

  static assertAllowed(file) {
    const base = path.basename(file);
    if (/^live/i.test(base) || /shot-today|hero-library|shot3|shot5-clean/i.test(base)) {
      throw new Error(`${file} is not an allowed capture`);
    }
    const digest = ScreenPipeline.hash(file);
    if (LIVE.has(digest) || Object.values(RAW_HASHES).includes(digest)) {
      throw new Error(`${file} matches a forbidden capture hash`);
    }
    return digest;
  }

  static provisionalMap() {
    const flags = new Map();
    if (!fs.existsSync(ScreenPipeline.capturesPath)) return flags;
    for (const row of parseCaptures(fs.readFileSync(ScreenPipeline.capturesPath, "utf8"))) {
      flags.set(row.slot, row.provisional === "yes");
    }
    return flags;
  }

  static async build() {
    fs.rmSync(ScreenPipeline.outDir, { recursive: true, force: true });
    fs.mkdirSync(ScreenPipeline.outDir, { recursive: true });
    const sharp = (await import("sharp")).default;
    const provisional = ScreenPipeline.provisionalMap();
    const manifest = {};
    for (const slot of SLOTS) {
      const source = path.join(ScreenPipeline.masterDir, slot.master);
      if (!fs.existsSync(source)) throw new Error(`missing cleaned master ${slot.master}`);
      const digest = ScreenPipeline.assertAllowed(source);
      if (digest !== slot.sha256) {
        throw new Error(`${slot.master} sha256 ${digest} does not match the cleaned master`);
      }
      const meta = await sharp(source).metadata();
      if (meta.width !== FRAME.width || meta.height !== FRAME.height) {
        throw new Error(`${slot.master} is ${meta.width}x${meta.height}, expected ${FRAME.width}x${FRAME.height}`);
      }
      const avif = [];
      const webp = [];
      for (const target of slot.widths) {
        const avifName = `${slot.name}-${target}.avif`;
        const webpName = `${slot.name}-${target}.webp`;
        await sharp(source)
          .resize({ width: target, withoutEnlargement: true })
          .avif({ quality: AVIF_QUALITY, effort: 5 })
          .toFile(path.join(ScreenPipeline.outDir, avifName));
        await sharp(source)
          .resize({ width: target, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(path.join(ScreenPipeline.outDir, webpName));
        avif.push(`/screens/${avifName} ${target}w`);
        webp.push(`/screens/${webpName} ${target}w`);
      }
      const largest = slot.widths.at(-1);
      fs.writeFileSync(path.join(ScreenPipeline.outDir, `${slot.name}.sha256`), `${digest}  ${slot.master}\n`);
      manifest[slot.name] = {
        src: `/screens/${slot.name}-${largest}.webp`,
        avifSrcSet: avif.join(", "),
        webpSrcSet: webp.join(", "),
        sizes: slot.sizes,
        width: FRAME.width,
        height: FRAME.height,
        provisional: provisional.get(slot.name) === true,
      };
      console.log(`${slot.name} ${FRAME.width}x${FRAME.height} from ${slot.master}`);
    }
    fs.mkdirSync(path.dirname(ScreenPipeline.manifestPath), { recursive: true });
    fs.writeFileSync(ScreenPipeline.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`screens: ${SLOTS.length} capture(s)`);
  }
}

await ScreenPipeline.build();
