import Link from "next/link";
import { Copy } from "@/content/Copy";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.bar}>
      <Link className={styles.wordmark} href="/">
        {Copy.text("wordmark")}
      </Link>
    </header>
  );
}
