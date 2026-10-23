import { Hero } from "@/components/Hero";
import { Benefits } from "@/components/Benefits";
import { Screens } from "@/components/Screens";
import { FinalCta } from "@/components/FinalCta";
import { PageShell } from "@/components/PageShell";
import { ScreenAssets } from "@/lib/ScreenAssets";

export default function HomePage() {
  const hero = ScreenAssets.asset("hero-library");
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
      <Hero />
      <Benefits />
      <Screens />
      <FinalCta />
    </PageShell>
  );
}
