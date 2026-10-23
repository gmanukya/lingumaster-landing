import { Copy } from "@/content/Copy";
import { Headline } from "@/lib/Headline";
import { Screen } from "./Screen";
import { StoreBadge } from "./StoreBadge";
import styles from "./Hero.module.css";

export function Hero() {
  const headline = Copy.text("hero.headline");
  const parts = Headline.split(headline);

  return (
    <section className={`${styles.hero} wrap`} aria-labelledby="hero-title">
      <h1 id="hero-title" className={styles.title}>
        {parts.tail ? (
          <>
            {parts.head} <span className="nw">{parts.tail}</span>
          </>
        ) : (
          headline
        )}
      </h1>
      <p className={styles.sub}>{Copy.text("hero.subline")}</p>
      <div className={styles.badge}>
        <StoreBadge placement="hero" />
      </div>
      <div className={styles.stage}>
        <Screen name="hero-library" variant="hero" priority />
      </div>
    </section>
  );
}
