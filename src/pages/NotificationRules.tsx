import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

const empty = { name: "", table_name: "", field: "", operator: "lt", threshold: 0, channel: "in_app", active: true };

export default function NotificationRules() {
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    try {
      const data = await tenantDb.select("notification_rules", { orderBy: "created_at", ascending: false });
      setItems(data || []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load");
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name || !form.table_name || !form.field) return toast.error("Required fields missing");
    const payload = { ...form, threshold: Number(form.threshold) };
    try {
      if (editId) await tenantDb.update("notification_rules", payload, { id: editId });
      else await tenantDb.insert("notification_rules", payload);
    } catch (error: any) {
      return toast.error(error?.message || "Save failed");
    }
    toast.success("Saved"); setOpen(false); setEditId(null); setForm(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    try {
      await tenantDb.remove("notification_rules", { id });
    } catch (error: any) {
      return toast.error(error?.message || "Delete failed");
    }
    toast.success("Deleted"); load();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => nav("/")}><ArrowLeft className="w-4 h-4 mr-2" /> رجوع</Button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
            <BellRing className="w-6 h-6" /> Notification Rules
          </h1>
          <Button onClick={() => { setEditId(null); setForm(empty); setOpen(true); }}><Plus className="w-4 h-4 mr-1" /> New Rule</Button>
        </div>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs"><tr>
              <th className="p-3 text-left">Name</th><th className="p-3 text-left">Trigger</th>
              <th className="p-3 text-left">Channel</th><th className="p-3 text-left">Status</th><th className="p-3"></th>
            </tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">لا توجد قواعد</td></tr> :
                items.map(r => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3 text-xs font-mono">{r.table_name}.{r.field} {r.operator} {r.threshold}</td>
                    <td className="p-3">{r.channel}</td>
                    <td className="p-3">{r.active ? "🟢" : "⚪"}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => { setEditId(r.id); setForm(r); setOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => remove(r.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Table *</Label><Input value={form.table_name} onChange={e => setForm({ ...form, table_name: e.target.value })} placeholder="materials" /></div>
            <div><Label>Field *</Label><Input value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} placeholder="current_stock" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Operator</Label>
                <Select value={form.operator} onValueChange={v => setForm({ ...form, operator: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lt">&lt; less than</SelectItem><SelectItem value="gt">&gt; greater than</SelectItem>
                    <SelectItem value="eq">= equals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Threshold</Label><Input type="number" value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} /></div>
            </div>
            <div><Label>Channel</Label>
              <Select value={form.channel} onValueChange={v => setForm({ ...form, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-App</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} /><Label>Active</Label></div>
          </div>
          <DialogFooter><Button onClick={submit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
