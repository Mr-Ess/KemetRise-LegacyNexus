import SimpleCrud from "@/components/shared/SimpleCrud";
import { Boxes } from "lucide-react";

export default function Inventory() {
  return <SimpleCrud title="Inventory" table="inventory" icon={Boxes}
    fields={[
      { name: "material_id", label: "Material ID (UUID)", placeholder: "Optional" },
      { name: "branch_id", label: "Branch ID (UUID)", placeholder: "Optional" },
      { name: "quantity", label: "Quantity", type: "number", required: true },
    ]}
    columns={[
      { key: "material_id", label: "Material" },
      { key: "branch_id", label: "Branch" },
      { key: "quantity", label: "Qty" },
      { key: "last_updated", label: "Updated", render: (v: any) => v ? new Date(v).toLocaleDateString() : "—" },
    ]} />;
}
