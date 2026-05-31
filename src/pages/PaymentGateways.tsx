import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit, CreditCard, Banknote, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { extApi } from "@/services/extended";
import ExportButton from "@/components/shared/ExportButton";
import BrandSelector from "@/components/shared/BrandSelector";

const GATEWAY_TYPES = ["card", "bank_transfer", "e_wallet", "crypto", "pos"];
const PROVIDERS = ["stripe", "paymob", "fawry", "vodafone_cash", "instapay", "mada", "benefit", "paypal", "tap", "moyasar", "kashier", "other"];
const CURRENCIES = ["EGP", "USD", "SAR", "AED", "GBP", "EUR", "KWD", "QAR", "BHD"];

type Gateway = {
  id: string; gateway_name: string; gateway_type?: string; provider_code?: string;
  is_active?: boolean; test_mode?: boolean; split_enabled?: boolean;
  description?: string; brand_id?: string;
  supported_currencies?: string[]; split_rules?: Record<string, any>;
  api_config?: Record<string, any>; created_at: string;
};

type Transaction = {
  id: string; method: string; amount: number; currency: string; status: string;
  gateway_id?: string; gateway_reference?: string; payment_method?: string;
  provider_code?: string; net_amount?: number; fee_amount?: number;
  notes?: string; created_at: string;
};

const emptyGateway = {
  gateway_name: "", gateway_type: "card", provider_code: "other",
  is_active: true, test_mode: true, split_enabled: false,
  description: "", brand_id: null,
  supported_currencies: ["EGP", "USD"],
};

const emptyTxn = {
  method: "card", amount: "", currency: "EGP", status: "pending",
  payment_method: "card", provider_code: "", gateway_reference: "",
  notes: "", fee_amount: "", gateway_id: null,
};

