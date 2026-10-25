import Link from "next/link";
import { Copy } from "@/content/Copy";
import headerStyles from "./Header.module.css";
import styles from "./NotFoundPage.module.css";

/**
 * Designer sign-off on PR #7 was FIX. The block is centred, the wordmark is
 * plain text in the home header frame (not a link), the title uses the home
 * H1 size below 768 and 64/68 from 1024, and the link is 17 px with the
 * underline always on. The copy was already approved. Exactly one link, to /.
 */
export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <header className={headerStyles.bar}>
        <span className={headerStyles.wordmark}>{Copy.text("wordmark")}</span>
      </header>
      <main className={styles.main} aria-labelledby="not-found-title">
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
    </div>
  );
}
