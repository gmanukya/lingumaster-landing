import { debugAdapter } from "./debug";
import { noopAdapter } from "./noop";
import type { AnalyticsAdapter } from "./types";
import { umamiAdapter, umamiConfig } from "./umami";

/**
 * NEXT_PUBLIC_ANALYTICS selects the adapter.
 * The default is noop. debug is the local logger.
 * umami is the production adapter, returned only when the website id is a UUID.
 * A missing or invalid id stays on noop. counter and plausible are not built.
 * Anything unexpected falls back to noop and does not throw.
 */
export const ADAPTER_NAMES = ["noop", "debug", "umami"] as const;

export type AdapterName = (typeof ADAPTER_NAMES)[number];

export function selectAdapter(name: string | undefined): AnalyticsAdapter {
  try {
    if (name === "debug") return debugAdapter;
    if (name === "umami" && umamiConfig()) return umamiAdapter;
    return noopAdapter;
  } catch {
    return noopAdapter;
  }
}
