import fs from "node:fs";
import path from "node:path";
import { SITE_URL } from "../../lib/site";
import { LegalDocument, type LegalModel, type LegalSlug } from "./document";
import { LEGAL_UPDATED, PUBLISHER_NAME } from "./facts";

export type { LegalModel, LegalSlug };

export function loadLegal(slug: LegalSlug): LegalModel {
  const raw = fs.readFileSync(path.join(process.cwd(), "src/content/legal", `${slug}.md`), "utf8");
  return LegalDocument.compose(slug, raw, {
    publisher: PUBLISHER_NAME,
    siteUrl: SITE_URL,
    updated: LEGAL_UPDATED,
  });
}
