import type { ReactNode } from "react";
import { Footer } from "./Footer";
import styles from "./PageShell.module.css";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <main className={styles.main}>{children}</main>
      <Footer />
    </>
  );
}
