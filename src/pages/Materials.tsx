import SimpleCrud from "@/components/shared/SimpleCrud";
import { Package } from "lucide-react";

export default function Materials() {
  return <SimpleCrud title="Materials" table="materials" icon={Package}
    fields={[
      { name: "name", label: "Name", required: true },
      { name: "unit", label: "Unit", placeholder: "kg, pcs..." },
      { name: "current_stock", label: "Current Stock", type: "number" },
      { name: "min_stock_level", label: "Min Stock Level", type: "number", defaultValue: 10 },
    ]}
    columns={[
      { key: "name", label: "Name" },
      { key: "unit", label: "Unit" },
      { key: "current_stock", label: "Stock" },
      { key: "min_stock_level", label: "Min" },
    ]} />;
}
