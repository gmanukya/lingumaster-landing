import { Copy } from "@/content/Copy";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <p className={styles.credit}>{Copy.text("legal.appleCredit")}</p>
      </div>
    </footer>
  );
}