export default function PaymentGateways() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"gateways" | "transactions" | "splits">("gateways");
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [gwForm, setGwForm] = useState<any>(emptyGateway);
  const [txnForm, setTxnForm] = useState<any>(emptyTxn);
  const [showGwForm, setShowGwForm] = useState(false);
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [editGwId, setEditGwId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, t, s] = await Promise.all([
        extApi.list("payment_gateways"),
        extApi.list("payment_splits"),
        extApi.list("payment_splits"),
      ]);
      setGateways(g as Gateway[]);
      // transactions come from a different table in tenantDb
      setSplits(s as any[]);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveGateway = async () => {
    if (!gwForm.gateway_name) { toast.error("Gateway name required"); return; }
    try {
      if (editGwId) { await extApi.update("payment_gateways", editGwId, gwForm); toast.success("Updated"); }
      else { await extApi.create("payment_gateways", gwForm); toast.success("Gateway added"); }
      setShowGwForm(false); setGwForm(emptyGateway); setEditGwId(null); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteGateway = async (id: string) => {
    await extApi.remove("payment_gateways", id); setGateways(p => p.filter(g => g.id !== id));
  };
  const openEditGw = (g: Gateway) => { setGwForm({ ...g }); setEditGwId(g.id); setShowGwForm(true); };

  const typeIcon = (t?: string) => t === "card" ? <CreditCard className="w-4 h-4" /> : t === "bank_transfer" ? <Banknote className="w-4 h-4" /> : <Wallet className="w-4 h-4" />;

  const statusColor: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    inactive: "bg-gray-500/20 text-gray-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    completed: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
    refunded: "bg-blue-500/20 text-blue-400",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span>
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg text-primary">PAYMENT GATEWAYS</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
            <ExportButton data={gateways} filename="payment-gateways" title="Payment Gateways" />
            {tab === "gateways" && <Button onClick={() => { setGwForm(emptyGateway); setEditGwId(null); setShowGwForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Gateway</Button>}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 bg-card border-border text-center">
            <p className="font-display text-xs text-muted-foreground">TOTAL GATEWAYS</p>
            <p className="font-display text-2xl text-primary">{gateways.length}</p>
          </Card>
          <Card className="p-3 bg-card border-border text-center">
            <p className="font-display text-xs text-muted-foreground">ACTIVE</p>
            <p className="font-display text-2xl text-green-400">{gateways.filter(g => g.is_active).length}</p>
          </Card>
          <Card className="p-3 bg-card border-border text-center">
            <p className="font-display text-xs text-muted-foreground">SPLIT ENABLED</p>
            <p className="font-display text-2xl text-nile">{gateways.filter(g => g.split_enabled).length}</p>
          </Card>
        </div>

        <div className="flex gap-2 mb-4">
          {(["gateways", "transactions", "splits"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${tab === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>
              {t === "gateways" ? `Gateways (${gateways.length})` : t === "transactions" ? "Transactions" : `Splits (${splits.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
        ) : tab === "gateways" ? (
          <div className="space-y-3">
            {gateways.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No payment gateways configured. Add one to start accepting payments.</p>}
            {gateways.map(g => (
              <Card key={g.id} className="p-4 bg-card border-border">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {typeIcon(g.gateway_type)}
                      <span className="font-display text-sm text-primary">{g.gateway_name}</span>
                      {g.provider_code && <Badge className="text-[10px] bg-secondary text-muted-foreground">{g.provider_code}</Badge>}
                      <Badge className={`text-[10px] ${g.is_active ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>{g.is_active ? "Active" : "Inactive"}</Badge>
                      {g.test_mode && <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400">Test Mode</Badge>}
                      {g.split_enabled && <Badge className="text-[10px] bg-nile/20 text-nile">Split</Badge>}
                    </div>
                    {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                    {g.supported_currencies && g.supported_currencies.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {(Array.isArray(g.supported_currencies) ? g.supported_currencies : []).map((c: string) => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditGw(g)} className="p-1.5 rounded text-muted-foreground hover:text-primary"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteGateway(g.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : tab === "splits" ? (
          <div className="space-y-3">
            {splits.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No payment splits recorded.</p>}
            {splits.map(s => (
              <Card key={s.id} className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm text-primary">{s.recipient_name || s.recipient_type}</span>
                      <Badge className={`text-[10px] ${statusColor[s.status] || "bg-muted text-muted-foreground"}`}>{s.status}</Badge>
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>{s.amount} {s.currency}</span>
                      {s.percentage && <span>{s.percentage}%</span>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">Transaction history will appear here once payment_transactions table is accessible.</p>
        )}
      </div>

      {/* Gateway Form */}
      <Dialog open={showGwForm} onOpenChange={setShowGwForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editGwId ? "Edit" : "New"} Payment Gateway</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Gateway Name *</Label><Input value={gwForm.gateway_name} onChange={e => setGwForm((p: any) => ({ ...p, gateway_name: e.target.value }))} placeholder="Paymob Production" className="bg-secondary border-border text-foreground" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Gateway Type</Label>
                <Select value={gwForm.gateway_type} onValueChange={v => setGwForm((p: any) => ({ ...p, gateway_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>{GATEWAY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Provider</Label>
                <Select value={gwForm.provider_code} onValueChange={v => setGwForm((p: any) => ({ ...p, provider_code: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <BrandSelector value={gwForm.brand_id} onChange={id => setGwForm((p: any) => ({ ...p, brand_id: id }))} />
            <div className="space-y-2"><Label>Description</Label><Textarea value={gwForm.description} onChange={e => setGwForm((p: any) => ({ ...p, description: e.target.value }))} rows={2} className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2">
              <Label>Supported Currencies</Label>
              <div className="flex gap-2 flex-wrap">
                {CURRENCIES.map(c => (
                  <button key={c} type="button"
                    onClick={() => setGwForm((p: any) => {
                      const curr = Array.isArray(p.supported_currencies) ? p.supported_currencies : [];
                      return { ...p, supported_currencies: curr.includes(c) ? curr.filter((x: string) => x !== c) : [...curr, c] };
                    })}
                    className={`px-2 py-0.5 rounded text-xs font-display transition-colors ${Array.isArray(gwForm.supported_currencies) && gwForm.supported_currencies.includes(c) ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-border"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={!!gwForm.is_active} onCheckedChange={v => setGwForm((p: any) => ({ ...p, is_active: v }))} /><Label>Active</Label></div>
              <div className="flex items-center gap-2"><Switch checked={!!gwForm.test_mode} onCheckedChange={v => setGwForm((p: any) => ({ ...p, test_mode: v }))} /><Label>Test Mode</Label></div>
              <div className="flex items-center gap-2"><Switch checked={!!gwForm.split_enabled} onCheckedChange={v => setGwForm((p: any) => ({ ...p, split_enabled: v }))} /><Label>Split</Label></div>
            </div>
          </div>
          <DialogFooter><Button onClick={saveGateway} className="font-display text-xs">{editGwId ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

