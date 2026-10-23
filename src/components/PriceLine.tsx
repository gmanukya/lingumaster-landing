import { Copy } from "@/content/Copy";
import styles from "./PriceLine.module.css";

export function PriceLine() {
  return (
    <p className={styles.price} data-section="price">
      {Copy.text("price.line")}
    </p>
  );
}
