import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

export default function IPWhitelist() {
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "", ip_range: "", active: true });

  const load = async () => {
    const data = await tenantDb.select("ip_whitelist", { orderBy: "created_at", ascending: false });
    setItems((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.label || !form.ip_range) return toast.error("All fields required");
    try {
      await tenantDb.insert("ip_whitelist", form);
    } catch (error: any) {
      return toast.error(error?.message || "Failed");
    }
    toast.success("Added"); setOpen(false); setForm({ label: "", ip_range: "", active: true }); load();
  };

  const toggle = async (id: string, active: boolean) => {
    await tenantDb.update("ip_whitelist", { active }, { id });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove?")) return;
    await tenantDb.remove("ip_whitelist", { id });
    load();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => nav("/settings")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Add IP Range</Button>
        </div>
        <h1 className="font-display text-2xl text-primary mb-2 flex items-center gap-2"><Lock className="w-5 h-5" />IP Whitelist</h1>
        <p className="text-sm text-muted-foreground mb-6">Restrict admin access to trusted IP addresses only.</p>

        <Card className="divide-y">
          {items.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No IP rules. All IPs are currently allowed.</div>}
          {items.map(i => (
            <div key={i.id} className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-body font-medium">{i.label}</div>
                <div className="text-xs text-muted-foreground font-mono">{i.ip_range}</div>
              </div>
              <Switch checked={i.active} onCheckedChange={c => toggle(i.id, c)} />
              <Button variant="ghost" size="sm" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-blood-red" /></Button>
            </div>
          ))}
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add IP Range</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Label</Label><Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Office HQ" /></div>
              <div><Label>IP / CIDR</Label><Input value={form.ip_range} onChange={e => setForm({ ...form, ip_range: e.target.value })} placeholder="192.168.1.0/24 or 203.0.113.42" /></div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
