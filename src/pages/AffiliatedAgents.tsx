import SimpleCrud from "@/components/shared/SimpleCrud";
import { Users } from "lucide-react";

export default function AffiliatedAgents() {
  return <SimpleCrud title="Affiliated Agents" table="affiliated_agents" icon={Users}
    fields={[
      { name: "agent_name", label: "Agent Name", required: true },
      { name: "commission_rate", label: "Commission Rate (e.g. 0.05)", type: "number", defaultValue: 0.05 },
      { name: "total_sales", label: "Total Sales", type: "number" },
    ]}
    columns={[
      { key: "agent_name", label: "Agent" },
      { key: "commission_rate", label: "Rate", render: (v: any) => `${(Number(v) * 100).toFixed(1)}%` },
      { key: "total_sales", label: "Sales" },
    ]} />;
}
