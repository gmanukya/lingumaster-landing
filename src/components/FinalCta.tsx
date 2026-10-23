import { Copy } from "@/content/Copy";
import { SiteConfig } from "@/config";
import { PriceLine } from "./PriceLine";
import { StoreBadge } from "./StoreBadge";
import styles from "./FinalCta.module.css";

export function FinalCta() {
  return (
    <section className={`${styles.section} rise`} data-section="final-cta">
      <h2 className={styles.title}>{Copy.text("finalCta.headline")}</h2>
      <div className={styles.row}>
        <p className={styles.label}>{Copy.text("finalCta.ctaLabel")}</p>
        {SiteConfig.finalCta === "badge" ? <StoreBadge placement="final" /> : null}
      </div>
      <PriceLine />
    </section>
  );
}
