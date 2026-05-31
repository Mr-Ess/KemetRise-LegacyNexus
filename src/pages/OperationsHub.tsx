import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Edit, Search, Package, Truck, BarChart2,
  MessageCircle, Megaphone, ScrollText, ShieldAlert, Box, Factory,
  TrendingUp, DollarSign, AlertTriangle, Lock, Calendar, Download,
  RefreshCw, Heart, Users, Shield, Key, FileText, Clock, Zap,
  BookOpen, UserCheck, Activity, CheckCircle, XCircle, Timer,
  Landmark, Globe, Phone, Mail, GitBranch, Eye, EyeOff, Copy,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useExtTable } from "@/hooks/useExtTable";
import { ExtTable } from "@/services/extended";
import { EmptyState, EntityListSkeleton } from "@/components/shared/EntitySkeleton";
import ExportButton from "@/components/shared/ExportButton";
import { dmsApi, heirsApi, type Heir } from "@/services/system";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

/* ─── Generic field / column types ───────────────────────────────────────── */
type FieldDef  = { key: string; label: string; type?: "text"|"number"|"date"|"textarea"|"boolean" };
type ColDef    = { key: string; label: string; render?: (v: any, row: any) => React.ReactNode };

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, color = "primary" }: {
  icon: React.ElementType; label: string; value: string|number; sub?: string; color?: string;
}) {
  const c: Record<string,string> = {
    primary:"border-primary text-primary", blue:"border-blue-500 text-blue-400",
    emerald:"border-emerald-500 text-emerald-400", amber:"border-amber-500 text-amber-400",
    violet:"border-violet-500 text-violet-400", rose:"border-rose-500 text-rose-400",
    red:"border-red-500 text-red-400",
  };
  const cls = c[color] ?? c.primary;
  return (
    <Card className={`border-l-4 ${cls}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`w-7 h-7 opacity-75 ${cls.split(" ")[1]}`}/>
        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub&&<p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Generic inline CRUD panel ──────────────────────────────────────────── */
function CrudPanel({
  table, title, fields, columns, emptyHint = "No records yet",
}: {
  table: ExtTable; title: string; fields: FieldDef[]; columns: ColDef[]; emptyHint?: string;
}) {
  const { items, loading, refresh, create, update, remove } = useExtTable(table);
  const [open, setOpen]   = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form,  setForm]  = useState<Record<string,any>>({});
  const [q,     setQ]     = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const lq = q.toLowerCase();
    return items.filter(it =>
      fields.some(f => String(it[f.key]||"").toLowerCase().includes(lq))
    );
  }, [items, q, fields]);

  const openNew  = () => { setEditId(null); setForm({}); setOpen(true); };
  const openEdit = (row: any) => {
    setEditId(row.id);
    setForm(Object.fromEntries(fields.map(f => [f.key, row[f.key] ?? ""])));
    setOpen(true);
  };

  const submit = async () => {
    const payload: Record<string,any> = {};
    for (const f of fields) {
      const v = form[f.key];
      if (v === undefined || v === "") continue;
      payload[f.key] = f.type === "number" ? Number(v) : f.type === "boolean" ? Boolean(v) : v;
    }
    if (Object.keys(payload).length === 0) return;
    if (editId) await update(editId, payload);
    else        await create(payload);
    setOpen(false); setForm({}); setEditId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground"/>
          <Input placeholder={`Search ${title}…`} className="pl-9 h-8 text-xs" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="w-3.5 h-3.5"/></Button>
        <ExportButton data={filtered} filename={table} title={title}/>
        <Button size="sm" className="gap-1 text-xs" onClick={openNew}><Plus className="w-3.5 h-3.5"/>Add</Button>
      </div>

      {loading ? <EntityListSkeleton rows={3}/> : filtered.length === 0
        ? <EmptyState title={`No ${title}`} hint={emptyHint}/>
        : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-[11px] font-display uppercase tracking-wider">
              <tr>
                {columns.map(c=><th key={c.key} className="text-left p-3">{c.label}</th>)}
                <th className="p-3"/>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row:any)=>(
                <tr key={row.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                  {columns.map(c=>(
                    <td key={c.key} className="p-3 text-xs">
                      {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={()=>openEdit(row)}><Edit className="w-3.5 h-3.5"/></Button>
                      <Button size="sm" variant="ghost" onClick={()=>remove(row.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display">{editId?"Edit":"New"} {title}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {fields.map(f=>(
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                {f.type === "textarea"
                  ? <Textarea value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} rows={3} className="mt-1"/>
                  : f.type === "boolean"
                  ? <div className="mt-1"><Switch checked={!!form[f.key]} onCheckedChange={v=>setForm(p=>({...p,[f.key]:v}))}/></div>
                  : <Input type={f.type||"text"} value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="mt-1"/>
                }
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Module mini-cards for Inventory/Logistics/Finance tabs ─────────────── */
type ModuleDef = { table: ExtTable; title: string; fields: FieldDef[]; titleKey: string };

function ModuleCard({ mod }: { mod: ModuleDef }) {
  const { items, loading, create, remove } = useExtTable(mod.table);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string,any>>({});

  const submit = async () => {
    const payload: Record<string,any> = {};
    for (const f of mod.fields) {
      if (form[f.key] === undefined || form[f.key] === "") continue;
      payload[f.key] = f.type === "number" ? Number(form[f.key]) : form[f.key];
    }
    if (Object.keys(payload).length === 0) return;
    await create(payload); setForm({}); setOpen(false);
  };

  return (
    <Card className="p-4 bg-card/50 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-primary text-sm">{mod.title} <span className="text-xs text-muted-foreground font-normal">({items.length})</span></h3>
        <Button size="sm" variant="outline" onClick={()=>setOpen(true)}><Plus className="w-3 h-3 mr-1"/>Add</Button>
      </div>
      {loading ? <EntityListSkeleton rows={2}/> : items.length === 0
        ? <EmptyState title="No records" hint="Add the first entry"/>
        : (
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {items.slice(0,15).map((it:any)=>(
            <div key={it.id} className="flex items-center justify-between text-xs p-2 hover:bg-muted/30 rounded">
              <span className="truncate flex-1 mr-2">{it[mod.titleKey]||it.id?.slice(0,8)||"—"}</span>
              <Button size="icon" variant="ghost" className="w-6 h-6" onClick={()=>remove(it.id)}><Trash2 className="w-3 h-3"/></Button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-sm">Add to {mod.title}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            {mod.fields.map(f=>(
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Input type={f.type||"text"} value={form[f.key]||""} onChange={e=>setForm({...form,[f.key]:e.target.value})} className="mt-1"/>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ─── Tab configs ────────────────────────────────────────────────────────── */
const INVENTORY_MODULES: ModuleDef[] = [
  { table:"materials",   title:"Raw Materials", titleKey:"name", fields:[
    {key:"name",label:"Name"},{key:"unit",label:"Unit"},
    {key:"current_stock",label:"Stock",type:"number"},{key:"min_stock_level",label:"Min Level",type:"number"},
  ]},
  { table:"inventory",   title:"Inventory Records", titleKey:"id", fields:[
    {key:"branch_id",label:"Branch (ID)"},{key:"material_id",label:"Material (ID)"},{key:"quantity",label:"Qty",type:"number"},
  ]},
  { table:"suppliers",   title:"Suppliers", titleKey:"company_name", fields:[
    {key:"company_name",label:"Company"},{key:"contact_person",label:"Contact"},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"category",label:"Category"},
  ]},
];
const LOGISTICS_MODULES: ModuleDef[] = [
  { table:"logistics_shipping",  title:"Shipping", titleKey:"tracking_number", fields:[
    {key:"tracking_number",label:"Tracking #"},{key:"carrier",label:"Carrier"},{key:"status",label:"Status"},{key:"estimated_delivery",label:"Est. Delivery",type:"date"},
  ]},
  { table:"import_export",       title:"Import / Export", titleKey:"document_type", fields:[
    {key:"document_type",label:"Doc Type"},{key:"country_of_origin",label:"Country"},{key:"status",label:"Status"},
  ]},
  { table:"artistic_production", title:"Artistic Production", titleKey:"project_name", fields:[
    {key:"project_name",label:"Project"},{key:"media_type",label:"Media"},{key:"production_status",label:"Status"},
  ]},
];
const FINANCE_MODULES: ModuleDef[] = [
  { table:"finance_analytics",  title:"Financial Analytics", titleKey:"month_year", fields:[
    {key:"month_year",label:"Month/Year"},{key:"total_revenue",label:"Revenue",type:"number"},
    {key:"total_expenses",label:"Expenses",type:"number"},{key:"net_profit",label:"Net Profit",type:"number"},
  ]},
  { table:"assets_management",  title:"Asset Management", titleKey:"asset_name", fields:[
    {key:"asset_name",label:"Asset Name"},{key:"purchase_date",label:"Purchase Date",type:"date"},
    {key:"value",label:"Value",type:"number"},{key:"location",label:"Location"},
  ]},
  { table:"payment_gateways",   title:"Payment Gateways", titleKey:"gateway_name", fields:[
    {key:"gateway_name",label:"Gateway"},{key:"provider",label:"Provider"},{key:"status",label:"Status"},
  ]},
];

/* ─── CRM columns / fields ───────────────────────────────────────────────── */
const CRM_COLS: ColDef[] = [
  { key:"interaction_type", label:"Type", render:(v)=><Badge variant="outline" className="text-[10px]">{v||"General"}</Badge>},
  { key:"notes",            label:"Notes", render:(v)=><span className="max-w-[200px] truncate block">{v||"—"}</span>},
  { key:"client_id",        label:"Client ID", render:(v)=><span className="font-mono text-[10px] text-muted-foreground">{v?String(v).slice(0,8)+"…":"—"}</span>},
  { key:"agent_id",         label:"Agent ID",  render:(v)=><span className="font-mono text-[10px] text-muted-foreground">{v?String(v).slice(0,8)+"…":"—"}</span>},
  { key:"interaction_date", label:"Date",  render:(v)=>v?new Date(v).toLocaleDateString():"—"},
];
const CRM_FIELDS: FieldDef[] = [
  {key:"interaction_type",label:"Interaction Type",type:"text"},
  {key:"notes",           label:"Notes *",type:"textarea"},
  {key:"client_id",       label:"Client ID (UUID)"},
  {key:"agent_id",        label:"Agent ID (UUID)"},
  {key:"interaction_date",label:"Date",type:"date"},
];

/* ─── Marketing columns / fields ─────────────────────────────────────────── */
const MKT_COLS: ColDef[] = [
  { key:"campaign_name", label:"Campaign", render:(v)=><span className="font-semibold">{v}</span>},
  { key:"status",        label:"Status",   render:(v)=><Badge variant={v==="active"?"default":v==="completed"?"outline":"secondary"} className="text-[10px]">{v||"draft"}</Badge>},
  { key:"channel",       label:"Channel",  render:(v)=>v||"—"},
  { key:"budget",        label:"Budget",   render:(v)=><span className="font-mono text-emerald-400">{v?`$${Number(v).toLocaleString()}`:"—"}</span>},
  { key:"leads_generated",label:"Leads",  render:(v)=><span className="font-bold">{v||0}</span>},
  { key:"start_date",    label:"Start",    render:(v)=>v?new Date(v).toLocaleDateString():"—"},
];
const MKT_FIELDS: FieldDef[] = [
  {key:"campaign_name",  label:"Campaign Name *"},
  {key:"status",         label:"Status (draft/active/paused/completed)"},
  {key:"channel",        label:"Channel (email/social/search/display)"},
  {key:"budget",         label:"Budget ($)",type:"number"},
  {key:"leads_generated",label:"Leads Generated",type:"number"},
  {key:"start_date",     label:"Start Date",type:"date"},
  {key:"end_date",       label:"End Date",type:"date"},
];

/* ─── Legal Vault columns / fields ──────────────────────────────────────── */
function ExpiryBadge({ date }: { date: string }) {
  if (!date) return <span className="text-muted-foreground text-xs">—</span>;
  const days = Math.floor((new Date(date).getTime() - Date.now()) / 86400000);
  if (days < 0)  return <Badge variant="destructive" className="text-[10px]">Expired</Badge>;
  if (days < 30) return <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-400">Expires in {days}d</Badge>;
  return <span className="text-xs">{new Date(date).toLocaleDateString()}</span>;
}
const LEGAL_COLS: ColDef[] = [
  { key:"doc_title",   label:"Title",     render:(v)=><span className="font-semibold">{v}</span>},
  { key:"doc_type",    label:"Type",      render:(v)=>v?<Badge variant="outline" className="text-[10px]">{v}</Badge>:<span className="text-muted-foreground">—</span>},
  { key:"expiry_date", label:"Expiry",    render:(v)=><ExpiryBadge date={v}/>},
  { key:"is_encrypted",label:"Encrypted", render:(v)=>v?<Lock className="w-3.5 h-3.5 text-emerald-400"/>:<span className="text-muted-foreground">—</span>},
  { key:"file_url",    label:"File",      render:(v)=>v?<a href={v} target="_blank" rel="noreferrer" className="text-primary underline text-[10px] flex items-center gap-1" onClick={e=>e.stopPropagation()}><Download className="w-3 h-3"/>View</a>:<span className="text-muted-foreground">—</span>},
  { key:"created_at",  label:"Added",     render:(v)=>v?new Date(v).toLocaleDateString():"—"},
];
const LEGAL_FIELDS: FieldDef[] = [
  {key:"doc_title",   label:"Document Title *"},
  {key:"doc_type",    label:"Type (contract/nda/license/compliance/other)"},
  {key:"file_url",    label:"File URL"},
  {key:"expiry_date", label:"Expiry Date",type:"date"},
  {key:"is_encrypted",label:"Encrypted",type:"boolean"},
  {key:"notes",       label:"Notes",type:"textarea"},
];

/* ─── Overview counters (single-table hooks) ─────────────────────────────── */
function useCount(table: ExtTable) {
  const { items } = useExtTable(table);
  return items.length;
}

/* ─── DMS Status Badge ───────────────────────────────────────────────────── */
function DmsStatusBadge({ active, triggered }: { active: boolean; triggered: boolean }) {
  if (triggered) return <Badge className="bg-red-500/20 border-red-500 text-red-400 animate-pulse">⚡ PROTOCOL ACTIVE</Badge>;
  if (active)    return <Badge className="bg-emerald-500/20 border-emerald-500 text-emerald-400">✓ Monitoring</Badge>;
  return              <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>;
}

/* ─── Legacy Protocol Panel ──────────────────────────────────────────────── */
function LegacyProtocolPanel() {
  const [dms,      setDms]      = useState<any>(null);
  const [heirs,    setHeirs]    = useState<Heir[]>([]);
  const [legalDocs,setLegalDocs]= useState<any[]>([]);
  const [assets,   setAssets]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [heirOpen, setHeirOpen] = useState(false);
  const [editHeirId,setEditHeirId] = useState<string|null>(null);
  const [heirForm, setHeirForm] = useState<Heir>({ id:"", name:"", email:"", phone:"", relation:"" });
  const [showTransfer, setShowTransfer] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [d, h, l, a] = await Promise.all([
        dmsApi.get(),
        heirsApi.list(),
        tenantDb.select("legal_vault",      { orderBy:"created_at", ascending:false, limit:100 }),
        tenantDb.select("assets_management",{ orderBy:"created_at", ascending:false, limit:100 }),
      ]);
      setDms(d); setHeirs(h);
      setLegalDocs(l as any[]); setAssets(a as any[]);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const saveHeir = async () => {
    if (!heirForm.name.trim() || !heirForm.email.trim()) { toast.error("Name & email required"); return; }
    try {
      await heirsApi.upsert(editHeirId ? { ...heirForm, id: editHeirId } : { ...heirForm, id: "" });
      toast.success("Heir saved");
      setHeirOpen(false); setEditHeirId(null);
      setHeirForm({ id:"", name:"", email:"", phone:"", relation:"" });
      setHeirs(await heirsApi.list());
    } catch (e: any) { toast.error(e.message); }
  };

  const removeHeir = async (id: string) => {
    if (!confirm("Remove this heir?")) return;
    try { await heirsApi.remove(id); setHeirs(await heirsApi.list()); toast.success("Removed"); }
    catch (e: any) { toast.error(e.message); }
  };

  const sendHeartbeat = async () => {
    try { await dmsApi.heartbeat(); setDms(await dmsApi.get()); toast.success("Heartbeat sent ✓"); }
    catch (e: any) { toast.error(e.message); }
  };

  const copyTransferSummary = () => {
    const lines = [
      "═══════════════════════════════════════",
      "    KEMETRISE : LEGACY NEXUS",
      "    DIGITAL INHERITANCE TRANSFER MANIFEST",
      "═══════════════════════════════════════",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "── AUTHORIZED HEIRS ────────────────────",
      ...heirs.map((h,i) => `${i+1}. ${h.name} <${h.email}>${h.relation ? ` [${h.relation}]` : ""}${h.phone ? ` • ${h.phone}` : ""}`),
      "",
      "── LEGAL DOCUMENTS TO TRANSFER ─────────",
      ...legalDocs.map((d,i) => `${i+1}. [${d.doc_type||"DOC"}] ${d.doc_title}${d.expiry_date ? ` (expires ${new Date(d.expiry_date).toLocaleDateString()})` : ""}${d.is_encrypted ? " 🔒" : ""}`),
      "",
      "── DIGITAL ASSETS ───────────────────────",
      ...assets.map((a,i) => `${i+1}. ${a.asset_name} — $${Number(a.value||0).toLocaleString()}${a.location ? ` @ ${a.location}` : ""}`),
      "",
      `TOTAL ASSET VALUE: $${assets.reduce((s,a)=>s+(a.value||0),0).toLocaleString()}`,
      "═══════════════════════════════════════",
    ].join("\n");
    navigator.clipboard.writeText(lines).then(() => toast.success("Transfer manifest copied to clipboard"));
  };

  // derived
  const dmsDeadline = dms?.deadline_days ?? 3;
  const lastBeat    = dms?.last_heartbeat ? new Date(dms.last_heartbeat) : null;
  const hoursAgo    = lastBeat ? Math.floor((Date.now() - lastBeat.getTime()) / 3600000) : null;
  const isTriggered = hoursAgo !== null && hoursAgo >= dmsDeadline * 24;
  const isActive    = !!dms?.active;
  const totalAssetValue = assets.reduce((s, a) => s + (a.value || 0), 0);
  const encryptedDocs   = legalDocs.filter(d => d.is_encrypted).length;
  const expiringDocs    = legalDocs.filter(d => d.expiry_date && Math.floor((new Date(d.expiry_date).getTime() - Date.now()) / 86400000) < 30).length;

  if (loading) return <EntityListSkeleton/>;

  return (
    <div className="space-y-6">

      {/* ── Emergency Status Banner ── */}
      {isTriggered && (
        <div className="rounded-lg border-2 border-red-500 bg-red-500/10 p-4 flex items-center gap-3 animate-pulse">
          <Zap className="w-6 h-6 text-red-400 shrink-0"/>
          <div>
            <p className="font-display text-sm text-red-400 font-bold">⚡ EMERGENCY PROTOCOL TRIGGERED</p>
            <p className="text-xs text-muted-foreground">No heartbeat in {hoursAgo}h — Legacy transfer protocol is active. Heirs will receive notifications.</p>
          </div>
          <Button size="sm" className="ml-auto bg-red-500 hover:bg-red-600 text-white" onClick={sendHeartbeat}>
            <Heart className="w-4 h-4 mr-1"/>Send Heartbeat
          </Button>
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Users}      label="Heirs"           value={heirs.length}          color="primary"/>
        <KpiCard icon={ScrollText} label="Legal Docs"      value={legalDocs.length}      sub={`${encryptedDocs} encrypted`} color="blue"/>
        <KpiCard icon={Landmark}   label="Digital Assets"  value={assets.length}         sub={`$${totalAssetValue.toLocaleString()}`} color="emerald"/>
        <KpiCard icon={AlertTriangle} label="Expiring Docs" value={expiringDocs}          color={expiringDocs > 0 ? "amber" : "emerald"}/>
        <KpiCard icon={Timer}      label="Deadline"        value={`${dmsDeadline}d`}     sub={hoursAgo !== null ? `Last beat ${hoursAgo}h ago` : "No beat yet"} color={isTriggered ? "red" : "emerald"}/>
        <KpiCard icon={Shield}     label="Status"          value={isTriggered ? "⚡" : isActive ? "✓" : "—"} sub={isTriggered ? "TRIGGERED" : isActive ? "Monitoring" : "Inactive"} color={isTriggered ? "red" : isActive ? "emerald" : "primary"}/>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">

        {/* ── DMS Panel ── */}
        <Card className={`border ${isTriggered ? "border-red-500/60" : "border-border"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className={`w-4 h-4 ${isTriggered ? "text-red-400 animate-pulse" : "text-emerald-400"}`}/>
              Dead Man's Switch
              <DmsStatusBadge active={isActive} triggered={isTriggered}/>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Protocol Active</span>
                <span className={`font-bold ${isActive ? "text-emerald-400" : "text-muted-foreground"}`}>{isActive ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-bold">{dmsDeadline} days</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Last Heartbeat</span>
                <span className={`font-bold ${isTriggered ? "text-red-400" : ""}`}>
                  {lastBeat ? `${hoursAgo}h ago` : "Never"}
                </span>
              </div>
              {lastBeat && (
                <div className="flex justify-between pb-1">
                  <span className="text-muted-foreground">Timestamp</span>
                  <span className="text-[10px]">{lastBeat.toLocaleString()}</span>
                </div>
              )}
            </div>
            {/* Progress bar */}
            {isActive && hoursAgo !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Heartbeat health</span>
                  <span>{Math.min(100, Math.round((hoursAgo / (dmsDeadline * 24)) * 100))}% elapsed</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isTriggered ? "bg-red-500" : hoursAgo > dmsDeadline * 18 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, Math.round((hoursAgo / (dmsDeadline * 24)) * 100))}%` }}
                  />
                </div>
              </div>
            )}
            <Button size="sm" className="w-full gap-2" onClick={sendHeartbeat}>
              <Heart className="w-4 h-4"/>Send Heartbeat Now
            </Button>
            <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => window.location.href = "/settings?section=emergency"}>
              <Shield className="w-4 h-4"/>Configure Protocol
            </Button>
          </CardContent>
        </Card>

        {/* ── Heirs Panel ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary"/>
                Digital Heirs
                <Badge variant="outline" className="text-[10px]">{heirs.length}</Badge>
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => { setEditHeirId(null); setHeirForm({ id:"", name:"", email:"", phone:"", relation:"" }); setHeirOpen(true); }}>
                <Plus className="w-3 h-3"/>Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {heirs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No heirs registered yet.</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
                {heirs.map(h => (
                  <div key={h.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/30 border border-border/50">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <UserCheck className="w-3.5 h-3.5 text-primary"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{h.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{h.email}</p>
                      {h.relation && <p className="text-[9px] text-primary">{h.relation}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditHeirId(h.id); setHeirForm(h); setHeirOpen(true); }}><Edit className="w-3 h-3"/></Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeHeir(h.id)}><Trash2 className="w-3 h-3 text-destructive"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Transfer Summary Panel ── */}
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary"/>
              Transfer Manifest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Authorized Heirs</span>
                <span className="font-bold text-primary">{heirs.length}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Legal Documents</span>
                <span className="font-bold">{legalDocs.length}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Digital Assets</span>
                <span className="font-bold">{assets.length}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Asset Value</span>
                <span className="font-bold text-emerald-400">${totalAssetValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Encryption Status</span>
                <span className={`font-bold ${encryptedDocs > 0 ? "text-blue-400" : "text-muted-foreground"}`}>
                  {encryptedDocs}/{legalDocs.length} encrypted
                </span>
              </div>
            </div>
            <div className="pt-1 space-y-2">
              <Button size="sm" className="w-full gap-2" variant="outline" onClick={copyTransferSummary}>
                <Copy className="w-4 h-4"/>Copy Manifest
              </Button>
              <Button size="sm" className="w-full gap-2" variant="outline" onClick={() => setShowTransfer(true)}>
                <Eye className="w-4 h-4"/>Preview Transfer
              </Button>
              <Button size="sm" className="w-full gap-2" variant="outline" onClick={() => { const e = new Blob([JSON.stringify({ heirs, legalDocs, assets, generated: new Date().toISOString() }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(e); a.download = "legacy-manifest.json"; a.click(); }}>
                <Download className="w-4 h-4"/>Export JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Legal Documents assigned to heirs ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-blue-400"/>
            Legal Vault — Documents to Transfer
            <Badge variant="outline" className="text-[10px]">{legalDocs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {legalDocs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No legal documents in vault. <button className="text-primary underline" onClick={() => window.location.href = "/legal-vault"}>Add documents →</button></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary/40">
                  <tr>
                    <th className="text-left p-2">Document</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Expiry</th>
                    <th className="p-2 text-center">🔒</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2"/>
                  </tr>
                </thead>
                <tbody>
                  {legalDocs.map(doc => {
                    const days = doc.expiry_date ? Math.floor((new Date(doc.expiry_date).getTime() - Date.now()) / 86400000) : null;
                    const expired = days !== null && days < 0;
                    const expiring = days !== null && !expired && days < 30;
                    return (
                      <tr key={doc.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="p-2 font-medium max-w-[200px] truncate">{doc.doc_title}</td>
                        <td className="p-2"><Badge variant="outline" className="text-[10px]">{doc.doc_type || "—"}</Badge></td>
                        <td className="p-2">
                          {days === null ? <span className="text-muted-foreground">—</span>
                            : expired ? <Badge variant="destructive" className="text-[10px]">Expired</Badge>
                            : expiring ? <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-400">{days}d left</Badge>
                            : <span>{new Date(doc.expiry_date).toLocaleDateString()}</span>}
                        </td>
                        <td className="p-2 text-center">{doc.is_encrypted ? <Lock className="w-3.5 h-3.5 text-emerald-400 mx-auto"/> : <span className="text-muted-foreground">—</span>}</td>
                        <td className="p-2 text-center">
                          {expired ? <XCircle className="w-3.5 h-3.5 text-red-400 mx-auto"/> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mx-auto"/>}
                        </td>
                        <td className="p-2">
                          {doc.file_url && <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-primary underline text-[10px] flex items-center gap-1"><Download className="w-3 h-3"/>View</a>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Digital Assets ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Landmark className="w-4 h-4 text-emerald-400"/>
            Digital Assets to Inherit
            <Badge variant="outline" className="text-[10px]">{assets.length}</Badge>
            <span className="ml-auto text-xs font-normal text-emerald-400">${totalAssetValue.toLocaleString()} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No assets registered. <button className="text-primary underline" onClick={() => window.location.href = "/assets"}>Add assets →</button></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-secondary/40">
                  <tr>
                    <th className="text-left p-2">Asset</th>
                    <th className="text-left p-2">Value</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Purchase Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="p-2 font-medium">{a.asset_name}</td>
                      <td className="p-2 text-emerald-400 font-bold">${Number(a.value || 0).toLocaleString()}</td>
                      <td className="p-2 text-muted-foreground">{a.location || "—"}</td>
                      <td className="p-2 text-muted-foreground">{a.purchase_date ? new Date(a.purchase_date).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Heir Form Dialog ── */}
      <Dialog open={heirOpen} onOpenChange={setHeirOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editHeirId ? "Edit Heir" : "Add Digital Heir"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Full Name *</Label><Input value={heirForm.name} onChange={e => setHeirForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Sara Ahmed"/></div>
            <div className="space-y-1"><Label>Email *</Label><Input type="email" value={heirForm.email} onChange={e => setHeirForm(p => ({...p, email: e.target.value}))} placeholder="heir@email.com"/></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={heirForm.phone||""} onChange={e => setHeirForm(p => ({...p, phone: e.target.value}))} placeholder="+20 100 000 0000"/></div>
            <div className="space-y-1"><Label>Relation</Label><Input value={heirForm.relation||""} onChange={e => setHeirForm(p => ({...p, relation: e.target.value}))} placeholder="e.g. Son, Daughter, Lawyer"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHeirOpen(false)}>Cancel</Button>
            <Button onClick={saveHeir}>Save Heir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Transfer Preview Dialog ── */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><GitBranch className="w-4 h-4 text-primary"/>Legacy Transfer Preview</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-2">Authorized Heirs ({heirs.length})</p>
              {heirs.length === 0 ? <p className="text-xs text-muted-foreground italic">No heirs registered</p> : (
                <div className="space-y-1">
                  {heirs.map(h => (
                    <div key={h.id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded text-xs">
                      <UserCheck className="w-3.5 h-3.5 text-primary shrink-0"/>
                      <span className="font-semibold">{h.name}</span>
                      <span className="text-muted-foreground">{h.email}</span>
                      {h.relation && <Badge variant="outline" className="text-[9px]">{h.relation}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-2">Legal Documents ({legalDocs.length})</p>
              {legalDocs.length === 0 ? <p className="text-xs text-muted-foreground italic">No documents in vault</p> : (
                <div className="space-y-1">
                  {legalDocs.map(d => (
                    <div key={d.id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded text-xs">
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0"/>
                      <span>{d.doc_title}</span>
                      {d.doc_type && <Badge variant="outline" className="text-[9px]">{d.doc_type}</Badge>}
                      {d.is_encrypted && <Lock className="w-3 h-3 text-emerald-400"/>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-2">Digital Assets ({assets.length})</p>
              {assets.length === 0 ? <p className="text-xs text-muted-foreground italic">No assets registered</p> : (
                <div className="space-y-1">
                  {assets.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded text-xs">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>
                        <span>{a.asset_name}</span>
                        {a.location && <span className="text-muted-foreground">@ {a.location}</span>}
                      </div>
                      <span className="font-bold text-emerald-400">${Number(a.value||0).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-2 border-t border-border font-bold text-xs">
                    <span>Total Value</span>
                    <span className="text-emerald-400">${totalAssetValue.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copyTransferSummary}><Copy className="w-4 h-4 mr-1"/>Copy Manifest</Button>
            <Button onClick={() => setShowTransfer(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function OperationsHub() {
  const navigate = useNavigate();

  // Counts for Overview KPIs
  const mCount  = useCount("materials");
  const sCount  = useCount("suppliers");
  const lsCount = useCount("logistics_shipping");
  const crmCount= useCount("crm_interactions");
  const mktCount= useCount("marketing_campaigns");
  const legalCount = useCount("legal_vault");
  const heirCount  = useCount("digital_inheritance");
  const assetCount = useCount("assets_management");

  // Legal expiry warning (reuse items from a hook)
  const { items: legalItems } = useExtTable("legal_vault");
  const expiringSoon = legalItems.filter(d =>
    d.expiry_date && Math.floor((new Date(d.expiry_date).getTime()-Date.now())/86400000) < 30
  ).length;

  // Marketing KPIs
  const { items: mktItems } = useExtTable("marketing_campaigns");
  const totalBudget  = mktItems.reduce((s,m)=>s+(m.budget||0),0);
  const totalLeads   = mktItems.reduce((s,m)=>s+(m.leads_generated||0),0);
  const activeCampaigns = mktItems.filter(m=>m.status==="active").length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <button onClick={()=>navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4"/><span className="font-body text-sm">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Factory className="w-6 h-6 text-primary"/></div>
          <div>
            <h1 className="font-display text-xl text-primary">OPERATIONS HUB</h1>
            <p className="text-xs text-muted-foreground">Inventory · Logistics · Finance · CRM · Marketing · Legal Vault · Digital Inheritance · Emergency Protocol</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 mb-2">
            <TabsTrigger value="overview"   className="text-xs"><BarChart2 className="w-3.5 h-3.5 mr-1"/>Overview</TabsTrigger>
            <TabsTrigger value="inventory"  className="text-xs"><Package className="w-3.5 h-3.5 mr-1"/>Inventory</TabsTrigger>
            <TabsTrigger value="logistics"  className="text-xs"><Truck className="w-3.5 h-3.5 mr-1"/>Logistics</TabsTrigger>
            <TabsTrigger value="finance"    className="text-xs"><DollarSign className="w-3.5 h-3.5 mr-1"/>Finance</TabsTrigger>
            <TabsTrigger value="crm"        className="text-xs"><MessageCircle className="w-3.5 h-3.5 mr-1"/>CRM</TabsTrigger>
            <TabsTrigger value="marketing"  className="text-xs"><Megaphone className="w-3.5 h-3.5 mr-1"/>Marketing</TabsTrigger>
            <TabsTrigger value="legal"      className="text-xs"><ScrollText className="w-3.5 h-3.5 mr-1"/>Legal Vault{expiringSoon>0&&<Badge variant="destructive" className="ml-1 text-[9px] px-1">{expiringSoon}</Badge>}</TabsTrigger>
            <TabsTrigger value="legacy"     className="text-xs"><Heart className="w-3.5 h-3.5 mr-1"/>Legacy Protocol</TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════ OVERVIEW ══ */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
              <KpiCard icon={Package}     label="Materials"      value={mCount}      color="primary"/>
              <KpiCard icon={Box}         label="Suppliers"      value={sCount}      color="blue"/>
              <KpiCard icon={Truck}       label="Shipments"      value={lsCount}     color="emerald"/>
              <KpiCard icon={MessageCircle} label="CRM Records"  value={crmCount}    color="violet"/>
              <KpiCard icon={Megaphone}   label="Campaigns"      value={mktCount}    sub={`${activeCampaigns} active`} color="amber"/>
              <KpiCard icon={ScrollText}  label="Legal Docs"     value={legalCount}  sub={expiringSoon>0?`${expiringSoon} expiring`:"All valid"} color={expiringSoon>0?"red":"emerald"}/>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <KpiCard icon={Users}   label="Digital Heirs"   value={heirCount}  color="primary"/>
              <KpiCard icon={Landmark} label="Assets Managed" value={assetCount} color="emerald"/>
              <KpiCard icon={Heart}   label="Legacy Protocol" value={heirCount > 0 ? "ARMED" : "SETUP"} color={heirCount > 0 ? "emerald" : "amber"}/>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-400"/>Marketing Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs border-b pb-1.5"><span className="text-muted-foreground">Total Campaigns</span><span className="font-bold">{mktCount}</span></div>
                  <div className="flex justify-between text-xs border-b pb-1.5"><span className="text-muted-foreground">Active</span><span className="font-bold text-emerald-400">{activeCampaigns}</span></div>
                  <div className="flex justify-between text-xs border-b pb-1.5"><span className="text-muted-foreground">Total Budget</span><span className="font-bold text-amber-400">${totalBudget.toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Leads Generated</span><span className="font-bold text-primary">{totalLeads.toLocaleString()}</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ScrollText className="w-4 h-4 text-blue-400"/>Legal Status</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs border-b pb-1.5"><span className="text-muted-foreground">Total Documents</span><span className="font-bold">{legalCount}</span></div>
                  <div className="flex justify-between text-xs border-b pb-1.5"><span className="text-muted-foreground">Expiring (&lt;30 days)</span><span className={`font-bold ${expiringSoon>0?"text-amber-400":""}`}>{expiringSoon}</span></div>
                  <div className="flex justify-between text-xs border-b pb-1.5"><span className="text-muted-foreground">Encrypted</span><span className="font-bold text-emerald-400">{legalItems.filter(d=>d.is_encrypted).length}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Expired</span><span className={`font-bold ${legalItems.filter(d=>d.expiry_date&&new Date(d.expiry_date)<new Date()).length>0?"text-red-400":""}`}>{legalItems.filter(d=>d.expiry_date&&new Date(d.expiry_date)<new Date()).length}</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-400"/>Expiring Documents</CardTitle></CardHeader>
                <CardContent>
                  {legalItems.filter(d=>d.expiry_date).sort((a,b)=>new Date(a.expiry_date).getTime()-new Date(b.expiry_date).getTime()).slice(0,5).map(d=>(
                    <div key={d.id} className="flex justify-between items-center text-xs py-1.5 border-b last:border-0">
                      <span className="truncate flex-1 mr-2">{d.doc_title}</span>
                      <ExpiryBadge date={d.expiry_date}/>
                    </div>
                  ))}
                  {legalItems.filter(d=>d.expiry_date).length===0&&<p className="text-xs text-muted-foreground text-center py-4">No dated documents</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═════════════════════════════════ INVENTORY ══ */}
          <TabsContent value="inventory">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {INVENTORY_MODULES.map(m=><ModuleCard key={m.table} mod={m}/>)}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════ LOGISTICS ══ */}
          <TabsContent value="logistics">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {LOGISTICS_MODULES.map(m=><ModuleCard key={m.table} mod={m}/>)}
            </div>
          </TabsContent>

          {/* ════════════════════════════════════ FINANCE ══ */}
          <TabsContent value="finance">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {FINANCE_MODULES.map(m=><ModuleCard key={m.table} mod={m}/>)}
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════ CRM ══ */}
          <TabsContent value="crm" className="mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <KpiCard icon={MessageCircle} label="Total Interactions" value={crmCount} color="violet"/>
            </div>
            <CrudPanel
              table="crm_interactions" title="CRM Interaction"
              fields={CRM_FIELDS} columns={CRM_COLS}
              emptyHint="Log your first client interaction"
            />
          </TabsContent>

          {/* ══════════════════════════════════ MARKETING ══ */}
          <TabsContent value="marketing" className="mt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <KpiCard icon={Megaphone}    label="Total Campaigns"    value={mktCount}                        color="amber"/>
              <KpiCard icon={TrendingUp}   label="Active"             value={activeCampaigns}                 color="emerald"/>
              <KpiCard icon={DollarSign}   label="Total Budget"       value={`$${totalBudget.toLocaleString()}`}  color="blue"/>
              <KpiCard icon={ShieldAlert}  label="Leads Generated"    value={totalLeads.toLocaleString()}     color="violet"/>
            </div>
            <CrudPanel
              table="marketing_campaigns" title="Marketing Campaign"
              fields={MKT_FIELDS} columns={MKT_COLS}
              emptyHint="Create your first marketing campaign"
            />
          </TabsContent>

          {/* ═══════════════════════════════════ LEGAL ══ */}
          <TabsContent value="legal" className="mt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <KpiCard icon={ScrollText}   label="Total Docs"    value={legalCount}                                   color="primary"/>
              <KpiCard icon={AlertTriangle} label="Expiring Soon" value={expiringSoon}                                color={expiringSoon>0?"amber":"emerald"}/>
              <KpiCard icon={Lock}         label="Encrypted"     value={legalItems.filter(d=>d.is_encrypted).length} color="blue"/>
              <KpiCard icon={Calendar}     label="Expired"       value={legalItems.filter(d=>d.expiry_date&&new Date(d.expiry_date)<new Date()).length} color="red"/>
            </div>
            <CrudPanel
              table="legal_vault" title="Legal Document"
              fields={LEGAL_FIELDS} columns={LEGAL_COLS}
              emptyHint="Upload your first legal document"
            />
          </TabsContent>

          {/* ══════════════════════════ LEGACY PROTOCOL ══ */}
          <TabsContent value="legacy" className="mt-2">
            <LegacyProtocolPanel/>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

