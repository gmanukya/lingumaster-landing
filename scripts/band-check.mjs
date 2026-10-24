import { BAND_SOURCE_ROWS, BAND_TOLERANCE, FRAME } from "./capture-slots.mjs";

/**
 * Necessary, not sufficient: the top 150/2796 of a decoded capture is one
 * flat colour, and that band has no saturated-green pixel.
 * A flat band still needs the visual check and the Designer sign-off.
 */
export class BandCheck {
  static async inspect(file) {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    const bandRows = Math.max(1, Math.round((height * BAND_SOURCE_ROWS) / FRAME.height));
    const rows = Math.min(bandRows, height);
    const count = rows * width;
    const reds = new Array(count);
    const greens = new Array(count);
    const blues = new Array(count);
    let saturatedGreen = 0;
    for (let index = 0; index < count; index += 1) {
      const offset = index * channels;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      reds[index] = red;
      greens[index] = green;
      blues[index] = blue;
      if (green > red + 60 && green > blue + 60) saturatedGreen += 1;
    }
    const medianRed = BandCheck.median(reds);
    const medianGreen = BandCheck.median(greens);
    const medianBlue = BandCheck.median(blues);
    let offMedian = 0;
    for (let index = 0; index < count; index += 1) {
      if (
        Math.abs(reds[index] - medianRed) > BAND_TOLERANCE ||
        Math.abs(greens[index] - medianGreen) > BAND_TOLERANCE ||
        Math.abs(blues[index] - medianBlue) > BAND_TOLERANCE
      ) {
        offMedian += 1;
      }
    }
    const aspect = width / height;
    const expected = FRAME.width / FRAME.height;
    return {
      width,
      height,
      bandRows: rows,
      saturatedGreen,
      offMedian,
      median: [medianRed, medianGreen, medianBlue],
      aspectDelta: Math.abs(aspect - expected) / expected,
    };
  }

  static median(values) {
    const sorted = values.slice().sort((left, right) => left - right);
    return sorted[Math.floor(sorted.length / 2)];
  }

  static async problems(file, label = file) {
    const report = await BandCheck.inspect(file);
    const hits = [];
    if (report.offMedian > 0) {
      hits.push(
        `band: ${label} top ${report.bandRows} rows are not one flat colour (${report.offMedian} px outside ±${BAND_TOLERANCE} of the median)`,
      );
    }
    if (report.saturatedGreen > 0) {
      hits.push(`band: ${label} has ${report.saturatedGreen} saturated-green px in the top band`);
    }
    return hits;
  }
}
