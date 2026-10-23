import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const FORBIDDEN = new Set([
  "11149a34297bf60334715a28492d525e2a50fb74368a02ff2884fa1a184107d6",
  "07b91a6c1bcf874ebf4c8cf417faf8e01b3ec7cee0e53a53a8a7c4e728af8383",
]);

export class ScreenPipeline {
  static root = process.cwd();
  static outDir = path.join(process.cwd(), "public", "screens");
  static screens = [
    { id: "live1", width: 1242, height: 1568 },
    { id: "live2", width: 1242, height: 1550 },
  ];
  static densities = [1, 2, 3];
  static baseWidth = 414;

  static hash(file) {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  }

  static assertAllowed(file) {
    const digest = ScreenPipeline.hash(file);
    if (FORBIDDEN.has(digest)) {
      throw new Error(`${file} matches a forbidden live3/ss3 hash`);
    }
    return digest;
  }

  static async build() {
    fs.mkdirSync(ScreenPipeline.outDir, { recursive: true });
    for (const screen of ScreenPipeline.screens) {
      const source = path.join(ScreenPipeline.root, "assets", "screens", `${screen.id}.png`);
      ScreenPipeline.assertAllowed(source);
      const meta = await sharp(source).metadata();
      if (meta.width !== screen.width || meta.height !== screen.height) {
        throw new Error(
          `${screen.id} is ${meta.width}x${meta.height}, expected ${screen.width}x${screen.height}`,
        );
      }
      for (const density of ScreenPipeline.densities) {
        const width = ScreenPipeline.baseWidth * density;
        const avif = path.join(ScreenPipeline.outDir, `${screen.id}-${density}x.avif`);
        const webp = path.join(ScreenPipeline.outDir, `${screen.id}-${density}x.webp`);
        await sharp(source).resize({ width, withoutEnlargement: true }).avif({ quality: 48, effort: 5 }).toFile(avif);
        await sharp(source)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 70 })
          .toFile(webp);
        for (const file of [avif, webp]) {
          ScreenPipeline.assertAllowed(file);
          const rel = path.relative(ScreenPipeline.root, file);
          console.log(`${rel} ${fs.statSync(file).size} bytes`);
        }
      }
    }
  }
}

await ScreenPipeline.build();
