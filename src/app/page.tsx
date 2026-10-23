import { PageShell } from "@/components/PageShell";
import { Hero } from "@/components/Hero";
import { Benefits } from "@/components/Benefits";
import { Screens } from "@/components/Screens";
import { TrustLine } from "@/components/TrustLine";
import { FinalCta } from "@/components/FinalCta";
import { ScreenAssets } from "@/lib/ScreenAssets";

export default function HomePage() {
  return (
    <PageShell>
      <link
        rel="preload"
        as="image"
        imageSrcSet={ScreenAssets.srcSet("live1", "avif")}
        imageSizes={ScreenAssets.heroSizes}
        type="image/avif"
        fetchPriority="high"
      />
      <Hero />
      <Benefits />
      <Screens />
      <TrustLine />
      <FinalCta />
    </PageShell>
  );
}
