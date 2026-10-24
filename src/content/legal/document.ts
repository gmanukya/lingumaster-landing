import { LegalGuards } from "./guards";
import { LegalMarkdown, type LegalBlock } from "./markdown";

export type { LegalBlock };

export type LegalSlug = "privacy" | "terms" | "mentions";

const PATHS: Record<LegalSlug, string> = {
  privacy: "privacy",
  terms: "terms",
  mentions: "mentions-legales",
};

export type LegalModel = {
  slug: LegalSlug;
  title: string;
  blocks: LegalBlock[];
  updated: string;
  robots: "noindex" | null;
  canonical: string;
};

export class LegalDocument {
  static compose(
    slug: LegalSlug,
    raw: string,
    facts: { publisher: string; siteUrl: string; updated: string },
  ): LegalModel {
    const filled = raw
      .replaceAll("{{PUBLISHER_NAME}}", facts.publisher)
      .replaceAll("{{SITE_URL}}", facts.siteUrl);
    const blocks = LegalMarkdown.blocks(filled);
    const titleBlock = blocks.find((block) => block.kind === "heading" && block.level === 1);
    const title = titleBlock && titleBlock.kind === "heading" ? titleBlock.text : slug;
    return {
      slug,
      title,
      blocks,
      updated: facts.updated,
      robots: LegalGuards.robots([filled, facts.updated]),
      canonical: `${facts.siteUrl}/${PATHS[slug]}`,
    };
  }
}
