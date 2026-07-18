import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Tag, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { couponsApi } from "@/services/billing";
import ExportButton from "@/components/shared/ExportButton";

const empty = { code: "", description: "", discount_type: "percent", discount_value: 10, currency: "USD", max_uses: null as number | null, expires_at: "", active: true };

export default function Coupons() {
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const load = () => couponsApi.list().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.code.trim()) return toast.error("Code required");
    const payload: any = { ...form, code: form.code.toUpperCase(), max_uses: form.max_uses || null, expires_at: form.expires_at || null };
    try {
      if (editId) await couponsApi.update(editId, payload);
      else await couponsApi.create(payload);
      toast.success("Saved"); setOpen(false); setEditId(null); setForm(empty); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete coupon?")) return;
    await couponsApi.remove(id); toast.success("Deleted"); load();
  };

  const copy = (code: string) => { navigator.clipboard.writeText(code); toast.success("Copied"); };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => nav("/")}><ArrowLeft className="w-4 h-4 mr-2" /> رجوع</Button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
            <Tag className="w-6 h-6" /> Coupons & Discounts
          </h1>
          <div className="flex gap-2">
            <ExportButton data={items} filename="coupons" title="Coupons" />
            <Button onClick={() => { setEditId(null); setForm(empty); setOpen(true); }}><Plus className="w-4 h-4 mr-1" /> New Coupon</Button>
          </div>
        </div>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs">
              <tr>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Discount</th>
                <th className="text-left p-3">Uses</th>
                <th className="text-left p-3">Expires</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">لا توجد كوبونات</td></tr>
              ) : items.map(c => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-mono text-primary">
                    {c.code}
                    <button onClick={() => copy(c.code)} className="ml-2 text-muted-foreground hover:text-primary"><Copy className="w-3 h-3 inline" /></button>
                  </td>
                  <td className="p-3">{c.discount_type === "percent" ? `${c.discount_value}%` : `${c.discount_value} ${c.currency}`}</td>
                  <td className="p-3 text-xs">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                  <td className="p-3 text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="p-3"><Badge variant={c.active ? "default" : "outline"}>{c.active ? "Active" : "Inactive"}</Badge></td>
                  <td className="p-3 text-right">
                    <button onClick={() => { setEditId(c.id); setForm({ ...empty, ...c, expires_at: c.expires_at?.slice(0, 10) || "" }); setOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Coupon</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Code *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER50" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percent">Percent %</SelectItem><SelectItem value="fixed">Fixed amount</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Value</Label><Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Max Uses</Label><Input type="number" value={form.max_uses ?? ""} onChange={e => setForm({ ...form, max_uses: e.target.value ? +e.target.value : null })} placeholder="∞" /></div>
              <div><Label>Expires</Label><Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} /><Label>Active</Label></div>
          </div>
          <DialogFooter><Button onClick={submit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
