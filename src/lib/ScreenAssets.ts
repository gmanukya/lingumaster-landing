import manifest from "@/generated/screens.json";

export type ScreenName = "hero-library" | "shot-library" | "shot-reader";

export type ScreenAsset = {
  src: string;
  avifSrcSet: string;
  webpSrcSet: string;
  sizes: string;
  width: number;
  height: number;
};

const files = manifest as Record<ScreenName, ScreenAsset | null>;

export class ScreenAssets {
  static readonly width = 1290;
  static readonly height = 2796;
  static readonly names: readonly ScreenName[] = [
    "hero-library",
    "shot-library",
    "shot-reader",
  ];

  static asset(name: ScreenName): ScreenAsset | null {
    return files[name];
  }

  static altSlot(name: ScreenName): string {
    if (name === "hero-library") return "hero.imageAlt";
    if (name === "shot-library") return "captures[0].alt";
    return "captures[1].alt";
  }
}
