import SimpleCrud from "@/components/shared/SimpleCrud";
import { Megaphone } from "lucide-react";

export default function MarketingCampaigns() {
  return <SimpleCrud title="Marketing Campaigns" table="marketing_campaigns" icon={Megaphone}
    fields={[
      { name: "campaign_name", label: "Campaign Name", required: true },
      { name: "brand_id", label: "Brand ID (UUID)" },
      { name: "budget", label: "Budget", type: "number" },
      { name: "leads_generated", label: "Leads Generated", type: "number" },
    ]}
    columns={[
      { key: "campaign_name", label: "Campaign" },
      { key: "budget", label: "Budget" },
      { key: "leads_generated", label: "Leads" },
      { key: "created_at", label: "Created", render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
    ]} />;
}
