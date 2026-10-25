import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { BrandMarks, parseIco, pngInfo } from "./generate-brand.mjs";

const masterHash = "1b986819db39800c86398e90a4bf2a4ddb05db936fb1a1e4e37699e398ef8d63";

test("the master sits outside public/ and matches the recorded hash", () => {
  assert.equal(BrandMarks.master.includes(`${path.sep}public${path.sep}`), false);
  const bytes = fs.readFileSync(BrandMarks.master);
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), masterHash);
  assert.equal(BrandMarks.recorded(), masterHash);
  const note = fs.readFileSync(path.resolve("src/assets/brand/SOURCE.txt"), "utf8");
  assert.match(note, /TikTok profile picture, given by Gor, 25 Oct 2026/);
  assert.throws(() => BrandMarks.assertMaster(bytes, "f".repeat(64), { width: 951, height: 949, hasAlpha: false }), /hash mismatch/);
  assert.throws(
    () => BrandMarks.assertMaster(bytes, masterHash, { width: 951, height: 950, hasAlpha: false }),
    /951x950/,
  );
});

test("the square crop is the top-left 949 and the head crop is the measured box", async () => {
  const sharp = (await import("sharp")).default;
  const bytes = fs.readFileSync(BrandMarks.master);
  const original = await sharp(bytes).rotate().raw().toBuffer({ resolveWithObject: true });
  const channels = original.info.channels;
  const pixel = (buffer, info, x, y) => buffer.subarray((y * info.width + x) * channels, (y * info.width + x) * channels + 3);
  const square = await sharp(bytes).rotate().extract(BrandMarks.square).raw().toBuffer({ resolveWithObject: true });
  assert.equal(square.info.width, 949);
  assert.equal(square.info.height, 949);
  assert.deepEqual(pixel(square.data, square.info, 0, 0), pixel(original.data, original.info, 0, 0));
  assert.deepEqual(pixel(square.data, square.info, 948, 0), pixel(original.data, original.info, 948, 0));
  const head = await sharp(bytes).rotate().extract(BrandMarks.head).raw().toBuffer({ resolveWithObject: true });
  assert.equal(head.info.width, 720);
  assert.equal(head.info.height, 720);
  assert.deepEqual(pixel(head.data, head.info, 0, 0), pixel(original.data, original.info, 110, 30));
});

test("derived files match the master hash, sizes, and byte budgets", async () => {
  const sharp = (await import("sharp")).default;
  const first = await BrandMarks.build();
  const hashes = new Map(first.map(([rel]) => [rel, crypto.createHash("sha256").update(fs.readFileSync(path.resolve(rel))).digest("hex")]));
  await BrandMarks.build();
  for (const [rel, digest] of hashes) {
    const again = crypto.createHash("sha256").update(fs.readFileSync(path.resolve(rel))).digest("hex");
    assert.equal(again, digest, rel);
    assert.notEqual(digest, masterHash, rel);
  }
  for (const [rel, size] of BrandMarks.header) {
    const bytes = fs.readFileSync(path.resolve(rel));
    const meta = await sharp(bytes).metadata();
    assert.equal(meta.format, "webp", rel);
    assert.equal(meta.width, size, rel);
    assert.equal(meta.height, size, rel);
    assert.equal(meta.hasAlpha, false, rel);
    assert.ok(bytes.length <= BrandMarks.webpBudget, `${rel} is ${bytes.length}`);
  }
  const ico = fs.readFileSync(path.resolve("src/app/favicon.ico"));
  assert.ok(ico.length <= BrandMarks.icoBudget, `favicon.ico is ${ico.length}`);
  const images = parseIco(ico);
  assert.deepEqual(images.map((image) => image.width), [16, 32, 48]);
  for (const image of images) {
    const info = pngInfo(image.data);
    assert.equal(info.colorType, 6, `favicon ${image.width}`);
    assert.equal(info.width, image.width);
    assert.equal(await BrandMarks.minAlpha(sharp, image.data), 255, `favicon ${image.width}`);
  }
  const icon = fs.readFileSync(path.resolve("src/app/icon.png"));
  const iconInfo = pngInfo(icon);
  assert.equal(iconInfo.width, 192);
  assert.equal(iconInfo.height, 192);
  assert.equal(iconInfo.alpha, false);
  assert.ok(icon.length <= BrandMarks.iconBudget, `icon.png is ${icon.length}`);
  const apple = fs.readFileSync(path.resolve("src/app/apple-icon.png"));
  const appleInfo = pngInfo(apple);
  assert.equal(appleInfo.width, 180);
  assert.equal(appleInfo.height, 180);
  assert.equal(appleInfo.colorType, 2);
  assert.equal(appleInfo.alpha, false);
  assert.ok(apple.length <= BrandMarks.appleBudget, `apple-icon.png is ${apple.length}`);
});

test("the header is the mark plus the wordmark slot and is not a link", () => {
  const header = fs.readFileSync(path.resolve("src/components/Header.tsx"), "utf8");
  const notFound = fs.readFileSync(path.resolve("src/components/NotFoundPage.tsx"), "utf8");
  assert.equal(header.includes("next/link"), false);
  assert.equal(header.includes("<a"), false);
  assert.equal(header.includes('Copy.text("wordmark")'), true);
  assert.equal(header.includes('alt=""'), true);
  assert.equal(header.includes('sizes="(min-width:1024px) 40px, 32px"'), true);
  assert.equal(notFound.includes("<img"), false);
  assert.equal(notFound.includes("/brand/"), false);
  assert.equal(notFound.includes('from "./Header"'), false);
});
