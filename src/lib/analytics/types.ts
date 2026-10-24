/**
 * Cookieless counts. The payload is only these fields: no URL, referrer,
 * user agent, identifier or timestamp.
 */
export type Event = {
  name: "view" | "badge_tap";
  src: "tiktok_bio" | "landing_direct";
  placement?: "hero" | "final";
};

/** send() must never throw and must never block the caller. */
export interface AnalyticsAdapter {
  send(event: Event): void;
}
