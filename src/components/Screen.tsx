import { Copy } from "@/content/Copy";
import { Placeholders } from "@/content/Placeholders";
import { ScreenAssets, type ScreenName } from "@/lib/ScreenAssets";
import styles from "./Screen.module.css";

type Variant = "hero" | "shot";

export function Screen({
  name,
  variant,
  onDark = false,
  priority = false,
}: {
  name: ScreenName;
  variant: Variant;
  onDark?: boolean;
  priority?: boolean;
}) {
  const asset = ScreenAssets.asset(name);
  const alt = Copy.text(ScreenAssets.altSlot(name));
  const className = [
    styles.device,
    styles[variant],
    onDark ? styles.onDark : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <span className={`${styles.button} ${styles.b1}`} aria-hidden="true" />
      <span className={`${styles.button} ${styles.b2}`} aria-hidden="true" />
      <span className={`${styles.button} ${styles.b3}`} aria-hidden="true" />
      <span className={`${styles.button} ${styles.b4}`} aria-hidden="true" />
      <div className={styles.bezel}>
        <div className={asset ? `${styles.screen} ${styles.filled}` : styles.screen}>
          {asset ? (
            <picture className={styles.picture}>
              <source type="image/avif" srcSet={asset.avifSrcSet} sizes={asset.sizes} />
              <img
                className={styles.photo}
                src={asset.src}
                srcSet={asset.webpSrcSet}
                sizes={asset.sizes}
                alt={alt}
                width={asset.width}
                height={asset.height}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
              />
            </picture>
          ) : (
            <>
              <svg
                className={styles.measure}
                data-placeholder="true"
                data-screen={name}
                width={ScreenAssets.width}
                height={ScreenAssets.height}
                viewBox={`0 0 ${ScreenAssets.width} ${ScreenAssets.height}`}
                role="img"
                aria-label={alt}
                focusable="false"
              >
                <rect width={ScreenAssets.width} height={ScreenAssets.height} fill="none" />
              </svg>
              <svg className={styles.glyph} viewBox="0 0 30 24" fill="none" aria-hidden="true">
                <rect
                  x="0.75"
                  y="0.75"
                  width="28.5"
                  height="22.5"
                  rx="5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="9" cy="8" r="2.5" fill="currentColor" />
                <path
                  d="M3 20l7.5-7 5 4.5 4-3.5L27 20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <p className={styles.phTitle} aria-hidden="true">
                {Placeholders.title()}
              </p>
              <p className={styles.phCaption} aria-hidden="true">
                {Placeholders.caption(name)}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
