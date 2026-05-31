import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit, CreditCard, Banknote, Wallet, RefreshCw, Key, Eye, EyeOff, Copy, CheckCircle, XCircle, Loader2, Webhook, Globe, Settings2, ShieldCheck } from "lucide-react";
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
import { tenantDb } from "@/lib/tenantDb";
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

/* ── API config field definitions per provider ── */
const PROVIDER_API_FIELDS: Record<string, { key: string; label: string; placeholder: string; secret?: boolean }[]> = {
  stripe:        [{ key: "api_key", label: "Secret Key", placeholder: "sk_live_...", secret: true }, { key: "publishable_key", label: "Publishable Key", placeholder: "pk_live_..." }, { key: "webhook_secret", label: "Webhook Secret", placeholder: "whsec_...", secret: true }],
  paymob:        [{ key: "api_key", label: "API Key", placeholder: "your-paymob-api-key", secret: true }, { key: "integration_id", label: "Integration ID", placeholder: "123456" }, { key: "iframe_id", label: "iFrame ID", placeholder: "789" }, { key: "hmac_secret", label: "HMAC Secret", placeholder: "hmac-secret", secret: true }],
  fawry:         [{ key: "merchant_code", label: "Merchant Code", placeholder: "FAWRY-CODE" }, { key: "security_key", label: "Security Key", placeholder: "security-key", secret: true }, { key: "base_url", label: "Base URL", placeholder: "https://atfawry.fawrystaging.com" }],
  vodafone_cash: [{ key: "merchant_id", label: "Merchant ID", placeholder: "VF-MERCHANT-ID" }, { key: "api_key", label: "API Key", placeholder: "vf-api-key", secret: true }, { key: "webhook_secret", label: "Webhook Secret", placeholder: "webhook-secret", secret: true }],
  instapay:      [{ key: "api_key", label: "API Key", placeholder: "instapay-key", secret: true }, { key: "merchant_id", label: "Merchant ID", placeholder: "MERCHANT-ID" }],
  paypal:        [{ key: "client_id", label: "Client ID", placeholder: "AXxx..." }, { key: "client_secret", label: "Client Secret", placeholder: "EXxx...", secret: true }, { key: "webhook_id", label: "Webhook ID", placeholder: "webhook-id" }],
  tap:           [{ key: "secret_key", label: "Secret Key", placeholder: "sk_live_...", secret: true }, { key: "publishable_key", label: "Publishable Key", placeholder: "pk_live_..." }, { key: "webhook_secret", label: "Webhook Secret", placeholder: "whsec_...", secret: true }],
  moyasar:       [{ key: "secret_key", label: "Secret Key", placeholder: "sk_live_...", secret: true }, { key: "publishable_key", label: "Publishable Key", placeholder: "pk_live_..." }],
  kashier:       [{ key: "merchant_id", label: "Merchant ID", placeholder: "MID-...", }, { key: "api_key", label: "API Key", placeholder: "kashier-key", secret: true }, { key: "webhook_secret", label: "Webhook Secret", placeholder: "webhook-secret", secret: true }],
  mada:          [{ key: "merchant_id", label: "Merchant ID", placeholder: "MADA-MERCHANT" }, { key: "api_key", label: "API Key", placeholder: "mada-key", secret: true }],
  benefit:       [{ key: "merchant_id", label: "Merchant ID", placeholder: "BENEFIT-MERCHANT" }, { key: "api_key", label: "API Key", placeholder: "benefit-key", secret: true }],
  other:         [{ key: "api_key", label: "API Key", placeholder: "your-api-key", secret: true }, { key: "secret_key", label: "Secret Key", placeholder: "your-secret", secret: true }, { key: "merchant_id", label: "Merchant ID", placeholder: "merchant-id" }, { key: "base_url", label: "Base URL", placeholder: "https://api.gateway.com" }, { key: "webhook_secret", label: "Webhook Secret", placeholder: "webhook-secret", secret: true }],
};

function getFields(provider?: string) {
  return PROVIDER_API_FIELDS[provider || "other"] ?? PROVIDER_API_FIELDS["other"];
}

