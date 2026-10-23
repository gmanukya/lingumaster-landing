import { Copy } from "@/content/Copy";
import type { ScreenName } from "@/lib/ScreenAssets";
import { Screen } from "./Screen";
import { TrustLine } from "./TrustLine";
import styles from "./Screens.module.css";

const shots: { name: ScreenName; caption: string }[] = [
  { name: "shot-library", caption: "captures[0].caption" },
  { name: "shot-reader", caption: "captures[1].caption" },
];

export function Screens() {
  return (
    <section className={styles.dark} aria-labelledby="captures-title">
      <div className="wrap">
        <h2 id="captures-title" className="vh">
          {Copy.text("headings.captures")}
        </h2>
        <div className={styles.pair}>
          {shots.map((shot) => (
            <figure key={shot.name} className={styles.shot}>
              <Screen name={shot.name} variant="shot" onDark />
              <figcaption className={styles.caption}>{Copy.text(shot.caption)}</figcaption>
            </figure>
          ))}
        </div>
        <TrustLine />
      </div>
    </section>
  );
}
