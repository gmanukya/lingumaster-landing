import styles from "./StoreBadge.module.css";

type Placement = "hero" | "final";

/** Placeholder slot. The App Store badge itself arrives in task (b). */
export function StoreBadge({ placement }: { placement: Placement }) {
  return (
    <div
      className={styles.slot}
      data-placement={placement}
      data-store-badge=""
      aria-hidden="true"
    />
  );
}