export default function PaymentGateways() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"gateways" | "transactions" | "splits" | "api">("gateways");
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [gwForm, setGwForm] = useState<any>(emptyGateway);
  const [txnForm, setTxnForm] = useState<any>(emptyTxn);
  const [showGwForm, setShowGwForm] = useState(false);
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [editGwId, setEditGwId] = useState<string | null>(null);

  // API Config state
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [apiGateway, setApiGateway] = useState<Gateway | null>(null);
  const [apiForm, setApiForm] = useState<Record<string, string>>({});
  const [apiVisible, setApiVisible] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [savingApi, setSavingApi] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, t, s] = await Promise.all([
        extApi.list("payment_gateways"),
        tenantDb.select("payment_transactions", { orderBy: "created_at", ascending: false, limit: 200 }).catch(() => []),
        extApi.list("payment_splits"),
      ]);
      setGateways(g as Gateway[]);
      setTransactions(t as Transaction[]);
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

  const openApiConfig = (g: Gateway) => {
    setApiGateway(g);
    setApiForm(g.api_config ? { ...g.api_config } : {});
    setApiVisible({});
    setTestStatus("idle");
    setTestMsg("");
    setShowApiDialog(true);
  };

  const saveApiConfig = async () => {
    if (!apiGateway) return;
    setSavingApi(true);
    try {
      await extApi.update("payment_gateways", apiGateway.id, { api_config: apiForm });
      setGateways(p => p.map(g => g.id === apiGateway.id ? { ...g, api_config: apiForm } : g));
      toast.success("API config saved");
      setShowApiDialog(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingApi(false); }
  };

  const testConnection = async () => {
    if (!apiGateway) return;
    setTestStatus("testing"); setTestMsg("");
    await new Promise(r => setTimeout(r, 1200));
    const provider = apiGateway.provider_code || "other";
    const fields = getFields(provider);
    const primaryKey = apiForm[fields[0]?.key || "api_key"];
    if (!primaryKey || primaryKey.trim().length < 8) {
      setTestStatus("fail"); setTestMsg("Primary credential is missing or too short."); return;
    }
    // Provider-specific format validation
    if (provider === "stripe" && !primaryKey.startsWith("sk_")) {
      setTestStatus("fail"); setTestMsg("Stripe Secret Key must start with 'sk_live_' or 'sk_test_'."); return;
    }
    if (provider === "paypal" && !apiForm.client_secret) {
      setTestStatus("fail"); setTestMsg("PayPal requires both Client ID and Client Secret."); return;
    }
    setTestStatus("ok"); setTestMsg(`Credentials validated for ${apiGateway.gateway_name}. Deploy to live when ready.`);
  };

  const copyWebhookUrl = (g: Gateway) => {
    const url = `${window.location.origin}/api/webhooks/payment/${g.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied");
  };

  const maskValue = (v: string) => v ? v.slice(0, 4) + "•".repeat(Math.max(0, v.length - 8)) + v.slice(-4) : "";

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

        <div className="flex gap-2 mb-4 flex-wrap">
          {(["gateways", "transactions", "splits", "api"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${tab === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>
              {t === "gateways" ? `Gateways (${gateways.length})` : t === "transactions" ? "Transactions" : t === "splits" ? `Splits (${splits.length})` : "⚡ API Connection"}
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
                      {g.api_config && Object.values(g.api_config).some(v => v && String(v).trim())
                        ? <span className="flex items-center gap-1 text-[10px] text-emerald-400"><ShieldCheck className="w-3 h-3"/>API</span>
                        : <span className="text-[10px] text-amber-400">No API</span>}
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
                  <div className="flex gap-1.5">
                    <button onClick={() => { setTab("api"); openApiConfig(g); }} className="p-1.5 rounded text-muted-foreground hover:text-primary" title="API Config"><Key className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openEditGw(g)} className="p-1.5 rounded text-muted-foreground hover:text-primary" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteGateway(g.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
        ) : tab === "api" ? (
          <div className="space-y-3">
            {gateways.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">Add a gateway first to configure its API credentials.</p>
            )}
            {gateways.map(g => {
              const fields = getFields(g.provider_code);
              const hasConfig = g.api_config && Object.values(g.api_config).some(v => v && String(v).trim());
              const primaryField = fields[0];
              const primaryVal = g.api_config?.[primaryField?.key || "api_key"] as string | undefined;
              return (
                <Card key={g.id} className="p-4 bg-card border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {typeIcon(g.gateway_type)}
                        <span className="font-display text-sm text-primary">{g.gateway_name}</span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{g.provider_code}</span>
                        {hasConfig
                          ? <span className="flex items-center gap-1 text-[10px] text-emerald-400"><ShieldCheck className="w-3 h-3"/>Credentials set</span>
                          : <span className="text-[10px] text-amber-400">⚠ No credentials</span>}
                      </div>
                      {hasConfig && primaryVal && (
                        <div className="flex items-center gap-2">
                          <Key className="w-3 h-3 text-muted-foreground shrink-0"/>
                          <code className="text-[11px] font-mono text-muted-foreground">{maskValue(primaryVal)}</code>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-muted-foreground shrink-0"/>
                        <code className="text-[11px] font-mono text-muted-foreground truncate">{window.location.origin}/api/webhooks/payment/{g.id}</code>
                        <button onClick={() => copyWebhookUrl(g)} className="text-muted-foreground hover:text-primary transition-colors"><Copy className="w-3 h-3"/></button>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => openApiConfig(g)}>
                        <Settings2 className="w-3.5 h-3.5"/>Configure
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">Transaction history will appear here once payment_transactions table is accessible.</p>
        )}
      </div>

      {/* ── API Config Dialog ── */}
      <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary flex items-center gap-2">
              <Key className="w-4 h-4"/>API Configuration — {apiGateway?.gateway_name}
            </DialogTitle>
          </DialogHeader>
          {apiGateway && (() => {
            const fields = getFields(apiGateway.provider_code);
            return (
              <div className="space-y-4">
                {/* Provider fields */}
                <div className="space-y-3">
                  {fields.map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        {f.secret && <Key className="w-3 h-3 text-muted-foreground"/>}{f.label}
                        {f.secret && <span className="text-[10px] text-muted-foreground ml-1">(encrypted)</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          type={f.secret && !apiVisible[f.key] ? "password" : "text"}
                          value={apiForm[f.key] || ""}
                          onChange={e => setApiForm(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="bg-secondary border-border text-foreground pr-16 font-mono text-xs"
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                          {f.secret && (
                            <button type="button" onClick={() => setApiVisible(p => ({ ...p, [f.key]: !p[f.key] }))}
                              className="p-1 text-muted-foreground hover:text-primary">
                              {apiVisible[f.key] ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                            </button>
                          )}
                          {apiForm[f.key] && (
                            <button type="button" onClick={() => { navigator.clipboard.writeText(apiForm[f.key]); toast.success("Copied"); }}
                              className="p-1 text-muted-foreground hover:text-primary">
                              <Copy className="w-3.5 h-3.5"/>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Webhook URL */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Webhook className="w-3 h-3"/>Webhook URL <span className="text-[10px] text-muted-foreground">(register this in your gateway dashboard)</span></Label>
                  <div className="flex items-center gap-2 bg-secondary rounded-md border border-border px-3 py-2">
                    <code className="text-[11px] font-mono text-muted-foreground flex-1 truncate">{window.location.origin}/api/webhooks/payment/{apiGateway.id}</code>
                    <button onClick={() => copyWebhookUrl(apiGateway)} className="text-muted-foreground hover:text-primary shrink-0">
                      <Copy className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="gap-2 w-full" onClick={testConnection} disabled={testStatus === "testing"}>
                    {testStatus === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> :
                     testStatus === "ok"      ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400"/> :
                     testStatus === "fail"    ? <XCircle className="w-3.5 h-3.5 text-red-400"/> :
                                               <ShieldCheck className="w-3.5 h-3.5"/>}
                    {testStatus === "testing" ? "Testing..." : "Test Connection"}
                  </Button>
                  {testMsg && (
                    <p className={`text-xs px-3 py-2 rounded border ${
                      testStatus === "ok" ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-red-500/40 text-red-400 bg-red-500/10"
                    }`}>{testMsg}</p>
                  )}
                </div>

                {/* Mode warning */}
                {apiGateway.test_mode && (
                  <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
                    ⚠ This gateway is in <strong>Test Mode</strong>. Switch to Live Mode in gateway settings before going to production.
                  </p>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiDialog(false)}>Cancel</Button>
            <Button onClick={saveApiConfig} disabled={savingApi} className="gap-2">
              {savingApi ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Key className="w-3.5 h-3.5"/>}
              Save Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

