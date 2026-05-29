import SimpleCrud from "@/components/shared/SimpleCrud";
import { Truck } from "lucide-react";

export default function Logistics() {
  return <SimpleCrud title="Logistics & Shipping" table="logistics_shipping" icon={Truck}
    fields={[
      { name: "tracking_number", label: "Tracking Number", required: true },
      { name: "carrier", label: "Carrier" },
      { name: "project_id", label: "Project ID (UUID)" },
      { name: "estimated_delivery", label: "Estimated Delivery", type: "date" },
      { name: "status", label: "Status", type: "select", defaultValue: "In Transit",
        options: [{ value: "In Transit", label: "In Transit" }, { value: "Delivered", label: "Delivered" }, { value: "Pending", label: "Pending" }, { value: "Failed", label: "Failed" }] },
    ]}
    columns={[
      { key: "tracking_number", label: "Tracking" },
      { key: "carrier", label: "Carrier" },
      { key: "status", label: "Status" },
      { key: "estimated_delivery", label: "ETA" },
    ]} />;
}
