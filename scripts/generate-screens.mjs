import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const FORBIDDEN = new Set([
  "11149a34297bf60334715a28492d525e2a50fb74368a02ff2884fa1a184107d6",
  "07b91a6c1bcf874ebf4c8cf417faf8e01b3ec7cee0e53a53a8a7c4e728af8383",
]);

export class ScreenPipeline {
  static root = process.cwd();
  static sourceDir = path.join(process.cwd(), "src", "assets", "screens");
  static outDir = path.join(process.cwd(), "public", "screens");
  static manifestPath = path.join(process.cwd(), "src", "generated", "screens.json");
  static names = ["hero-library", "shot-library", "shot-reader"];
  static widths = {
    "hero-library": [480, 720, 960],
    "shot-library": [320, 480, 640, 900],
    "shot-reader": [320, 480, 640, 900],
  };
  static sizes = {
    "hero-library": "(min-width: 1024px) 326px, 232px",
    "shot-library": "(min-width: 1024px) 296px, 151px",
    "shot-reader": "(min-width: 1024px) 296px, 151px",
  };
  static extensions = [".png", ".jpg", ".jpeg", ".webp", ".avif"];

  static hash(file) {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  }

  static assertAllowed(file) {
    const base = path.basename(file);
    if (/^live/i.test(base)) {
      throw new Error(`${file} uses a live* name`);
    }
    const digest = ScreenPipeline.hash(file);
    if (FORBIDDEN.has(digest)) {
      throw new Error(`${file} matches a forbidden live3/ss3 hash`);
    }
    return digest;
  }

  static sourceFor(name) {
    if (!fs.existsSync(ScreenPipeline.sourceDir)) return null;
    for (const ext of ScreenPipeline.extensions) {
      const file = path.join(ScreenPipeline.sourceDir, `${name}${ext}`);
      if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
    }
    return null;
  }

  static async build() {
    fs.rmSync(ScreenPipeline.outDir, { recursive: true, force: true });
    const manifest = {};
    let sharp = null;
    for (const name of ScreenPipeline.names) {
      const source = ScreenPipeline.sourceFor(name);
      if (!source) {
        manifest[name] = null;
        continue;
      }
      ScreenPipeline.assertAllowed(source);
      sharp ??= (await import("sharp")).default;
      fs.mkdirSync(ScreenPipeline.outDir, { recursive: true });
      const meta = await sharp(source).metadata();
      const width = meta.width ?? 0;
      const height = meta.height ?? 0;
      const avif = [];
      const webp = [];
      for (const target of ScreenPipeline.widths[name]) {
        const avifName = `${name}-${target}.avif`;
        const webpName = `${name}-${target}.webp`;
        const avifPath = path.join(ScreenPipeline.outDir, avifName);
        const webpPath = path.join(ScreenPipeline.outDir, webpName);
        const resize = { width: target, withoutEnlargement: true };
        await sharp(source).resize(resize).avif({ quality: 50, effort: 5 }).toFile(avifPath);
        await sharp(source).resize(resize).webp({ quality: 75 }).toFile(webpPath);
        ScreenPipeline.assertAllowed(avifPath);
        ScreenPipeline.assertAllowed(webpPath);
        avif.push(`/screens/${avifName} ${target}w`);
        webp.push(`/screens/${webpName} ${target}w`);
      }
      const largest = ScreenPipeline.widths[name].at(-1);
      manifest[name] = {
        src: `/screens/${name}-${largest}.webp`,
        avifSrcSet: avif.join(", "),
        webpSrcSet: webp.join(", "),
        sizes: ScreenPipeline.sizes[name],
        width,
        height,
      };
      console.log(`${name} ${width}x${height} from ${path.basename(source)}`);
    }
    fs.mkdirSync(path.dirname(ScreenPipeline.manifestPath), { recursive: true });
    fs.writeFileSync(ScreenPipeline.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const ready = ScreenPipeline.names.filter((name) => manifest[name]).length;
    console.log(`screens: ${ready} capture(s), ${ScreenPipeline.names.length - ready} placeholder(s)`);
  }
}

await ScreenPipeline.build();
