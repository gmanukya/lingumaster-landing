import type { Metadata } from "next";
import { Copy } from "@/content/Copy";
import { SITE_URL } from "@/lib/site";
import { loadLegal, type LegalModel, type LegalSlug } from "./load";

const ogImage = `${SITE_URL}/og.png`;

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: Copy.text("meta.ogTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      title: doc.title,
      description: doc.title,
      images: [{ url: ogImage, alt: Copy.text("meta.ogTitle") }],
    },
  };
  if (doc.robots) metadata.robots = doc.robots;
  return { doc, metadata };
}
