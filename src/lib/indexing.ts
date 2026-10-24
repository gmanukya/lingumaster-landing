/**
 * Netlify sets CONTEXT to production, deploy-preview, branch-deploy, or dev.
 * Anything other than production, including a local build where it is unset,
 * is a non-production build.
 */
export function isProductionContext(context: string | undefined = process.env.CONTEXT): boolean {
  return context === "production";
}

/** Noindex on every non-production build. */
export function blockIndexing(): boolean {
  return !isProductionContext();
}
