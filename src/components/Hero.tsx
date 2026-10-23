import { Copy } from "@/content/Copy";
import { ScreenAssets } from "@/lib/ScreenAssets";
import { ScreenImage } from "./ScreenImage";
import { StoreBadge } from "./StoreBadge";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={`${styles.hero} rise`} data-section="hero" aria-labelledby="hero-title">
      <div className={styles.copy}>
        <h1 id="hero-title" className={styles.title}>
          {Copy.text("hero.headline")}
        </h1>
        <p className={styles.sub}>{Copy.text("hero.subline")}</p>
        <div className={styles.cta}>
          <p className={styles.label}>{Copy.text("hero.ctaLabel")}</p>
          <StoreBadge placement="hero" />
        </div>
        <p className={styles.micro}>{Copy.text("hero.microcopy")}</p>
      </div>
      <ScreenImage
        id="live1"
        altSlot="captures[0].alt"
        sizes={ScreenAssets.heroSizes}
        priority
      />
    </section>
  );
}
