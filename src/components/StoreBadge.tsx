import { Copy } from "@/content/Copy";
import { appStoreUrl, type Placement } from "@/lib/campaign";
import styles from "./StoreBadge.module.css";

/** Official French black App Store badge. The SVG bytes are checked at build. */
export function StoreBadge({ placement }: { placement: Placement }) {
  return (
    <a
      className={styles.badge}
      href={appStoreUrl(placement)}
      aria-label={Copy.text("badge.ariaLabel")}
      data-placement={placement}
      suppressHydrationWarning
    >
      <img
        src="/assets/badge-fr-black-official.svg"
        alt=""
        width={171}
        height={54}
        fetchPriority="low"
      />
    </a>
  );
}
