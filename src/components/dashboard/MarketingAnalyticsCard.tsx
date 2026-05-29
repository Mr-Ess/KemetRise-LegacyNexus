import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import { Megaphone, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ExportButton from "@/components/shared/ExportButton";
import { tenantDb } from "@/lib/tenantDb";

type Campaign = { id: string; campaign_name: string; budget: number | null; leads_generated: number | null; created_at: string };
type Finance = { id: string; month_year: string | null; total_revenue: number | null; total_expenses: number | null; net_profit: number | null };

const MarketingAnalyticsCard = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [finance, setFinance] = useState<Finance[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ campaign_name: "", budget: "", leads_generated: "" });

  const load = async () => {
    const [c, f] = await Promise.all([
      tenantDb.select("marketing_campaigns", { orderBy: "created_at", ascending: false }),
      tenantDb.select("finance_analytics", { orderBy: "month_year", ascending: true }),
    ]);
    setCampaigns(c as any);
    setFinance(f as any);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("mk-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "marketing_campaigns" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "finance_analytics" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const submit = async () => {
    if (!form.campaign_name.trim()) { toast.error("الاسم مطلوب"); return; }
    try {
      await tenantDb.insert("marketing_campaigns", {
        campaign_name: form.campaign_name,
        budget: form.budget ? Number(form.budget) : null,
        leads_generated: form.leads_generated ? Number(form.leads_generated) : 0,
      } as any);
    } catch (error: any) {
      toast.error(String(error?.message || error));
      return;
    }
    setForm({ campaign_name: "", budget: "", leads_generated: "" });
    setOpen(false); toast.success("تمت الإضافة");
  };

  const totalLeads = campaigns.reduce((s, c) => s + Number(c.leads_generated || 0), 0);
  const totalBudget = campaigns.reduce((s, c) => s + Number(c.budget || 0), 0);
  const cpl = totalLeads ? (totalBudget / totalLeads).toFixed(2) : "0";

  const campaignChart = campaigns.slice(0, 8).map(c => ({
    name: (c.campaign_name || "—").slice(0, 12),
    leads: Number(c.leads_generated || 0),
    budget: Number(c.budget || 0),
  })).reverse();

  const financeChart = finance.slice(-12).map(f => ({
    month: f.month_year || "",
    revenue: Number(f.total_revenue || 0),
    expenses: Number(f.total_expenses || 0),
    profit: Number(f.net_profit || 0),
  }));

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          <h3 className="font-display text-xs font-bold text-foreground tracking-wider">MARKETING & FINANCE ANALYTICS</h3>
        </div>
        <div className="flex items-center gap-1">
          <ExportButton data={campaigns as any[]} filename="marketing_campaigns" title="Campaigns" />
          <button onClick={() => setOpen(true)} className="p-1 rounded hover:bg-secondary text-primary"><Plus className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-secondary/40 rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground font-display">CAMPAIGNS</p>
          <p className="text-base font-bold text-primary">{campaigns.length}</p>
        </div>
        <div className="bg-secondary/40 rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground font-display">TOTAL LEADS</p>
          <p className="text-base font-bold text-nile">{totalLeads}</p>
        </div>
        <div className="bg-secondary/40 rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground font-display">CPL</p>
          <p className="text-base font-bold text-scarab">${cpl}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-secondary/30 rounded p-2">
          <p className="text-[10px] font-display text-primary mb-1">LEADS BY CAMPAIGN</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={campaignChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" fontSize={9} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={9} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10 }} />
              <Bar dataKey="leads" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-secondary/30 rounded p-2">
          <p className="text-[10px] font-display text-primary mb-1">FINANCE TREND</p>
          {financeChart.length === 0 ? (
            <div className="h-[150px] flex items-center justify-center text-[10px] text-muted-foreground">
              لا توجد بيانات مالية بعد — أضفها من Operations Hub
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={financeChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" fontSize={9} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={9} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(160,60%,45%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="hsl(0,70%,55%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-sm text-primary">ADD CAMPAIGN</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Campaign Name</Label><Input value={form.campaign_name} onChange={e => setForm({ ...form, campaign_name: e.target.value })} className="bg-secondary border-border" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Budget</Label><Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="bg-secondary border-border" /></div>
              <div className="space-y-1"><Label className="text-xs">Leads</Label><Input type="number" value={form.leads_generated} onChange={e => setForm({ ...form, leads_generated: e.target.value })} className="bg-secondary border-border" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketingAnalyticsCard;
