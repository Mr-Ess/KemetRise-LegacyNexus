import SimpleCrud from "@/components/shared/SimpleCrud";
import { Palette } from "lucide-react";

export default function ArtisticProduction() {
  return <SimpleCrud title="Artistic Production" table="artistic_production" icon={Palette}
    fields={[
      { name: "project_name", label: "Project Name", required: true },
      { name: "brand_id", label: "Brand ID (UUID)" },
      { name: "media_type", label: "Media Type", placeholder: "Video, Audio, Print..." },
      { name: "production_status", label: "Status", type: "select", defaultValue: "Drafting",
        options: [{ value: "Drafting", label: "Drafting" }, { value: "In Production", label: "In Production" }, { value: "Review", label: "Review" }, { value: "Completed", label: "Completed" }] },
    ]}
    columns={[
      { key: "project_name", label: "Project" },
      { key: "media_type", label: "Type" },
      { key: "production_status", label: "Status" },
    ]} />;
}
