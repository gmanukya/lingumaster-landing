import fs from "node:fs";
import path from "node:path";
import { LEGAL_UPDATED } from "@/content/legal/facts";
import { LegalGuards } from "@/content/legal/guards";

const SLUGS = ["privacy", "terms", "mentions"] as const;

/**
 * Netlify sets CONTEXT to production, deploy-preview, branch-deploy, or dev.
 * Anything other than production, including a local build where it is unset,
 * is a non-production build.
 */
export function isProductionContext(context: string | undefined = process.env.CONTEXT): boolean {
  return context === "production";
}

export function legalMarkerSources(): string[] {
  const parts = SLUGS.map((slug) =>
    fs.readFileSync(path.join(process.cwd(), "src/content/legal", `${slug}.md`), "utf8"),
  );
  parts.push(LEGAL_UPDATED);
  return parts;
}

export function legalMarkersRemain(): boolean {
  return LegalGuards.incomplete(legalMarkerSources());
}

/** Site-wide noindex while legal markers remain, and on every non-production build. */
export function blockIndexing(): boolean {
  return legalMarkersRemain() || !isProductionContext();
}
