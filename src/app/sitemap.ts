import type { MetadataRoute } from "next";
import { isProductionContext, legalMarkersRemain } from "@/lib/indexing";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const LEGAL_PATHS = ["/privacy", "/terms", "/mentions-legales"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/"];
  if (!legalMarkersRemain() && isProductionContext()) {
    paths.push(...LEGAL_PATHS);
  }
  return paths.map((entry) => ({
    url: entry === "/" ? `${SITE_URL}/` : `${SITE_URL}${entry}`,
  }));
}
