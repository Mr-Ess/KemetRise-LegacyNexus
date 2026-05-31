import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Webhook, Code as CodeIcon, Plus, Trash2, RefreshCw, Copy, Activity, Book, Shield, Zap, Globe, Save, Chrome, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { tenantDb } from "@/lib/tenantDb";
import { supabase } from "@/integrations/supabase/client";
import { apiKeysApi } from "@/services/entities";
import { getTenantScope } from "@/lib/tenantScope";
import { toast } from "sonner";
import ExportButton from "@/components/shared/ExportButton";

const BASE = `${import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co"}/rest/v1`;

const FALLBACK_EVENTS = ["insert.invoices","update.invoices","insert.subscriptions","update.subscriptions","insert.payment_transactions","*"];

const ENDPOINTS = [
  { method:"GET",  path:"/brands",               desc:"List your brands",       scope:"owner" },
  { method:"POST", path:"/brands",               desc:"Create a brand",         scope:"owner" },
  { method:"GET",  path:"/customers",            desc:"List customers",         scope:"owner" },
  { method:"GET",  path:"/employees",            desc:"List employees / agents",scope:"owner" },
  { method:"GET",  path:"/invoices",             desc:"List invoices",          scope:"owner" },
  { method:"POST", path:"/invoices",             desc:"Create invoice",         scope:"owner" },
  { method:"GET",  path:"/subscriptions",        desc:"List subscriptions",     scope:"owner" },
  { method:"POST", path:"/coupons",              desc:"Create coupon",          scope:"owner" },
  { method:"GET",  path:"/payment_transactions", desc:"List transactions",      scope:"owner" },
  { method:"GET",  path:"/audit_logs",           desc:"Audit history",          scope:"owner" },
  { method:"GET",  path:"/tasks",                desc:"List tasks",             scope:"owner" },
  { method:"GET",  path:"/webhooks",             desc:"List webhooks",          scope:"owner" },
];

const CodeBlock = ({ children }: { children: string }) => (
  <div className="relative">
    <pre className="bg-secondary/50 border border-border rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{children}</pre>
    <button onClick={() => { navigator.clipboard.writeText(children); toast.success("Copied!"); }}
      className="absolute top-2 right-2 p-1 rounded hover:bg-background/80">
      <Copy className="w-3 h-3 text-muted-foreground" />
    </button>
  </div>
);

