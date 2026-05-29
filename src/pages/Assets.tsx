import SimpleCrud from "@/components/shared/SimpleCrud";
import { Building } from "lucide-react";

export default function Assets() {
  return <SimpleCrud title="Assets Management" table="assets_management" icon={Building}
    fields={[
      { name: "asset_name", label: "Asset Name", required: true },
      { name: "value", label: "Value", type: "number" },
      { name: "location", label: "Location" },
      { name: "purchase_date", label: "Purchase Date", type: "date" },
    ]}
    columns={[
      { key: "asset_name", label: "Asset" },
      { key: "value", label: "Value" },
      { key: "location", label: "Location" },
      { key: "purchase_date", label: "Purchased" },
    ]} />;
}
