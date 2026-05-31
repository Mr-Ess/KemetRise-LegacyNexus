import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Crown, FolderOpen, Briefcase, Building2, Users, UserCheck,
  Plus, Edit, Trash2, Search, RefreshCw, ExternalLink, BarChart2,
  MapPin, Globe, Mail, Phone, DollarSign, TrendingUp, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrands } from "@/context/BrandsContext";
import { useEntities } from "@/hooks/useEntities";
import { useExtTable } from "@/hooks/useExtTable";
import ExportButton from "@/components/shared/ExportButton";
import { toast } from "sonner";

/* ─── helpers ───────────────────────────────────────────────── */
const statusBadge = (s: string) => {
  const m: Record<string,string> = {
    active:"bg-emerald-500/20 text-emerald-400", inactive:"bg-muted text-muted-foreground",
    maintenance:"bg-amber-500/20 text-amber-400", pending:"bg-blue-500/20 text-blue-400",
    Active:"bg-emerald-500/20 text-emerald-400", Inactive:"bg-muted text-muted-foreground",
    "On Hold":"bg-amber-500/20 text-amber-400", Completed:"bg-blue-500/20 text-blue-400",
    Cancelled:"bg-red-500/20 text-red-400", Lead:"bg-primary/20 text-primary",
    Maintenance:"bg-amber-500/20 text-amber-400",
  };
  return <Badge variant="outline" className={`text-[10px] ${m[s]||""}`}>{s}</Badge>;
};

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-xs mt-1">{hint}</p>}
    </div>
  );
}

