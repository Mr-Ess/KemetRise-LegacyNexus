import { useEntities } from "@/hooks/useEntities";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

export const BrandSelector = ({ value, onChange, label }: { value?: string | null; onChange: (id: string | null) => void; label?: string }) => {
  const { t } = useTranslation();
  const displayLabel = label ?? t('filter_by_brand');
  const { items } = useEntities("brands");
  return (
    <div className="space-y-2">
      <Label>{displayLabel}</Label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-secondary border border-border text-foreground rounded-md px-3 py-2 text-sm font-body"
      >
        <option value="">{t('none_option')}</option>
        {items.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  );
};

export default BrandSelector;
