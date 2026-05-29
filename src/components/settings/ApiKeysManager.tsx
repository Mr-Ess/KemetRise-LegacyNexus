import { useEffect, useState } from "react";
import { apiKeysApi } from "@/services/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function ApiKeysManager() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const load = () => { if (user) apiKeysApi.list("brand" as any, user.id).then(setKeys); };
  useEffect(() => { load(); }, [user]);
  const create = async () => {
    if (!label.trim() || !user) return;
    await apiKeysApi.create("brand" as any, user.id, label);
    setLabel(""); load(); toast.success("تم إنشاء المفتاح");
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={label} onChange={e=>setLabel(e.target.value)} placeholder="اسم المفتاح" />
        <Button onClick={create}><Plus className="w-4 h-4 mr-1"/> إنشاء</Button>
      </div>
      <div className="space-y-2">
        {keys.map(k => (
          <div key={k.id} className="flex items-center gap-2 border border-border rounded p-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{k.label}</div>
              <code className="text-xs text-muted-foreground truncate block">{k.key_value}</code>
            </div>
            <Button size="icon" variant="ghost" onClick={()=>{navigator.clipboard.writeText(k.key_value); toast.success("تم النسخ");}}><Copy className="w-4 h-4"/></Button>
            <Button size="icon" variant="ghost" onClick={async()=>{await apiKeysApi.remove(k.id); load();}}><Trash2 className="w-4 h-4 text-blood-red"/></Button>
          </div>
        ))}
        {keys.length===0 && <p className="text-sm text-muted-foreground">لا توجد مفاتيح</p>}
      </div>
    </div>
  );
}
