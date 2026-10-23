import { Copy } from "@/content/Copy";
import styles from "./Benefits.module.css";

const slots = [0, 1, 2] as const;

export function Benefits() {
  return (
    <section className="rise" data-section="benefits">
      <ul className={styles.list}>
        {slots.map((index) => (
          <li key={index} className={styles.card}>
            <h2 className={styles.title}>{Copy.text(`benefits[${index}].title`)}</h2>
            <p className={styles.line}>{Copy.text(`benefits[${index}].line`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
