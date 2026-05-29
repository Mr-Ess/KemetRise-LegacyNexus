import SimpleCrud from "@/components/shared/SimpleCrud";
import { GitBranch } from "lucide-react";

export default function WorkflowMap() {
  return <SimpleCrud title="Workflow Map" table="workflow_map" icon={GitBranch}
    fields={[
      { name: "from_agent_code", label: "From Agent", required: true },
      { name: "to_agent_code", label: "To Agent", required: true },
      { name: "dependency_type", label: "Dependency Type", type: "select", defaultValue: "sequential",
        options: [
          { value: "sequential", label: "Sequential" },
          { value: "parallel", label: "Parallel" },
          { value: "conditional", label: "Conditional" },
          { value: "trigger", label: "Trigger" },
        ] },
      { name: "description", label: "Description", type: "textarea" },
    ]}
    columns={[
      { key: "from_agent_code", label: "From" },
      { key: "to_agent_code", label: "To" },
      { key: "dependency_type", label: "Type" },
      { key: "description", label: "Description" },
    ]} />;
}
