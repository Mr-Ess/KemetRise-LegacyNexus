import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { tenantDb } from "@/lib/tenantDb";
import { Bell, Plus, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

const TABLES = ["materials", "inventory", "finance_analytics", "marketing_campaigns"];
const OPS = [
  { v: "lt", l: "<" }, { v: "lte", l: "<=" }, { v: "gt", l: ">" },
  { v: "gte", l: ">=" }, { v: "eq", l: "=" },
];

export const NotificationRulesManager = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", table_name: "materials", field: "current_stock", operator: "lt", threshold: 10 });

  const load = async () => {
    const data = await tenantDb.select("notification_rules", { orderBy: "created_at", ascending: false });
    setRules((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name) return toast.error("Name required");
    try {
      await tenantDb.insert("notification_rules", form as any);
    } catch (error: any) {
      return toast.error(String(error?.message || error));
    }
    toast.success("Rule created"); setForm({ ...form, name: "" }); load();
  };

  const remove = async (id: string) => {
    await tenantDb.remove("notification_rules", { id }); load();
  };

  const toggle = async (id: string, active: boolean) => {
    await tenantDb.update("notification_rules", { active } as any, { id }); load();
  };

  const evaluate = async (rule: any) => {
    const data = await tenantDb.select(rule.table_name as any, { select: `id,${rule.field}`, limit: 50 });
    const ops: Record<string, (a: number, b: number) => boolean> = {
      lt: (a, b) => a < b, lte: (a, b) => a <= b, gt: (a, b) => a > b, gte: (a, b) => a >= b, eq: (a, b) => a === b,
    };
    const triggered = (data || []).filter((r: any) => ops[rule.operator](Number(r[rule.field]), Number(rule.threshold)));
    if (triggered.length === 0) return toast.success("No matches");
    await tenantDb.insert("system_alerts", {
      level: "warning",
      module: rule.table_name,
      message: `Rule "${rule.name}" matched ${triggered.length} record(s)`,
    } as any);
    toast.warning(`${triggered.length} record(s) matched — alert created`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Bell className="w-4 h-4" />
        <span className="font-display text-xs tracking-wider">SMART NOTIFICATION RULES</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 bg-secondary/30 rounded-md border border-border">
        <Input placeholder="Rule name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
        <Select value={form.table_name} onValueChange={v => setForm({ ...form, table_name: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="field" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} />
        <Select value={form.operator} onValueChange={v => setForm({ ...form, operator: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{OPS.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex gap-1">
          <Input type="number" value={form.threshold} onChange={e => setForm({ ...form, threshold: Number(e.target.value) })} />
          <Button size="icon" onClick={create}><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="space-y-2">
        {rules.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-2 bg-card border border-border rounded-md">
            <Switch checked={r.active} onCheckedChange={c => toggle(r.id, c)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body text-foreground">{r.name}</p>
              <p className="text-[10px] text-muted-foreground font-body">
                {r.table_name}.{r.field} {OPS.find(o => o.v === r.operator)?.l} {r.threshold}
              </p>
            </div>
            <button onClick={() => evaluate(r)} title="Run now" className="p-1 hover:bg-secondary rounded text-primary"><Play className="w-3.5 h-3.5" /></button>
            <button onClick={() => remove(r.id)} className="p-1 hover:bg-secondary rounded text-blood-red"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {rules.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No rules yet</p>}
      </div>
    </div>
  );
};

export default NotificationRulesManager;