export default function DeveloperHub() {
  const nav = useNavigate();
  const [hooks, setHooks] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [events, setEvents] = useState<string[]>(FALLBACK_EVENTS);
  const [hookOpen, setHookOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [hookForm, setHookForm] = useState({ label:"", url:"", events:["*"], active:true, secret:"" });
  const [keyLabel, setKeyLabel] = useState("");
  const [newKey, setNewKey] = useState<string|null>(null);

  // White Label state
  const [wl, setWl] = useState<any>({
    brand_name:"", logo_url:"", primary_color:"#d4af37", accent_color:"#8b0000",
    custom_domain:"", hide_branding:false,
  });
  const [wlLoading, setWlLoading] = useState(true);

  const loadWl = async () => {
    try { const rows = await tenantDb.select("white_label",{limit:1}); if(rows[0]) setWl(rows[0]); }
    catch {}
    finally { setWlLoading(false); }
  };
  const saveWl = async () => {
    try {
      const scope = await getTenantScope();
      const payload = { ...wl, user_id:scope.userId, client_id:scope.clientId, brand_id:scope.brandId, user_name:scope.userName, updated_at:new Date().toISOString() };
      await tenantDb.upsert("white_label", payload as any, { onConflict: scope.brandId?"brand_id":"user_id" });
      toast.success("Branding saved");
    } catch { toast.error("Not signed in"); }
  };

  const loadAll = async () => {
    const [h, d, k] = await Promise.all([
      tenantDb.select("webhooks", { orderBy:"created_at", ascending:false }).catch(()=>[]),
      tenantDb.select("webhook_deliveries", { orderBy:"created_at", ascending:false, limit:200 }).catch(()=>[]),
      apiKeysApi.list().catch(()=>[]),
    ]);
    setHooks(h as any[]); setDeliveries(d as any[]); setApiKeys(k as any[]);

    // Load distinct event types from webhook_deliveries + existing hooks
    try {
      const deliveryEvents: string[] = (d as any[]).map((x: any) => x.event_type).filter(Boolean);
      const hookEvents: string[]     = (h as any[]).flatMap((x: any) => Array.isArray(x.events) ? x.events : [x.events]).filter(Boolean);
      const allEvents = Array.from(new Set([...deliveryEvents, ...hookEvents, "*"]));
      if (allEvents.length > 1) setEvents(allEvents);
    } catch { /* keep fallback */ }
  };
  useEffect(() => { loadAll(); loadWl(); }, []);

  const createHook = async () => {
    if (!hookForm.label || !hookForm.url) return toast.error("Label & URL required");
    if (!hookForm.url.startsWith("https://")) return toast.error("URL must use HTTPS");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Not authenticated");
    try {
      await tenantDb.insert("webhooks", { owner_kind:"brand", owner_id:u.user.id, ...hookForm } as any, { includeClientId:false, includeBrandId:false });
      toast.success("Webhook created"); setHookOpen(false); setHookForm({ label:"", url:"", events:["*"], active:true, secret:"" }); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const toggleHook = async (id:string, active:boolean) => { await tenantDb.update("webhooks",{active:!active},{id}); loadAll(); };
  const removeHook = async (id:string) => { if(!confirm("Delete webhook?")) return; await tenantDb.remove("webhooks",{id}); loadAll(); };

  const createKey = async () => {
    if (!keyLabel.trim()) return toast.error("Label required");
    try {
      const key = `kr_${crypto.randomUUID().replace(/-/g,"")}`;
      await apiKeysApi.create({ label: keyLabel, key, created: new Date().toISOString() });
      setNewKey(key); setKeyLabel(""); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };
  const removeKey = async (id:string) => { if(!confirm("Delete API key?")) return; await apiKeysApi.remove(id); loadAll(); };

  const stats = {
    success: (deliveries as any[]).filter(d=>d.status==="delivered").length,
    failed:  (deliveries as any[]).filter(d=>d.status==="failed").length,
    pending: (deliveries as any[]).filter(d=>d.status==="pending").length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" onClick={()=>nav(-1 as any)}><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{fontFamily:"Orbitron"}}>
            <CodeIcon className="w-6 h-6"/> Developer Hub
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAll}><RefreshCw className="w-4 h-4"/></Button>
            <ExportButton data={deliveries} filename="webhook-deliveries" title="Deliveries"/>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border-l-4 border-emerald-500"><p className="text-xs text-muted-foreground">Delivered</p><p className="text-2xl font-bold text-emerald-500">{stats.success}</p></Card>
          <Card className="p-4 border-l-4 border-red-500"><p className="text-xs text-muted-foreground">Failed</p><p className="text-2xl font-bold text-destructive">{stats.failed}</p></Card>
          <Card className="p-4 border-l-4 border-yellow-500"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-primary">{stats.pending}</p></Card>
          <Card className="p-4 border-l-4 border-blue-500"><p className="text-xs text-muted-foreground">API Keys</p><p className="text-2xl font-bold">{apiKeys.length}</p></Card>
        </div>

        <Tabs defaultValue="docs">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="docs"><Book className="w-3.5 h-3.5 mr-1"/>API Reference</TabsTrigger>
            <TabsTrigger value="keys"><Shield className="w-3.5 h-3.5 mr-1"/>API Keys</TabsTrigger>
            <TabsTrigger value="webhooks"><Webhook className="w-3.5 h-3.5 mr-1"/>Webhooks ({hooks.length})</TabsTrigger>
            <TabsTrigger value="deliveries"><Activity className="w-3.5 h-3.5 mr-1"/>Deliveries ({deliveries.length})</TabsTrigger>
            <TabsTrigger value="whitelabel"><Globe className="w-3.5 h-3.5 mr-1"/>White Label</TabsTrigger>
            <TabsTrigger value="extension"><Chrome className="w-3.5 h-3.5 mr-1"/>Extension</TabsTrigger>
          </TabsList>

          {/* ── API REFERENCE ─────────────────────────────────────── */}
          <TabsContent value="docs" className="space-y-4 mt-4">
            <Tabs defaultValue="quickstart">
              <TabsList>
                <TabsTrigger value="quickstart"><Zap className="w-3 h-3 mr-1"/>Quick Start</TabsTrigger>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="webhookformat">Webhook Format</TabsTrigger>
                <TabsTrigger value="errors">Error Codes</TabsTrigger>
              </TabsList>
              <TabsContent value="quickstart" className="space-y-3 mt-3">
                <Card className="p-4 space-y-2">
                  <h3 className="font-bold text-sm">1. Create an API Key</h3>
                  <p className="text-xs text-muted-foreground">Go to <strong>API Keys</strong> tab → New Key. The key is shown once — save it immediately.</p>
                </Card>
                <Card className="p-4 space-y-2">
                  <h3 className="font-bold text-sm">2. Authenticate</h3>
                  <CodeBlock>{`curl ${BASE}/brands \\\n  -H "apikey: YOUR_API_KEY" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
                </Card>
                <Card className="p-4 space-y-2">
                  <h3 className="font-bold text-sm">3. Fetch Data (JavaScript)</h3>
                  <CodeBlock>{`const res = await fetch("${BASE}/invoices?select=*&limit=50", {\n  headers: {\n    apikey: "YOUR_API_KEY",\n    Authorization: "Bearer YOUR_API_KEY"\n  }\n});\nconst invoices = await res.json();`}</CodeBlock>
                </Card>
                <Card className="p-4 space-y-2">
                  <h3 className="font-bold text-sm">4. Filter & Sort</h3>
                  <CodeBlock>{`# Filter by status\nGET ${BASE}/tasks?status=eq.in-progress\n\n# Sort descending\nGET ${BASE}/audit_logs?order=created_at.desc\n\n# Pagination\nGET ${BASE}/customers?limit=20&offset=40`}</CodeBlock>
                </Card>
              </TabsContent>
              <TabsContent value="endpoints" className="mt-3">
                <Card className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 text-xs"><tr>
                      <th className="text-left p-3">Method</th><th className="text-left p-3">Endpoint</th>
                      <th className="text-left p-3">Description</th><th className="text-left p-3">Scope</th>
                    </tr></thead>
                    <tbody>
                      {ENDPOINTS.map((e,i)=>(
                        <tr key={i} className="border-t border-border hover:bg-secondary/20">
                          <td className="p-3"><Badge variant={e.method==="GET"?"outline":"default"} className="text-[10px]">{e.method}</Badge></td>
                          <td className="p-3 font-mono text-xs text-primary">{e.path}</td>
                          <td className="p-3 text-xs">{e.desc}</td>
                          <td className="p-3 text-xs text-muted-foreground">{e.scope}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>
              <TabsContent value="webhookformat" className="mt-3 space-y-3">
                <Card className="p-4 space-y-3">
                  <h3 className="font-bold text-sm">Webhook Payload Format</h3>
                  <CodeBlock>{`POST <your-webhook-url>\nContent-Type: application/json\nX-KemetRise-Signature: sha256=<hmac_hex>\n\n{\n  "event": "insert.invoices",\n  "timestamp": "2026-05-31T12:00:00Z",\n  "audit": {\n    "id": "uuid",\n    "action": "INSERT invoices",\n    "table_name": "invoices",\n    "record_id": "uuid",\n    "created_at": "2026-05-31T12:00:00Z"\n  }\n}`}</CodeBlock>
                </Card>
                <Card className="p-4 space-y-3">
                  <h3 className="font-bold text-sm">Verify Signature (Node.js)</h3>
                  <CodeBlock>{`const crypto = require("crypto");\nfunction verifyWebhook(secret, body, signature) {\n  const expected = "sha256=" + crypto\n    .createHmac("sha256", secret)\n    .update(JSON.stringify(body))\n    .digest("hex");\n  return crypto.timingSafeEqual(\n    Buffer.from(signature), Buffer.from(expected)\n  );\n}`}</CodeBlock>
                </Card>
                <Card className="p-4 space-y-2">
                  <h3 className="font-bold text-sm">Supported Events</h3>
                  <div className="flex flex-wrap gap-2">{events.map(e=><Badge key={e} variant="outline" className="text-xs font-mono">{e}</Badge>)}</div>
                </Card>
              </TabsContent>
              <TabsContent value="errors" className="mt-3">
                <Card className="p-4 space-y-2">
                  {[{code:"200",variant:"default",text:"OK — Request succeeded"},
                    {code:"201",variant:"outline",text:"Created — Resource created"},
                    {code:"401",variant:"destructive",text:"Unauthorized — Missing or invalid API key"},
                    {code:"403",variant:"destructive",text:"Forbidden — RLS policy blocked access"},
                    {code:"404",variant:"destructive",text:"Not Found"},
                    {code:"429",variant:"destructive",text:"Rate Limited — 100 req/min"},
                    {code:"500",variant:"destructive",text:"Server Error"},
                  ].map(r=>(
                    <div key={r.code} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                      <Badge variant={r.variant as any}>{r.code}</Badge>
                      <span className="text-sm">{r.text}</span>
                    </div>
                  ))}
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ── API KEYS ──────────────────────────────────────────── */}
          <TabsContent value="keys" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button onClick={()=>setKeyOpen(true)}><Plus className="w-4 h-4 mr-1"/>New API Key</Button>
            </div>
            {newKey && (
              <Card className="p-4 border border-emerald-500 bg-emerald-500/5">
                <p className="text-xs font-bold text-emerald-500 mb-2">⚠️ Copy this key now — it won't be shown again!</p>
                <CodeBlock>{newKey}</CodeBlock>
                <Button size="sm" variant="ghost" className="mt-2" onClick={()=>setNewKey(null)}>Dismiss</Button>
              </Card>
            )}
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs"><tr>
                  <th className="text-left p-3">Label</th><th className="text-left p-3">Key (masked)</th>
                  <th className="text-left p-3">Created</th><th className="text-left p-3"/>
                </tr></thead>
                <tbody>
                  {apiKeys.length===0?<tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No API keys yet</td></tr>:
                  (apiKeys as any[]).map(k=>(
                    <tr key={k.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="p-3 font-semibold">{k.name||k.label}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        {(k.key||"").slice(0,6)}••••••••••••••••
                        <button onClick={()=>{navigator.clipboard.writeText(k.key||"");toast.success("Copied");}} className="ml-2 hover:text-primary"><Copy className="w-3 h-3 inline"/></button>
                      </td>
                      <td className="p-3 text-xs">{k.created?new Date(k.created).toLocaleDateString():"—"}</td>
                      <td className="p-3"><Button size="sm" variant="ghost" onClick={()=>removeKey(k.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* ── WEBHOOKS ─────────────────────────────────────────── */}
          <TabsContent value="webhooks" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button onClick={()=>setHookOpen(true)}><Plus className="w-4 h-4 mr-1"/>New Webhook</Button>
            </div>
            <Card>
              {hooks.length===0?<p className="p-8 text-center text-muted-foreground text-sm">No webhooks configured</p>:(
                <div className="divide-y divide-border">
                  {hooks.map(h=>(
                    <div key={h.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{h.label}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{h.url}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {((h.events||[]) as string[]).map(e=><Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Switch checked={!!h.active} onCheckedChange={()=>toggleHook(h.id,h.active)}/>
                        <button onClick={()=>removeHook(h.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── DELIVERIES ───────────────────────────────────────── */}
          <TabsContent value="deliveries" className="mt-4">
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs"><tr>
                  <th className="p-3 text-left">Time</th><th className="p-3 text-left">Event</th>
                  <th className="p-3 text-left">Status</th><th className="p-3 text-left">HTTP</th><th className="p-3 text-left">Attempts</th>
                </tr></thead>
                <tbody>
                  {deliveries.length===0?<tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No delivery attempts yet</td></tr>:
                  (deliveries as any[]).map(d=>(
                    <tr key={d.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="p-3 text-xs whitespace-nowrap">{new Date(d.created_at).toLocaleString()}</td>
                      <td className="p-3 font-mono text-xs">{d.event}</td>
                      <td className="p-3"><Badge variant={d.status==="delivered"?"default":d.status==="failed"?"destructive":"secondary"}>{d.status}</Badge></td>
                      <td className="p-3 text-xs">{d.response_status||"—"}</td>
                      <td className="p-3 text-xs">{d.attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          {/* ── WHITE LABEL ───────────────────────────────────────── */}
          <TabsContent value="whitelabel" className="mt-4">
            {wlLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading branding settings…</div>
            ) : (
              <div className="max-w-2xl space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10"><Globe className="w-5 h-5 text-primary"/></div>
                  <div>
                    <h2 className="font-display text-sm text-primary">White Label Branding</h2>
                    <p className="text-xs text-muted-foreground">Customize the platform with your own brand identity for your customers.</p>
                  </div>
                </div>

                {/* Preview banner */}
                <Card className="p-4 overflow-hidden relative" style={{ borderColor: wl.primary_color || "#d4af37" }}>
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ background: wl.primary_color || "#d4af37" }}/>
                  <div className="pl-4 flex items-center gap-4">
                    {wl.logo_url
                      ? <img src={wl.logo_url} alt="logo" className="w-10 h-10 rounded object-contain bg-secondary"/>
                      : <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-xs text-muted-foreground">Logo</div>
                    }
                    <div>
                      <p className="font-bold text-sm">{wl.brand_name || "Your Brand Name"}</p>
                      <p className="text-xs text-muted-foreground">{wl.custom_domain || "app.yourdomain.com"}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-border" style={{ background: wl.primary_color }}/>
                      <div className="w-6 h-6 rounded-full border-2 border-border" style={{ background: wl.accent_color }}/>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 space-y-4">
                  <div><Label>Brand Name</Label><Input value={wl.brand_name||""} onChange={e=>setWl({...wl,brand_name:e.target.value})} placeholder="Acme Corp" className="mt-1"/></div>
                  <div><Label>Logo URL</Label><Input value={wl.logo_url||""} onChange={e=>setWl({...wl,logo_url:e.target.value})} placeholder="https://cdn.example.com/logo.png" className="mt-1"/></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Primary Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input type="color" value={wl.primary_color||"#d4af37"} onChange={e=>setWl({...wl,primary_color:e.target.value})} className="w-16 h-10 p-1 cursor-pointer"/>
                        <Input value={wl.primary_color||""} onChange={e=>setWl({...wl,primary_color:e.target.value})}/>
                      </div>
                    </div>
                    <div>
                      <Label>Accent Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input type="color" value={wl.accent_color||"#8b0000"} onChange={e=>setWl({...wl,accent_color:e.target.value})} className="w-16 h-10 p-1 cursor-pointer"/>
                        <Input value={wl.accent_color||""} onChange={e=>setWl({...wl,accent_color:e.target.value})}/>
                      </div>
                    </div>
                  </div>
                  <div><Label>Custom Domain</Label><Input value={wl.custom_domain||""} onChange={e=>setWl({...wl,custom_domain:e.target.value})} placeholder="app.yourdomain.com" className="mt-1"/></div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-md">
                    <div>
                      <p className="text-sm font-medium">Hide "Powered by KemetRise"</p>
                      <p className="text-xs text-muted-foreground">Premium plan required</p>
                    </div>
                    <Switch checked={!!wl.hide_branding} onCheckedChange={v=>setWl({...wl,hide_branding:v})}/>
                  </div>
                  <Button onClick={saveWl} className="w-full font-display"><Save className="w-4 h-4 mr-2"/>Save Branding</Button>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── EXTENSION ────────────────────────────────────────── */}
          <TabsContent value="extension" className="mt-4">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10"><Chrome className="w-5 h-5 text-primary"/></div>
                <div>
                  <h2 className="font-display text-sm text-primary">Browser Extension</h2>
                  <p className="text-xs text-muted-foreground">Quick-access KemetRise from any tab — Chrome, Edge, Brave, Arc, Opera.</p>
                </div>
              </div>

              <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-transparent">
                <Chrome className="w-16 h-16 text-primary mx-auto mb-4 opacity-80"/>
                <h3 className="font-display text-lg text-primary mb-2">KemetRise Quick Access</h3>
                <p className="text-sm text-muted-foreground mb-6">Works in Chrome, Edge, Brave, Arc, and Opera.</p>
                <div className="flex justify-center gap-3">
                  <Button onClick={()=>{
                    fetch("/kemetrise-extension.zip")
                      .then(r=>{if(!r.ok)throw new Error("File not found");return r.blob();})
                      .then(blob=>{
                        const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
                        a.download="kemetrise-extension.zip"; a.click(); URL.revokeObjectURL(a.href);
                        toast.success("Download started");
                      }).catch(e=>toast.error(e.message));
                  }}>
                    <Download className="w-4 h-4 mr-2"/>Download Extension
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-display text-sm text-primary mb-4">Installation Steps</h3>
                <ol className="space-y-3">
                  {[
                    "Unzip the downloaded file.",
                    'Open "chrome://extensions" in Chrome (or Edge, Brave, Arc).',
                    "Enable Developer mode (toggle in top-right corner).",
                    'Click "Load unpacked" and select the unzipped folder.',
                    "The KemetRise icon will appear in your toolbar — click to open.",
                  ].map((s,i)=>(
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i+1}</div>
                      <span className="text-sm">{s}</span>
                    </li>
                  ))}
                </ol>
              </Card>

              <Card className="p-5">
                <h3 className="font-display text-sm text-primary mb-3">Extension Capabilities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {icon:Check,label:"One-click login"},
                    {icon:Check,label:"Quick task creation"},
                    {icon:Check,label:"Notification badge"},
                    {icon:Check,label:"Clipboard shortcuts"},
                    {icon:Check,label:"Offline mode support"},
                    {icon:Check,label:"Dark / light theme sync"},
                  ].map(f=>(
                    <div key={f.label} className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>{f.label}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Webhook Dialog */}
      <Dialog open={hookOpen} onOpenChange={setHookOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Webhook</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Label</Label><Input value={hookForm.label} onChange={e=>setHookForm(p=>({...p,label:e.target.value}))} placeholder="e.g. Slack Invoice Alerts"/></div>
            <div><Label>URL (HTTPS required)</Label><Input value={hookForm.url} onChange={e=>setHookForm(p=>({...p,url:e.target.value}))} placeholder="https://..."/></div>
            <div><Label>Secret (for HMAC signing)</Label><Input value={hookForm.secret} onChange={e=>setHookForm(p=>({...p,secret:e.target.value}))} type="password" placeholder="Optional but recommended"/></div>
            <div>
              <Label>Events</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {events.map(e=>(
                  <button key={e} type="button" onClick={()=>setHookForm(p=>({...p,events:p.events.includes(e)?p.events.filter(x=>x!==e):[...p.events,e]}))}
                    className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${hookForm.events.includes(e)?"bg-primary text-primary-foreground border-primary":"border-border hover:border-primary/50"}`}>{e}</button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setHookOpen(false)}>Cancel</Button>
            <Button onClick={createHook}>Create Webhook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New API Key Dialog */}
      <Dialog open={keyOpen} onOpenChange={setKeyOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New API Key</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label>Label</Label>
            <Input value={keyLabel} onChange={e=>setKeyLabel(e.target.value)} placeholder="e.g. Production Integration" className="mt-1"/>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setKeyOpen(false)}>Cancel</Button>
            <Button onClick={async()=>{await createKey();setKeyOpen(false);}}>Generate Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}