import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DraftRibbon } from "@/components/DraftRibbon";
import { Copy } from "@/content/Copy";
import { UmamiScript } from "@/lib/analytics/UmamiScript";
import { campaignInlineScript } from "@/lib/campaign";
import { blockIndexing } from "@/lib/indexing";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const title = Copy.text("meta.title");
const description = Copy.text("meta.description");
const ogTitle = Copy.text("meta.ogTitle");
const ogDescription = Copy.text("meta.ogDescription");
const ogImage = `${SITE_URL}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: { canonical: SITE_URL },
  robots: blockIndexing() ? "noindex" : undefined,
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    locale: "fr_FR",
    type: "website",
    url: SITE_URL,
    images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
    images: [{ url: ogImage, alt: ogTitle }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <link
        rel="preload"
        href="/fonts/inter-var-400-600-opsz-latin.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <body data-draft={Copy.isDraft() ? "true" : "false"}>
        <script
          id="campaign-ct"
          dangerouslySetInnerHTML={{ __html: campaignInlineScript() }}
        />
        <DraftRibbon />
        {children}
        <UmamiScript />
      </body>
    </html>
  );
}
