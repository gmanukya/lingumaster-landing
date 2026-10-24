import type { Metadata } from "next";
import { Analytics } from "@/components/Analytics";
import { Hero } from "@/components/Hero";
import { Benefits } from "@/components/Benefits";
import { Screens } from "@/components/Screens";
import { FinalCta } from "@/components/FinalCta";
import { PageShell } from "@/components/PageShell";
import { APPLE_APP_ID } from "@/lib/campaign";
import { ScreenAssets } from "@/lib/ScreenAssets";

export const metadata: Metadata = {
  itunes: { appId: APPLE_APP_ID },
};

export default function HomePage() {
  const hero = ScreenAssets.asset("hero-reader");
  return (
    <PageShell>
      {hero ? (
        <link
          rel="preload"
          as="image"
          imageSrcSet={hero.avifSrcSet}
          imageSizes={hero.sizes}
          type="image/avif"
          fetchPriority="high"
        />
      ) : null}
      <Analytics />
      <Hero />
      <Benefits />
      <Screens />
      <FinalCta />
    </PageShell>
  );
}
