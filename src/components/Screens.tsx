import { Copy } from "@/content/Copy";
import { ScreenAssets, type ScreenId } from "@/lib/ScreenAssets";
import { ScreenImage } from "./ScreenImage";
import styles from "./Screens.module.css";

const shots: { id: ScreenId; caption: string; alt: string }[] = [
  { id: "live1", caption: "captures[0].caption", alt: "captures[0].alt" },
  { id: "live2", caption: "captures[1].caption", alt: "captures[1].alt" },
];

export function Screens() {
  return (
    <section className="rise" data-section="screens">
      <div className={styles.strip}>
        {shots.map((shot) => (
          <figure key={shot.id} className={styles.figure}>
            <ScreenImage id={shot.id} altSlot={shot.alt} sizes={ScreenAssets.stripSizes} />
            <figcaption className={styles.caption}>{Copy.text(shot.caption)}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
