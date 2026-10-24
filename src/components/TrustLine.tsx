import { Copy } from "@/content/Copy";
import styles from "./TrustLine.module.css";

export function TrustLine({ afterLanguages = false }: { afterLanguages?: boolean }) {
  if (!Copy.present("trust.line")) return null;
  const className = afterLanguages ? `${styles.trust} ${styles.afterLanguages}` : styles.trust;
  return <p className={className}>{Copy.text("trust.line")}</p>;
}
