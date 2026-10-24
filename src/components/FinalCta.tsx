import { Copy } from "@/content/Copy";
import { SiteConfig } from "@/config";
import { appStoreUrl } from "@/lib/campaign";
import { StoreBadge } from "./StoreBadge";
import styles from "./FinalCta.module.css";

export function FinalCta() {
  const label = Copy.text("finalCta.label");
  return (
    <section className={styles.final} aria-labelledby="final-title">
      <div className={`${styles.inner} wrap`}>
        <h2 id="final-title" className={styles.title}>
          {Copy.text("finalCta.headline")}
        </h2>
        {SiteConfig.finalCta === "text" ? (
          <p className={styles.label}>
            <a
              className={styles.textLink}
              href={appStoreUrl("final")}
              data-placement="final"
              suppressHydrationWarning
            >
              {label}
            </a>
          </p>
        ) : (
          <>
            <p className={styles.label}>{label}</p>
            <div className={styles.badge}>
              <StoreBadge placement="final" />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
