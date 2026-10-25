import type { Metadata } from "next";
import { NotFoundPage } from "@/components/NotFoundPage";
import { Copy } from "@/content/Copy";

const title = Copy.text("notFound.title");

export const metadata: Metadata = {
  title: { absolute: title },
  robots: "noindex",
  alternates: { canonical: null },
  openGraph: {
    title: Copy.text("meta.ogTitle"),
    description: Copy.text("meta.ogDescription"),
    locale: "fr_FR",
    type: "website",
    url: null,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: Copy.text("meta.ogTitle"),
      },
    ],
  },
};

export default function NotFound() {
  return <NotFoundPage />;
}
