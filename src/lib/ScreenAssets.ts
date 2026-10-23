export type ScreenId = "live1" | "live2";
export type ScreenFormat = "avif" | "webp";

type ScreenMeta = {
  width: number;
  height: number;
};

/**
 * Cropped listing screens.
 * live1 keeps y 0–1567 and drops the bottom caption band.
 * live2 keeps y 658–2207 and drops the top caption band.
 * Files are 1×/2×/3× of the 414 pt screenshot width.
 */
export class ScreenAssets {
  static readonly live1: ScreenMeta = { width: 1242, height: 1568 };
  static readonly live2: ScreenMeta = { width: 1242, height: 1550 };
  static readonly densities = [1, 2, 3] as const;
  static readonly baseWidth = 414;

  static readonly heroSizes = "(min-width: 1024px) 420px, calc(100vw - 48px)";
  static readonly stripSizes =
    "(min-width: 1024px) 460px, calc((100vw - 60px) / 2)";

  static meta(id: ScreenId): ScreenMeta {
    return id === "live1" ? ScreenAssets.live1 : ScreenAssets.live2;
  }

  static widthFor(density: 1 | 2 | 3): number {
    return ScreenAssets.baseWidth * density;
  }

  static file(id: ScreenId, format: ScreenFormat, density: 1 | 2 | 3): string {
    return `/screens/${id}-${density}x.${format}`;
  }

  static srcSet(id: ScreenId, format: ScreenFormat): string {
    return ScreenAssets.densities
      .map((density) => {
        const width = ScreenAssets.widthFor(density);
        return `${ScreenAssets.file(id, format, density)} ${width}w`;
      })
      .join(", ");
  }
}
