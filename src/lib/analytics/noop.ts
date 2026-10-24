import type { AnalyticsAdapter } from "./types";

/** Default adapter. No network, no console, no storage. */
export const noopAdapter: AnalyticsAdapter = {
  send() {},
};
