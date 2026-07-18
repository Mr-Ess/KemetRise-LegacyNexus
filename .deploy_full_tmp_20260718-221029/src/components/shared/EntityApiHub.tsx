import { useEffect, useState } from "react";
import { Plug, Plus, Copy, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiKeysApi, webhooksApi, type OwnerKind } from "@/services/entities";

type Props = {
  entityName: string;
  ownerKind?: OwnerKind;
  ownerId?: string;
};

const EntityApiHub = ({ entityName, ownerKind, ownerId }: Props) => {
  const persistent = !!(ownerKind && ownerId);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!persistent) return;
    setLoading(true);
    Promise.all([
      apiKeysApi.list(ownerKind!, ownerId!),
      webhooksApi.list(ownerKind!, ownerId!),
    ]).then(([k, w]) => {
      setApiKeys(k);
      setWebhooks(w);
    }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [persistent, ownerKind, ownerId]);

  // Don't render at all until entity is saved (ownerId exists)
  if (!persistent) return null;

  const generateKey = async () => {
    try {
      const k = await apiKeysApi.create(ownerKind!, ownerId!, `Key ${apiKeys.length + 1}`);
      setApiKeys(p => [k, ...p]);
      toast.success("API Key generated");
    } catch (e: any) { toast.error(e.message); }
  };

  const removeKey = async (id: string) => {
    try { await apiKeysApi.remove(id); setApiKeys(p => p.filter(x => x.id !== id)); }
    catch (e: any) { toast.error(e.message); }
  };

  const addWebhook = async () => {
    if (!newWebhookUrl.trim()) { toast.error("URL required"); return; }
    try {
      const w = await webhooksApi.create(ownerKind!, ownerId!, {
        label: entityName, url: newWebhookUrl, events: [newWebhookEvents],
      });
      setWebhooks(p => [w, ...p]);
      setNewWebhookUrl("");
      toast.success("Webhook added");
    } catch (e: any) { toast.error(e.message); }
  };

  const removeWebhook = async (id: string) => {
    try { await webhooksApi.remove(id); setWebhooks(p => p.filter(x => x.id !== id)); }
    catch (e: any) { toast.error(e.message); }
  };

  const copyKey = (key: string) => { navigator.clipboard.writeText(key); toast.success("Copied"); };

  return (
    <div className="bg-secondary/20 rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Plug className="w-3.5 h-3.5 text-primary" />
        <span className="font-display text-[10px] tracking-wider text-primary">API MANAGEMENT — {entityName.toUpperCase()}</span>

      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-display text-muted-foreground">API KEYS</span>
          <Button type="button" variant="outline" size="sm" onClick={generateKey} disabled={loading} className="gap-1 text-[10px] h-6 px-2"><Plus className="w-3 h-3" />Generate Key</Button>
        </div>
        {apiKeys.map(k => (
          <div key={k.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded border border-border">
            <span className="text-[10px] text-foreground font-body flex-1 truncate font-mono">{String(k.key_value).slice(0, 24)}...</span>
            <span className="text-[9px] text-muted-foreground shrink-0">{new Date(k.created_at).toLocaleDateString()}</span>
            <button type="button" onClick={() => copyKey(k.key_value)} className="p-1 text-muted-foreground hover:text-primary"><Copy className="w-3 h-3" /></button>
            <button type="button" onClick={() => removeKey(k.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        {apiKeys.length === 0 && <p className="text-[10px] text-muted-foreground">No API keys yet</p>}
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] font-display text-muted-foreground">WEBHOOKS</span>
        <div className="flex gap-2">
          <Input value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} placeholder="https://your-endpoint.com/webhook" className="bg-secondary border-border text-foreground text-xs h-7" />
          <select value={newWebhookEvents} onChange={e => setNewWebhookEvents(e.target.value)} className="rounded bg-secondary border border-border px-2 text-[10px] font-body text-foreground w-24 shrink-0">
            <option value="all">All Events</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
          <Button type="button" variant="outline" size="sm" onClick={addWebhook} className="text-[10px] h-7 px-2 shrink-0"><Globe className="w-3 h-3" /></Button>
        </div>
        {webhooks.map(w => (
          <div key={w.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded border border-border">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${w.active ? "bg-scarab" : "bg-muted-foreground"}`} />
            <span className="text-[10px] text-foreground font-body flex-1 truncate">{w.url}</span>
            <span className="text-[9px] text-muted-foreground shrink-0">{Array.isArray(w.events) ? w.events.join(",") : ""}</span>
            <button type="button" onClick={() => removeWebhook(w.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        {webhooks.length === 0 && <p className="text-[10px] text-muted-foreground">No webhooks configured</p>}
      </div>
    </div>
  );
};

export default EntityApiHub;
