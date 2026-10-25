import { allowlist } from "./payload";
import type { AnalyticsAdapter, Event } from "./types";

/**
 * Production adapter for Umami Cloud. Selected only when
 * NEXT_PUBLIC_ANALYTICS=umami and NEXT_PUBLIC_UMAMI_WEBSITE_ID is a UUID.
 * Otherwise the registry keeps noop. send() never throws and never blocks.
 * The tracker script is loaded by the layout, not by this module.
 */

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const UMAMI_DOMAINS = "lingumaster.app";
export const UMAMI_RETRY_LIMIT = 3;
export const UMAMI_RETRY_MS = 500;

type TrackProps = Record<string, unknown>;

type UmamiTracker = {
  track: (event: string | ((props: TrackProps) => TrackProps), data?: Record<string, string>) => void;
};

export function isUmamiWebsiteId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value.trim());
}

/** Null unless both public env vars are valid. Never throws. */
export function umamiConfig(): { websiteId: string; domains: string } | null {
  try {
    if (process.env.NEXT_PUBLIC_ANALYTICS !== "umami") return null;
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    if (!isUmamiWebsiteId(websiteId)) return null;
    const override = process.env.NEXT_PUBLIC_UMAMI_DOMAINS?.trim();
    return {
      websiteId: websiteId.trim(),
      domains: override ? override : UMAMI_DOMAINS,
    };
  } catch {
    return null;
  }
}

function readUmami(): UmamiTracker | null {
  const scope = globalThis as typeof globalThis & { umami?: { track?: unknown } };
  if (typeof scope.umami?.track !== "function") return null;
  return scope.umami as UmamiTracker;
}

function pageUrl(src: Event["src"]): string {
  return "/" + (src === "tiktok_bio" ? "?src=tiktok_bio" : "");
}

function deliver(umami: UmamiTracker, event: Event): void {
  const payload = allowlist(event);
  if (!payload) return;
  if (payload.name === "badge_tap") {
    if (payload.placement !== "hero" && payload.placement !== "final") return;
    umami.track("badge_tap", { src: payload.src, placement: payload.placement });
    return;
  }
  const url = pageUrl(payload.src);
  umami.track((props) => ({ ...props, url }));
}

function attempt(event: Event, retriesLeft: number): void {
  try {
    const umami = readUmami();
    if (!umami) {
      if (retriesLeft <= 0) return;
      setTimeout(() => {
        attempt(event, retriesLeft - 1);
      }, UMAMI_RETRY_MS);
      return;
    }
    deliver(umami, event);
  } catch {
    // A missing or broken tracker must not throw or schedule further work.
  }
}

export const umamiAdapter: AnalyticsAdapter = {
  send(event: Event): void {
    try {
      if (!umamiConfig()) return;
      attempt(event, UMAMI_RETRY_LIMIT);
    } catch {
      // never throw, never block navigation
    }
  },
};
