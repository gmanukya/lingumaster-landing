/**
 * App Store campaign mapping. The static page always ships ct=landing_direct.
 * The inline script (before first paint) may switch that to ct=tiktok_bio.
 * Unknown src values are ignored and never written into the DOM.
 */

export const APPLE_APP_ID = "6504011014";
export const APPLE_PROVIDER_TOKEN = "107400811";

export const TIKTOK_SRC = "tiktok_bio";
export const DIRECT_SRC = "landing_direct";

export type CampaignSrc = typeof TIKTOK_SRC | typeof DIRECT_SRC;
export type Placement = "hero" | "final";

const STORE_ORIGIN = `https://apps.apple.com/fr/app/id${APPLE_APP_ID}`;

function currentSearch(): string {
  const scope = globalThis as { location?: { search?: string } };
  const search = scope.location?.search;
  return typeof search === "string" ? search : "";
}

/** Allowlisted src. Anything else, including an absent param, is landing_direct. */
export function getSrc(search?: string): CampaignSrc {
  const raw = search === undefined ? currentSearch() : search;
  const value = new URLSearchParams(raw).get("src");
  return value === TIKTOK_SRC ? TIKTOK_SRC : DIRECT_SRC;
}

/** Same-tab App Store URL. Placement is the badge slot; it is not a query param. */
export function appStoreUrl(placement: Placement, search?: string): string {
  if (placement !== "hero" && placement !== "final") {
    throw new Error("Unknown placement");
  }
  const ct = getSrc(search);
  return `${STORE_ORIGIN}?pt=${APPLE_PROVIDER_TOKEN}&ct=${ct}&mt=8`;
}

/**
 * Runs in the document head. ≤ 1 KB. Compares src to the allowlist and, only
 * on an exact match, rewrites the constant ct token. The query value itself
 * is never inserted into the page.
 */
export function campaignInlineScript(): string {
  const tiktok = JSON.stringify(TIKTOK_SRC);
  const from = JSON.stringify(`ct=${DIRECT_SRC}`);
  const to = JSON.stringify(`ct=${TIKTOK_SRC}`);
  return (
    "(function(){" +
    `if(new URLSearchParams(location.search).get("src")!==${tiktok})return;` +
    `var from=${from},to=${to};` +
    "function fix(){var n=document.querySelectorAll(\"a[data-placement]\"),i,h;" +
    "for(i=0;i<n.length;i++){h=n[i].getAttribute(\"href\");" +
    "if(h&&h.indexOf(from)>=0)n[i].setAttribute(\"href\",h.replace(from,to));}}" +
    "var o=new MutationObserver(fix);" +
    "o.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:[\"href\"]});" +
    "addEventListener(\"DOMContentLoaded\",fix);" +
    "setTimeout(function(){fix();o.disconnect();},1000);" +
    "})();"
  );
}
