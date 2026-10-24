import { allowlist, serialize } from "./payload";
import type { AnalyticsAdapter, Event } from "./types";

/**
 * Console logger for local checks. Selected only when
 * NEXT_PUBLIC_ANALYTICS=debug.
 *
 * When NEXT_PUBLIC_ANALYTICS_ENDPOINT is also set, the same allowlisted
 * payload is handed to navigator.sendBeacon (fetch keepalive if the
 * browser cannot queue the beacon). This is the dev collector path.
 * It stays inert unless debug is the selected adapter.
 * counter / plausible / umami are not this adapter.
 */
export const debugAdapter: AnalyticsAdapter = {
  send(event: Event): void {
    try {
      if (process.env.NEXT_PUBLIC_ANALYTICS !== "debug") return;
      const payload = allowlist(event);
      if (!payload) return;
      try {
        console.info("[analytics]", payload);
      } catch {
        // A broken console must not stop the beacon or throw.
      }
      const endpoint = collectorUrl();
      if (!endpoint) return;
      deliver(endpoint, serialize(payload));
    } catch {
      // never throw
    }
  },
};

function collectorUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  if (typeof value !== "string") return null;
  const url = value.trim();
  return url.length > 0 ? url : null;
}

function deliver(url: string, body: string): void {
  try {
    const sendBeacon = globalThis.navigator?.sendBeacon;
    if (typeof sendBeacon === "function" && sendBeacon.call(globalThis.navigator, url, body)) {
      return;
    }
  } catch {
    // fall through to fetch
  }
  try {
    if (typeof globalThis.fetch !== "function") return;
    void globalThis
      .fetch(url, {
        method: "POST",
        body,
        keepalive: true,
        credentials: "omit",
        cache: "no-store",
        mode: "cors",
        headers: { "content-type": "text/plain;charset=UTF-8" },
      })
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    // never throw
  }
}