/* ─── Brand filter bar ──────────────────────────────────────── */
function BrandFilterBar({ brands, activeBrandId, setActiveBrandId }: {
  brands: any[]; activeBrandId: string | null; setActiveBrandId: (id: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap p-3 bg-secondary/30 rounded-lg border border-border">
      <Crown className="w-4 h-4 text-primary shrink-0"/>
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Filter by Brand:</span>
      <button
        onClick={() => setActiveBrandId(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!activeBrandId ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
      >
        All Brands
      </button>
      {brands.map(b => (
        <button
          key={b.id}
          onClick={() => setActiveBrandId(activeBrandId === b.id ? null : b.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${activeBrandId === b.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
        >
          {b.logoUrl && <img src={b.logoUrl} alt="" className="w-3 h-3 rounded-full object-cover"/>}
          {b.name}
        </button>
      ))}
    </div>
  );
}

/* ─── KPI card ──────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, color = "primary" }: {
  icon: React.ElementType; label: string; value: number | string; color?: string;
}) {
  const c: Record<string,string> = {
    primary:"border-primary text-primary", blue:"border-blue-500 text-blue-400",
    emerald:"border-emerald-500 text-emerald-400", amber:"border-amber-500 text-amber-400",
    violet:"border-violet-500 text-violet-400",
  };
  return (
    <Card className={`border-l-4 ${c[color]||c.primary}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`w-7 h-7 opacity-75 ${(c[color]||c.primary).split(" ")[1]}`}/>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Overview tab ──────────────────────────────────────────── */
function OverviewTab({ brands, projRows, svcRows, branchRows, custRows, agentItems, navigate, setActiveBrandId, setTab }: any) {
  const getBrandStats = (brandId: string) => ({
    projects: projRows.filter((r: any) => (r.brand_id ?? r.data?.brandId) === brandId).length,
    services: svcRows.filter((r: any) => (r.brand_id ?? r.data?.brandId) === brandId).length,
    branches: branchRows.filter((r: any) => (r.brand_id ?? r.data?.brandId) === brandId).length,
    customers: custRows.filter((r: any) => (r.brand_id ?? r.data?.brandId) === brandId).length,
    agents: agentItems.filter((a: any) => a.brand_id === brandId).length,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={Crown}      label="Brands"    value={brands.length}    color="primary"/>
        <KpiCard icon={FolderOpen} label="Projects"  value={projRows.length}  color="blue"/>
        <KpiCard icon={Briefcase}  label="Services"  value={svcRows.length}   color="emerald"/>
        <KpiCard icon={Building2}  label="Branches"  value={branchRows.length} color="amber"/>
        <KpiCard icon={Users}      label="Customers" value={custRows.length}  color="violet"/>
      </div>

      {brands.length === 0 ? (
        <Card className="p-12 text-center">
          <Crown className="w-12 h-12 mx-auto mb-3 text-primary/30"/>
          <p className="font-display text-primary">No brands yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first brand to get started</p>
          <Button className="mt-4" onClick={() => navigate("/brands/add")}><Plus className="w-4 h-4 mr-2"/>Add Brand</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {brands.map((b: any) => {
            const stats = getBrandStats(b.id);
            return (
              <Card key={b.id} className="hover:border-primary/50 transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {b.logoUrl
                        ? <img src={b.logoUrl} alt={b.name} className="w-10 h-10 rounded-lg object-contain bg-secondary shrink-0"/>
                        : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Crown className="w-5 h-5 text-primary"/></div>
                      }
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-display text-primary truncate">{b.name}</CardTitle>
                        {b.industry && <p className="text-xs text-muted-foreground truncate">{b.industry}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => navigate(`/brands/edit/${b.id}`)} title="Edit">
                        <Edit className="w-3.5 h-3.5"/>
                      </Button>
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => navigate(`/brands/${b.id}`)} title="Details">
                        <ExternalLink className="w-3.5 h-3.5"/>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {b.address && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0"/><span className="truncate">{b.address}</span>
                    </div>
                  )}
                  {b.socialLinks?.website && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="w-3 h-3 shrink-0"/><span className="truncate">{b.socialLinks.website}</span>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-5 gap-1 pt-2 border-t border-border">
                    {[
                      { icon: FolderOpen, count: stats.projects, label: "Proj", tab: "projects" },
                      { icon: Briefcase,  count: stats.services,  label: "Svc",  tab: "services" },
                      { icon: Building2,  count: stats.branches,  label: "Brnch",tab: "branches" },
                      { icon: Users,      count: stats.customers, label: "Cust", tab: "customers" },
                      { icon: UserCheck,  count: stats.agents,    label: "Agts", tab: "agents" },
                    ].map(s => (
                      <button
                        key={s.tab}
                        onClick={() => { setActiveBrandId(b.id); setTab(s.tab); }}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded hover:bg-secondary/50 transition-colors"
                        title={`View ${s.tab}`}
                      >
                        <s.icon className="w-3.5 h-3.5 text-muted-foreground"/>
                        <span className="text-xs font-bold">{s.count}</span>
                        <span className="text-[9px] text-muted-foreground">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Generic entity CRUD tab ───────────────────────────────── */
interface ColDef { key: string; label: string; render?: (v: any, row: any) => React.ReactNode }
interface FieldDef { key: string; label: string; type?: "text"|"number"|"date"|"textarea"|"select"; options?: string[] }

function EntityTab({ items, loading, create, update, remove, title, columns, fields, emptyHint, activeBrandId, brands, getBrandLabel }: {
  items: any[]; loading: boolean; create: (p: any) => Promise<any>; update: (id: string, p: any) => Promise<any>; remove: (id: string) => Promise<void>;
  title: string; columns: ColDef[]; fields: FieldDef[]; emptyHint?: string;
  activeBrandId: string | null; brands: any[]; getBrandLabel: (id: string | null) => string;
}) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string,any>>({});
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = activeBrandId
      ? items.filter(it => (it.brand_id ?? it.data?.brandId) === activeBrandId)
      : items;
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter(it => fields.some(f => String(it[f.key] ?? it.data?.[f.key] ?? "").toLowerCase().includes(lq)));
    }
    return list;
  }, [items, activeBrandId, q, fields]);

  const openNew = () => {
    setEditId(null);
    setForm({ brand_id: activeBrandId ?? "" });
    setOpen(true);
  };
  const openEdit = (row: any) => {
    setEditId(row.id);
    const base: Record<string,any> = { brand_id: row.brand_id ?? row.data?.brandId ?? "" };
    for (const f of fields) base[f.key] = row[f.key] ?? row.data?.[f.key] ?? "";
    setForm(base);
    setOpen(true);
  };
  const submit = async () => {
    const payload: Record<string,any> = { brand_id: form.brand_id || null };
    for (const f of fields) {
      const v = form[f.key];
      if (v === undefined || v === "") continue;
      payload[f.key] = f.type === "number" ? Number(v) : v;
    }
    if (!payload.name && !payload.agent_name) { toast.error("Name is required"); return; }
    if (editId) await update(editId, payload);
    else        await create(payload);
    setOpen(false);
  };

  const getVal = (row: any, key: string) => row[key] ?? row.data?.[key] ?? "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground"/>
          <Input placeholder={`Search ${title}…`} value={q} onChange={e => setQ(e.target.value)} className="pl-9 h-8 text-xs"/>
        </div>
        <ExportButton data={filtered} filename={title.toLowerCase()} title={title}/>
        <Button size="sm" onClick={openNew} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState title={`No ${title}`} hint={emptyHint}/></Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left p-3">Brand</th>
                {columns.map(c => <th key={c.key} className="text-left p-3">{c.label}</th>)}
                <th className="p-3"/>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row: any) => {
                const bId = row.brand_id ?? row.data?.brandId ?? null;
                return (
                  <tr key={row.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-3">
                      {bId
                        ? <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">{getBrandLabel(bId)}</Badge>
                        : <span className="text-[10px] text-muted-foreground">—</span>
                      }
                    </td>
                    {columns.map(c => (
                      <td key={c.key} className="p-3 text-xs">
                        {c.render ? c.render(getVal(row, c.key), row) : String(getVal(row, c.key) || "—")}
                      </td>
                    ))}
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEdit(row)}><Edit className="w-3.5 h-3.5"/></Button>
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => remove(row.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} {title.replace(/s$/,"")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            {/* Brand selector */}
            <div>
              <Label className="text-xs">Brand</Label>
              <select
                value={form.brand_id || ""}
                onChange={e => setForm(p => ({ ...p, brand_id: e.target.value || null }))}
                className="mt-1 w-full bg-secondary border border-border text-foreground rounded-md px-3 py-2 text-sm"
              >
                <option value="">— No Brand —</option>
                {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea value={form[f.key] || ""} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))} className="mt-1" rows={3}/>
                ) : f.type === "select" && f.options ? (
                  <Select value={form[f.key] || ""} onValueChange={v => setForm(p => ({...p,[f.key]:v}))}>
                    <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                    <SelectContent>{f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input type={f.type||"text"} value={form[f.key]||""} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))} className="mt-1"/>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════ MAIN COMPONENT ══════════ */
export default function BrandsHub() {
  const navigate = useNavigate();
  const { brands, loading: brandsLoading } = useBrands();
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");

  // All entity data at component level
  const { items: projRows,   loading: projLoading,   create: projCreate,   update: projUpdate,   remove: projRemove   } = useEntities("projects");
  const { items: svcRows,    loading: svcLoading,    create: svcCreate,    update: svcUpdate,    remove: svcRemove    } = useEntities("services");
  const { items: branchRows, loading: branchLoading, create: branchCreate, update: branchUpdate, remove: branchRemove } = useEntities("branches");
  const { items: custRows,   loading: custLoading,   create: custCreate,   update: custUpdate,   remove: custRemove   } = useEntities("customers");
  const { items: agentItems, loading: agentLoading,  create: _agentCreate,  update: _agentUpdate,  remove: _agentRemove  } = useExtTable("affiliated_agents");

  const getBrandLabel = (id: string | null) => brands.find((b: any) => b.id === id)?.name ?? id?.slice(0,8) ?? "—";

  const brandFilter = (row: any) => !activeBrandId || (row.brand_id ?? row.data?.brandId) === activeBrandId;
  const agentFilter = (a: any) => !activeBrandId || a.brand_id === activeBrandId;

  const projCount   = projRows.filter(brandFilter).length;
  const svcCount    = svcRows.filter(brandFilter).length;
  const branchCount = branchRows.filter(brandFilter).length;
  const custCount   = custRows.filter(brandFilter).length;
  const agentCount  = agentItems.filter(agentFilter).length;
  /* ── Column/field configs ───────────────────────────────── */
  const PROJECT_COLS: ColDef[] = [
    { key:"name", label:"Name", render:(v)=><span className="font-semibold">{v}</span> },
    { key:"status", label:"Status", render:(v,row)=>statusBadge(row.status ?? row.data?.status ?? v) },
    { key:"start_date", label:"Start", render:(v,row)=>{ const d=row.start_date??row.data?.startDate; return d?new Date(d).toLocaleDateString():"—"; } },
    { key:"budget", label:"Budget", render:(v,row)=>{ const b=row.budget??row.data?.budget; return b?<span className="text-emerald-400">{b}</span>:"—"; } },
  ];
  const PROJECT_FIELDS: FieldDef[] = [
    { key:"name", label:"Project Name *" },
    { key:"description", label:"Description", type:"textarea" },
    { key:"status", label:"Status", type:"select", options:["Active","On Hold","Completed","Cancelled"] },
    { key:"start_date", label:"Start Date", type:"date" },
    { key:"end_date",   label:"End Date",   type:"date" },
    { key:"budget",     label:"Budget" },
    { key:"responsible_person", label:"Responsible Person" },
  ];

  const SERVICE_COLS: ColDef[] = [
    { key:"name", label:"Name", render:(v)=><span className="font-semibold">{v}</span> },
    { key:"category", label:"Category", render:(v,row)=>row.category??row.data?.category??v??"—" },
    { key:"price", label:"Price", render:(v,row)=>{ const p=row.price??row.data?.price; return p?<span className="text-emerald-400">{p}</span>:"—"; } },
    { key:"status", label:"Status", render:(v,row)=>statusBadge(row.status??row.data?.status??v) },
  ];
  const SERVICE_FIELDS: FieldDef[] = [
    { key:"name",        label:"Service Name *" },
    { key:"description", label:"Description", type:"textarea" },
    { key:"category",    label:"Category" },
    { key:"price",       label:"Price" },
    { key:"status",      label:"Status", type:"select", options:["Active","Inactive"] },
    { key:"responsible_person", label:"Responsible Person" },
  ];

  const BRANCH_COLS: ColDef[] = [
    { key:"name", label:"Name", render:(v)=><span className="font-semibold">{v}</span> },
    { key:"branch_type", label:"Type", render:(v,row)=><Badge variant="outline" className="text-[10px]">{row.branch_type??row.data?.type??v??"—"}</Badge> },
    { key:"address", label:"Address", render:(v,row)=><span className="text-muted-foreground">{row.address??row.data?.address??v??"—"}</span> },
    { key:"status", label:"Status", render:(v,row)=>statusBadge(row.status??row.data?.status??v) },
  ];
  const BRANCH_FIELDS: FieldDef[] = [
    { key:"name",       label:"Branch Name *" },
    { key:"branch_type",label:"Type", type:"select", options:["Main","Sub-branch","Warehouse","Data Center","Office","Lab","Showroom"] },
    { key:"address",    label:"Address" },
    { key:"status",     label:"Status", type:"select", options:["Active","Inactive","Maintenance"] },
    { key:"human_count",label:"Staff Count", type:"number" },
    { key:"responsible_person", label:"Responsible Person" },
  ];

  const CUSTOMER_COLS: ColDef[] = [
    { key:"name", label:"Name", render:(v)=><span className="font-semibold">{v}</span> },
    { key:"email", label:"Email", render:(v,row)=><span className="text-muted-foreground">{row.email??row.data?.email??v??"—"}</span> },
    { key:"phone", label:"Phone", render:(v,row)=>row.phone??row.data?.phone??v??"—" },
    { key:"company", label:"Company", render:(v,row)=>row.company??row.data?.company??v??"—" },
    { key:"status", label:"Status", render:(v,row)=>statusBadge(row.status??row.data?.status??v) },
    { key:"loyalty_points", label:"Points", render:(v,row)=><span className="font-bold text-primary">{row.loyalty_points??row.data?.loyaltyPoints??0}</span> },
  ];
  const CUSTOMER_FIELDS: FieldDef[] = [
    { key:"name",          label:"Full Name *" },
    { key:"email",         label:"Email" },
    { key:"phone",         label:"Phone" },
    { key:"company",       label:"Company" },
    { key:"status",        label:"Status", type:"select", options:["Active","Inactive","Lead"] },
    { key:"loyalty_points",label:"Loyalty Points", type:"number" },
    { key:"notes",         label:"Notes", type:"textarea" },
  ];

  const AGENT_COLS: ColDef[] = [
    { key:"agent_name", label:"Agent Name", render:(v)=><span className="font-semibold">{v}</span> },
    { key:"commission_rate", label:"Commission", render:(v)=><span className="font-bold text-primary">{v?`${(Number(v)*100).toFixed(1)}%`:"—"}</span> },
    { key:"total_sales", label:"Total Sales", render:(v)=><span className="text-emerald-400">{v?`$${Number(v).toLocaleString()}`:"—"}</span> },
  ];
  const AGENT_FIELDS: FieldDef[] = [
    { key:"agent_name",      label:"Agent Name *" },
    { key:"commission_rate", label:"Commission Rate (e.g. 0.05)", type:"number" },
    { key:"total_sales",     label:"Total Sales", type:"number" },
    { key:"email",           label:"Email" },
    { key:"phone",           label:"Phone" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4"/><span className="font-body text-sm">Back</span>
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Crown className="w-6 h-6 text-primary"/></div>
            <div>
              <h1 className="font-display text-xl text-primary">BRANDS HUB</h1>
              <p className="text-xs text-muted-foreground">Brands · Projects · Services · Branches · Customers · Agents</p>
            </div>
          </div>
          <Button onClick={() => navigate("/brands/add")} className="gap-1.5 font-display text-xs">
            <Plus className="w-4 h-4"/>New Brand
          </Button>
        </div>

        {/* Brand filter bar */}
        {!brandsLoading && brands.length > 0 && (
          <BrandFilterBar brands={brands} activeBrandId={activeBrandId} setActiveBrandId={setActiveBrandId}/>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 mb-2">
            <TabsTrigger value="overview"   className="text-xs"><BarChart2 className="w-3.5 h-3.5 mr-1"/>Overview</TabsTrigger>
            <TabsTrigger value="projects"   className="text-xs"><FolderOpen className="w-3.5 h-3.5 mr-1"/>Projects ({projCount})</TabsTrigger>
            <TabsTrigger value="services"   className="text-xs"><Briefcase className="w-3.5 h-3.5 mr-1"/>Services ({svcCount})</TabsTrigger>
            <TabsTrigger value="branches"   className="text-xs"><Building2 className="w-3.5 h-3.5 mr-1"/>Branches ({branchCount})</TabsTrigger>
            <TabsTrigger value="customers"  className="text-xs"><Users className="w-3.5 h-3.5 mr-1"/>Customers ({custCount})</TabsTrigger>
            <TabsTrigger value="agents"     className="text-xs"><UserCheck className="w-3.5 h-3.5 mr-1"/>Agents ({agentCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-2">
            <OverviewTab
              brands={brands} projRows={projRows} svcRows={svcRows}
              branchRows={branchRows} custRows={custRows} agentItems={agentItems}
              navigate={navigate} setActiveBrandId={setActiveBrandId} setTab={setTab}
            />
          </TabsContent>

          <TabsContent value="projects" className="mt-2">
            <EntityTab
              items={projRows} loading={projLoading}
              create={p => projCreate({ ...p, name: p.name, status: p.status === "Active" ? "active" : p.status === "Completed" ? "inactive" : p.status === "On Hold" ? "maintenance" : "pending", brand_id: p.brand_id, start_date: p.start_date||null, end_date: p.end_date||null, budget: p.budget||null, responsible_person: p.responsible_person||null, description: p.description||null, data: p })}
              update={(id, p) => projUpdate(id, { ...p, name: p.name, status: p.status === "Active" ? "active" : p.status === "Completed" ? "inactive" : p.status === "On Hold" ? "maintenance" : "pending", brand_id: p.brand_id, data: p })}
              remove={projRemove}
              title="Projects" columns={PROJECT_COLS} fields={PROJECT_FIELDS}
              emptyHint="Create your first project and link it to a brand"
              activeBrandId={activeBrandId} brands={brands} getBrandLabel={getBrandLabel}
            />
          </TabsContent>

          <TabsContent value="services" className="mt-2">
            <EntityTab
              items={svcRows} loading={svcLoading}
              create={p => svcCreate({ ...p, name: p.name, status: p.status === "Active" ? "active" : "inactive", brand_id: p.brand_id, description: p.description||null, category: p.category||null, price: p.price||null, responsible_person: p.responsible_person||null, data: p })}
              update={(id, p) => svcUpdate(id, { ...p, status: p.status === "Active" ? "active" : "inactive", brand_id: p.brand_id, data: p })}
              remove={svcRemove}
              title="Services" columns={SERVICE_COLS} fields={SERVICE_FIELDS}
              emptyHint="Add services offered by your brands"
              activeBrandId={activeBrandId} brands={brands} getBrandLabel={getBrandLabel}
            />
          </TabsContent>

          <TabsContent value="branches" className="mt-2">
            <EntityTab
              items={branchRows} loading={branchLoading}
              create={p => branchCreate({ ...p, name: p.name, status: p.status === "Active" ? "active" : p.status === "Maintenance" ? "maintenance" : "inactive", brand_id: p.brand_id, branch_type: p.branch_type||"Main", address: p.address||null, human_count: Number(p.human_count)||0, responsible_person: p.responsible_person||null, data: p })}
              update={(id, p) => branchUpdate(id, { ...p, status: p.status === "Active" ? "active" : p.status === "Maintenance" ? "maintenance" : "inactive", brand_id: p.brand_id, data: p })}
              remove={branchRemove}
              title="Branches" columns={BRANCH_COLS} fields={BRANCH_FIELDS}
              emptyHint="Register branches for each brand location"
              activeBrandId={activeBrandId} brands={brands} getBrandLabel={getBrandLabel}
            />
          </TabsContent>

          <TabsContent value="customers" className="mt-2">
            <EntityTab
              items={custRows} loading={custLoading}
              create={p => custCreate({ name: p.name, status: p.status === "Active" ? "active" : p.status === "Inactive" ? "inactive" : "pending", brand_id: p.brand_id, email: p.email||null, phone: p.phone||null, company: p.company||null, loyalty_points: Number(p.loyalty_points)||0, notes: p.notes||null, data: p })}
              update={(id, p) => custUpdate(id, { name: p.name, status: p.status === "Active" ? "active" : p.status === "Inactive" ? "inactive" : "pending", brand_id: p.brand_id, email: p.email||null, phone: p.phone||null, company: p.company||null, loyalty_points: Number(p.loyalty_points)||0, notes: p.notes||null, data: p })}
              remove={custRemove}
              title="Customers" columns={CUSTOMER_COLS} fields={CUSTOMER_FIELDS}
              emptyHint="Add customers and associate them with a brand"
              activeBrandId={activeBrandId} brands={brands} getBrandLabel={getBrandLabel}
            />
          </TabsContent>

          <TabsContent value="agents" className="mt-2">
            <AgentTab
              items={agentItems} loading={agentLoading}
              create={_agentCreate} update={_agentUpdate} remove={_agentRemove}
              columns={AGENT_COLS} fields={AGENT_FIELDS}
              activeBrandId={activeBrandId} brands={brands} getBrandLabel={getBrandLabel}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ─── Agents tab (uses useExtTable, brand_id at root level) ─── */
function AgentTab({ items, loading, create, update, remove, columns, fields, activeBrandId, brands, getBrandLabel }: {
  items: any[]; loading: boolean; create: any; update: any; remove: any;
  columns: ColDef[]; fields: FieldDef[];
  activeBrandId: string | null; brands: any[]; getBrandLabel: (id: string | null) => string;
}) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string,any>>({});
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = activeBrandId ? items.filter((a: any) => a.brand_id === activeBrandId) : items;
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter((a: any) => fields.some(f => String(a[f.key]??"").toLowerCase().includes(lq)));
    }
    return list;
  }, [items, activeBrandId, q, fields]);

  const openNew  = () => { setEditId(null); setForm({ brand_id: activeBrandId ?? "" }); setOpen(true); };
  const openEdit = (row: any) => {
    setEditId(row.id);
    const base: Record<string,any> = { brand_id: row.brand_id ?? "" };
    for (const f of fields) base[f.key] = row[f.key] ?? "";
    setForm(base);
    setOpen(true);
  };
  const submit = async () => {
    if (!form.agent_name?.trim()) { toast.error("Agent name is required"); return; }
    const payload: Record<string,any> = { brand_id: form.brand_id || null };
    for (const f of fields) {
      const v = form[f.key];
      if (v !== undefined && v !== "") payload[f.key] = f.type === "number" ? Number(v) : v;
    }
    if (editId) await update(editId, payload);
    else        await create(payload);
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground"/>
          <Input placeholder="Search agents…" value={q} onChange={e => setQ(e.target.value)} className="pl-9 h-8 text-xs"/>
        </div>
        <ExportButton data={filtered} filename="agents" title="Agents"/>
        <Button size="sm" onClick={openNew} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Agent</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState title="No Agents" hint="Add affiliated agents and link them to a brand"/></Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left p-3">Brand</th>
                {columns.map(c => <th key={c.key} className="text-left p-3">{c.label}</th>)}
                <th className="p-3"/>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row: any) => (
                <tr key={row.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                  <td className="p-3">
                    {row.brand_id
                      ? <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">{getBrandLabel(row.brand_id)}</Badge>
                      : <span className="text-[10px] text-muted-foreground">—</span>
                    }
                  </td>
                  {columns.map(c => (
                    <td key={c.key} className="p-3 text-xs">
                      {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEdit(row)}><Edit className="w-3.5 h-3.5"/></Button>
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => remove(row.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit" : "New"} Affiliated Agent</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs">Brand</Label>
              <select
                value={form.brand_id || ""}
                onChange={e => setForm(p => ({...p, brand_id: e.target.value || null}))}
                className="mt-1 w-full bg-secondary border border-border text-foreground rounded-md px-3 py-2 text-sm"
              >
                <option value="">— No Brand —</option>
                {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Input type={f.type||"text"} value={form[f.key]||""} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))} className="mt-1"/>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
