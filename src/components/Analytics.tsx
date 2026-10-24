"use client";

import { useEffect } from "react";
import { sendBadgeTap, sendView } from "@/lib/analytics/track";

/**
 * Counts a view after first paint and a badge tap on pointerdown (or a
 * keyboard click). Renders nothing. Does not call preventDefault or await.
 */
export function Analytics() {
  useEffect(() => {
    let live = true;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (live) sendView();
      });
    });

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      sendBadgeTap(event.target);
    };
    const onClick = (event: MouseEvent) => {
      if (event.detail !== 0) return;
      sendBadgeTap(event.target);
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    document.addEventListener("click", onClick, { capture: true, passive: true });

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
