import { LegalLayout } from "@/components/LegalLayout";
import { legalPage } from "@/content/legal/meta";

const page = legalPage("mentions");

export const metadata = page.metadata;

export default function LegalNoticePage() {
  return <LegalLayout doc={page.doc} />;
}
