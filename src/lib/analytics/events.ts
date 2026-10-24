import { getSrc } from "../campaign";
import type { Event } from "./types";

/** Page view. src is the allowlisted campaign value from getSrc(). */
export function viewEvent(search?: string): Event {
  return { name: "view", src: getSrc(search) };
}

/** Badge tap. placement is the CTA slot, not a query parameter. */
export function badgeTapEvent(placement: "hero" | "final", search?: string): Event {
  return { name: "badge_tap", src: getSrc(search), placement };
}
