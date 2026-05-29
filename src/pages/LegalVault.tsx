import SimpleCrud from "@/components/shared/SimpleCrud";
import { ScrollText } from "lucide-react";

export default function LegalVault() {
  return <SimpleCrud title="Legal Vault" table="legal_vault" icon={ScrollText}
    fields={[
      { name: "doc_title", label: "Document Title", required: true },
      { name: "file_url", label: "File URL" },
      { name: "expiry_date", label: "Expiry Date", type: "date" },
    ]}
    columns={[
      { key: "doc_title", label: "Title" },
      { key: "expiry_date", label: "Expires" },
      { key: "is_encrypted", label: "Encrypted", render: (v: any) => v ? "🔒" : "—" },
      { key: "created_at", label: "Added", render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
    ]} />;
}
