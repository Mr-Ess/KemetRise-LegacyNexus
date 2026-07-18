import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, RotateCcw, Tag, DollarSign, Plus, Edit, Trash2, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { tenantDb } from "@/lib/tenantDb";
import { couponsApi, invoicesApi, paymentsApi } from "@/services/billing";
import ExportButton from "@/components/shared/ExportButton";

const emptyCoupon = { code:"", description:"", discount_type:"percent", discount_value:10, currency:"USD", max_uses:null as number|null, expires_at:"", active:true };

export default function FinanceAnalytics() {
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");

  // ── Overview / Analytics ─────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // ── Refunds ───────────────────────────────────────────────────────────────
  const [refunds, setRefunds] = useState<any[]>([]);
  const [refundFilter, setRefundFilter] = useState("all");
  const [activeRefund, setActiveRefund] = useState<any|null>(null);
  const [refundNotes, setRefundNotes] = useState("");

  // ── Coupons ───────────────────────────────────────────────────────────────
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponEditId, setCouponEditId] = useState<string|null>(null);
  const [couponForm, setCouponForm] = useState<any>(emptyCoupon);

  const loadAll = async () => {
    const [an, rf, cp, inv, pay] = await Promise.all([
      tenantDb.select("finance_analytics", { orderBy: "month_year", ascending: false }).catch(()=>[]),
      tenantDb.select("refund_requests", { orderBy: "created_at", ascending: false }).catch(()=>[]),
      couponsApi.list().catch(()=>[]),
      invoicesApi.list().catch(()=>[]),
      paymentsApi.list().catch(()=>[]),
    ]);
    setAnalytics(an as any[]);
    setRefunds(rf as any[]);
    setCoupons(cp as any[]);
    setInvoices(inv as any[]);
    setPayments(pay as any[]);
  };

  useEffect(() => { loadAll(); }, []);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalRev = (payments as any[]).filter(p=>p.status==="completed").reduce((s:number,p:any)=>s+(p.amount||0),0);
    const totalRefunded = (refunds as any[]).filter(r=>r.status==="approved").reduce((s:number,r:any)=>s+(r.amount||0),0);
    const pendingRefunds = (refunds as any[]).filter(r=>r.status==="pending").length;
    const activeCoupons = (coupons as any[]).filter(c=>c.active).length;
    return { totalRev, totalRefunded, pendingRefunds, activeCoupons };
  }, [payments, refunds, coupons]);

  // ── Coupons CRUD ──────────────────────────────────────────────────────────
  const saveCoupon = async () => {
    if (!couponForm.code.trim()) return toast.error("Code required");
    const payload:any = { ...couponForm, code: couponForm.code.toUpperCase(), max_uses: couponForm.max_uses||null, expires_at: couponForm.expires_at||null };
    try {
      if (couponEditId) await couponsApi.update(couponEditId, payload);
      else await couponsApi.create(payload);
      toast.success("Saved"); setCouponOpen(false); setCouponEditId(null); setCouponForm(emptyCoupon); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const removeCoupon = async (id:string) => {
    if (!confirm("Delete coupon?")) return;
    await couponsApi.remove(id); toast.success("Deleted"); loadAll();
  };

  // ── Refunds ───────────────────────────────────────────────────────────────
  const updateRefund = async (status:"approved"|"rejected") => {
    if (!activeRefund) return;
    try {
      await tenantDb.update("refund_requests", { status, admin_notes: refundNotes, processed_at: new Date().toISOString() }, { id: activeRefund.id });
      if (status === "approved") await tenantDb.update("invoices", { status: "refunded", refunded_amount: activeRefund.amount }, { id: activeRefund.invoice_id });
      toast.success(status === "approved" ? "Refund approved" : "Refund rejected");
      setActiveRefund(null); setRefundNotes(""); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const filteredRefunds = refundFilter === "all" ? refunds : refunds.filter(r=>r.status===refundFilter);

  const kpiCard = (icon:React.ReactNode, label:string, value:string|number, color:string) => (
    <Card className={`p-4 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-display text-2xl mt-1">{value}</p></div>
        <div className="opacity-30">{icon}</div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={()=>nav(-1 as any)}><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{fontFamily:"Orbitron"}}>
            <TrendingUp className="w-6 h-6"/> Finance Analytics
          </h1>
          <ExportButton data={tab==="refunds"?refunds:tab==="coupons"?coupons:tab==="analytics"?analytics:payments} filename="finance" title="Finance"/>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpiCard(<DollarSign className="w-8 h-8"/>, "Total Revenue", `$${kpis.totalRev.toLocaleString()}`, "border-emerald-500")}
          {kpiCard(<RotateCcw className="w-8 h-8"/>, "Total Refunded", `$${kpis.totalRefunded.toLocaleString()}`, "border-red-500")}
          {kpiCard(<RotateCcw className="w-8 h-8"/>, "Pending Refunds", kpis.pendingRefunds, "border-yellow-500")}
          {kpiCard(<Tag className="w-8 h-8"/>, "Active Coupons", kpis.activeCoupons, "border-blue-500")}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview"><DollarSign className="w-3.5 h-3.5 mr-1"/>Revenue</TabsTrigger>
            <TabsTrigger value="analytics"><TrendingUp className="w-3.5 h-3.5 mr-1"/>Analytics</TabsTrigger>
            <TabsTrigger value="refunds"><RotateCcw className="w-3.5 h-3.5 mr-1"/>Refunds ({refunds.filter(r=>r.status==="pending").length})</TabsTrigger>
            <TabsTrigger value="coupons"><Tag className="w-3.5 h-3.5 mr-1"/>Coupons</TabsTrigger>
          </TabsList>

          {/* REVENUE / PAYMENTS */}
          <TabsContent value="overview" className="mt-4">
            <Card className="overflow-x-auto">
              <div className="p-3 border-b border-border flex justify-between items-center">
                <p className="text-sm font-medium">{payments.length} transactions</p>
                <ExportButton data={payments} filename="payments" title="Payments"/>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs"><tr>
                  <th className="text-left p-3">Date</th><th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Method</th><th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Ref</th>
                </tr></thead>
                <tbody>
                  {payments.length===0?<tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No transactions</td></tr>:
                  payments.map(p=>(
                    <tr key={p.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="p-3 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-emerald-400">{p.amount} {p.currency}</td>
                      <td className="p-3 text-xs">{p.payment_method||"—"}</td>
                      <td className="p-3"><Badge variant={p.status==="completed"?"default":p.status==="failed"?"destructive":"secondary"}>{p.status}</Badge></td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{p.gateway_ref?.slice(0,12)||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* ANALYTICS */}
          <TabsContent value="analytics" className="mt-4">
            <Card className="overflow-x-auto">
              <div className="p-3 border-b border-border flex justify-between items-center">
                <p className="text-sm font-medium">{analytics.length} periods</p>
                <ExportButton data={analytics} filename="analytics" title="Analytics"/>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs"><tr>
                  <th className="text-left p-3">Period</th><th className="text-right p-3">Revenue</th>
                  <th className="text-right p-3">Expenses</th><th className="text-right p-3">Net Profit</th>
                  <th className="text-right p-3">Margin</th>
                </tr></thead>
                <tbody>
                  {analytics.length===0?<tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No analytics data. Run migration 20260601000000 first.</td></tr>:
                  analytics.map(a=>{
                    const margin = a.total_revenue>0?((a.net_profit/a.total_revenue)*100).toFixed(1):0;
                    return (
                      <tr key={a.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="p-3 font-mono">{a.month_year}</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">${(a.total_revenue||0).toLocaleString()}</td>
                        <td className="p-3 text-right text-red-400">${(a.total_expenses||0).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold">${(a.net_profit||0).toLocaleString()}</td>
                        <td className="p-3 text-right text-xs"><Badge variant={+margin>20?"default":"secondary"}>{margin}%</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* REFUNDS */}
          <TabsContent value="refunds" className="mt-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              {(["all","pending","approved","rejected"] as const).map(f=>(
                <Button key={f} size="sm" variant={refundFilter===f?"default":"outline"} onClick={()=>setRefundFilter(f)}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                  {f!=="all"&&<span className="ml-1 text-[10px]">({refunds.filter(r=>r.status===f).length})</span>}
                </Button>
              ))}
              <ExportButton data={refunds} filename="refunds" title="Refunds"/>
            </div>
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs"><tr>
                  <th className="text-left p-3">Date</th><th className="text-left p-3">Invoice</th>
                  <th className="text-left p-3">Amount</th><th className="text-left p-3">Reason</th>
                  <th className="text-left p-3">Status</th><th className="text-left p-3"/>
                </tr></thead>
                <tbody>
                  {filteredRefunds.length===0?<tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No refund requests</td></tr>:
                  filteredRefunds.map(r=>(
                    <tr key={r.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="p-3 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-mono text-xs">{r.invoice_id?.slice(0,8)}</td>
                      <td className="p-3 font-bold">{r.amount} {r.currency}</td>
                      <td className="p-3 text-xs max-w-[200px] truncate">{r.reason}</td>
                      <td className="p-3"><Badge variant={r.status==="approved"?"default":r.status==="rejected"?"destructive":"secondary"}>{r.status}</Badge></td>
                      <td className="p-3">
                        {r.status==="pending"&&<Button size="sm" variant="outline" onClick={()=>{setActiveRefund(r);setRefundNotes("");}}>Review</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* COUPONS */}
          <TabsContent value="coupons" className="mt-4 space-y-3">
            <div className="flex justify-end gap-2">
              <ExportButton data={coupons} filename="coupons" title="Coupons"/>
              <Button onClick={()=>{setCouponEditId(null);setCouponForm(emptyCoupon);setCouponOpen(true);}}><Plus className="w-4 h-4 mr-1"/>New Coupon</Button>
            </div>
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs"><tr>
                  <th className="text-left p-3">Code</th><th className="text-left p-3">Discount</th>
                  <th className="text-left p-3">Uses</th><th className="text-left p-3">Expires</th>
                  <th className="text-left p-3">Status</th><th className="text-left p-3"/>
                </tr></thead>
                <tbody>
                  {coupons.length===0?<tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No coupons</td></tr>:
                  coupons.map(c=>(
                    <tr key={c.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="p-3 font-mono text-primary">
                        {c.code}
                        <button onClick={()=>{navigator.clipboard.writeText(c.code);toast.success("Copied");}} className="ml-2 text-muted-foreground hover:text-primary">
                          <Copy className="w-3 h-3 inline"/>
                        </button>
                      </td>
                      <td className="p-3">{c.discount_type==="percent"?`${c.discount_value}%`:`${c.discount_value} ${c.currency}`}</td>
                      <td className="p-3 text-xs">{c.use_count||0}{c.max_uses?` / ${c.max_uses}`:""}</td>
                      <td className="p-3 text-xs">{c.expires_at?new Date(c.expires_at).toLocaleDateString():"No expiry"}</td>
                      <td className="p-3"><Badge variant={c.active?"default":"secondary"}>{c.active?"Active":"Inactive"}</Badge></td>
                      <td className="p-3 flex gap-1">
                        <Button size="sm" variant="ghost" onClick={()=>{setCouponEditId(c.id);setCouponForm({...c});setCouponOpen(true);}}><Edit className="w-3.5 h-3.5"/></Button>
                        <Button size="sm" variant="ghost" onClick={()=>removeCoupon(c.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Refund Review Dialog */}
      <Dialog open={!!activeRefund} onOpenChange={()=>{setActiveRefund(null);setRefundNotes("");}}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Review Refund Request</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-secondary/30 rounded p-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">Amount:</span> <strong>{activeRefund?.amount} {activeRefund?.currency}</strong></p>
              <p><span className="text-muted-foreground">Reason:</span> {activeRefund?.reason}</p>
              <p><span className="text-muted-foreground">Invoice:</span> <span className="font-mono text-xs">{activeRefund?.invoice_id}</span></p>
            </div>
            <div><Label>Admin Notes</Label><Textarea rows={3} value={refundNotes} onChange={e=>setRefundNotes(e.target.value)} placeholder="Optional notes…"/></div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={()=>{setActiveRefund(null);setRefundNotes("");}}>Cancel</Button>
            <Button variant="destructive" onClick={()=>updateRefund("rejected")}><X className="w-4 h-4 mr-1"/>Reject</Button>
            <Button onClick={()=>updateRefund("approved")}><Check className="w-4 h-4 mr-1"/>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{couponEditId?"Edit":"New"} Coupon</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Code</Label><Input placeholder="SUMMER25" value={couponForm.code} onChange={e=>setCouponForm((p:any)=>({...p,code:e.target.value.toUpperCase()}))}/></div>
            <div><Label>Description</Label><Input value={couponForm.description} onChange={e=>setCouponForm((p:any)=>({...p,description:e.target.value}))}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={couponForm.discount_type} onValueChange={v=>setCouponForm((p:any)=>({...p,discount_type:v}))}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="percent">Percent %</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Value</Label><Input type="number" value={couponForm.discount_value} onChange={e=>setCouponForm((p:any)=>({...p,discount_value:+e.target.value}))}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Max Uses</Label><Input type="number" placeholder="Unlimited" value={couponForm.max_uses??""} onChange={e=>setCouponForm((p:any)=>({...p,max_uses:e.target.value?+e.target.value:null}))}/></div>
              <div><Label>Expires At</Label><Input type="date" value={couponForm.expires_at} onChange={e=>setCouponForm((p:any)=>({...p,expires_at:e.target.value}))}/></div>
            </div>
            <div className="flex items-center justify-between p-2 border border-border rounded">
              <span className="text-sm">Active</span>
              <Switch checked={!!couponForm.active} onCheckedChange={v=>setCouponForm((p:any)=>({...p,active:v}))}/>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setCouponOpen(false)}>Cancel</Button><Button onClick={saveCoupon}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}