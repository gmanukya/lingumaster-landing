import { badgeTapEvent, viewEvent } from "./events";
import { selectAdapter } from "./registry";
import type { AnalyticsAdapter, Event } from "./types";

let viewed = false;
const adapter: AnalyticsAdapter = selectAdapter(process.env.NEXT_PUBLIC_ANALYTICS);

function safeSend(event: Event): void {
  try {
    adapter.send(event);
  } catch {
    // never throw, never block navigation
  }
}

/** One view per document load. Call after first paint. */
export function sendView(): void {
  if (viewed) return;
  viewed = true;
  safeSend(viewEvent());
}

/**
 * Badge tap from a pointer or keyboard event target.
 * Returns without sending when the target is not a [data-placement] CTA.
 */
export function sendBadgeTap(target: EventTarget | null): void {
  const placement = readPlacement(target);
  if (!placement) return;
  safeSend(badgeTapEvent(placement));
}

export function readPlacement(target: EventTarget | null): "hero" | "final" | null {
  const element = asElement(target);
  if (!element) return null;
  const slot = element.closest("[data-placement]");
  const value = slot?.getAttribute("data-placement");
  if (value === "hero" || value === "final") return value;
  return null;
}

function asElement(target: EventTarget | null): Element | null {
  if (!target || typeof target !== "object") return null;
  if ("closest" in target && typeof (target as Element).closest === "function") {
    return target as Element;
  }
  if ("parentElement" in target) {
    const parent = (target as { parentElement?: Element | null }).parentElement;
    return parent ?? null;
  }
  return null;
}
