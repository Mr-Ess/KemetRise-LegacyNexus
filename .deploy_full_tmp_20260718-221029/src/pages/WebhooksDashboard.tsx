import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Webhook, Plus, Trash2, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

const EVENTS = ["insert.invoices", "update.invoices", "insert.subscriptions", "update.subscriptions", "insert.payment_transactions", "*"];

export default function WebhooksDashboard() {
  const nav = useNavigate();
  const [hooks, setHooks] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "", url: "", events: ["*"], active: true, secret: "" });

  const load = async () => {
    const [h, d] = await Promise.all([
      tenantDb.select("webhooks", { orderBy: "created_at", ascending: false }),
      tenantDb.select("webhook_deliveries", { orderBy: "created_at", ascending: false, limit: 100 }),
    ]);
    setHooks((h as any[]) || []); setDeliveries((d as any[]) || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.label || !form.url) return toast.error("Label & URL required");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Not authenticated");
    try {
      await tenantDb.insert(
        "webhooks",
        { owner_kind: "brand", owner_id: u.user.id, ...form } as any,
        { includeClientId: false, includeBrandId: false },
      );
    } catch (error: any) {
      return toast.error(String(error?.message || error));
    }
    toast.success("Webhook created"); setOpen(false); setForm({ label: "", url: "", events: ["*"], active: true, secret: "" }); load();
  };

  const toggle = async (id: string, active: boolean) => {
    await tenantDb.update("webhooks", { active: !active }, { id }); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await tenantDb.remove("webhooks", { id }); load();
  };

  const stats = {
    success: deliveries.filter(d => d.status === "delivered").length,
    failed: deliveries.filter(d => d.status === "failed").length,
    pending: deliveries.filter(d => d.status === "pending").length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => nav("/")}><ArrowLeft className="w-4 h-4 mr-2" /> رجوع</Button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
            <Webhook className="w-6 h-6" /> Webhooks
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
            <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Webhook</Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4"><p className="text-xs text-muted-foreground">Delivered</p><p className="text-2xl font-bold text-emerald-500">{stats.success}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Failed</p><p className="text-2xl font-bold text-destructive">{stats.failed}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-primary">{stats.pending}</p></Card>
        </div>

        <Tabs defaultValue="endpoints">
          <TabsList><TabsTrigger value="endpoints">Endpoints</TabsTrigger><TabsTrigger value="deliveries">Deliveries</TabsTrigger></TabsList>
          <TabsContent value="endpoints">
            <Card>
              {hooks.length === 0 ? <p className="p-8 text-center text-muted-foreground text-sm">لا توجد webhooks</p> : (
                <div className="divide-y divide-border">
                  {hooks.map(h => (
                    <div key={h.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{h.label}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[420px]">{h.url}</p>
                        <div className="flex gap-1 mt-1">{(h.events as any[]).map(e => <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={h.active} onCheckedChange={() => toggle(h.id, h.active)} />
                        <button onClick={() => remove(h.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="deliveries">
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs">
                  <tr><th className="p-3 text-left">Time</th><th className="p-3 text-left">Event</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">HTTP</th><th className="p-3 text-left">Attempts</th></tr>
                </thead>
                <tbody>
                  {deliveries.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد محاولات</td></tr> : deliveries.map(d => (
                    <tr key={d.id} className="border-t border-border">
                      <td className="p-3 text-xs">{new Date(d.created_at).toLocaleString("ar-EG")}</td>
                      <td className="p-3 font-mono text-xs">{d.event}</td>
                      <td className="p-3"><Badge variant={d.status === "delivered" ? "default" : d.status === "failed" ? "destructive" : "outline"}>{d.status}</Badge></td>
                      <td className="p-3 text-xs">{d.response_status || "—"}</td>
                      <td className="p-3 text-xs">{d.attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Webhook</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Label</Label><Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div><Label>URL</Label><Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Secret (optional)</Label><Input value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} type="password" /></div>
            <div>
              <Label>Events</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EVENTS.map(e => (
                  <button key={e} type="button" onClick={() => setForm({ ...form, events: form.events.includes(e) ? form.events.filter(x => x !== e) : [...form.events, e] })}
                    className={`text-[10px] px-2 py-1 rounded-md border ${form.events.includes(e) ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{e}</button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
