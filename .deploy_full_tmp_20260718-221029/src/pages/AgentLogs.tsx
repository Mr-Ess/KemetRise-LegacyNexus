import SimpleCrud from "@/components/shared/SimpleCrud";
import { Activity } from "lucide-react";

export default function AgentLogs() {
  return <SimpleCrud title="Agent Logs" table="agent_logs" icon={Activity}
    fields={[
      { name: "agent_code", label: "Agent Code", required: true, placeholder: "e.g. AG-001" },
      { name: "action_taken", label: "Action Taken", type: "textarea", required: true },
      { name: "task_id", label: "Task ID (optional)", placeholder: "uuid" },
    ]}
    columns={[
      { key: "agent_code", label: "Agent" },
      { key: "action_taken", label: "Action" },
      { key: "task_id", label: "Task" },
      { key: "created_at", label: "When", render: (v) => v ? new Date(v).toLocaleString() : "—" },
    ]} />;
}
