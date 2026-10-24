import { Copy } from "@/content/Copy";
import styles from "./StoreBadge.module.css";

type Placement = "hero" | "final";

/** Empty slot sized for the official badge. Task (b) fills the artwork and the link. */
export function StoreBadge({ placement }: { placement: Placement }) {
  return (
    <div
      className={styles.slot}
      data-placement={placement}
      data-store-badge=""
      aria-hidden="true"
      aria-label={Copy.text("badge.ariaLabel")}
    />
  );
}
