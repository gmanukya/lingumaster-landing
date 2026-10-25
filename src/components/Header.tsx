import { Copy } from "@/content/Copy";
import styles from "./Header.module.css";

/**
 * Owl mark plus the wordmark slot. Not a link: on / a tap must not reload,
 * drop ?src=, or send another view. fetchPriority="low" keeps React 19 from
 * hoisting a preload, so the hero capture stays the only image preload.
 * The 404 page does not render this.
 */
export function Header() {
  return (
    <header className={styles.bar}>
      <div className={styles.group}>
        <img
          className={styles.mark}
          src="/brand/logo-64.webp"
          srcSet="/brand/logo-64.webp 64w, /brand/logo-80.webp 80w, /brand/logo-96.webp 96w, /brand/logo-120.webp 120w"
          sizes="(min-width:1024px) 40px, 32px"
          width={32}
          height={32}
          alt=""
          decoding="async"
          fetchPriority="low"
        />
        <span className={styles.wordmark}>{Copy.text("wordmark")}</span>
      </div>
    </header>
  );
}
