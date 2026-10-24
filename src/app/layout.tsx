import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Copy } from "@/content/Copy";
import { DraftRibbon } from "@/components/DraftRibbon";
import { campaignInlineScript } from "@/lib/campaign";
import "./globals.css";

export const metadata: Metadata = {
  title: Copy.text("meta.title"),
  description: Copy.text("meta.description"),
  openGraph: {
    title: Copy.text("meta.ogTitle"),
    description: Copy.text("meta.ogDescription"),
    locale: "fr_FR",
    type: "website",
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
      </body>
    </html>
  );
}
