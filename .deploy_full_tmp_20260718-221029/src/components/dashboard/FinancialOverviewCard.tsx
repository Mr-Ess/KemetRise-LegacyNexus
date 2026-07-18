import { TrendingUp, BarChart3, Cpu, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { aiApi, transactionsApi } from "@/services/system";
import ExportButton from "@/components/shared/ExportButton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type Period = "weekly" | "monthly" | "yearly";

const FinancialOverviewCard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>("monthly");
  const [rows, setRows] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ amount: "", kind: "income" as "income" | "expense", category: "", description: "" });

  const load = async () => {
    try { setRows(await transactionsApi.list()); } catch (e: any) { toast.error(e.message); }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("tx-rt").on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    if (period === "weekly") cutoff.setDate(now.getDate() - 7);
    else if (period === "monthly") cutoff.setMonth(now.getMonth() - 1);
    else cutoff.setFullYear(now.getFullYear() - 1);
    return rows.filter(r => new Date(r.occurred_at) >= cutoff);
  }, [rows, period]);

  const income = filtered.filter(r => r.kind === "income").reduce((s, r) => s + Number(r.amount), 0);
  const expense = filtered.filter(r => r.kind === "expense").reduce((s, r) => s + Number(r.amount), 0);

  // Build sparkline buckets
  const buildBuckets = (items: any[], n: number) => {
    if (!items.length) return Array.from({ length: n }, () => 0);
    const sorted = [...items].sort((a, b) => +new Date(a.occurred_at) - +new Date(b.occurred_at));
    const start = +new Date(sorted[0].occurred_at);
    const end = Date.now();
    const span = Math.max(1, end - start);
    const buckets = Array.from({ length: n }, () => 0);
    items.forEach(r => {
      const idx = Math.min(n - 1, Math.floor(((+new Date(r.occurred_at)) - start) / span * n));
      buckets[idx] += Number(r.amount);
    });
    return buckets;
  };
  const revBuckets = buildBuckets(filtered.filter(r => r.kind === "income"), 8);
  const max = Math.max(1, ...revBuckets);
  const path = revBuckets.map((v, i) => `${i * (100 / (revBuckets.length - 1 || 1))},${40 - (v / max) * 32 - 4}`).join(" L");
  const roiBars = buildBuckets(filtered, 7);
  const maxRoi = Math.max(1, ...roiBars);

  const submit = async () => {
    const amt = parseFloat(form.amount);
    if (!amt) { toast.error(t('amount_required_msg')); return; }
    try {
      await transactionsApi.create({ amount: amt, kind: form.kind, category: form.category, description: form.description });
      setForm({ amount: "", kind: "income", category: "", description: "" });
      setShowAdd(false);
      toast.success(t('transaction_added'));
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <h3 className="font-display text-xs font-bold text-foreground tracking-wider">{t('financial_overview_title')}</h3>
        </div>
        <div className="flex items-center gap-1">
          {(["weekly", "monthly", "yearly"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2 py-0.5 rounded text-[9px] font-display transition-colors ${
                period === p ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}>
              {p.charAt(0).toUpperCase() + p.slice(1, 3)}
            </button>
          ))}
          <ExportButton data={rows as any[]} filename="transactions" title="Transactions" />
          <button onClick={() => setShowAdd(true)} className="ml-1 p-1 rounded hover:bg-secondary text-primary"><Plus className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 flex-1">
        <div className="bg-secondary/50 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-display text-primary tracking-wider">{t('revenue_kpi')}</span>
            <TrendingUp className="w-3.5 h-3.5 text-scarab" />
          </div>
          <p className="text-xs font-body text-scarab mb-1">${income.toLocaleString()}</p>
          <svg viewBox="0 0 100 40" className="w-full h-10">
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160,60%,35%)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(160,60%,35%)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`M0,40 L${path} L100,40 Z`} fill="url(#revGrad)" />
            <path d={`M${path}`} fill="none" stroke="hsl(160,60%,35%)" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="bg-secondary/50 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-display text-primary tracking-wider">{t('activity_kpi')}</span>
            <BarChart3 className="w-3.5 h-3.5 text-nile" />
          </div>
          <div className="flex items-end gap-1.5 h-12 mt-2">
            {roiBars.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-nile/60" style={{ height: `${Math.max(6, (v / maxRoi) * 100)}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-secondary/50 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-display text-primary tracking-wider">{t('expenses_kpi')}</span>
            <Cpu className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-xs font-body text-blood-red mb-1">${expense.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{t('net_label')}: <span className={income - expense >= 0 ? "text-scarab" : "text-blood-red"}>${(income - expense).toLocaleString()}</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">{filtered.length} {t('txns_count')}</p>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-sm text-primary">{t('add_transaction_title')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">{t('amount')}</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="space-y-1"><Label className="text-xs">{t('kind_label')}</Label>
                <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as any })} className="w-full rounded-md bg-secondary border border-border px-2 py-2 text-xs">
                  <option value="income">{t('income_type')}</option><option value="expense">{t('expense_type')}</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('category')}</Label>
                <button type="button" onClick={async () => {
                  if (!form.description.trim()) { toast.error(t('description') + " " + t('required')); return; }
                  try {
                    const cat = await aiApi.categorize("transaction", form.description);
                    setForm(f => ({ ...f, category: cat }));
                    toast.success(`${t('ai_insights')}: ${cat}`);
                  } catch (e: any) { toast.error(e.message); }
                }} className="text-[10px] text-primary hover:underline">✨ {t('ai_insights')}</button>
              </div>
              <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1"><Label className="text-xs">{t('description')}</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>{t('cancel')}</Button>
            <Button onClick={submit}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialOverviewCard;
