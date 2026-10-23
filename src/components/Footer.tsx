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
    <footer className={`${styles.footer} rise`} data-section="footer">
      <nav className={styles.nav}>
        {links.map((link) => (
          <a key={link.href} className={styles.link} href={link.href}>
            {Copy.text(link.slot)}
          </a>
        ))}
        {SiteConfig.contactHref ? (
          <a className={styles.link} href={SiteConfig.contactHref}>
            {Copy.text("footer.contact")}
          </a>
        ) : null}
      </nav>
      <p className={styles.credit}>{Copy.text("legal.appleCredit")}</p>
    </footer>
  );
}
