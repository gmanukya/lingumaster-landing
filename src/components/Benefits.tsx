import { Copy } from "@/content/Copy";
import styles from "./Benefits.module.css";

const slots = [0, 1, 2] as const;

export function Benefits() {
  return (
    <section className={styles.ben} aria-labelledby="benefits-title">
      <div className={`${styles.band} wrap`}>
        <h2 id="benefits-title" className="vh">
          {Copy.text("headings.benefits")}
        </h2>
        <div className={styles.list}>
          {slots.map((index) => (
            <div key={index} className={styles.row}>
              <h3 className={styles.title}>{Copy.text(`benefits[${index}].title`)}</h3>
              <p className={styles.line}>{Copy.text(`benefits[${index}].line`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
