import Link from "next/link";
import { Copy } from "@/content/Copy";
import styles from "./NotFoundPage.module.css";

/**
 * Provisional layout. The visual spec has no 404 page, so this uses Design D
 * tokens only, until the Designer signs off the title scale, the missing
 * header wordmark, and the vertical position. The copy is already approved.
 */
export function NotFoundPage() {
  return (
    <main className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.column}>
        <h1 id="not-found-title" className={styles.title}>
          {Copy.text("notFound.title")}
        </h1>
        <p className={styles.body}>{Copy.text("notFound.body")}</p>
        <Link className={styles.link} href="/">
          {Copy.text("notFound.cta")}
        </Link>
      </div>
    </main>
  );
}
