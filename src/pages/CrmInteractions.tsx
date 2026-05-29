import SimpleCrud from "@/components/shared/SimpleCrud";
import { MessageCircle } from "lucide-react";

export default function CrmInteractions() {
  return <SimpleCrud title="CRM Interactions" table="crm_interactions" icon={MessageCircle}
    fields={[
      { name: "client_id", label: "Client ID (UUID)" },
      { name: "agent_id", label: "Agent ID (UUID)" },
      { name: "notes", label: "Notes", type: "textarea", required: true },
    ]}
    columns={[
      { key: "client_id", label: "Client" },
      { key: "agent_id", label: "Agent" },
      { key: "notes", label: "Notes" },
      { key: "interaction_date", label: "Date", render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
    ]} />;
}
