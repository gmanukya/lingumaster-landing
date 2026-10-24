import { LegalLayout } from "@/components/LegalLayout";
import { legalPage } from "@/content/legal/meta";

const page = legalPage("terms");

export const metadata = page.metadata;

export default function TermsPage() {
  return <LegalLayout doc={page.doc} />;
}
