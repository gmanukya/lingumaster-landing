import type { ScreenName } from "@/lib/ScreenAssets";
import { placeholders } from "./fr";

/** Visible placeholder chrome from the design spec. Not writer copy. */
export class Placeholders {
  static title(): string {
    return placeholders.title;
  }

  static caption(name: ScreenName): string {
    return placeholders[name];
  }
}
