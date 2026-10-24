import { LegalLayout } from "@/components/LegalLayout";
import { legalPage } from "@/content/legal/meta";

const page = legalPage("privacy");

export const metadata = page.metadata;

export default function PrivacyPage() {
  return <LegalLayout doc={page.doc} />;
}
