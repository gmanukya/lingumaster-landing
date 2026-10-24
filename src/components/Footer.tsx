import { Copy } from "@/content/Copy";
import { SiteConfig } from "@/config";
import styles from "./Footer.module.css";

const links = [
  { href: "/privacy/", slot: "footer.privacy" },
  { href: "/terms/", slot: "footer.terms" },
  { href: "/mentions-legales/", slot: "footer.legal" },
] as const;

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} wrap`}>
        <ul className={styles.links}>
          {links.map((link) => (
            <li key={link.href}>
              <a className={styles.link} href={link.href}>
                {Copy.text(link.slot)}
              </a>
            </li>
          ))}
          {SiteConfig.contactHref ? (
            <li>
              <a className={styles.link} href={SiteConfig.contactHref}>
                {Copy.text("footer.contact")}
              </a>
            </li>
          ) : null}
        </ul>
        <p className={styles.credit}>{Copy.text("legal.appleCredit")}</p>
      </div>
    </footer>
  );
}
