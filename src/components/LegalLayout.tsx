import Link from "next/link";
import { Draft } from "@/content/Draft";
import type { LegalBlock, LegalModel } from "@/content/legal/document";
import { PageShell } from "./PageShell";
import ribbonStyles from "./DraftRibbon.module.css";
import styles from "./LegalLayout.module.css";

function LegalDraftRibbon({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className={ribbonStyles.ribbon} data-legal-draft="true">
      {Draft.label}
    </p>
  );
}

function TableBlock({ block, index }: { block: Extract<LegalBlock, { kind: "table" }>; index: number }) {
  const labels = block.headers.slice(1);
  return (
    <div className={styles.facts}>
      {block.rows.map((row, rowIndex) => {
        const id = `legal-${index}-${rowIndex}`;
        return (
          <section key={id} className={styles.fact} aria-labelledby={id}>
            <h3 id={id} className={styles.h3}>
              {row[0]}
            </h3>
            <dl>
              {labels.map((label, cell) => (
                <div key={label} className={styles.pair}>
                  <dt className={styles.dt}>{label}</dt>
                  <dd className={styles.dd}>{row[cell + 1]}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function BlockView({ block, index }: { block: LegalBlock; index: number }) {
  if (block.kind === "heading") {
    if (block.level === 1) return <h1 className={styles.h1}>{block.text}</h1>;
    if (block.level === 2) return <h2 className={styles.h2}>{block.text}</h2>;
    return <h3 className={styles.h3}>{block.text}</h3>;
  }
  if (block.kind === "list") {
    return (
      <ul className={styles.list}>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.kind === "table") return <TableBlock block={block} index={index} />;
  return <p className={styles.p}>{block.text}</p>;
}

export function LegalLayout({ doc }: { doc: LegalModel }) {
  const heading = doc.blocks[0];
  const rest = doc.blocks.slice(1);
  return (
    <PageShell>
      <LegalDraftRibbon show={doc.robots === "noindex"} />
      <article className={styles.article} aria-labelledby="legal-title">
        <Link className={styles.back} href="/">
          Retour à l’accueil
        </Link>
        {heading?.kind === "heading" && heading.level === 1 ? (
          <h1 id="legal-title" className={styles.h1}>
            {heading.text}
          </h1>
        ) : (
          <h1 id="legal-title" className={styles.h1}>
            {doc.title}
          </h1>
        )}
        <p className={styles.updated}>Mise à jour le {doc.updated}</p>
        {rest.map((block, index) => (
          <BlockView key={index} block={block} index={index} />
        ))}
      </article>
    </PageShell>
  );
}
