import { useEntities } from "@/hooks/useEntities";
import { Label } from "@/components/ui/label";

export const BrandSelector = ({ value, onChange, label = "Brand" }: { value?: string | null; onChange: (id: string | null) => void; label?: string }) => {
  const { items } = useEntities("brands");
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-secondary border border-border text-foreground rounded-md px-3 py-2 text-sm font-body"
      >
        <option value="">— None —</option>
        {items.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  );
};

export default BrandSelector;
