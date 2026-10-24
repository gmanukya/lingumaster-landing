export type Payload = {
  name: "view" | "badge_tap";
  src: "tiktok_bio" | "landing_direct";
  placement?: "hero" | "final";
};

/** Copies only the allowlisted fields. Anything else is dropped. */
export function allowlist(input: unknown): Payload | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const name = record.name;
  const src = record.src;
  if (name !== "view" && name !== "badge_tap") return null;
  if (src !== "tiktok_bio" && src !== "landing_direct") return null;
  if (name === "view") return { name, src };
  const placement = record.placement;
  if (placement !== "hero" && placement !== "final") return null;
  return { name, src, placement };
}

/** JSON of an allowlisted payload. View events omit placement. */
export function serialize(payload: Payload): string {
  if (payload.name === "badge_tap" && payload.placement) {
    return JSON.stringify({
      name: payload.name,
      src: payload.src,
      placement: payload.placement,
    });
  }
  return JSON.stringify({ name: payload.name, src: payload.src });
}
