import { umamiConfig } from "./umami";

/** Static tracker tag. Rendered only when both public env vars are valid. */
const SCRIPT_SRC = "https://cloud.umami.is/script.js";

export function UmamiScript() {
  const config = umamiConfig();
  if (!config) return null;
  return (
    <script
      defer
      src={SCRIPT_SRC}
      data-website-id={config.websiteId}
      data-domains={config.domains}
      data-auto-pageview="false"
    />
  );
}
