import { useEffect, useRef, useState } from "react";
import { Plus, X, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { filesApi, type OwnerKind } from "@/services/entities";

type LocalFile = { id: string; name: string; category: string };
const categories = ["Marketing", "Financial", "Legal/Contract", "Profile", "Other"];

type Props = {
  files?: LocalFile[];
  onChange?: (files: LocalFile[]) => void;
  ownerKind?: OwnerKind;
  ownerId?: string;
};

const EntityFileUpload = ({ files = [], onChange, ownerKind, ownerId }: Props) => {
  const persistent = !!(ownerKind && ownerId);
  const [remoteFiles, setRemoteFiles] = useState<any[]>([]);
  const [category, setCategory] = useState("Other");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!persistent) return;
    filesApi.list(ownerKind!, ownerId!).then(setRemoteFiles).catch(e => toast.error(e.message));
  }, [persistent, ownerKind, ownerId]);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!persistent) {
      onChange?.([...files, { id: crypto.randomUUID(), name: file.name, category }]);
      e.target.value = ""; return;
    }
    setBusy(true);
    try {
      const row = await filesApi.upload(ownerKind!, ownerId!, file, category);
      setRemoteFiles(p => [row, ...p]);
      toast.success("Uploaded");
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); e.target.value = ""; }
  };

  const removeRemote = async (row: any) => {
    try { await filesApi.remove(row.id, row.file_path); setRemoteFiles(p => p.filter(x => x.id !== row.id)); }
    catch (e: any) { toast.error(e.message); }
  };

  const download = async (row: any) => {
    try { const url = await filesApi.signedUrl(row.file_path); window.open(url, "_blank"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="bg-secondary/20 rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-3.5 h-3.5 text-primary" />
        <span className="font-display text-[10px] tracking-wider text-primary">DOCUMENTS & FILES</span>
        {!persistent && <span className="text-[9px] text-muted-foreground ml-auto">(local until saved)</span>}
      </div>

      <div className="flex items-center gap-2">
        <select value={category} onChange={e => setCategory(e.target.value)} className="rounded bg-secondary border border-border px-2 py-1 text-[10px] font-body text-foreground w-28 shrink-0">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <input ref={inputRef} type="file" className="hidden" onChange={handlePick} />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy} className="gap-1 text-[10px]">
          <Plus className="w-3 h-3" />{busy ? "Uploading..." : "Add File"}
        </Button>
      </div>

      {persistent ? remoteFiles.map(f => (
        <div key={f.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md border border-border">
          <span className="text-[10px] font-display text-muted-foreground w-20 truncate shrink-0">{f.category || "—"}</span>
          <span className="flex-1 text-xs font-body text-foreground truncate">{f.file_name}</span>
          <button type="button" onClick={() => download(f)} className="p-1 text-muted-foreground hover:text-primary"><Download className="w-3 h-3" /></button>
          <button type="button" onClick={() => removeRemote(f)} className="p-1 text-destructive hover:bg-destructive/10 rounded shrink-0"><X className="w-3 h-3" /></button>
        </div>
      )) : files.map((f, i) => (
        <div key={f.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md border border-border">
          <span className="text-[10px] font-display text-muted-foreground w-20 truncate shrink-0">{f.category}</span>
          <span className="flex-1 text-xs font-body text-foreground truncate">{f.name || "No file"}</span>
          <button type="button" onClick={() => onChange?.(files.filter((_, idx) => idx !== i))} className="p-1 text-destructive hover:bg-destructive/10 rounded shrink-0"><X className="w-3 h-3" /></button>
        </div>
      ))}
    </div>
  );
};

export default EntityFileUpload;
