import type { Metadata } from "next";
import { loadLegal, type LegalModel, type LegalSlug } from "./load";

export function legalPage(slug: LegalSlug): { doc: LegalModel; metadata: Metadata } {
  const doc = loadLegal(slug);
  const metadata: Metadata = {
    title: { absolute: `${doc.title} — Lingumaster` },
    description: doc.title,
    alternates: { canonical: doc.canonical },
    openGraph: {
      title: doc.title,
      description: doc.title,
      url: doc.canonical,
      locale: "fr_FR",
      type: "website",
    },
  };
  if (doc.robots) metadata.robots = doc.robots;
  return { doc, metadata };
}
