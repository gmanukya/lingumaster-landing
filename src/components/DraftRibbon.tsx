import { Copy } from "@/content/Copy";
import { Draft } from "@/content/Draft";
import styles from "./DraftRibbon.module.css";

export function DraftRibbon() {
  if (!Copy.isDraft()) return null;
  return <p className={styles.ribbon}>{Draft.label}</p>;
}
