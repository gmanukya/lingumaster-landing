import { Copy } from "@/content/Copy";
import { PageShell } from "./PageShell";
import styles from "./StubPage.module.css";

export function StubPage({ titleSlot, bodySlot }: { titleSlot: string; bodySlot: string }) {
  return (
    <PageShell>
      <article className={styles.stub}>
        <h1 className={styles.title}>{Copy.text(titleSlot)}</h1>
        <p className={styles.body}>{Copy.text(bodySlot)}</p>
      </article>
    </PageShell>
  );
}
