import { debugAdapter } from "./debug";
import { noopAdapter } from "./noop";
import type { AnalyticsAdapter } from "./types";

/**
 * NEXT_PUBLIC_ANALYTICS selects one of these names.
 * noop and debug are built. counter, plausible and umami are reserved for
 * D3: add the adapter in its own file and return it from selectAdapter.
 * Until then every unbuilt or unknown value falls back to noop and does not throw.
 */
export const ADAPTER_NAMES = ["noop", "debug", "counter", "plausible", "umami"] as const;

export type AdapterName = (typeof ADAPTER_NAMES)[number];

export function selectAdapter(name: string | undefined): AnalyticsAdapter {
  try {
    if (name === "debug") return debugAdapter;
    return noopAdapter;
  } catch {
    return noopAdapter;
  }
}
