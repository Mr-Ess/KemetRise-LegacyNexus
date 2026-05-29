import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { backupsApi } from "@/services/system";
import { Download, Trash2, Database, RotateCcw } from "lucide-react";

export default function BackupsManager() {
  const [list, setList] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => setList(await backupsApi.list());
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!label.trim()) { toast.error("Label required"); return; }
    setBusy(true);
    try { await backupsApi.create(label); setLabel(""); toast.success("Backup created"); await load(); }
    catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const download = async (id: string) => {
    const r: any = await backupsApi.download(id);
    const blob = new Blob([JSON.stringify(r.snapshot, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${r.label}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const remove = async (id: string) => {
    await backupsApi.remove(id); toast.success("Deleted"); await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Backup label (e.g. Pre-update)" value={label} onChange={e => setLabel(e.target.value)} />
        <Button onClick={create} disabled={busy}><Database className="w-4 h-4 mr-2"/>{busy ? "Creating..." : "Create Backup"}</Button>
      </div>
      <div className="space-y-2">
        {list.length === 0 && <p className="text-sm opacity-60">No backups yet.</p>}
        {list.map(b => (
          <div key={b.id} className="flex items-center justify-between p-3 border border-primary/20 rounded-lg bg-card">
            <div>
              <p className="font-medium">{b.label}</p>
              <p className="text-xs opacity-60">{new Date(b.created_at).toLocaleString()} · {(b.size_bytes/1024).toFixed(1)} KB</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => download(b.id)}><Download className="w-4 h-4"/></Button>
              <Button size="sm" variant="ghost" onClick={async()=>{
                if (!confirm("استعادة هذه النسخة ستضيف/تحدث بياناتك. متأكد؟")) return;
                const r:any = await backupsApi.restore(b.id); toast.success(`تمت الاستعادة (${r.restored} صف)`);
              }}><RotateCcw className="w-4 h-4 text-nile"/></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4 text-blood-red"/></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
