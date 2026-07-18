import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bookmark, Plus, X } from "lucide-react";
import { viewsApi } from "@/services/system";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Props {
  page: string;
  currentFilters: any;
  onApply: (filters: any) => void;
}

export const SavedViews = ({ page, currentFilters, onApply }: Props) => {
  const { t } = useTranslation();
  const [views, setViews] = useState<any[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    try { setViews(await viewsApi.list(page)); } catch {}
  };
  useEffect(() => { load(); }, [page]);

  const save = async () => {
    if (!name.trim()) return;
    try {
      await viewsApi.create({ page, name: name.trim(), filters: currentFilters });
      setName(""); await load();
      toast.success(t('view_saved'));
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    await viewsApi.remove(id); await load();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" /> {t('views_label')} ({views.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder={t('view_name_placeholder')} value={name} onChange={(e) => setName(e.target.value)} />
            <Button size="sm" onClick={save}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="max-h-60 overflow-auto space-y-1">
            {views.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-2 rounded border">
                <button className="text-sm text-left flex-1" onClick={() => onApply(v.filters)}>{v.name}</button>
                <Button size="icon" variant="ghost" onClick={() => remove(v.id)}><X className="h-3 w-3" /></Button>
              </div>
            ))}
            {views.length === 0 && <div className="text-xs text-muted-foreground p-2">{t('no_saved_views')}</div>}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
