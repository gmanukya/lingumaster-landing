import { Copy } from "@/content/Copy";
import styles from "./TrustLine.module.css";

export function TrustLine() {
  if (!Copy.present("trust.line")) return null;
  return <p className={styles.trust}>{Copy.text("trust.line")}</p>;
}
