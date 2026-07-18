import SimpleCrud from "@/components/shared/SimpleCrud";
import { Plane } from "lucide-react";

export default function ImportExport() {
  return <SimpleCrud title="Import / Export" table="import_export" icon={Plane}
    fields={[
      { name: "document_type", label: "Document Type", required: true, placeholder: "Bill of Lading, Customs..." },
      { name: "country_of_origin", label: "Country of Origin" },
      { name: "status", label: "Status", type: "select", defaultValue: "Under Review",
        options: [{ value: "Under Review", label: "Under Review" }, { value: "Approved", label: "Approved" }, { value: "Rejected", label: "Rejected" }, { value: "Cleared", label: "Cleared" }] },
    ]}
    columns={[
      { key: "document_type", label: "Document" },
      { key: "country_of_origin", label: "Origin" },
      { key: "status", label: "Status" },
    ]} />;
}
