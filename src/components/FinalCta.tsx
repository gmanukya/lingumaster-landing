import { Copy } from "@/content/Copy";
import { SiteConfig } from "@/config";
import { StoreBadge } from "./StoreBadge";
import styles from "./FinalCta.module.css";

export function FinalCta() {
  return (
    <section className={styles.final} aria-labelledby="final-title">
      <div className={`${styles.inner} wrap`}>
        <h2 id="final-title" className={styles.title}>
          {Copy.text("finalCta.headline")}
        </h2>
        <p className={styles.label}>{Copy.text("finalCta.label")}</p>
        {SiteConfig.finalCta === "badge" ? (
          <div className={styles.badge}>
            <StoreBadge placement="final" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
