import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Crown, FolderOpen, Briefcase, Building2, Users, UserCheck, Handshake,
  Plus, Edit, Trash2, Search, ExternalLink, BarChart2,
  MapPin, Globe, Mail, Phone, DollarSign, Package,
  Upload, Save, User, Megaphone, FileText, Pencil, X, Link2, Cpu, MessageSquare,
  Paperclip, ScrollText, ShieldCheck, Shield, Bot, Layers, Network, List, Play,
  RefreshCw, Copy, GitBranch, TrendingUp, Award, Activity, ChevronDown, ChevronUp,
  Code as CodeIcon, Webhook, Book, Zap, Chrome, Download, Check,
  Share2, Gift, BarChart3, RotateCcw, Tag,
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
import { Switch } from "@/components/ui/switch";
import { useBrands } from "@/context/BrandsContext";
import { teamApi } from "@/services/system";
import { extApi } from "@/services/extended";
import { supabase } from "@/integrations/supabase/client";
import { useEntities } from "@/hooks/useEntities";
import { useExtTable } from "@/hooks/useExtTable";
import ExportButton from "@/components/shared/ExportButton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Brand, Owner, TeamMember, ProductItem, DocFile, MarketingPlan, SocialLinks, ResponsiblePersonContact } from "@/context/BrandsContext";
import StaffMetrics from "@/components/shared/StaffMetrics";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { Comments } from "@/components/shared/Comments";
import ApiIntegrationStatus from "@/components/dashboard/ApiIntegrationStatus";
import EntityFileUpload from "@/components/shared/EntityFileUpload";
import EntityApiHub from "@/components/shared/EntityApiHub";
import ResponsiblePerson, { summarizeKeyPersons } from "@/components/shared/ResponsiblePerson";
import { SavedViews } from "@/components/shared/SavedViews";
import { toast } from "sonner";
import { tenantDb } from "@/lib/tenantDb";
import { apiKeysApi } from "@/services/entities";
import { getTenantScope } from "@/lib/tenantScope";
import { couponsApi, invoicesApi, paymentsApi } from "@/services/billing";

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
    violet:"border-violet-500 text-violet-400", rose:"border-rose-500 text-rose-400",
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
function OverviewTab({ brands, projRows, svcRows, branchRows, custRows, agentItems, partnerRows, setActiveBrandId, setTab }: any) {
  const getBrandStats = (brandId: string) => ({
    projects:  projRows.filter((r: any) => (r.brand_id ?? r.data?.brandId) === brandId).length,
    services:  svcRows.filter((r: any) => (r.brand_id ?? r.data?.brandId) === brandId).length,
    branches:  branchRows.filter((r: any) => (r.brand_id ?? r.data?.brandId) === brandId).length,
    customers: custRows.filter((r: any) => (r.brand_id ?? r.data?.brandId) === brandId).length,
    agents:    agentItems.filter((a: any) => a.brand_id === brandId).length,
    partners:  partnerRows.filter((r: any) => (r.brand_id ?? r.data?.brandId) === brandId).length,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard icon={Crown}      label="Brands"    value={brands.length}        color="primary"/>
        <KpiCard icon={FolderOpen} label="Projects"  value={projRows.length}      color="blue"/>
        <KpiCard icon={Briefcase}  label="Services"  value={svcRows.length}       color="emerald"/>
        <KpiCard icon={Building2}  label="Branches"  value={branchRows.length}    color="amber"/>
        <KpiCard icon={Users}      label="Customers" value={custRows.length}      color="violet"/>
        <KpiCard icon={Handshake}  label="Partners"  value={partnerRows.length}   color="rose"/>
      </div>

      {brands.length === 0 ? (
        <Card className="p-12 text-center">
          <Crown className="w-12 h-12 mx-auto mb-3 text-primary/30"/>
          <p className="font-display text-primary">No brands yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first brand to get started</p>
          <Button className="mt-4" onClick={() => setTab("brands")}><Plus className="w-4 h-4 mr-2"/>Add Brand</Button>
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
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setTab("brands")} title="Manage in Brands tab">
                        <Pencil className="w-3.5 h-3.5"/>
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
                  <div className="grid grid-cols-6 gap-1 pt-2 border-t border-border">
                    {[
                      { icon: FolderOpen, count: stats.projects,  label: "Proj",  tab: "projects" },
                      { icon: Briefcase,  count: stats.services,  label: "Svc",   tab: "services" },
                      { icon: Building2,  count: stats.branches,  label: "Brnch", tab: "branches" },
                      { icon: Users,      count: stats.customers, label: "Cust",  tab: "customers" },
                      { icon: UserCheck,  count: stats.agents,    label: "Agts",  tab: "agents" },
                      { icon: Handshake,  count: stats.partners,  label: "Prtnr", tab: "partners" },
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
interface FieldDef { key: string; label: string; type?: "text"|"number"|"date"|"textarea"|"select"; options?: string[]; allowCustom?: boolean }
type AFile = { id: string; name: string };
const emptyDocs = () => ({ _legal_docs: [] as AFile[], _contracts: [] as AFile[], _marketing_plans: [] as AFile[], _other_files: [] as AFile[] });

type ContactEntry = { id: string; type: string; value: string };
type PersonEntry  = { id: string; name: string; role: string; contacts: ContactEntry[] };
const emptyPerson = (): PersonEntry => ({ id: crypto.randomUUID(), name: "", role: "", contacts: [] });
const emptyPeople = (): { _owners: PersonEntry[]; _key_personnel: PersonEntry[]; _team: PersonEntry[] } =>
  ({ _owners: [], _key_personnel: [], _team: [] });

function PeopleSection({ title, icon: Icon, color = "text-primary", people, onChange }: {
  title: string; icon: React.ElementType; color?: string;
  people: PersonEntry[]; onChange: (v: PersonEntry[]) => void;
}) {
  const updPerson  = (i: number, f: string, v: string) => onChange(people.map((p,idx) => idx===i ? {...p,[f]:v} : p));
  const addContact = (i: number) => onChange(people.map((p,idx) => idx===i ? {...p, contacts:[...p.contacts,{id:crypto.randomUUID(),type:"phone",value:""}]} : p));
  const rmContact  = (i: number, ci: number) => onChange(people.map((p,idx) => idx===i ? {...p, contacts:p.contacts.filter((_,cIdx)=>cIdx!==ci)} : p));
  const updContact = (i: number, ci: number, f: string, v: string) => onChange(people.map((p,idx) => idx===i ? {...p, contacts:p.contacts.map((c,cIdx)=>cIdx===ci?{...c,[f]:v}:c)} : p));
  return (
    <div>
      <div className="flex items-center gap-1.5 pb-1 border-b border-border mb-2 mt-4">
        <Icon className={`w-3.5 h-3.5 ${color}`}/>
        <span className={`text-[11px] font-medium uppercase tracking-wider ${color}`}>{title}</span>
      </div>
      <div className="space-y-3">
        {people.map((person, i) => (
          <div key={person.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{title.replace(/s$/, "")} #{i+1}</span>
              <button type="button" onClick={() => onChange(people.filter((_,idx)=>idx!==i))} className="text-destructive p-0.5 rounded hover:bg-destructive/10"><X className="w-3.5 h-3.5"/></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Name</Label><Input value={person.name} onChange={e=>updPerson(i,"name",e.target.value)} className="mt-1 bg-secondary border-border text-xs"/></div>
              <div><Label className="text-xs">Role / Position</Label><Input value={person.role} onChange={e=>updPerson(i,"role",e.target.value)} className="mt-1 bg-secondary border-border text-xs"/></div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contact Info</p>
              {person.contacts.map((c, ci) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <select value={c.type} onChange={e=>updContact(i,ci,"type",e.target.value)}
                    className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground shrink-0 w-28">
                    <option value="phone">📞 Phone</option>
                    <option value="email">📧 Email</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="linkedin">🔗 LinkedIn</option>
                    <option value="twitter">𝕏 Twitter</option>
                    <option value="other">• Other</option>
                  </select>
                  <Input value={c.value} onChange={e=>updContact(i,ci,"value",e.target.value)} placeholder="Value…" className="flex-1 h-7 text-xs bg-secondary border-border"/>
                  <button type="button" onClick={()=>rmContact(i,ci)} className="text-destructive p-0.5 shrink-0 hover:bg-destructive/10 rounded"><X className="w-3 h-3"/></button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={()=>addContact(i)} className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"><Plus className="w-3 h-3"/>Add Contact</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={()=>onChange([...people, emptyPerson()])} className="gap-1 text-xs h-7"><Plus className="w-3 h-3"/>Add {title.replace(/s$/,"")}</Button>
      </div>
    </div>
  );
}

function DocList({ label, icon: Icon, color, items, onChange }: {
  label: string; icon: React.ElementType; color: string;
  items: AFile[]; onChange: (v: AFile[]) => void;
}) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 pb-1 border-b border-border mb-2 mt-4`}>
        <Icon className={`w-3.5 h-3.5 ${color}`}/>
        <span className={`text-[11px] font-medium uppercase tracking-wider ${color}`}>{label}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((d, i) => (
          <div key={d.id} className="flex items-center gap-2 p-2 bg-secondary/40 rounded-md border border-border">
            <Icon className={`w-3.5 h-3.5 shrink-0 ${color} opacity-60`}/>
            <span className="flex-1 text-xs truncate text-foreground">{d.name || "No file selected"}</span>
            <label className="cursor-pointer px-2 py-0.5 text-[11px] text-primary hover:underline shrink-0">
              Browse
              <input type="file" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) onChange(items.map((x, idx) => idx === i ? { ...x, name: f.name } : x));
              }}/>
            </label>
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-destructive p-0.5 rounded hover:bg-destructive/10 shrink-0"><X className="w-3 h-3"/></button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm"
          onClick={() => onChange([...items, { id: crypto.randomUUID(), name: "" }])}
          className="gap-1 text-xs h-7">
          <Plus className="w-3 h-3"/>Add {label}
        </Button>
      </div>
    </div>
  );
}

function EntityTab({ items, loading, create, update, remove, title, columns, fields, emptyHint, activeBrandId, brands, getBrandLabel }: {
  items: any[]; loading: boolean; create: (p: any) => Promise<any>; update: (id: string, p: any) => Promise<any>; remove: (id: string) => Promise<void>;
  title: string; columns: ColDef[]; fields: FieldDef[]; emptyHint?: string;
  activeBrandId: string | null; brands: any[]; getBrandLabel: (id: string | null) => string;
}) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string,any>>({});
  const [docs, setDocs] = useState(emptyDocs());
  const [people, setPeople] = useState(emptyPeople());
  const [q, setQ] = useState("");

  const setDoc    = (key: keyof ReturnType<typeof emptyDocs>)    => (v: AFile[])       => setDocs(p => ({ ...p, [key]: v }));
  const setPeople2 = (key: keyof ReturnType<typeof emptyPeople>) => (v: PersonEntry[]) => setPeople(p => ({ ...p, [key]: v }));

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
    setDocs(emptyDocs());
    setPeople(emptyPeople());
    setOpen(true);
  };
  const openEdit = (row: any) => {
    setEditId(row.id);
    const base: Record<string,any> = { brand_id: row.brand_id ?? row.data?.brandId ?? "" };
    for (const f of fields) base[f.key] = row[f.key] ?? row.data?.[f.key] ?? "";
    setForm(base);
    setDocs({
      _legal_docs:      (row._legal_docs      ?? row.data?._legal_docs      ?? []),
      _contracts:       (row._contracts        ?? row.data?._contracts        ?? []),
      _marketing_plans: (row._marketing_plans  ?? row.data?._marketing_plans  ?? []),
      _other_files:     (row._other_files      ?? row.data?._other_files      ?? []),
    });
    setPeople({
      _owners:        (row._owners         ?? row.data?._owners         ?? []),
      _key_personnel: (row._key_personnel   ?? row.data?._key_personnel   ?? []),
      _team:          (row._team            ?? row.data?._team            ?? []),
    });
    setOpen(true);
  };
  const submit = async () => {
    const payload: Record<string,any> = { brand_id: form.brand_id || null };
    for (const f of fields) {
      const v = form[f.key];
      if (v === undefined || v === "") continue;
      payload[f.key] = f.type === "number" ? Number(v) : v;
    }
    // Store _* fields inside data JSONB — they are not dedicated DB columns
    payload.data = {
      ...(payload.data || {}),
      _legal_docs:      docs._legal_docs.filter(d => d.name),
      _contracts:       docs._contracts.filter(d => d.name),
      _marketing_plans: docs._marketing_plans.filter(d => d.name),
      _other_files:     docs._other_files.filter(d => d.name),
      _owners:          people._owners.filter(p => p.name.trim()),
      _key_personnel:   people._key_personnel.filter(p => p.name.trim()),
      _team:            people._team.filter(p => p.name.trim()),
    };
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
                const totalDocs = (row._legal_docs?.length ?? row.data?._legal_docs?.length ?? 0)
                  + (row._contracts?.length ?? row.data?._contracts?.length ?? 0)
                  + (row._marketing_plans?.length ?? row.data?._marketing_plans?.length ?? 0)
                  + (row._other_files?.length ?? row.data?._other_files?.length ?? 0);
                const totalPeople = (row._owners?.length ?? row.data?._owners?.length ?? 0)
                  + (row._key_personnel?.length ?? row.data?._key_personnel?.length ?? 0)
                  + (row._team?.length ?? row.data?._team?.length ?? 0);
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
                      <div className="flex items-center gap-1">
                        {totalPeople > 0 && <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5"><Users className="w-2.5 h-2.5"/>{totalPeople}</Badge>}
                        {totalDocs > 0 && <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5"><Paperclip className="w-2.5 h-2.5"/>{totalDocs}</Badge>}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
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
                  <>
                    <Select
                      value={f.allowCustom && f.options && !f.options.includes(form[f.key]) && form[f.key] ? "__custom__" : (form[f.key] || "")}
                      onValueChange={v => setForm(p => ({...p,[f.key]: v === "__custom__" ? "" : v, ...(v === "__custom__" ? {[`${f.key}__custom`]: true} : {[`${f.key}__custom`]: false})}))}
                    >
                      <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        {f.allowCustom && <SelectItem value="__custom__">✏ Other (custom)…</SelectItem>}
                      </SelectContent>
                    </Select>
                    {f.allowCustom && (form[`${f.key}__custom`] || (form[f.key] && !f.options.includes(form[f.key]))) && (
                      <Input placeholder="Enter custom type…" value={form[f.key] || ""} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))} className="mt-1.5 text-xs"/>
                    )}
                  </>
                ) : (
                  <Input type={f.type||"text"} value={form[f.key]||""} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))} className="mt-1"/>
                )}
              </div>
            ))}

            {/* ── People ── */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">People</p>
              <PeopleSection title="Owners" icon={User} color="text-amber-400"
                people={people._owners} onChange={setPeople2("_owners")}/>
              <PeopleSection title="Key Personnel" icon={UserCheck} color="text-primary"
                people={people._key_personnel} onChange={setPeople2("_key_personnel")}/>
              <PeopleSection title="Team Members" icon={Users} color="text-blue-400"
                people={people._team} onChange={setPeople2("_team")}/>
            </div>

            {/* ── Attachments ── */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Attachments</p>
              <DocList label="Legal Papers" icon={ShieldCheck} color="text-blue-400"
                items={docs._legal_docs} onChange={setDoc("_legal_docs")}/>
              <DocList label="Contracts" icon={ScrollText} color="text-amber-400"
                items={docs._contracts} onChange={setDoc("_contracts")}/>
              <DocList label="Marketing Plans" icon={Megaphone} color="text-pink-400"
                items={docs._marketing_plans} onChange={setDoc("_marketing_plans")}/>
              <DocList label="Other Files" icon={Paperclip} color="text-muted-foreground"
                items={docs._other_files} onChange={setDoc("_other_files")}/>
            </div>
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

/* ═══════════════════════════════════ DEVELOPER HUB TAB ═══════ */

const DEV_BASE = `${import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co"}/rest/v1`;
const DEV_FALLBACK_EVENTS = ["insert.invoices","update.invoices","insert.subscriptions","update.subscriptions","insert.payment_transactions","*"];
const DEV_ENDPOINTS = [
  { method:"GET",  path:"/brands",               desc:"List your brands",        scope:"owner" },
  { method:"POST", path:"/brands",               desc:"Create a brand",          scope:"owner" },
  { method:"GET",  path:"/customers",            desc:"List customers",          scope:"owner" },
  { method:"GET",  path:"/employees",            desc:"List employees / agents", scope:"owner" },
  { method:"GET",  path:"/invoices",             desc:"List invoices",           scope:"owner" },
  { method:"POST", path:"/invoices",             desc:"Create invoice",          scope:"owner" },
  { method:"GET",  path:"/subscriptions",        desc:"List subscriptions",      scope:"owner" },
  { method:"POST", path:"/coupons",              desc:"Create coupon",           scope:"owner" },
  { method:"GET",  path:"/payment_transactions", desc:"List transactions",       scope:"owner" },
  { method:"GET",  path:"/audit_logs",           desc:"Audit history",           scope:"owner" },
  { method:"GET",  path:"/tasks",                desc:"List tasks",              scope:"owner" },
  { method:"GET",  path:"/webhooks",             desc:"List webhooks",           scope:"owner" },
  { method:"GET",  path:"/affiliates",           desc:"List affiliates",         scope:"owner" },
  { method:"POST", path:"/affiliates",           desc:"Create affiliate",        scope:"owner" },
  { method:"GET",  path:"/projects",             desc:"List projects",           scope:"owner" },
  { method:"GET",  path:"/services",             desc:"List services",           scope:"owner" },
  { method:"GET",  path:"/branches",             desc:"List branches",           scope:"owner" },
];

function DevCodeBlock({ children }: { children: string }) {
  return (
    <div className="relative">
      <pre className="bg-secondary/60 border border-border rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{children}</pre>
      <button onClick={() => { navigator.clipboard.writeText(children); toast.success("Copied!"); }}
        className="absolute top-2 right-2 p-1 rounded hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors"
      ><Copy className="w-3.5 h-3.5"/></button>
    </div>
  );
}

function DeveloperHubTab() {
  const [hooks, setHooks]           = React.useState<any[]>([]);
  const [deliveries, setDeliveries] = React.useState<any[]>([]);
  const [apiKeys, setApiKeys]       = React.useState<any[]>([]);
  const [events, setEvents]         = React.useState<string[]>(DEV_FALLBACK_EVENTS);
  const [hookOpen, setHookOpen]     = React.useState(false);
  const [keyOpen, setKeyOpen]       = React.useState(false);
  const [hookForm, setHookForm]     = React.useState({ label:"", url:"", events:["*"], active:true, secret:"" });
  const [keyLabel, setKeyLabel]     = React.useState("");
  const [newKey, setNewKey]         = React.useState<string|null>(null);
  const [wl, setWl]                 = React.useState<any>({ brand_name:"", logo_url:"", primary_color:"#d4af37", accent_color:"#8b0000", custom_domain:"", hide_branding:false });
  const [wlLoading, setWlLoading]   = React.useState(true);

  const loadWl = async () => {
    try { const rows = await tenantDb.select("white_label",{limit:1}); if(rows[0]) setWl(rows[0]); }
    catch {} finally { setWlLoading(false); }
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
    try {
      const de: string[] = (d as any[]).map((x:any)=>x.event_type).filter(Boolean);
      const he: string[] = (h as any[]).flatMap((x:any)=>Array.isArray(x.events)?x.events:[x.events]).filter(Boolean);
      const all = Array.from(new Set([...de,...he,"*"]));
      if (all.length > 1) setEvents(all);
    } catch {}
  };
  React.useEffect(()=>{ loadAll(); loadWl(); },[]);

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
    success: deliveries.filter((d:any)=>d.status==="delivered").length,
    failed:  deliveries.filter((d:any)=>d.status==="failed").length,
    pending: deliveries.filter((d:any)=>d.status==="pending").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg flex-1">
          <div className="p-2 bg-primary/10 rounded-lg"><CodeIcon className="w-5 h-5 text-primary"/></div>
          <div><h3 className="font-display text-sm font-bold">Developer Hub</h3><p className="text-[11px] text-muted-foreground font-mono">{DEV_BASE}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAll}><RefreshCw className="w-4 h-4"/></Button>
          <ExportButton data={deliveries} filename="webhook-deliveries" title="Deliveries"/>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-l-4 border-emerald-500"><p className="text-xs text-muted-foreground">Delivered</p><p className="text-2xl font-bold text-emerald-500">{stats.success}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-xs text-muted-foreground">Failed</p><p className="text-2xl font-bold text-destructive">{stats.failed}</p></Card>
        <Card className="p-4 border-l-4 border-yellow-500"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-primary">{stats.pending}</p></Card>
        <Card className="p-4 border-l-4 border-blue-500"><p className="text-xs text-muted-foreground">API Keys</p><p className="text-2xl font-bold">{apiKeys.length}</p></Card>
      </div>
      <Tabs defaultValue="docs">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="docs"       className="text-xs"><Book className="w-3.5 h-3.5 mr-1"/>API Reference</TabsTrigger>
          <TabsTrigger value="keys"       className="text-xs"><Shield className="w-3.5 h-3.5 mr-1"/>API Keys</TabsTrigger>
          <TabsTrigger value="webhooks"   className="text-xs"><Webhook className="w-3.5 h-3.5 mr-1"/>Webhooks ({hooks.length})</TabsTrigger>
          <TabsTrigger value="deliveries" className="text-xs"><Activity className="w-3.5 h-3.5 mr-1"/>Deliveries ({deliveries.length})</TabsTrigger>
          <TabsTrigger value="whitelabel" className="text-xs"><Globe className="w-3.5 h-3.5 mr-1"/>White Label</TabsTrigger>
          <TabsTrigger value="extension"  className="text-xs"><Chrome className="w-3.5 h-3.5 mr-1"/>Extension</TabsTrigger>
        </TabsList>
        <TabsContent value="docs" className="space-y-4 mt-4">
          <Tabs defaultValue="quickstart">
            <TabsList><TabsTrigger value="quickstart"><Zap className="w-3 h-3 mr-1"/>Quick Start</TabsTrigger><TabsTrigger value="endpoints">Endpoints</TabsTrigger><TabsTrigger value="webhookformat">Webhook Format</TabsTrigger><TabsTrigger value="errors">Error Codes</TabsTrigger></TabsList>
            <TabsContent value="quickstart" className="space-y-3 mt-3">
              <Card className="p-4 space-y-2"><h3 className="font-bold text-sm">1. Create an API Key</h3><p className="text-xs text-muted-foreground">Go to <strong>API Keys</strong> tab → New Key. The key is shown once.</p></Card>
              <Card className="p-4 space-y-2"><h3 className="font-bold text-sm">2. Authenticate</h3><DevCodeBlock>{`curl ${DEV_BASE}/brands \\\n  -H "apikey: YOUR_API_KEY" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`}</DevCodeBlock></Card>
              <Card className="p-4 space-y-2"><h3 className="font-bold text-sm">3. Fetch Data (JavaScript)</h3><DevCodeBlock>{`const res = await fetch("${DEV_BASE}/invoices?select=*&limit=50", {\n  headers: { apikey: "YOUR_API_KEY", Authorization: "Bearer YOUR_API_KEY" }\n});\nconst data = await res.json();`}</DevCodeBlock></Card>
              <Card className="p-4 space-y-2"><h3 className="font-bold text-sm">4. Filter &amp; Sort</h3><DevCodeBlock>{`GET ${DEV_BASE}/tasks?status=eq.in-progress\nGET ${DEV_BASE}/audit_logs?order=created_at.desc\nGET ${DEV_BASE}/customers?limit=20&offset=40`}</DevCodeBlock></Card>
              <Card className="p-4 space-y-2"><h3 className="font-bold text-sm">5. Python</h3><DevCodeBlock>{`import requests\nresp = requests.get("${DEV_BASE}/brands", headers={"apikey":"YOUR_KEY","Authorization":"Bearer YOUR_KEY"})\nprint(resp.json())`}</DevCodeBlock></Card>
            </TabsContent>
            <TabsContent value="endpoints" className="mt-3">
              <Card className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-secondary/50 text-xs"><tr><th className="text-left p-3">Method</th><th className="text-left p-3">Endpoint</th><th className="text-left p-3">Description</th><th className="text-left p-3">Scope</th></tr></thead><tbody>{DEV_ENDPOINTS.map((e,i)=>(<tr key={i} className="border-t border-border hover:bg-secondary/20"><td className="p-3"><Badge variant={e.method==="GET"?"outline":"default"} className="text-[10px]">{e.method}</Badge></td><td className="p-3 font-mono text-xs text-primary">{e.path}</td><td className="p-3 text-xs">{e.desc}</td><td className="p-3 text-xs text-muted-foreground">{e.scope}</td></tr>))}</tbody></table></Card>
            </TabsContent>
            <TabsContent value="webhookformat" className="mt-3 space-y-3">
              <Card className="p-4 space-y-3"><h3 className="font-bold text-sm">Payload</h3><DevCodeBlock>{`POST <your-url>\nX-KemetRise-Signature: sha256=<hmac>\n\n{\n  "event": "insert.invoices",\n  "timestamp": "2026-...",\n  "audit": { "id": "uuid", "action": "INSERT invoices", "table_name": "invoices", "record_id": "uuid" }\n}`}</DevCodeBlock></Card>
              <Card className="p-4 space-y-3"><h3 className="font-bold text-sm">Verify (Node.js)</h3><DevCodeBlock>{`const crypto = require("crypto");\nfunction verify(secret, body, sig) {\n  const h = "sha256=" + crypto.createHmac("sha256",secret).update(JSON.stringify(body)).digest("hex");\n  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(h));\n}`}</DevCodeBlock></Card>
              <Card className="p-4 space-y-2"><h3 className="font-bold text-sm">Supported Events</h3><div className="flex flex-wrap gap-2">{events.map(e=><Badge key={e} variant="outline" className="text-xs font-mono">{e}</Badge>)}</div></Card>
            </TabsContent>
            <TabsContent value="errors" className="mt-3">
              <Card className="p-4 space-y-2">{[{c:"200",v:"default",t:"OK — Request succeeded"},{c:"201",v:"outline",t:"Created — Resource created"},{c:"401",v:"destructive",t:"Unauthorized — Invalid API key"},{c:"403",v:"destructive",t:"Forbidden — RLS blocked"},{c:"404",v:"destructive",t:"Not Found"},{c:"429",v:"destructive",t:"Rate Limited"},{c:"500",v:"destructive",t:"Server Error"}].map(r=>(<div key={r.c} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0"><Badge variant={r.v as any}>{r.c}</Badge><span className="text-sm">{r.t}</span></div>))}</Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="keys" className="mt-4 space-y-3">
          <div className="flex justify-end"><Button onClick={()=>setKeyOpen(true)}><Plus className="w-4 h-4 mr-1"/>New API Key</Button></div>
          {newKey&&<Card className="p-4 border border-emerald-500 bg-emerald-500/5"><p className="text-xs font-bold text-emerald-500 mb-2">⚠️ Copy now — shown once!</p><DevCodeBlock>{newKey}</DevCodeBlock><Button size="sm" variant="ghost" className="mt-2" onClick={()=>setNewKey(null)}>Dismiss</Button></Card>}
          <Card className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-secondary/50 text-xs"><tr><th className="text-left p-3">Label</th><th className="text-left p-3">Key</th><th className="text-left p-3">Created</th><th className="p-3"/></tr></thead><tbody>{apiKeys.length===0?<tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No API keys yet</td></tr>:apiKeys.map((k:any)=>(<tr key={k.id} className="border-t border-border hover:bg-secondary/20"><td className="p-3 font-semibold">{k.name||k.label}</td><td className="p-3 font-mono text-xs text-muted-foreground">{(k.key||"").slice(0,6)}••••••••<button onClick={()=>{navigator.clipboard.writeText(k.key||"");toast.success("Copied");}} className="ml-2 hover:text-primary"><Copy className="w-3 h-3 inline"/></button></td><td className="p-3 text-xs">{k.created?new Date(k.created).toLocaleDateString():"—"}</td><td className="p-3"><Button size="sm" variant="ghost" onClick={()=>removeKey(k.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button></td></tr>))}</tbody></table></Card>
        </TabsContent>
        <TabsContent value="webhooks" className="mt-4 space-y-3">
          <div className="flex justify-end"><Button onClick={()=>setHookOpen(true)}><Plus className="w-4 h-4 mr-1"/>New Webhook</Button></div>
          <Card>{hooks.length===0?<p className="p-8 text-center text-muted-foreground text-sm">No webhooks configured</p>:<div className="divide-y divide-border">{hooks.map((h:any)=>(<div key={h.id} className="p-4 flex items-center justify-between gap-4"><div className="flex-1 min-w-0"><p className="font-semibold text-sm">{h.label}</p><p className="text-xs text-muted-foreground font-mono truncate">{h.url}</p><div className="flex gap-1 mt-1 flex-wrap">{((h.events||[]) as string[]).map(e=><Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>)}</div></div><div className="flex items-center gap-3 shrink-0"><Switch checked={!!h.active} onCheckedChange={()=>toggleHook(h.id,h.active)}/><button onClick={()=>removeHook(h.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button></div></div>))}</div>}</Card>
        </TabsContent>
        <TabsContent value="deliveries" className="mt-4">
          <Card className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-secondary/50 text-xs"><tr><th className="p-3 text-left">Time</th><th className="p-3 text-left">Event</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">HTTP</th><th className="p-3 text-left">Attempts</th></tr></thead><tbody>{deliveries.length===0?<tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No deliveries yet</td></tr>:deliveries.map((d:any)=>(<tr key={d.id} className="border-t border-border hover:bg-secondary/20"><td className="p-3 text-xs whitespace-nowrap">{new Date(d.created_at).toLocaleString()}</td><td className="p-3 font-mono text-xs">{d.event}</td><td className="p-3"><Badge variant={d.status==="delivered"?"default":d.status==="failed"?"destructive":"secondary"}>{d.status}</Badge></td><td className="p-3 text-xs">{d.response_status||"—"}</td><td className="p-3 text-xs">{d.attempts}</td></tr>))}</tbody></table></Card>
        </TabsContent>
        <TabsContent value="whitelabel" className="mt-4">
          {wlLoading?<div className="text-center py-8 text-muted-foreground text-sm">Loading…</div>:<div className="max-w-2xl space-y-4">
            <Card className="p-4 overflow-hidden relative" style={{ borderColor: wl.primary_color||"#d4af37" }}><div className="absolute top-0 left-0 w-1 h-full" style={{ background: wl.primary_color||"#d4af37" }}/><div className="pl-4 flex items-center gap-4">{wl.logo_url?<img src={wl.logo_url} alt="" className="w-10 h-10 rounded object-contain bg-secondary"/>:<div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-xs text-muted-foreground">Logo</div>}<div><p className="font-bold text-sm">{wl.brand_name||"Your Brand"}</p><p className="text-xs text-muted-foreground">{wl.custom_domain||"app.yourdomain.com"}</p></div><div className="ml-auto flex gap-2"><div className="w-6 h-6 rounded-full border-2 border-border" style={{ background: wl.primary_color }}/><div className="w-6 h-6 rounded-full border-2 border-border" style={{ background: wl.accent_color }}/></div></div></Card>
            <Card className="p-5 space-y-4">
              <div><Label>Brand Name</Label><Input value={wl.brand_name||""} onChange={e=>setWl({...wl,brand_name:e.target.value})} placeholder="Acme Corp" className="mt-1"/></div>
              <div><Label>Logo URL</Label><Input value={wl.logo_url||""} onChange={e=>setWl({...wl,logo_url:e.target.value})} placeholder="https://cdn.example.com/logo.png" className="mt-1"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Primary Color</Label><div className="flex gap-2 mt-1"><Input type="color" value={wl.primary_color||"#d4af37"} onChange={e=>setWl({...wl,primary_color:e.target.value})} className="w-16 h-10 p-1 cursor-pointer"/><Input value={wl.primary_color||""} onChange={e=>setWl({...wl,primary_color:e.target.value})}/></div></div>
                <div><Label>Accent Color</Label><div className="flex gap-2 mt-1"><Input type="color" value={wl.accent_color||"#8b0000"} onChange={e=>setWl({...wl,accent_color:e.target.value})} className="w-16 h-10 p-1 cursor-pointer"/><Input value={wl.accent_color||""} onChange={e=>setWl({...wl,accent_color:e.target.value})}/></div></div>
              </div>
              <div><Label>Custom Domain</Label><Input value={wl.custom_domain||""} onChange={e=>setWl({...wl,custom_domain:e.target.value})} placeholder="app.yourdomain.com" className="mt-1"/></div>
              <div className="flex items-center justify-between p-3 border border-border rounded-md"><div><p className="text-sm font-medium">Hide "Powered by KemetRise"</p><p className="text-xs text-muted-foreground">Premium plan required</p></div><Switch checked={!!wl.hide_branding} onCheckedChange={v=>setWl({...wl,hide_branding:v})}/></div>
              <Button onClick={saveWl} className="w-full font-display"><Save className="w-4 h-4 mr-2"/>Save Branding</Button>
            </Card>
          </div>}
        </TabsContent>
        <TabsContent value="extension" className="mt-4">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3 mb-4"><div className="p-2 rounded-lg bg-primary/10"><Chrome className="w-5 h-5 text-primary"/></div><div><h2 className="font-display text-sm text-primary">Browser Extension</h2><p className="text-xs text-muted-foreground">Chrome, Edge, Brave, Arc, Opera.</p></div></div>
            <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-transparent"><Chrome className="w-16 h-16 text-primary mx-auto mb-4 opacity-80"/><h3 className="font-display text-lg text-primary mb-2">KemetRise Quick Access</h3><p className="text-sm text-muted-foreground mb-6">Works in Chrome, Edge, Brave, Arc, and Opera.</p><Button onClick={()=>{ fetch("/kemetrise-extension.zip").then(r=>{if(!r.ok)throw new Error("File not found");return r.blob();}).then(blob=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kemetrise-extension.zip";a.click();URL.revokeObjectURL(a.href);toast.success("Download started");}).catch((e:any)=>toast.error(e.message)); }}><Download className="w-4 h-4 mr-2"/>Download Extension</Button></Card>
            <Card className="p-5"><h3 className="font-display text-sm text-primary mb-4">Installation Steps</h3><ol className="space-y-3">{["Unzip the downloaded file.","Open \"chrome://extensions\" in Chrome.","Enable Developer mode.","Click \"Load unpacked\" and select the folder.","The KemetRise icon appears in your toolbar."].map((s,i)=>(<li key={i} className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i+1}</div><span className="text-sm">{s}</span></li>))}</ol></Card>
            <Card className="p-5"><h3 className="font-display text-sm text-primary mb-3">Capabilities</h3><div className="grid grid-cols-2 gap-2">{["One-click login","Quick task creation","Notification badge","Clipboard shortcuts","Offline mode support","Dark / light theme sync"].map(f=>(<div key={f} className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>{f}</div>))}</div></Card>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={hookOpen} onOpenChange={setHookOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>New Webhook</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Label</Label><Input value={hookForm.label} onChange={e=>setHookForm(p=>({...p,label:e.target.value}))} placeholder="e.g. Slack Invoice Alerts"/></div>
            <div><Label>URL (HTTPS)</Label><Input value={hookForm.url} onChange={e=>setHookForm(p=>({...p,url:e.target.value}))} placeholder="https://..."/></div>
            <div><Label>Secret</Label><Input value={hookForm.secret} onChange={e=>setHookForm(p=>({...p,secret:e.target.value}))} type="password" placeholder="Optional"/></div>
            <div><Label>Events</Label><div className="flex flex-wrap gap-2 mt-2">{events.map(e=>(<button key={e} type="button" onClick={()=>setHookForm(p=>({...p,events:p.events.includes(e)?p.events.filter(x=>x!==e):[...p.events,e]}))} className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${hookForm.events.includes(e)?"bg-primary text-primary-foreground border-primary":"border-border hover:border-primary/50"}`}>{e}</button>))}</div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setHookOpen(false)}>Cancel</Button><Button onClick={createHook}>Create Webhook</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={keyOpen} onOpenChange={setKeyOpen}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>New API Key</DialogTitle></DialogHeader>
          <div className="py-2"><Label>Label</Label><Input value={keyLabel} onChange={e=>setKeyLabel(e.target.value)} placeholder="e.g. Production Integration" className="mt-1"/></div>
          <DialogFooter><Button variant="outline" onClick={()=>setKeyOpen(false)}>Cancel</Button><Button onClick={async()=>{ await createKey(); setKeyOpen(false); }}>Generate Key</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════ AFFILIATES HUB TAB ══════ */

type AffiliateRow = {
  id: string; name: string; code: string; commission: string;
  referrals: number; status: "Active" | "Inactive"; region: string;
  email: string; phone: string; notes: string; responsiblePerson: string;
  humanCount: number; aiCount: number; files: any[];
};
type AgentRow = {
  id: string; agent_name: string; commission_rate: number;
  total_sales: number; status: string; affiliate_id: string; brand_id: string; notes: string;
};
const emptyAff = (): Omit<AffiliateRow,"id"> => ({
  name:"",code:"",commission:"",referrals:0,status:"Active",region:"",
  email:"",phone:"",notes:"",responsiblePerson:"",humanCount:0,aiCount:0,files:[],
});
const emptyAgent = (): Omit<AgentRow,"id"> => ({
  agent_name:"",commission_rate:0.05,total_sales:0,status:"active",affiliate_id:"",brand_id:"",notes:"",
});

function CommissionBar({ rate }: { rate: number }) {
  const pct = Math.min((rate||0)*100,100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width:`${pct}%` }}/>
      </div>
      <span className="text-xs font-mono">{pct.toFixed(1)}%</span>
    </div>
  );
}

/* ─── Referrals Tab ──────────────────────────────────────────── */
function ReferralsTab({ activeBrandId, brands }: { activeBrandId: string|null; brands: any[] }) {
  const [ref, setRef] = React.useState<any>(null);
  const [copied, setCopied] = React.useState(false);
  const [brandId, setBrandId] = React.useState(activeBrandId || "");

  React.useEffect(() => { setBrandId(activeBrandId || ""); }, [activeBrandId]);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const rows = await tenantDb.select("referrals" as any, { eq: { user_id: user.id }, limit: 1 });
      const data = (rows as any[])[0] || null;
      if (data) { setRef(data); return; }
      const code = "KEMET-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const created = await tenantDb.insert("referrals" as any, { user_id: user.id, code, brand_id: brandId || null } as any, { includeClientId: false, includeBrandId: false } as any);
      setRef(created as any);
    })();
  }, []);

  const link = ref ? `${window.location.origin}/auth?ref=${ref.code}` : "";
  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
        <Share2 className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Link to Brand</Label>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select brand…" /></SelectTrigger>
            <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5"><Users className="w-5 h-5 text-primary mb-2"/><div className="text-3xl font-display">{ref?.total_referred ?? 0}</div><div className="text-xs text-muted-foreground">Total Referred</div></Card>
        <Card className="p-5"><DollarSign className="w-5 h-5 text-primary mb-2"/><div className="text-3xl font-display">${ref?.total_earned ?? 0}</div><div className="text-xs text-muted-foreground">Total Earned</div></Card>
        <Card className="p-5"><Gift className="w-5 h-5 text-primary mb-2"/><div className="text-3xl font-display">${ref?.reward_amount ?? 10}</div><div className="text-xs text-muted-foreground">Per Referral</div></Card>
      </div>
      <Card className="p-6">
        <h2 className="font-display text-lg text-primary mb-4">Your Referral Link</h2>
        <div className="flex gap-2">
          <Input readOnly value={link} className="font-mono text-xs" />
          <Button onClick={copy}>{copied ? <Check className="w-4 h-4 mr-2"/> : <Copy className="w-4 h-4 mr-2"/>}{copied ? "Copied" : "Copy"}</Button>
        </div>
        {brandId && <p className="text-xs text-muted-foreground mt-2">Linked to brand: <span className="text-primary">{brands.find(b => b.id === brandId)?.name}</span></p>}
      </Card>
    </div>
  );
}

/* ─── Reports Tab ────────────────────────────────────────────── */
const REPORT_TABLES = ["brands","branches","employees","customers","projects","services","tasks","marketing_campaigns","finance_analytics","transactions","affiliates","success_partners","audit_logs"];

function ReportsTab({ activeBrandId }: { activeBrandId: string|null }) {
  const [table, setTable] = React.useState("projects");
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    tenantDb.select(table as any, { limit: 500, orderBy: "created_at", ascending: false })
      .then(data => { setRows((data as any[]) || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [table]);

  const cols = React.useMemo(() => rows[0] ? Object.keys(rows[0]).slice(0, 6) : [], [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary"/>
          <h2 className="font-display text-lg tracking-wider text-primary">REPORTS BUILDER</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={table} onValueChange={setTable}>
            <SelectTrigger className="w-48"><SelectValue/></SelectTrigger>
            <SelectContent>{REPORT_TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <ExportButton data={rows} filename={`${table}-report`}/>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {([["Total Rows", rows.length], ["Columns", cols.length], ["Source", table]] as [string, string|number][]).map(([l, v]) => (
          <div key={l} className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] font-display text-muted-foreground tracking-wider">{l}</p>
            <p className="text-xl font-display text-primary mt-1">{v}</p>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg overflow-auto">
        {loading ? <p className="p-6 text-center text-muted-foreground">Loading...</p> : (
          <table className="w-full text-xs">
            <thead className="bg-secondary/50">
              <tr>{cols.map(c => <th key={c} className="text-left p-2 font-display text-primary tracking-wider">{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((r, i) => (
                <tr key={i} className="border-t border-border/50 hover:bg-secondary/30">
                  {cols.map(c => <td key={c} className="p-2 text-foreground truncate max-w-[200px]">{String(r[c] ?? "—").slice(0, 60)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─── Finance Analytics Tab ──────────────────────────────────── */
function FinanceAnalyticsTab({ brands }: { brands: any[] }) {
  const [analytics, setAnalytics] = React.useState<any[]>([]);
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [refunds, setRefunds] = React.useState<any[]>([]);
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [tab, setTab] = React.useState("revenue");
  const [refundFilter, setRefundFilter] = React.useState("all");
  const [activeRefund, setActiveRefund] = React.useState<any>(null);
  const [refundNotes, setRefundNotes] = React.useState("");
  const [couponOpen, setCouponOpen] = React.useState(false);
  const [couponEditId, setCouponEditId] = React.useState<string|null>(null);
  const [couponForm, setCouponForm] = React.useState({ code: "", discount_type: "percent", discount_value: "", expires_at: "", max_uses: "", brand_id: "" });

  const loadAll = React.useCallback(async () => {
    const [inv, pay, ref, coup, anal] = await Promise.all([
      invoicesApi.list(),
      paymentsApi.list(),
      tenantDb.select("refund_requests" as any, { limit: 200 }),
      couponsApi.list(),
      tenantDb.select("finance_analytics" as any, { limit: 200 }),
    ]);
    setInvoices((inv as any[]) || []);
    setPayments((pay as any[]) || []);
    setRefunds((ref as any[]) || []);
    setCoupons((coup as any[]) || []);
    setAnalytics((anal as any[]) || []);
  }, []);

  React.useEffect(() => { loadAll(); }, [loadAll]);

  const kpis = React.useMemo(() => ({
    totalRevenue: payments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    totalRefunded: refunds.filter(r => r.status === "approved").reduce((s, r) => s + (Number(r.amount) || 0), 0),
    pendingRefunds: refunds.filter(r => r.status === "pending").length,
    activeCoupons: coupons.filter(c => c.is_active).length,
  }), [payments, refunds, coupons]);

  const saveCoupon = async () => {
    const payload = { ...couponForm, discount_value: Number(couponForm.discount_value), max_uses: couponForm.max_uses ? Number(couponForm.max_uses) : null, is_active: true };
    if (couponEditId) { await couponsApi.update(couponEditId, payload); }
    else { await couponsApi.create(payload); }
    setCouponOpen(false); setCouponEditId(null);
    setCouponForm({ code: "", discount_type: "percent", discount_value: "", expires_at: "", max_uses: "", brand_id: "" });
    loadAll();
  };

  const removeCoupon = async (id: string) => { await couponsApi.remove(id); loadAll(); };

  const updateRefund = async (id: string, status: "approved"|"rejected") => {
    await tenantDb.update("refund_requests" as any, id, { status, admin_notes: refundNotes } as any);
    setActiveRefund(null); setRefundNotes(""); loadAll();
  };

  const filteredRefunds = refundFilter === "all" ? refunds : refunds.filter(r => r.status === refundFilter);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: `$${kpis.totalRevenue.toLocaleString()}`, icon: <DollarSign className="w-4 h-4"/> },
          { label: "Total Refunded", value: `$${kpis.totalRefunded.toLocaleString()}`, icon: <RotateCcw className="w-4 h-4"/> },
          { label: "Pending Refunds", value: kpis.pendingRefunds, icon: <Activity className="w-4 h-4"/> },
          { label: "Active Coupons", value: kpis.activeCoupons, icon: <Tag className="w-4 h-4"/> },
        ].map(k => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">{k.icon}<span className="text-xs text-muted-foreground">{k.label}</span></div>
            <div className="text-2xl font-display">{k.value}</div>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/50">
          <TabsTrigger value="revenue" className="text-xs">Revenue</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          <TabsTrigger value="refunds" className="text-xs">Refunds</TabsTrigger>
          <TabsTrigger value="coupons" className="text-xs">Coupons</TabsTrigger>
        </TabsList>

        {/* Revenue */}
        <TabsContent value="revenue" className="mt-3">
          <div className="bg-card border border-border rounded-lg overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary/50"><tr>
                {["Date","Amount","Method","Status","Reference"].map(h => <th key={h} className="text-left p-2 font-display text-primary tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>{payments.map((p, i) => (
                <tr key={i} className="border-t border-border/50 hover:bg-secondary/30">
                  <td className="p-2">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</td>
                  <td className="p-2 text-emerald-400">${Number(p.amount || 0).toLocaleString()}</td>
                  <td className="p-2">{p.payment_method || "—"}</td>
                  <td className="p-2"><Badge className="text-[10px]">{p.status || "—"}</Badge></td>
                  <td className="p-2 font-mono text-muted-foreground">{String(p.reference || p.id || "").slice(0, 20)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-3">
          <div className="bg-card border border-border rounded-lg overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary/50"><tr>
                {["Period","Revenue","Expenses","Profit","Growth"].map(h => <th key={h} className="text-left p-2 font-display text-primary tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>{analytics.map((a, i) => (
                <tr key={i} className="border-t border-border/50 hover:bg-secondary/30">
                  <td className="p-2">{a.period || a.month || a.created_at ? new Date(a.created_at || a.period || a.month).toLocaleDateString() : "—"}</td>
                  <td className="p-2 text-emerald-400">${Number(a.revenue || a.total_revenue || 0).toLocaleString()}</td>
                  <td className="p-2 text-red-400">${Number(a.expenses || a.total_expenses || 0).toLocaleString()}</td>
                  <td className="p-2">${Number(a.profit || a.net_profit || 0).toLocaleString()}</td>
                  <td className="p-2">{a.growth_rate ? `${a.growth_rate}%` : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>

        {/* Refunds */}
        <TabsContent value="refunds" className="mt-3 space-y-3">
          <div className="flex gap-2">
            {["all","pending","approved","rejected"].map(f => (
              <Button key={f} variant={refundFilter === f ? "default" : "outline"} size="sm" className="text-xs capitalize" onClick={() => setRefundFilter(f)}>{f}</Button>
            ))}
          </div>
          <div className="bg-card border border-border rounded-lg overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary/50"><tr>
                {["Date","Amount","Reason","Status","Actions"].map(h => <th key={h} className="text-left p-2 font-display text-primary tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>{filteredRefunds.map((r, i) => (
                <tr key={i} className="border-t border-border/50 hover:bg-secondary/30">
                  <td className="p-2">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                  <td className="p-2">${Number(r.amount || 0).toLocaleString()}</td>
                  <td className="p-2 max-w-[150px] truncate">{r.reason || "—"}</td>
                  <td className="p-2"><Badge className="text-[10px]">{r.status || "pending"}</Badge></td>
                  <td className="p-2">{r.status === "pending" && <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => { setActiveRefund(r); setRefundNotes(""); }}>Review</Button>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>

        {/* Coupons */}
        <TabsContent value="coupons" className="mt-3 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="text-xs" onClick={() => { setCouponEditId(null); setCouponForm({ code: "", discount_type: "percent", discount_value: "", expires_at: "", max_uses: "" }); setCouponOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1"/>New Coupon
            </Button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary/50"><tr>
                {["Code","Type","Value","Expires","Uses","Active","Actions"].map(h => <th key={h} className="text-left p-2 font-display text-primary tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>{coupons.map((c, i) => (
                <tr key={i} className="border-t border-border/50 hover:bg-secondary/30">
                  <td className="p-2 font-mono">{c.code}</td>
                  <td className="p-2 capitalize">{c.discount_type}</td>
                  <td className="p-2">{c.discount_type === "percent" ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                  <td className="p-2">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="p-2">{c.current_uses ?? 0}/{c.max_uses ?? "∞"}</td>
                  <td className="p-2"><Badge className={c.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}>{c.is_active ? "Active" : "Off"}</Badge></td>
                  <td className="p-2 flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setCouponEditId(c.id); setCouponForm({ code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value), expires_at: c.expires_at || "", max_uses: c.max_uses ? String(c.max_uses) : "", brand_id: c.brand_id || "" }); setCouponOpen(true); }}><Pencil className="w-3 h-3"/></Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeCoupon(c.id)}><Trash2 className="w-3 h-3"/></Button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Refund Review Dialog */}
      <Dialog open={!!activeRefund} onOpenChange={o => { if (!o) setActiveRefund(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Refund Request</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Amount: </span><strong>${Number(activeRefund?.amount || 0).toLocaleString()}</strong></div>
            <div><span className="text-muted-foreground">Reason: </span>{activeRefund?.reason || "—"}</div>
            <div>
              <Label className="text-xs">Admin Notes</Label>
              <Textarea className="mt-1 text-xs" rows={3} value={refundNotes} onChange={e => setRefundNotes(e.target.value)} placeholder="Optional notes…"/>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="destructive" size="sm" onClick={() => updateRefund(activeRefund.id, "rejected")}>Reject</Button>
            <Button size="sm" onClick={() => updateRefund(activeRefund.id, "approved")}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{couponEditId ? "Edit Coupon" : "New Coupon"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Brand</Label>
              <Select value={couponForm.brand_id} onValueChange={v => setCouponForm(f => ({...f, brand_id: v}))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue placeholder="Select brand…"/></SelectTrigger>
                <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Code</Label><Input className="mt-1 text-xs" value={couponForm.code} onChange={e => setCouponForm(f => ({...f, code: e.target.value}))} placeholder="SAVE20"/></div>
            <div><Label className="text-xs">Type</Label>
              <Select value={couponForm.discount_type} onValueChange={v => setCouponForm(f => ({...f, discount_type: v}))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="percent">Percent</SelectItem><SelectItem value="fixed">Fixed</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Value</Label><Input className="mt-1 text-xs" type="number" value={couponForm.discount_value} onChange={e => setCouponForm(f => ({...f, discount_value: e.target.value}))} placeholder="20"/></div>
            <div><Label className="text-xs">Expires At</Label><Input className="mt-1 text-xs" type="date" value={couponForm.expires_at} onChange={e => setCouponForm(f => ({...f, expires_at: e.target.value}))}/></div>
            <div><Label className="text-xs">Max Uses</Label><Input className="mt-1 text-xs" type="number" value={couponForm.max_uses} onChange={e => setCouponForm(f => ({...f, max_uses: e.target.value}))} placeholder="Unlimited"/></div>
          </div>
          <DialogFooter><Button size="sm" onClick={saveCoupon}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AffiliatesHubTab({ activeBrandId, brands }: { activeBrandId: string|null; brands: any[] }) {
  const { items: rows, create, update, remove } = useEntities("affiliates");

  // map rows → typed affiliates (filter by activeBrandId if set)
  const allItems: AffiliateRow[] = React.useMemo(() => rows.map(r => ({
    id: r.id,
    ...emptyAff(),
    ...(r.data as any),
    name:              (r as any).name              ?? (r.data as any)?.name              ?? "",
    code:              (r as any).code              ?? (r.data as any)?.code              ?? "",
    commission:        (r as any).commission        ?? (r.data as any)?.commission        ?? "",
    referrals:         (r as any).referrals         ?? (r.data as any)?.referrals         ?? 0,
    region:            (r as any).region            ?? (r.data as any)?.region            ?? "",
    email:             (r as any).email             ?? (r.data as any)?.email             ?? "",
    phone:             (r as any).phone             ?? (r.data as any)?.phone             ?? "",
    notes:             (r as any).notes             ?? (r.data as any)?.notes             ?? "",
    humanCount:        (r as any).human_count       ?? (r.data as any)?.humanCount        ?? 0,
    aiCount:           (r as any).ai_count          ?? (r.data as any)?.aiCount           ?? 0,
    responsiblePerson: (r as any).responsible_person ?? (r.data as any)?.responsiblePerson ?? "",
    status:  (r as any).status === "inactive" ? "Inactive" : ((r.data as any)?.status ?? "Active"),
    brand_id: (r as any).brand_id ?? null,
  })), [rows]);

  const items: AffiliateRow[] = React.useMemo(
    () => activeBrandId ? allItems.filter((a: any) => a.brand_id === activeBrandId) : allItems,
    [allItems, activeBrandId]
  );

  const [agents, setAgents] = React.useState<AgentRow[]>([]);
  const loadAgents = () => extApi.list("affiliated_agents",{ order:"id" }).then(d => setAgents(d as AgentRow[])).catch(()=>{});
  React.useEffect(() => { loadAgents(); }, []);

  // KPIs
  const activeAffiliates = items.filter(a=>a.status==="Active").length;
  const activeAgents     = agents.filter(a=>a.status==="active").length;
  const totalSales       = agents.reduce((s,a)=>s+(a.total_sales||0),0);
  const totalCommission  = agents.reduce((s,a)=>s+(a.total_sales||0)*(a.commission_rate||0),0);
  const totalReferrals   = items.reduce((s,a)=>s+(a.referrals||0),0);
  const topAffiliate     = [...items].sort((a,b)=>b.referrals-a.referrals)[0];
  const affiliateName    = (id:string) => items.find(a=>a.id===id)?.name ?? (id?"Unknown":"—");
  const agentCountFor    = (id:string) => agents.filter(a=>a.affiliate_id===id).length;

  // Affiliate form
  const [showForm,setShowForm]  = React.useState(false);
  const [editId,setEditId]      = React.useState<string|null>(null);
  const [deleteId,setDeleteId]  = React.useState<string|null>(null);
  const [detailId,setDetailId]  = React.useState<string|null>(null);
  const [statusFilter,setStatusFilter] = React.useState("all");
  const [affSearch,setAffSearch]  = React.useState("");
  const [expandedAff,setExpandedAff] = React.useState<string|null>(null);
  const [form,setForm]            = React.useState<Omit<AffiliateRow,"id">>(emptyAff());
  const [selectedBrandId,setSelectedBrandId] = React.useState<string>(activeBrandId ?? "");

  React.useEffect(() => { setSelectedBrandId(activeBrandId ?? ""); }, [activeBrandId]);

  const resetForm = () => { setForm(emptyAff()); setEditId(null); setSelectedBrandId(activeBrandId ?? ""); };
  const openEdit  = (a: AffiliateRow) => {
    const { id, ...rest } = a; setForm(rest); setEditId(a.id);
    setSelectedBrandId((a as any).brand_id ?? "");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    const payload = {
      name: form.name, status: form.status==="Active"?"active":"inactive",
      code: form.code||null, commission: form.commission||null,
      referrals: form.referrals||0, region: form.region||null,
      email: form.email||null, phone: form.phone||null, notes: form.notes||null,
      human_count: form.humanCount||0, ai_count: form.aiCount||0,
      responsible_person: form.responsiblePerson||null,
      brand_id: selectedBrandId || null,
      data: form,
    };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else        { await create(payload); toast.success("Created"); }
    setShowForm(false); resetForm();
  };

  const filteredAffiliates = React.useMemo(() => {
    let list = statusFilter==="all" ? items : items.filter(a=>a.status===statusFilter);
    if (affSearch.trim())
      list = list.filter(a =>
        a.name.toLowerCase().includes(affSearch.toLowerCase()) ||
        a.code.toLowerCase().includes(affSearch.toLowerCase()) ||
        a.region.toLowerCase().includes(affSearch.toLowerCase())
      );
    return list;
  }, [items, statusFilter, affSearch]);

  // Agent form
  const [agentOpen,setAgentOpen]      = React.useState(false);
  const [agentEditId,setAgentEditId]  = React.useState<string|null>(null);
  const [agentSearch,setAgentSearch]  = React.useState("");
  const [agentStatus,setAgentStatus]      = React.useState("all");
  const [agentAffFilter,setAgentAffFilter] = React.useState("all");
  const [agentBrandFilter,setAgentBrandFilter] = React.useState(activeBrandId||"all");
  React.useEffect(()=>{ setAgentBrandFilter(activeBrandId||"all"); },[activeBrandId]);
  const [agentForm,setAgentForm]      = React.useState<Omit<AgentRow,"id">>(emptyAgent());

  const openAgentEdit = (a: AgentRow) => { const { id, ...rest } = a; setAgentForm(rest); setAgentEditId(a.id); setAgentOpen(true); };
  const openAgentNew  = (defaultAff="", defaultBrand="") => { setAgentEditId(null); setAgentForm({ ...emptyAgent(), affiliate_id: defaultAff, brand_id: defaultBrand||activeBrandId||"" }); setAgentOpen(true); };
  const saveAgent = async () => {
    if (!agentForm.agent_name.trim()) { toast.error("Agent name required"); return; }
    try {
      if (agentEditId) await extApi.update("affiliated_agents",agentEditId,agentForm);
      else             await extApi.create("affiliated_agents",agentForm);
      toast.success("Saved"); setAgentOpen(false); setAgentEditId(null); loadAgents();
    } catch (e:any) { toast.error(e.message); }
  };
  const removeAgent = async (id:string) => {
    if (!confirm("Delete this agent?")) return;
    await extApi.remove("affiliated_agents",id); toast.success("Deleted"); loadAgents();
  };
  const filteredAgents = React.useMemo(() => {
    let list = agents;
    if (agentBrandFilter!=="all") list = list.filter(a=>a.brand_id===agentBrandFilter);
    if (agentStatus!=="all") list = list.filter(a=>a.status===agentStatus);
    if (agentAffFilter!=="all") list = list.filter(a=>a.affiliate_id===agentAffFilter);
    if (agentSearch.trim())
      list = list.filter(a =>
        a.agent_name.toLowerCase().includes(agentSearch.toLowerCase()) ||
        affiliateName(a.affiliate_id).toLowerCase().includes(agentSearch.toLowerCase())
      );
    return list;
  }, [agents, agentBrandFilter, agentStatus, agentAffFilter, agentSearch, items]);

  const commissionRows = React.useMemo(() =>
    items.map(af => {
      const linked = agents.filter(a=>a.affiliate_id===af.id);
      const sales  = linked.reduce((s,a)=>s+(a.total_sales||0),0);
      const owed   = linked.reduce((s,a)=>s+(a.total_sales||0)*(a.commission_rate||0),0);
      return { ...af, agentCount: linked.length, totalSales: sales, commissionOwed: owed };
    }).sort((a,b)=>b.commissionOwed-a.commissionOwed),
  [items, agents]);

  const detail = detailId ? items.find(a=>a.id===detailId) : null;

  // KPI card (local, no sub prop needed — reuse BrandsHub KpiCard which only takes value)
  const KpiA = ({ icon: Icon, label, value, sub, color="primary" }: any) => {
    const c: Record<string,string> = {
      primary:"border-primary text-primary", blue:"border-blue-500 text-blue-400",
      emerald:"border-emerald-500 text-emerald-400", amber:"border-amber-500 text-amber-400",
      violet:"border-violet-500 text-violet-400", rose:"border-rose-500 text-rose-400",
    };
    return (
      <Card className={`border-l-4 ${c[color]||c.primary}`}>
        <CardContent className="p-4 flex items-center gap-3">
          <Icon className={`w-8 h-8 opacity-70 ${(c[color]||c.primary).split(" ")[1]}`}/>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Brand filter pill */}
      {brands.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-3 bg-secondary/30 rounded-lg border border-border">
          <Crown className="w-4 h-4 text-primary shrink-0"/>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Brand:</span>
          <button onClick={()=>setSelectedBrandId("")} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!selectedBrandId?"bg-primary text-primary-foreground":"bg-secondary hover:bg-secondary/80"}`}>All</button>
          {brands.map(b=>(
            <button key={b.id} onClick={()=>setSelectedBrandId(b.id===selectedBrandId?"":b.id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${selectedBrandId===b.id?"bg-primary text-primary-foreground":"bg-secondary hover:bg-secondary/80"}`}>
              {b.logoUrl&&<img src={b.logoUrl} alt="" className="w-3 h-3 rounded-full object-cover"/>}{b.name}
            </button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiA icon={UserCheck}  label="Affiliates"      value={items.length}                        sub={`${activeAffiliates} active`} color="primary"/>
        <KpiA icon={Users}      label="Agents"          value={agents.length}                       sub={`${activeAgents} active`}     color="blue"/>
        <KpiA icon={TrendingUp} label="Total Sales"     value={`$${totalSales.toLocaleString()}`}   sub="all agents"                   color="emerald"/>
        <KpiA icon={DollarSign} label="Commission"      value={`$${totalCommission.toFixed(0)}`}    sub="pending payout"               color="amber"/>
        <KpiA icon={Activity}   label="Referrals"       value={totalReferrals}                      sub="from affiliates"              color="violet"/>
        <KpiA icon={Award}      label="Top Region"      value={topAffiliate?.region||"—"}           sub={topAffiliate?.name||""}       color="rose"/>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4 max-w-xl mb-4">
          <TabsTrigger value="overview"><BarChart2 className="w-3.5 h-3.5 mr-1"/>Overview</TabsTrigger>
          <TabsTrigger value="affiliates"><UserCheck className="w-3.5 h-3.5 mr-1"/>Affiliates ({items.length})</TabsTrigger>
          <TabsTrigger value="agents"><Users className="w-3.5 h-3.5 mr-1"/>Agents ({agents.length})</TabsTrigger>
          <TabsTrigger value="commissions"><DollarSign className="w-3.5 h-3.5 mr-1"/>Commissions</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-display flex items-center gap-2"><Award className="w-4 h-4 text-amber-400"/>Top Affiliates by Referrals</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[...items].sort((a,b)=>b.referrals-a.referrals).slice(0,5).map((a,i)=>(
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{i+1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1"><span className="font-medium">{a.name}</span><span className="text-primary">{a.referrals}</span></div>
                      <div className="w-full h-1.5 bg-secondary rounded-full"><div className="h-full bg-primary rounded-full" style={{width:`${Math.min((a.referrals/([...items].sort((x,y)=>y.referrals-x.referrals)[0]?.referrals||1))*100,100)}%`}}/></div>
                    </div>
                  </div>
                ))}
                {items.length===0&&<p className="text-xs text-muted-foreground text-center py-4">No affiliates yet</p>}
              </CardContent>
            </Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-display flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400"/>Top Agents by Sales</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[...agents].sort((a,b)=>(b.total_sales||0)-(a.total_sales||0)).slice(0,5).map((a,i)=>{
                  const maxS=[...agents].sort((x,y)=>(y.total_sales||0)-(x.total_sales||0))[0]?.total_sales||1;
                  return (
                    <div key={a.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i+1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1"><span className="font-medium">{a.agent_name}</span><span className="text-emerald-400">${(a.total_sales||0).toLocaleString()}</span></div>
                        <div className="w-full h-1.5 bg-secondary rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.min(((a.total_sales||0)/maxS)*100,100)}%`}}/></div>
                      </div>
                    </div>
                  );
                })}
                {agents.length===0&&<p className="text-xs text-muted-foreground text-center py-4">No agents yet</p>}
              </CardContent>
            </Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-display flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400"/>Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Affiliates</p>
                    <div className="flex justify-between text-xs"><span className="text-emerald-400">● Active</span><span className="font-bold">{activeAffiliates}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">● Inactive</span><span>{items.length-activeAffiliates}</span></div>
                  </div>
                  <div className="space-y-2"><p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Agents</p>
                    <div className="flex justify-between text-xs"><span className="text-emerald-400">● Active</span><span className="font-bold">{activeAgents}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-amber-400">● Inactive</span><span>{agents.filter(a=>a.status==="inactive").length}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-rose-400">● Suspended</span><span>{agents.filter(a=>a.status==="suspended").length}</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-display flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-400"/>Commission Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm border-b pb-2"><span className="text-muted-foreground">Total Sales</span><span className="font-bold text-emerald-400">${totalSales.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm border-b pb-2"><span className="text-muted-foreground">Commission Owed</span><span className="font-bold text-amber-400">${totalCommission.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm border-b pb-2"><span className="text-muted-foreground">Avg Rate</span><span className="font-bold">{agents.length>0?`${(agents.reduce((s,a)=>s+(a.commission_rate||0),0)/agents.length*100).toFixed(1)}%`:"—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Unlinked Agents</span><span className={agents.filter(a=>!a.affiliate_id).length>0?"text-amber-400 font-bold":""}>{agents.filter(a=>!a.affiliate_id).length}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Affiliates list ── */}
        <TabsContent value="affiliates">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground"/><Input placeholder="Search affiliates…" className="pl-9 h-8 text-xs" value={affSearch} onChange={e=>setAffSearch(e.target.value)}/></div>
            <ExportButton data={filteredAffiliates as any[]} filename="affiliates" title="Affiliates"/>
            <SavedViews page="affiliates" currentFilters={{ statusFilter }} onApply={(f:any)=>setStatusFilter(f.statusFilter??"all")}/>
            <Button onClick={()=>{resetForm();setShowForm(true);}} className="gap-1 font-display text-xs"><Plus className="w-4 h-4"/>Add Affiliate</Button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {["all","Active","Inactive"].map(s=>(
              <button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${statusFilter===s?"bg-primary/20 text-primary border border-primary/30":"text-muted-foreground border border-transparent"}`}>{s==="all"?"All":s}</button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredAffiliates.map(a=>{
              const isExpanded   = expandedAff===a.id;
              const linkedAgents = agents.filter(ag=>ag.affiliate_id===a.id);
              return (
                <div key={a.id} className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="p-4 cursor-pointer" onClick={()=>setDetailId(a.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm">{a.name}</h3>
                          {agentCountFor(a.id)>0&&<Badge variant="outline" className="text-[9px] px-1.5">{agentCountFor(a.id)} agent{agentCountFor(a.id)>1?"s":""}</Badge>}
                        </div>
                        {a.responsiblePerson&&<p className="text-[10px] text-primary mt-0.5">Key Person: {summarizeKeyPersons(a.responsiblePerson)}</p>}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">{a.code}</span>
                          <span className="text-xs text-emerald-400 font-display">{a.commission}</span>
                          <span className="text-xs text-muted-foreground">{a.referrals} referrals</span>
                          {a.region&&<span className="text-xs text-muted-foreground">{a.region}</span>}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.status==="Active"?"bg-emerald-500/20 text-emerald-400":"bg-muted text-muted-foreground"}`}>{a.status}</span>
                        </div>
                        {a.email&&<p className="text-[10px] text-muted-foreground mt-1">{a.email}{a.phone&&` • ${a.phone}`}</p>}
                        <div className="mt-2"><StaffMetrics humanCount={a.humanCount} aiCount={a.aiCount}/></div>
                      </div>
                      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                        {linkedAgents.length>0&&(
                          <button onClick={()=>setExpandedAff(isExpanded?null:a.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10">
                            {isExpanded?<ChevronUp className="w-3.5 h-3.5"/>:<ChevronDown className="w-3.5 h-3.5"/>}
                          </button>
                        )}
                        <button onClick={()=>openEdit(a)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>setDeleteId(a.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  </div>
                  {isExpanded&&linkedAgents.length>0&&(
                    <div className="border-t border-border bg-secondary/30 px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">Linked Agents ({linkedAgents.length})</p>
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={()=>openAgentNew(a.id,(a as any).brand_id||"")}><Plus className="w-3 h-3 mr-1"/>Add Agent</Button>
                      </div>
                      <div className="space-y-1.5">
                        {linkedAgents.map(ag=>(
                          <div key={ag.id} className="flex items-center justify-between text-xs bg-card rounded-md px-3 py-1.5 gap-2">
                            <span className="font-medium w-28 truncate">{ag.agent_name}</span>
                            <CommissionBar rate={ag.commission_rate||0}/>
                            <span className="text-emerald-400 w-20 text-right font-mono">${(ag.total_sales||0).toLocaleString()}</span>
                            <Badge variant={ag.status==="active"?"default":"secondary"} className="text-[9px]">{ag.status}</Badge>
                            <div className="flex gap-1 ml-1">
                              <button onClick={()=>openAgentEdit(ag)} className="p-1 rounded hover:bg-primary/10"><Edit className="w-3 h-3 text-muted-foreground"/></button>
                              <button onClick={()=>removeAgent(ag.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-destructive"/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredAffiliates.length===0&&<p className="text-center text-muted-foreground text-sm py-12">No affiliates found</p>}
          </div>
          <div className="mt-6"><ApiIntegrationStatus/></div>
        </TabsContent>

        {/* ── Agents ── */}
        <TabsContent value="agents">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground"/><Input placeholder="Search agents…" className="pl-9 h-8 text-xs" value={agentSearch} onChange={e=>setAgentSearch(e.target.value)}/></div>
            <select value={agentStatus} onChange={e=>setAgentStatus(e.target.value)} className="h-8 text-xs rounded-md bg-secondary border border-border px-2 text-foreground">
              <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
            </select>
{brands.length>0&&(
              <select value={agentBrandFilter} onChange={e=>setAgentBrandFilter(e.target.value)} className="h-8 text-xs rounded-md bg-primary/20 border border-primary/40 px-2 text-foreground max-w-[160px] font-semibold">
                <option value="all">All Brands</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <select value={agentAffFilter} onChange={e=>setAgentAffFilter(e.target.value)} className="h-8 text-xs rounded-md bg-secondary border border-border px-2 text-foreground max-w-[160px]">
              <option value="all">All Affiliates</option>{items.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ExportButton data={filteredAgents as any[]} filename="affiliated-agents" title="Agents"/>
            <Button className="gap-1 font-display text-xs" onClick={()=>openAgentNew("",activeBrandId||"")}><Plus className="w-4 h-4"/>Add Agent</Button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-[11px] font-display uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Name</th><th className="text-left p-3">Brand</th>
                  <th className="text-left p-3">Commission</th>
                  <th className="text-left p-3">Sales</th><th className="text-left p-3">Earned</th>
                  <th className="text-left p-3">Status</th><th className="text-left p-3">Affiliate</th>
                  <th className="p-3"/>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.length===0
                  ?<tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No agents found</td></tr>
                  :filteredAgents.map(a=>(
                  <tr key={a.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-semibold">{a.agent_name}</td>
                    <td className="p-3 text-xs">{a.brand_id?<span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">{brands.find(b=>b.id===a.brand_id)?.name||"—"}</span>:<span className="text-muted-foreground">—</span>}</td>
                    <td className="p-3"><CommissionBar rate={a.commission_rate||0}/></td>
                    <td className="p-3 font-bold text-emerald-400 font-mono">${(a.total_sales||0).toLocaleString()}</td>
                    <td className="p-3 font-mono text-amber-400">${((a.total_sales||0)*(a.commission_rate||0)).toFixed(2)}</td>
                    <td className="p-3"><Badge variant={a.status==="active"?"default":a.status==="suspended"?"destructive":"secondary"} className="text-[10px]">{a.status}</Badge></td>
                    <td className="p-3 text-xs">{a.affiliate_id?<span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">{affiliateName(a.affiliate_id)}</span>:<span className="text-muted-foreground">—</span>}</td>
                    <td className="p-3"><div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={()=>openAgentEdit(a)}><Edit className="w-3.5 h-3.5"/></Button>
                      <Button size="sm" variant="ghost" onClick={()=>removeAgent(a.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* ── Commissions ── */}
        <TabsContent value="commissions">
          <div className="flex justify-end mb-3"><ExportButton data={commissionRows as any[]} filename="commission-report" title="Commission Report"/></div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Total Sales</p><p className="text-lg font-bold text-emerald-400">${commissionRows.reduce((s,r)=>s+r.totalSales,0).toLocaleString()}</p></Card>
            <Card className="p-3 text-center"><p className="text-[10px] text-muted-foreground">Commission Owed</p><p className="text-lg font-bold text-amber-400">${commissionRows.reduce((s,r)=>s+r.commissionOwed,0).toFixed(2)}</p></Card>
            <Card className="p-3 text-center"><p className="text-[10px] text-muted-foreground">With Agents</p><p className="text-lg font-bold text-blue-400">{commissionRows.filter(r=>r.agentCount>0).length}</p></Card>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-[11px] font-display uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Affiliate</th><th className="text-left p-3">Brand</th>
                  <th className="text-left p-3">Region</th><th className="text-left p-3">Agents</th>
                  <th className="text-left p-3">Total Sales</th><th className="text-left p-3">Commission</th>
                  <th className="text-left p-3">Rate</th><th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissionRows.length===0
                  ?<tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No data yet</td></tr>
                  :commissionRows.map(r=>(
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-semibold">{r.name}</td>
                    <td className="p-3 text-xs">{brands.find(b=>b.id===(r as any).brand_id)?.name||<span className="text-muted-foreground">—</span>}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.region||"—"}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs">{r.agentCount}</span></td>
                    <td className="p-3 font-bold text-emerald-400 font-mono">${r.totalSales.toLocaleString()}</td>
                    <td className="p-3"><span className={`font-bold font-mono ${r.commissionOwed>0?"text-amber-400":"text-muted-foreground"}`}>${r.commissionOwed.toFixed(2)}</span></td>
                    <td className="p-3 text-xs text-primary">{r.commission||"—"}</td>
                    <td className="p-3"><Badge variant={r.status==="Active"?"default":"secondary"} className="text-[10px]">{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Agent dialog ── */}
      <Dialog open={agentOpen} onOpenChange={setAgentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{agentEditId?"Edit":"New"} Affiliated Agent</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Agent Name *</Label><Input value={agentForm.agent_name} onChange={e=>setAgentForm(p=>({...p,agent_name:e.target.value}))} placeholder="Agent Cairo-01"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Commission Rate</Label><Input type="number" step="0.01" min="0" max="1" value={agentForm.commission_rate} onChange={e=>setAgentForm(p=>({...p,commission_rate:+e.target.value}))}/><p className="text-[10px] text-muted-foreground mt-0.5">= {((agentForm.commission_rate||0)*100).toFixed(1)}%</p></div>
              <div><Label>Total Sales ($)</Label><Input type="number" value={agentForm.total_sales} onChange={e=>setAgentForm(p=>({...p,total_sales:+e.target.value}))}/>{agentForm.total_sales>0&&<p className="text-[10px] text-amber-400 mt-0.5">Earns: ${((agentForm.total_sales||0)*(agentForm.commission_rate||0)).toFixed(2)}</p>}</div>
            </div>
            {brands.length>0&&(
              <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 space-y-1">
                <p className="text-[10px] font-display font-bold text-primary uppercase tracking-wider flex items-center gap-1.5"><Crown className="w-3.5 h-3.5"/>Brand Linkage</p>
                <select value={agentForm.brand_id} onChange={e=>setAgentForm(p=>({...p,brand_id:e.target.value}))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground">
                  <option value="">— No Brand —</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label><select value={agentForm.status} onChange={e=>setAgentForm(p=>({...p,status:e.target.value}))} className="w-full mt-1 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground"><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></div>
              <div><Label>Parent Affiliate</Label><select value={agentForm.affiliate_id} onChange={e=>setAgentForm(p=>({...p,affiliate_id:e.target.value}))} className="w-full mt-1 rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground"><option value="">— None —</option>{items.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            </div>
            <div><Label>Notes</Label><Textarea value={agentForm.notes} onChange={e=>setAgentForm(p=>({...p,notes:e.target.value}))} rows={2}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setAgentOpen(false)}>Cancel</Button><Button onClick={saveAgent}>Save Agent</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Affiliate form dialog ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editId?"Edit":"New"} Affiliate</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
            {brands.length>0&&(
              <div className="space-y-2">
                <Label>Brand</Label>
                <select value={selectedBrandId} onChange={e=>setSelectedBrandId(e.target.value)} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm text-foreground">
                  <option value="">— No Brand —</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <ResponsiblePerson value={form.responsiblePerson} onChange={v=>setForm(p=>({...p,responsiblePerson:v}))}/>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
              <div className="space-y-2"><Label>Commission Rate</Label><Input value={form.commission} onChange={e=>setForm(p=>({...p,commission:e.target.value}))} placeholder="e.g. 10%" className="bg-secondary border-border text-foreground"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Region</Label><Input value={form.region} onChange={e=>setForm(p=>({...p,region:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
              <div className="space-y-2"><Label>Status</Label><select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value as AffiliateRow["status"]}))} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground"><option>Active</option><option>Inactive</option></select></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Referrals</Label><Input type="number" min={0} value={form.referrals} onChange={e=>setForm(p=>({...p,referrals:+e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
              <div className="space-y-2"><Label>Human Staff</Label><Input type="number" min={0} value={form.humanCount} onChange={e=>setForm(p=>({...p,humanCount:+e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
              <div className="space-y-2"><Label>AI Agents</Label><Input type="number" min={0} value={form.aiCount} onChange={e=>setForm(p=>({...p,aiCount:+e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} className="bg-secondary border-border text-foreground"/></div>
            <EntityFileUpload files={form.files} onChange={files=>setForm(p=>({...p,files}))} ownerKind="affiliate" ownerId={editId||undefined}/>
            <EntityApiHub entityName={form.name||"New Affiliate"} ownerKind="affiliate" ownerId={editId||undefined}/>
          </div>
          <DialogFooter><Button onClick={handleSubmit} className="font-display text-xs">{editId?"Save":"Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail dialog ── */}
      <Dialog open={!!detailId} onOpenChange={()=>setDetailId(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          {detail&&(<>
            <DialogHeader><DialogTitle className="font-display text-primary flex items-center gap-2">{detail.name}<Badge variant={detail.status==="Active"?"default":"secondary"} className="text-[10px]">{detail.status}</Badge></DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-secondary/50 rounded p-2"><p className="text-muted-foreground">Code</p><p className="font-mono mt-0.5">{detail.code||"—"}</p></div>
                <div className="bg-secondary/50 rounded p-2"><p className="text-muted-foreground">Commission</p><p className="font-mono mt-0.5 text-emerald-400">{detail.commission||"—"}</p></div>
                <div className="bg-secondary/50 rounded p-2"><p className="text-muted-foreground">Region</p><p className="font-mono mt-0.5">{detail.region||"—"}</p></div>
              </div>
              {detail.responsiblePerson&&<p className="text-xs text-primary">Key Person: {summarizeKeyPersons(detail.responsiblePerson)}</p>}
              <StaffMetrics humanCount={detail.humanCount} aiCount={detail.aiCount}/>
              {agents.filter(a=>a.affiliate_id===detail.id).length>0&&(
                <div>
                  <p className="text-xs font-display text-muted-foreground mb-2 uppercase tracking-wider">Linked Agents ({agents.filter(a=>a.affiliate_id===detail.id).length})</p>
                  <div className="space-y-1.5">
                    {agents.filter(a=>a.affiliate_id===detail.id).map(ag=>(
                      <div key={ag.id} className="flex justify-between items-center text-xs bg-secondary/40 rounded px-3 py-1.5 gap-3">
                        <span className="font-medium">{ag.agent_name}</span>
                        <CommissionBar rate={ag.commission_rate||0}/>
                        <span className="text-emerald-400 font-mono">${(ag.total_sales||0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <EntityApiHub entityName={detail.name} ownerKind="affiliate" ownerId={detail.id}/>
            </div>
          </>)}
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog open={!!deleteId} onOpenChange={()=>setDeleteId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-destructive">Delete Affiliate?</DialogTitle></DialogHeader>
          {deleteId&&agents.filter(a=>a.affiliate_id===deleteId).length>0&&<p className="text-xs text-amber-400 mb-2">⚠ {agents.filter(a=>a.affiliate_id===deleteId).length} agent(s) will be unlinked.</p>}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async()=>{if(deleteId){await remove(deleteId);setDeleteId(null);toast.success("Deleted");}}}>Delete</Button>
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
  const { items: agentItems,   loading: agentLoading,   create: _agentCreate,   update: _agentUpdate,   remove: _agentRemove   } = useExtTable("affiliated_agents");
  const { items: partnerRows,  loading: partnerLoading, create: partnerCreate,  update: partnerUpdate,  remove: partnerRemove  } = useEntities("success_partners");
  const { items: empRows,      loading: _empLoading                                                                              } = useEntities("employees");

  const getBrandLabel = (id: string | null) => brands.find((b: any) => b.id === id)?.name ?? id?.slice(0,8) ?? "—";

  const brandFilter   = (row: any) => !activeBrandId || (row.brand_id ?? row.data?.brandId) === activeBrandId;
  const agentFilter   = (a: any)   => !activeBrandId || a.brand_id === activeBrandId;

  const projCount     = projRows.filter(brandFilter).length;
  const svcCount      = svcRows.filter(brandFilter).length;
  const branchCount   = branchRows.filter(brandFilter).length;
  const custCount     = custRows.filter(brandFilter).length;
  const agentCount    = agentItems.filter(agentFilter).length;
  const partnerCount  = partnerRows.filter(brandFilter).length;
  const empCount      = empRows.filter((e:any) => !activeBrandId || (e.brand_id ?? e.data?.brandId) === activeBrandId).length;
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
    { key:"human_count", label:"Human Staff", render:(v,row)=><span className="flex items-center gap-1 text-xs"><Users className="w-3 h-3 text-blue-400"/>{row.human_count??0}</span> },
    { key:"ai_count", label:"AI Agents", render:(v,row)=><span className="flex items-center gap-1 text-xs"><Cpu className="w-3 h-3 text-purple-400"/>{row.ai_count??0}</span> },
  ];
  const BRANCH_FIELDS: FieldDef[] = [
    { key:"name",       label:"Branch Name *" },
    { key:"branch_type",label:"Type", type:"select", options:["Main","Sub-branch","Warehouse","Data Center","Office","Lab","Showroom"], allowCustom:true },
    { key:"address",    label:"Address" },
    { key:"status",     label:"Status", type:"select", options:["Active","Inactive","Maintenance"] },
    { key:"human_count",label:"Human Staff Count", type:"number" },
    { key:"ai_count",   label:"AI Agents Count", type:"number" },
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

  const PARTNER_COLS: ColDef[] = [
    { key:"name",         label:"Name",    render:(v)=><span className="font-semibold">{v}</span> },
    { key:"company",      label:"Company" },
    { key:"role",         label:"Role",    render:(v,row)=><Badge variant="outline" className="text-[10px]">{row.role??row.data?.role??v??"—"}</Badge> },
    { key:"email",        label:"Email",   render:(v,row)=><span className="text-muted-foreground">{row.email??row.data?.email??v??"—"}</span> },
    { key:"contribution", label:"Contribution", render:(v,row)=>{ const c=row.contribution??row.data?.contribution??v; return c?<span className="truncate max-w-[160px] block">{c}</span>:"—"; } },
    { key:"status",       label:"Status",  render:(v,row)=>statusBadge(row.status??row.data?.status??v) },
  ];
  const PARTNER_FIELDS: FieldDef[] = [
    { key:"name",         label:"Partner Name *" },
    { key:"company",      label:"Company" },
    { key:"role",         label:"Role" },
    { key:"email",        label:"Email" },
    { key:"phone",        label:"Phone" },
    { key:"status",       label:"Status", type:"select", options:["Active","Inactive"] },
    { key:"contribution", label:"Contribution", type:"textarea" },
    { key:"human_count",  label:"Human Staff", type:"number" },
    { key:"ai_count",     label:"AI Agents", type:"number" },
    { key:"responsible_person", label:"Key Person" },
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
          <Button onClick={() => setTab("brands")} className="gap-1.5 font-display text-xs">
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
            <TabsTrigger value="brands"    className="text-xs"><Crown className="w-3.5 h-3.5 mr-1"/>Brands ({brands.length})</TabsTrigger>
            <TabsTrigger value="projects"   className="text-xs"><FolderOpen className="w-3.5 h-3.5 mr-1"/>Projects ({projCount})</TabsTrigger>
            <TabsTrigger value="services"   className="text-xs"><Briefcase className="w-3.5 h-3.5 mr-1"/>Services ({svcCount})</TabsTrigger>
            <TabsTrigger value="branches"   className="text-xs"><Building2 className="w-3.5 h-3.5 mr-1"/>Branches ({branchCount})</TabsTrigger>
            <TabsTrigger value="customers"  className="text-xs"><Users className="w-3.5 h-3.5 mr-1"/>Customers ({custCount})</TabsTrigger>
            <TabsTrigger value="agents"     className="text-xs"><UserCheck className="w-3.5 h-3.5 mr-1"/>Agents ({agentCount})</TabsTrigger>
            <TabsTrigger value="partners"   className="text-xs"><Handshake className="w-3.5 h-3.5 mr-1"/>Partners ({partnerCount})</TabsTrigger>
            <TabsTrigger value="employees"  className="text-xs"><Users className="w-3.5 h-3.5 mr-1"/>Employees ({empCount})</TabsTrigger>
            <TabsTrigger value="affiliates-hub" className="text-xs"><UserCheck className="w-3.5 h-3.5 mr-1"/>Affiliates Hub</TabsTrigger>
            <TabsTrigger value="developer-hub"  className="text-xs"><CodeIcon className="w-3.5 h-3.5 mr-1"/>Developer Hub</TabsTrigger>
            <TabsTrigger value="referrals"  className="text-xs"><Share2 className="w-3.5 h-3.5 mr-1"/>Referrals</TabsTrigger>
            <TabsTrigger value="reports"    className="text-xs"><BarChart3 className="w-3.5 h-3.5 mr-1"/>Reports</TabsTrigger>
            <TabsTrigger value="finance"    className="text-xs"><TrendingUp className="w-3.5 h-3.5 mr-1"/>Finance</TabsTrigger>
            <TabsTrigger value="users"      className="text-xs"><Shield className="w-3.5 h-3.5 mr-1"/>Users</TabsTrigger>
            <TabsTrigger value="workflow"   className="text-xs"><GitBranch className="w-3.5 h-3.5 mr-1"/>Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-2">
            <OverviewTab
              brands={brands} projRows={projRows} svcRows={svcRows}
              branchRows={branchRows} custRows={custRows} agentItems={agentItems}
              partnerRows={partnerRows}
              setActiveBrandId={setActiveBrandId} setTab={setTab}
            />
          </TabsContent>

          <TabsContent value="brands" className="mt-2">
            <BrandsManageTab/>
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
              create={p => branchCreate({ ...p, name: p.name, status: p.status === "Active" ? "active" : p.status === "Maintenance" ? "maintenance" : "inactive", brand_id: p.brand_id, branch_type: p.branch_type||"Main", address: p.address||null, human_count: Number(p.human_count)||0, ai_count: Number(p.ai_count)||0, responsible_person: p.responsible_person||null, data: p })}
              update={(id, p) => branchUpdate(id, { ...p, status: p.status === "Active" ? "active" : p.status === "Maintenance" ? "maintenance" : "inactive", brand_id: p.brand_id, human_count: Number(p.human_count)||0, ai_count: Number(p.ai_count)||0, data: p })}
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

          <TabsContent value="partners" className="mt-2">
            <EntityTab
              items={partnerRows} loading={partnerLoading}
              create={p => partnerCreate({ name: p.name, status: p.status === "Active" ? "active" : "inactive", brand_id: p.brand_id, company: p.company||null, role: p.role||null, email: p.email||null, phone: p.phone||null, contribution: p.contribution||null, human_count: Number(p.human_count)||0, ai_count: Number(p.ai_count)||0, responsible_person: p.responsible_person||null, data: p })}
              update={(id, p) => partnerUpdate(id, { name: p.name, status: p.status === "Active" ? "active" : "inactive", brand_id: p.brand_id, company: p.company||null, role: p.role||null, email: p.email||null, phone: p.phone||null, contribution: p.contribution||null, human_count: Number(p.human_count)||0, ai_count: Number(p.ai_count)||0, responsible_person: p.responsible_person||null, data: p })}
              remove={partnerRemove}
              title="Success Partners" columns={PARTNER_COLS} fields={PARTNER_FIELDS}
              emptyHint="Add success partners and link them to a brand"
              activeBrandId={activeBrandId} brands={brands} getBrandLabel={getBrandLabel}
            />
          </TabsContent>

          <TabsContent value="employees" className="mt-2">
            <EmployeesTab activeBrandId={activeBrandId} brands={brands}/>
          </TabsContent>

          <TabsContent value="affiliates-hub" className="mt-2">
            <AffiliatesHubTab activeBrandId={activeBrandId} brands={brands}/>
          </TabsContent>

          <TabsContent value="developer-hub" className="mt-2">
            <DeveloperHubTab/>
          </TabsContent>

          <TabsContent value="referrals" className="mt-2">
            <ReferralsTab activeBrandId={activeBrandId} brands={brands}/>
          </TabsContent>

          <TabsContent value="reports" className="mt-2">
            <ReportsTab activeBrandId={activeBrandId}/>
          </TabsContent>

          <TabsContent value="finance" className="mt-2">
            <FinanceAnalyticsTab brands={brands}/>
          </TabsContent>

          <TabsContent value="users" className="mt-2">
            <UserManagementTab activeBrandId={activeBrandId} brands={brands}/>
          </TabsContent>

          <TabsContent value="workflow" className="mt-2">
            <WorkflowMapTab activeBrandId={activeBrandId}/>
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


/* ─── Employees Tab ──────────────────────────────────────────── */
function EmployeesTab({ activeBrandId, brands }: { activeBrandId: string | null; brands: any[] }) {
  const { items: rows, loading, create, update, remove } = useEntities("employees");
  const [open, setOpen]         = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [q, setQ]               = useState("");
  const [typeFilter, setTypeFilter]     = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const emptyForm = () => ({
    name:"", type:"Human", position:"", branch:"", email:"", phone:"",
    specialization:"", tasks:"", status:"Active", bio:"", role:"", department:"",
    responsiblePerson:"", availability:"offline", reports_to:"", avatar_url:"",
    instructions:"", workflow_id:"",
    metadata:{} as Record<string,any>, metaRaw:"{}",
    agent_code:"", agent_version:"", system_prompt:"", team_category:"", is_aggregator:false,
    brand_id: activeBrandId ?? "",
  });

  const [form, setForm] = useState<Record<string,any>>(emptyForm());

  const items = useMemo(() => rows.map((r: any) => ({
    id: r.id,
    name:             r.name               ?? r.data?.name              ?? "",
    type:             (r.employee_type==="AI"||r.employee_type==="AI Agent"||r.data?.type==="AI Agent") ? "AI Agent" : "Human",
    position:         r.position           ?? r.data?.position          ?? "",
    branch:           r.branch_name        ?? r.data?.branch            ?? "",
    email:            r.email              ?? r.data?.email             ?? "",
    phone:            r.phone              ?? r.data?.phone             ?? "",
    specialization:   r.specialization     ?? r.data?.specialization    ?? "",
    tasks:            r.tasks              ?? r.data?.tasks             ?? "",
    status:           r.status==="inactive" ? "Inactive" : "Active",
    bio:              r.bio                ?? r.data?.bio               ?? "",
    role:             r.role               ?? r.data?.role              ?? "",
    department:       r.department         ?? r.data?.department        ?? "",
    responsiblePerson:r.responsible_person ?? r.data?.responsiblePerson ?? "",
    availability:     r.availability       ?? r.data?.availability      ?? "offline",
    reports_to:       r.reports_to         ?? r.data?.reports_to        ?? "",
    avatar_url:       r.avatar_url         ?? r.data?.avatar_url        ?? "",
    instructions:     r.instructions       ?? r.data?.instructions      ?? "",
    workflow_id:      r.workflow_id         ?? r.data?.workflow_id        ?? "",
    metadata:         (() => { const m=r.metadata??r.data?.metadata; if(!m||typeof m!=="object"||Array.isArray(m)) return {}; return m; })(),
    agent_code:       r.agent_code         ?? r.data?.agent_code        ?? "",
    agent_version:    r.agent_version      ?? r.data?.agent_version     ?? "",
    system_prompt:    r.system_prompt      ?? r.data?.system_prompt     ?? "",
    team_category:    r.team_category      ?? r.data?.team_category     ?? "",
    is_aggregator:    r.is_aggregator      ?? r.data?.is_aggregator     ?? false,
    brand_id:         r.brand_id           ?? r.data?.brandId           ?? null,
  })), [rows]);

  const filtered = useMemo(() => {
    let list = activeBrandId ? items.filter(e => e.brand_id === activeBrandId) : items;
    if (typeFilter !== "all") list = list.filter(e => e.type === typeFilter);
    if (statusFilter !== "all") list = list.filter(e => e.status === statusFilter);
    if (q.trim()) { const lq=q.toLowerCase(); list=list.filter(e=>e.name.toLowerCase().includes(lq)||(e.position||"").toLowerCase().includes(lq)); }
    return list;
  }, [items, activeBrandId, typeFilter, statusFilter, q]);

  const openNew  = () => { setForm(emptyForm()); setEditId(null); setOpen(true); };
  const openEdit = (e: any) => {
    let metaRaw = "{}";
    try { metaRaw = e.metadata && typeof e.metadata==="object" ? JSON.stringify(e.metadata, null, 2) : "{}"; } catch {}
    setForm({ ...e, metaRaw });
    setEditId(e.id); setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    let metadata = {};
    try { metadata = JSON.parse(form.metaRaw||"{}"); } catch {}
    const payload: any = {
      name:               form.name,
      status:             form.status==="Active"?"active":"inactive",
      brand_id:           form.brand_id||null,
      employee_type:      form.type==="AI Agent"?"AI":"Human",
      position:           form.position||null,
      branch_name:        form.branch||null,
      email:              form.email||null,
      phone:              form.phone||null,
      specialization:     form.specialization||null,
      tasks:              form.tasks||null,
      responsible_person: form.responsiblePerson||null,
      role:               form.role||null,
      department:         form.department||null,
      bio:                form.bio||null,
      avatar_url:         form.avatar_url||null,
      availability:       form.availability||"offline",
      reports_to:         form.reports_to||null,
      instructions:       form.instructions||null,
      workflow_id:         form.workflow_id||null,
      metadata,
      agent_code:         form.agent_code||null,
      agent_version:      form.agent_version||null,
      system_prompt:      form.system_prompt||null,
      team_category:      form.team_category||null,
      is_aggregator:      !!form.is_aggregator,
      data:               { ...form, metadata },
    };
    if (editId) { await update(editId, payload); toast.success("Updated"); }
    else        { await create(payload);          toast.success("Added");   }
    setOpen(false);
  };

  const sf = (key: string, label: string, type="text") => (
    <div key={key}>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={form[key]||""} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} className="mt-1 bg-secondary border-border text-xs"/>
    </div>
  );

  const availabilityDot: Record<string,string> = { online:"bg-emerald-500", offline:"bg-muted-foreground", busy:"bg-amber-500" };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground"/>
          <Input placeholder="Search employees…" value={q} onChange={e=>setQ(e.target.value)} className="pl-9 h-8 text-xs"/>
        </div>
        <ExportButton data={filtered as any[]} filename="employees" title="Employees"/>
        <Button size="sm" onClick={openNew} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Employee</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {["all","Human","AI Agent"].map(t=>(
          <button key={t} onClick={()=>setTypeFilter(t)} className={`px-2.5 py-1 rounded-md text-[11px] font-display transition-colors ${typeFilter===t?"bg-primary/20 text-primary border border-primary/30":"text-muted-foreground border border-transparent hover:border-border"}`}>{t==="all"?"All Types":t}</button>
        ))}
        <span className="text-border">|</span>
        {["all","Active","Inactive"].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} className={`px-2.5 py-1 rounded-md text-[11px] font-display transition-colors ${statusFilter===s?"bg-primary/20 text-primary border border-primary/30":"text-muted-foreground border border-transparent hover:border-border"}`}>{s==="all"?"All Status":s}</button>
        ))}
        <span className="ml-auto flex gap-3 text-xs font-display text-muted-foreground">
          <span>👤 {items.filter(e=>e.type==="Human").length} Human</span>
          <span>🤖 {items.filter(e=>e.type==="AI Agent").length} AI</span>
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-16 w-full"/>)}</div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState title="No Employees" hint="Add employees and link them to brands"/></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(e => (
            <Card key={e.id} className="p-3 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {e.avatar_url
                    ? <img src={e.avatar_url} alt={e.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-border"/>
                    : <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${e.type==="AI Agent"?"bg-purple-500/20":"bg-primary/20"}`}>
                        {e.type==="AI Agent" ? <Cpu className="w-4 h-4 text-purple-400"/> : <User className="w-4 h-4 text-primary"/>}
                      </div>
                  }
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-sm text-foreground truncate">{e.name}</p>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${availabilityDot[e.availability]||"bg-muted-foreground"}`}/>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{[e.position, e.department, e.branch].filter(Boolean).join(" · ")}</p>
                    {e.specialization&&<p className="text-[10px] text-primary">{e.specialization}</p>}
                    {(e.email||e.phone)&&<p className="text-[10px] text-muted-foreground">{e.email}{e.email&&e.phone?" · ":""}{e.phone}</p>}
                    {e.responsiblePerson&&<p className="text-[10px] text-muted-foreground">Reports to: {e.responsiblePerson}</p>}
                    {e.brand_id&&<Badge variant="outline" className="text-[9px] mt-0.5">{brands.find((b:any)=>b.id===e.brand_id)?.name??""}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge className={`text-[9px] ${e.type==="AI Agent"?"bg-purple-500/20 text-purple-300":"bg-primary/20 text-primary"}`}>{e.type}</Badge>
                  <Badge className={`text-[9px] ${e.status==="Active"?"bg-emerald-500/20 text-emerald-400":"bg-muted text-muted-foreground"}`}>{e.status}</Badge>
                  <Button size="icon" variant="ghost" className="w-7 h-7" onClick={()=>openEdit(e)}><Edit className="w-3.5 h-3.5"/></Button>
                  <Button size="icon" variant="ghost" className="w-7 h-7" onClick={()=>setDeleteId(e.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[88vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display">{editId?"Edit":"New"} Employee</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">

            {/* Brand */}
            <div>
              <Label className="text-xs">Brand</Label>
              <select value={form.brand_id||""} onChange={e=>setForm(p=>({...p,brand_id:e.target.value||null}))} className="mt-1 w-full bg-secondary border border-border text-foreground rounded-md px-3 py-2 text-sm">
                <option value="">— No Brand —</option>
                {brands.map((b:any)=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Classification */}
            <div>
              <Label className="text-xs">Classification *</Label>
              <Select value={form.type} onValueChange={v=>setForm(p=>({...p,type:v}))}>
                <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="Human">Human</SelectItem><SelectItem value="AI Agent">AI Agent</SelectItem></SelectContent>
              </Select>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-2">
              {sf("name","Name *")}
              {sf("position","Position")}
              {sf("branch","Branch")}
              {sf("specialization","Specialization")}
              {sf("role","Role")}
              {sf("department","Department")}
            </div>

            {/* Responsible person + reports to */}
            <div className="grid grid-cols-2 gap-2">
              {sf("responsiblePerson","Responsible Person")}
              {sf("reports_to","Reports To")}
            </div>

            {/* Availability + Status */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Availability</Label>
                <Select value={form.availability||"offline"} onValueChange={v=>setForm(p=>({...p,availability:v}))}>
                  <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">🟢 Online</SelectItem>
                    <SelectItem value="busy">🟡 Busy</SelectItem>
                    <SelectItem value="offline">⚫ Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v=>setForm(p=>({...p,status:v}))}>
                  <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            {/* Avatar URL */}
            {sf("avatar_url","Avatar URL (https://…)")}

            {/* Human-only contact */}
            {form.type==="Human"&&(
              <div className="grid grid-cols-2 gap-2">
                {sf("email","Email","email")}
                {sf("phone","Phone","tel")}
              </div>
            )}

            {/* Tasks */}
            <div>
              <Label className="text-xs">Tasks</Label>
              <Textarea value={form.tasks||""} onChange={e=>setForm(p=>({...p,tasks:e.target.value}))} className="mt-1 bg-secondary border-border text-xs" rows={2} placeholder="Comma-separated tasks"/>
            </div>

            {/* Bio */}
            <div>
              <Label className="text-xs">Bio</Label>
              <Textarea value={form.bio||""} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} className="mt-1 bg-secondary border-border text-xs" rows={2}/>
            </div>

            {/* Instructions (Human) */}
            {form.type==="Human"&&(
              <div>
                <Label className="text-xs">Special Instructions</Label>
                <Textarea value={form.instructions||""} onChange={e=>setForm(p=>({...p,instructions:e.target.value}))} className="mt-1 bg-secondary border-border text-xs" rows={2}/>
              </div>
            )}

            {/* Workflow ID */}
            {sf("workflow_id","Workflow ID")}

            {/* Metadata */}
            <div>
              <Label className="text-xs">Metadata (JSON)</Label>
              <Textarea
                value={form.metaRaw||"{}"}
                onChange={e=>setForm(p=>({...p,metaRaw:e.target.value}))}
                rows={3} placeholder={'{ "key": "value" }'}
                className="mt-1 bg-secondary border-border text-xs font-mono"
              />
            </div>

            {/* AI Agent config */}
            {form.type==="AI Agent"&&(
              <div className="p-3 rounded-md border border-purple-500/30 bg-purple-500/5 space-y-3">
                <p className="font-display text-[11px] text-purple-400 tracking-wider">AI AGENT CONFIG</p>
                <div className="grid grid-cols-2 gap-2">
                  {sf("agent_code","Agent Code")}
                  {sf("agent_version","Version")}
                </div>
                {sf("team_category","Team Category")}
                <div>
                  <Label className="text-xs">System Prompt</Label>
                  <Textarea value={form.system_prompt||""} onChange={e=>setForm(p=>({...p,system_prompt:e.target.value}))} className="mt-1 bg-secondary border-border text-xs" rows={4} placeholder="Instructions for the AI agent…"/>
                </div>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input type="checkbox" checked={!!form.is_aggregator} onChange={e=>setForm(p=>({...p,is_aggregator:e.target.checked}))}/>
                  Is Aggregator (collects results from sub-agents)
                </label>
              </div>
            )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteId} onOpenChange={()=>setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-destructive">Delete Employee?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async()=>{if(deleteId){await remove(deleteId);toast.success("Deleted");setDeleteId(null);}}}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Brands Management Tab ─────────────────────────────────── */
function BrandsManageTab() {
  const { brands, loading, addBrand, updateBrand, deleteBrand } = useBrands();
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [detailId, setDetailId]     = useState<string | null>(null);
  const [q, setQ]                   = useState("");
  const [name, setName]             = useState("");
  const [address, setAddress]       = useState("");
  const [industry, setIndustry]     = useState("");
  const [logoUrl, setLogoUrl]       = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [humanCount, setHumanCount] = useState(0);
  const [aiCount, setAiCount]       = useState(0);
  const [owners, setOwners]         = useState<Owner[]>([{ id: crypto.randomUUID(), name: "", phone: "", email: "", whatsapp: "" }]);
  const [team, setTeam]             = useState<TeamMember[]>([]);
  const [products, setProducts]     = useState<ProductItem[]>([{ id: crypto.randomUUID(), name: "", description: "" }]);
  const [legalDocs, setLegalDocs]   = useState<DocFile[]>([]);
  const [financialDocs, setFinancialDocs] = useState<DocFile[]>([]);
  const [marketingPlans, setMarketingPlans] = useState<MarketingPlan[]>([]);
  const [companyProfiles, setCompanyProfiles] = useState<DocFile[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ website: "", facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "" });
  const [responsiblePersonContact, setResponsiblePersonContact] = useState<ResponsiblePersonContact>({ phone: "", email: "", whatsapp: "", linkedin: "", twitter: "" });

  const emptyRpc = (): ResponsiblePersonContact => ({ phone: "", email: "", whatsapp: "", linkedin: "", twitter: "" });

  const resetForm = () => {
    setName(""); setAddress(""); setIndustry(""); setLogoUrl("");
    setResponsiblePerson(""); setHumanCount(0); setAiCount(0);
    setOwners([{ id: crypto.randomUUID(), name: "", phone: "", email: "", whatsapp: "" }]);
    setTeam([]); setProducts([{ id: crypto.randomUUID(), name: "", description: "" }]);
    setLegalDocs([]); setFinancialDocs([]); setMarketingPlans([]); setCompanyProfiles([]);
    setSocialLinks({ website: "", facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "" });
    setResponsiblePersonContact(emptyRpc());
    setEditId(null);
  };
  const openNew = () => { resetForm(); setSheetOpen(true); };
  const openEdit = useCallback((b: Brand) => {
    setEditId(b.id); setName(b.name); setAddress(b.address); setIndustry(b.industry); setLogoUrl(b.logoUrl||"");
    setResponsiblePerson(b.responsiblePerson||""); setHumanCount(b.humanCount||0); setAiCount(b.aiCount||0);
    setOwners(b.owners.length ? b.owners : [{ id: crypto.randomUUID(), name: "", phone: "", email: "", whatsapp: "" }]);
    setTeam(b.team);
    setProducts(b.products.length ? b.products : [{ id: crypto.randomUUID(), name: "", description: "" }]);
    setLegalDocs(b.legalDocs); setFinancialDocs(b.financialDocs);
    setMarketingPlans(b.marketingPlans); setCompanyProfiles(b.companyProfiles||[]);
    setSocialLinks(b.socialLinks||{ website:"",facebook:"",instagram:"",twitter:"",linkedin:"",tiktok:"" });
    setResponsiblePersonContact(b.responsiblePersonContact||emptyRpc());
    setSheetOpen(true);
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Brand name is required"); return; }
    const data = { name, address, industry, logoUrl, socialLinks, responsiblePerson, responsiblePersonContact, humanCount, aiCount,
      companyProfiles: companyProfiles.filter(d => d.name), owners: owners.filter(o => o.name.trim()),
      team: team.filter(t => t.name.trim()), products: products.filter(p => p.name.trim()),
      legalDocs: legalDocs.filter(d => d.name), financialDocs: financialDocs.filter(d => d.name),
      marketingPlans: marketingPlans.filter(m => m.title.trim()),
    };
    setSaving(true);
    try {
      if (editId) { await updateBrand(editId, data); toast.success(`${name} updated`); }
      else        { await addBrand(data);             toast.success(`${name} created`); }
      setSheetOpen(false); resetForm();
    } catch (err: any) { toast.error(err?.message||"Failed to save brand"); }
    finally { setSaving(false); }
  };

  const updOwner = useCallback((i: number, f: string, v: string) => setOwners(p => p.map((o,idx) => idx===i?{...o,[f]:v}:o)),[]);
  const updTeam  = useCallback((i: number, f: string, v: string) => setTeam(p => p.map((t,idx) => idx===i?{...t,[f]:v}:t)),[]);
  const updProd  = useCallback((i: number, f: string, v: string) => setProducts(p => p.map((pr,idx) => idx===i?{...pr,[f]:v}:pr)),[]);
  const updPlan  = useCallback((i: number, f: string, v: string) => setMarketingPlans(p => p.map((m,idx) => idx===i?{...m,[f]:v}:m)),[]);

  const detail       = useMemo(() => detailId ? brands.find(b => b.id===detailId) : null, [brands,detailId]);
  const deleteTarget = useMemo(() => deleteId ? brands.find(b => b.id===deleteId) : null, [brands,deleteId]);
  const filtered     = useMemo(() => { if (!q.trim()) return brands; const lq=q.toLowerCase(); return brands.filter(b=>b.name.toLowerCase().includes(lq)||(b.industry||"").toLowerCase().includes(lq)); }, [brands,q]);

  const SH = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-2 pb-1.5 border-b border-border mb-3 mt-5"><Icon className="w-3.5 h-3.5 text-primary"/><span className="font-display text-[11px] tracking-wider text-primary uppercase">{title}</span></div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground"/><Input placeholder="Search brands..." value={q} onChange={e=>setQ(e.target.value)} className="pl-9 h-8 text-xs"/></div>
        <ExportButton data={filtered as any[]} filename="brands" title="Brands"/>
        <Button size="sm" onClick={openNew} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Brand</Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><Skeleton key={i} className="h-44 rounded-lg"/>)}</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <Crown className="w-12 h-12 mx-auto text-primary/20"/>
          <p className="font-display text-primary">No brands yet</p>
          <p className="text-xs text-muted-foreground">Create your first brand to get started</p>
          <Button size="sm" onClick={openNew}><Plus className="w-3.5 h-3.5 mr-1"/>Add Brand</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(b => (
            <Card key={b.id} className="group hover:border-primary/50 transition-colors cursor-pointer" onClick={()=>setDetailId(b.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {b.logoUrl ? <img src={b.logoUrl} alt={b.name} className="w-10 h-10 rounded-lg object-contain bg-secondary shrink-0"/> : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Crown className="w-5 h-5 text-primary"/></div>}
                    <div className="min-w-0"><CardTitle className="text-sm font-display text-primary truncate">⚜ {b.name}</CardTitle>{b.industry&&<p className="text-[11px] text-muted-foreground truncate">{b.industry}</p>}</div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e=>e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="w-7 h-7" onClick={()=>openEdit(b)}><Pencil className="w-3.5 h-3.5"/></Button>
                    <Button size="icon" variant="ghost" className="w-7 h-7" onClick={()=>setDeleteId(b.id)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {b.address&&<div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3 h-3 shrink-0"/><span className="truncate">{b.address}</span></div>}
                {b.socialLinks?.website&&<div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Globe className="w-3 h-3 shrink-0"/><span className="truncate">{b.socialLinks.website}</span></div>}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {b.owners.filter(o=>o.name).length>0&&<Badge variant="outline" className="text-[10px]"><User className="w-2.5 h-2.5 mr-1"/>{b.owners.filter(o=>o.name).length} Owner{b.owners.filter(o=>o.name).length>1?"s":""}</Badge>}
                  {b.team.filter(t=>t.name).length>0&&<Badge variant="outline" className="text-[10px]"><Users className="w-2.5 h-2.5 mr-1"/>{b.team.filter(t=>t.name).length} Team</Badge>}
                  {b.products.filter(p=>p.name).length>0&&<Badge variant="outline" className="text-[10px]"><Package className="w-2.5 h-2.5 mr-1"/>{b.products.filter(p=>p.name).length} Products</Badge>}
                  {(b.legalDocs.length+b.financialDocs.length)>0&&<Badge variant="outline" className="text-[10px]"><FileText className="w-2.5 h-2.5 mr-1"/>{b.legalDocs.length+b.financialDocs.length} Docs</Badge>}
                </div>
                <p className="text-[10px] text-muted-foreground">Created {new Date(b.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={()=>setDetailId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          {detail&&(
            <>
              <DialogHeader><div className="flex items-center gap-3">{detail.logoUrl&&<img src={detail.logoUrl} alt={detail.name} className="w-10 h-10 rounded-lg object-contain"/>}<DialogTitle className="font-display text-primary">⚜ {detail.name.toUpperCase()}</DialogTitle></div></DialogHeader>
              <div>
                <SH icon={Building2} title="General Information"/>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {detail.address&&<div><p className="text-[10px] text-muted-foreground uppercase">Address</p><p>{detail.address}</p></div>}
                  {detail.industry&&<div><p className="text-[10px] text-muted-foreground uppercase">Industry</p><p>{detail.industry}</p></div>}
                  <div><p className="text-[10px] text-muted-foreground uppercase">Created</p><p>{new Date(detail.createdAt).toLocaleDateString()}</p></div>
                  {detail.responsiblePerson&&<div className="col-span-2"><p className="text-[10px] text-muted-foreground uppercase">Key Person</p><p>{detail.responsiblePerson}</p>{detail.responsiblePersonContact&&Object.values(detail.responsiblePersonContact).some(v=>v)&&(<div className="flex flex-wrap gap-3 mt-1">{detail.responsiblePersonContact.phone&&<span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3"/>{detail.responsiblePersonContact.phone}</span>}{detail.responsiblePersonContact.email&&<span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3"/>{detail.responsiblePersonContact.email}</span>}{detail.responsiblePersonContact.whatsapp&&<span className="flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="w-3 h-3"/>{detail.responsiblePersonContact.whatsapp}</span>}{detail.responsiblePersonContact.linkedin&&<a href={detail.responsiblePersonContact.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><Link2 className="w-3 h-3"/>LinkedIn</a>}{detail.responsiblePersonContact.twitter&&<a href={detail.responsiblePersonContact.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><Link2 className="w-3 h-3"/>Twitter</a>}</div>)}</div>}
                </div>
                {(detail.humanCount||detail.aiCount)?<StaffMetrics humanCount={detail.humanCount||0} aiCount={detail.aiCount||0}/>:null}
                {Object.values(detail.socialLinks||{}).some(v=>v)&&(<><SH icon={Globe} title="Social & Links"/><div className="flex flex-wrap gap-2">{Object.entries(detail.socialLinks).filter(([,v])=>v).map(([k,v])=><a key={k} href={v as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary rounded-md text-xs text-primary hover:bg-secondary/80 capitalize"><Link2 className="w-3 h-3"/>{k}</a>)}</div></>)}
                {detail.owners.filter(o=>o.name).length>0&&(<><SH icon={User} title="Owners"/><div className="space-y-2">{detail.owners.filter(o=>o.name).map(o=><div key={o.id} className="p-2.5 bg-secondary/30 rounded-md border border-border"><p className="font-semibold text-sm">{o.name}</p><div className="flex flex-wrap gap-3 mt-1">{o.phone&&<span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3"/>{o.phone}</span>}{o.email&&<span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3"/>{o.email}</span>}</div></div>)}</div></>)}
                {detail.team.filter(t=>t.name).length>0&&(<><SH icon={Users} title="Key Personnel"/><div className="space-y-2">{detail.team.filter(t=>t.name).map(t=><div key={t.id} className="p-2.5 bg-secondary/30 rounded-md border border-border"><p className="font-semibold text-sm">{t.name} <span className="font-normal text-muted-foreground text-xs">— {t.position}</span></p><div className="flex flex-wrap gap-3 mt-1">{t.phone&&<span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3"/>{t.phone}</span>}{t.email&&<span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3"/>{t.email}</span>}</div></div>)}</div></>)}
                {detail.products.filter(p=>p.name).length>0&&(<><SH icon={Package} title="Products"/><div className="space-y-2">{detail.products.filter(p=>p.name).map(p=><div key={p.id} className="p-2.5 bg-secondary/30 rounded-md border border-border"><p className="font-semibold text-sm">{p.name}</p>{p.description&&<p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}</div>)}</div></>)}
                {(detail.legalDocs.length>0||detail.financialDocs.length>0)&&(<><SH icon={FileText} title="Documents"/><div className="space-y-1.5">{detail.legalDocs.map(d=><div key={d.id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md border border-border text-sm"><FileText className="w-3.5 h-3.5 text-primary/60 shrink-0"/><span>{d.name}</span><Badge variant="outline" className="text-[9px] ml-auto">Legal</Badge></div>)}{detail.financialDocs.map(d=><div key={d.id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md border border-border text-sm"><DollarSign className="w-3.5 h-3.5 text-emerald-400/60 shrink-0"/><span>{d.name}</span><Badge variant="outline" className="text-[9px] ml-auto">Financial</Badge></div>)}</div></>)}
                {detail.marketingPlans.filter(m=>m.title).length>0&&(<><SH icon={Megaphone} title="Marketing Plans"/><div className="space-y-2">{detail.marketingPlans.filter(m=>m.title).map(m=><div key={m.id} className="p-2.5 bg-secondary/30 rounded-md border border-border"><p className="font-semibold text-sm">{m.title}</p>{m.description&&<p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}</div>)}</div></>)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="bg-card border border-border rounded-lg p-3"><p className="font-display text-xs tracking-wider text-primary mb-2">ACTIVITY</p><ActivityTimeline table="brands" recordId={detail.id}/></div>
                  <div className="bg-card border border-border rounded-lg p-3"><Comments entityType="brand" entityId={detail.id}/></div>
                </div>
              </div>
              <DialogFooter className="pt-2 gap-2">
                <Button variant="outline" size="sm" onClick={()=>setDetailId(null)}>Close</Button>
                <Button size="sm" className="gap-1" onClick={()=>{setDetailId(null);openEdit(detail);}}><Pencil className="w-3.5 h-3.5"/>Edit Brand</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={()=>setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-destructive">Delete Brand?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Permanently delete <strong className="text-foreground">{deleteTarget?.name}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async()=>{if(deleteId){await deleteBrand(deleteId);toast.success("Brand deleted");setDeleteId(null);}}}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 shrink-0">
            <SheetHeader><SheetTitle className="font-display text-primary">⚜ {editId?"EDIT BRAND":"ADD NEW BRAND"}</SheetTitle></SheetHeader>
          </div>
          <div className="flex-1 overflow-auto px-6 pb-6">
            <SH icon={Building2} title="General Information"/>
            <div className="space-y-3">
              <div><Label className="text-xs">Brand Name *</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter brand name" className="mt-1 bg-secondary border-border"/></div>
              <div>
                <Label className="text-xs">Brand Logo</Label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-md cursor-pointer hover:border-primary text-xs text-muted-foreground">
                    <Upload className="w-3.5 h-3.5"/>Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={async e=>{
                      const f=e.target.files?.[0]; if(!f) return;
                      try {
                        const {supabase}=await import("@/integrations/supabase/client");
                        const {data:u}=await supabase.auth.getUser(); if(!u.user) throw new Error("Not authenticated");
                        const path=`${u.user.id}/brand-${Date.now()}-${f.name}`;
                        const {error}=await supabase.storage.from("avatars").upload(path,f,{upsert:true});
                        if(error) throw error;
                        const {data}=supabase.storage.from("avatars").getPublicUrl(path);
                        setLogoUrl(data.publicUrl);
                      } catch(err:any){toast.error(err.message||"Upload failed");}
                    }}/>
                  </label>
                  {logoUrl&&<img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-md object-cover border border-border"/>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">Business Address</Label><Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Address" className="mt-1 bg-secondary border-border"/></div>
                <div><Label className="text-xs">Industry</Label><Input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. Jewelry, Tech" className="mt-1 bg-secondary border-border"/></div>
                <div><Label className="text-xs">Key Person</Label><Input value={responsiblePerson} onChange={e=>setResponsiblePerson(e.target.value)} placeholder="Name" className="mt-1 bg-secondary border-border"/></div>
              </div>
              <div className="mt-3 p-3 bg-secondary/30 rounded-md border border-border space-y-2">
                <p className="text-[11px] text-muted-foreground font-medium">Key Person Contact</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Phone</Label><Input value={responsiblePersonContact.phone} onChange={e=>setResponsiblePersonContact(p=>({...p,phone:e.target.value}))} placeholder="+20…" className="mt-1 bg-secondary border-border text-xs"/></div>
                  <div><Label className="text-xs">Email</Label><Input value={responsiblePersonContact.email} onChange={e=>setResponsiblePersonContact(p=>({...p,email:e.target.value}))} placeholder="email@…" className="mt-1 bg-secondary border-border text-xs"/></div>
                  <div><Label className="text-xs">WhatsApp</Label><Input value={responsiblePersonContact.whatsapp} onChange={e=>setResponsiblePersonContact(p=>({...p,whatsapp:e.target.value}))} placeholder="+20…" className="mt-1 bg-secondary border-border text-xs"/></div>
                  <div><Label className="text-xs">Twitter</Label><Input value={responsiblePersonContact.twitter} onChange={e=>setResponsiblePersonContact(p=>({...p,twitter:e.target.value}))} placeholder="@handle or URL" className="mt-1 bg-secondary border-border text-xs"/></div>
                  <div className="col-span-2"><Label className="text-xs">LinkedIn</Label><Input value={responsiblePersonContact.linkedin} onChange={e=>setResponsiblePersonContact(p=>({...p,linkedin:e.target.value}))} placeholder="linkedin.com/in/…" className="mt-1 bg-secondary border-border text-xs"/></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Human Staff</Label><Input type="number" min={0} value={humanCount} onChange={e=>setHumanCount(+e.target.value)} className="mt-1 bg-secondary border-border"/></div>
                <div><Label className="text-xs">AI Agents</Label><Input type="number" min={0} value={aiCount} onChange={e=>setAiCount(+e.target.value)} className="mt-1 bg-secondary border-border"/></div>
              </div>
            </div>
            <SH icon={Globe} title="Social Media & Contact"/>
            <div className="grid grid-cols-2 gap-3">
              {(["website","facebook","instagram","twitter","linkedin","tiktok"] as const).map(k=>(
                <div key={k}><Label className="text-xs capitalize">{k}</Label><Input value={socialLinks[k]} onChange={e=>setSocialLinks(p=>({...p,[k]:e.target.value}))} placeholder={k==="website"?"https://...":"@handle"} className="mt-1 bg-secondary border-border text-xs"/></div>
              ))}
            </div>
            <SH icon={User} title="Owners"/>
            <div className="space-y-3">
              {owners.map((o,i)=>(
                <div key={o.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-2">
                  <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Owner #{i+1}</span>{owners.length>1&&<button type="button" onClick={()=>setOwners(p=>p.filter((_,idx)=>idx!==i))} className="text-destructive hover:bg-destructive/10 rounded p-1"><X className="w-3.5 h-3.5"/></button>}</div>
                  <div className="grid grid-cols-2 gap-2">{(["name","phone","email","whatsapp"] as const).map(f=><div key={f}><Label className="text-xs capitalize">{f}</Label><Input value={o[f]} onChange={e=>updOwner(i,f,e.target.value)} className="mt-1 bg-secondary border-border text-xs"/></div>)}</div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={()=>setOwners(p=>[...p,{id:crypto.randomUUID(),name:"",phone:"",email:"",whatsapp:""}])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Owner</Button>
            </div>
            <SH icon={Users} title="Key Personnel / Team"/>
            <div className="space-y-3">
              {team.map((t,i)=>(
                <div key={t.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-2">
                  <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Member #{i+1}</span><button type="button" onClick={()=>setTeam(p=>p.filter((_,idx)=>idx!==i))} className="text-destructive hover:bg-destructive/10 rounded p-1"><X className="w-3.5 h-3.5"/></button></div>
                  <div className="grid grid-cols-2 gap-2">{(["name","position","phone","email","whatsapp"] as const).map(f=><div key={f}><Label className="text-xs capitalize">{f}</Label><Input value={t[f]} onChange={e=>updTeam(i,f,e.target.value)} className="mt-1 bg-secondary border-border text-xs"/></div>)}</div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={()=>setTeam(p=>[...p,{id:crypto.randomUUID(),name:"",position:"",phone:"",email:"",whatsapp:""}])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Member</Button>
            </div>
            <SH icon={Package} title="Products & Services"/>
            <div className="space-y-3">
              {products.map((p,i)=>(
                <div key={p.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-2">
                  <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Product #{i+1}</span>{products.length>1&&<button type="button" onClick={()=>setProducts(prev=>prev.filter((_,idx)=>idx!==i))} className="text-destructive hover:bg-destructive/10 rounded p-1"><X className="w-3.5 h-3.5"/></button>}</div>
                  <div><Label className="text-xs">Name</Label><Input value={p.name} onChange={e=>updProd(i,"name",e.target.value)} className="mt-1 bg-secondary border-border text-xs"/></div>
                  <div><Label className="text-xs">Description</Label><Textarea value={p.description} onChange={e=>updProd(i,"description",e.target.value)} className="mt-1 bg-secondary border-border text-xs min-h-[56px]"/></div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={()=>setProducts(p=>[...p,{id:crypto.randomUUID(),name:"",description:""}])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Product</Button>
            </div>
            <SH icon={FileText} title="Legal Documents"/>
            <div className="space-y-2">
              {legalDocs.map((d,i)=>(
                <div key={d.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md border border-border">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0"/>
                  <span className="flex-1 text-sm truncate">{d.name||"No file"}</span>
                  <label className="cursor-pointer px-2 py-0.5 text-xs text-primary hover:underline">Upload<input type="file" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)setLegalDocs(p=>p.map((doc,idx)=>idx===i?{...doc,name:f.name}:doc));}}/></label>
                  <button onClick={()=>setLegalDocs(p=>p.filter((_,idx)=>idx!==i))} className="text-destructive p-0.5 rounded hover:bg-destructive/10"><X className="w-3 h-3"/></button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={()=>setLegalDocs(p=>[...p,{id:crypto.randomUUID(),name:""}])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Legal Doc</Button>
            </div>
            <SH icon={DollarSign} title="Financial Documents"/>
            <div className="space-y-2">
              {financialDocs.map((d,i)=>(
                <div key={d.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md border border-border">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400/60 shrink-0"/>
                  <span className="flex-1 text-sm truncate">{d.name||"No file"}</span>
                  <label className="cursor-pointer px-2 py-0.5 text-xs text-primary hover:underline">Upload<input type="file" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)setFinancialDocs(p=>p.map((doc,idx)=>idx===i?{...doc,name:f.name}:doc));}}/></label>
                  <button onClick={()=>setFinancialDocs(p=>p.filter((_,idx)=>idx!==i))} className="text-destructive p-0.5 rounded hover:bg-destructive/10"><X className="w-3 h-3"/></button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={()=>setFinancialDocs(p=>[...p,{id:crypto.randomUUID(),name:""}])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Financial Doc</Button>
            </div>
            <SH icon={Megaphone} title="Marketing Plans"/>
            <div className="space-y-3">
              {marketingPlans.map((m,i)=>(
                <div key={m.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-2">
                  <div className="flex items-center justify-between"><span className="text-[11px] text-muted-foreground">Plan #{i+1}</span><button type="button" onClick={()=>setMarketingPlans(p=>p.filter((_,idx)=>idx!==i))} className="text-destructive hover:bg-destructive/10 rounded p-1"><X className="w-3.5 h-3.5"/></button></div>
                  <div><Label className="text-xs">Title</Label><Input value={m.title} onChange={e=>updPlan(i,"title",e.target.value)} className="mt-1 bg-secondary border-border text-xs"/></div>
                  <div><Label className="text-xs">Description</Label><Textarea value={m.description} onChange={e=>updPlan(i,"description",e.target.value)} className="mt-1 bg-secondary border-border text-xs min-h-[56px]"/></div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={()=>setMarketingPlans(p=>[...p,{id:crypto.randomUUID(),title:"",description:""}])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5"/>Add Plan</Button>
            </div>
          </div>
          <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={()=>setSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2 font-display text-xs"><Save className="w-4 h-4"/>{saving?"SAVING...":editId?"SAVE CHANGES":"CREATE BRAND"}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ─── UserManagementTab ─────────────────────────────────────── */
function UserManagementTab({ activeBrandId, brands }: { activeBrandId: string | null; brands: any[] }) {
  const brandId = activeBrandId ?? (brands[0]?.id ?? "");
  const ROLES = ["admin","manager","staff","viewer","agent"];
  const SECTORS = ["brands","projects","services","employees","customers","branches","affiliates","success_partners","digital_inheritance","legendary_journey","inventory","materials","logistics","legal","finance","marketing","ai_agents","settings","reports","payments","workflows","audit_logs"];
  const RC: Record<string,string> = { admin:"bg-red-500/20 text-red-400 border-red-500/30", manager:"bg-orange-500/20 text-orange-400 border-orange-500/30", staff:"bg-blue-500/20 text-blue-400 border-blue-500/30", viewer:"bg-gray-500/20 text-gray-300 border-gray-500/30", agent:"bg-purple-500/20 text-purple-400 border-purple-500/30" };
  const emptyRP = () => ({ role:"staff", resource_type:"brands", can_read:true, can_create:false, can_update:false, can_delete:false, can_export:false, can_approve:false });
  const emptySP = () => ({ target_user_id:"", sector:"brands", can_read:true, can_write:false, can_delete:false, can_approve:false, can_export:false, ai_managed:false, ai_agent_codes:"", notes:"" });
  const emptyAP = () => ({ agent_code:"", allowed_tables:"", allowed_actions:"read", max_daily_ops:1000, max_spend_eur:0, can_escalate:true, requires_approval:false, sandbox_mode:false, notes:"" });
  const Dot = ({ v }:{ v:boolean }) => <span className={`inline-block w-2.5 h-2.5 rounded-full ${v?"bg-emerald-500":"bg-secondary"}`}/>;

  const [umTab, setUmTab] = useState("members");
  const [search, setSearch] = useState("");
  const [umLoading, setUmLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [invOpen, setInvOpen] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("member");
  const [rolePerms, setRolePerms] = useState<any[]>([]);
  const [rpOpen, setRpOpen] = useState(false);
  const [rpForm, setRpForm] = useState<any>(emptyRP());
  const [rpId, setRpId] = useState<string|null>(null);
  const [sectorPerms, setSectorPerms] = useState<any[]>([]);
  const [spOpen, setSpOpen] = useState(false);
  const [spForm, setSpForm] = useState<any>(emptySP());
  const [spId, setSpId] = useState<string|null>(null);
  const [agentPerms, setAgentPerms] = useState<any[]>([]);
  const [apOpen, setApOpen] = useState(false);
  const [apForm, setApForm] = useState<any>(emptyAP());
  const [apId, setApId] = useState<string|null>(null);

  const loadAll = useCallback(async () => {
    if (!brandId) return;
    setUmLoading(true);
    try {
      const [m,i,rp,sp,ap] = await Promise.all([
        teamApi.members(brandId).catch(()=>[]),
        teamApi.invitations(brandId).catch(()=>[]),
        extApi.list("role_permissions",{eq:{brand_id:brandId}}).catch(()=>[]),
        extApi.list("sector_permissions",{eq:{brand_id:brandId}}).catch(()=>[]),
        extApi.list("agent_permissions",{eq:{brand_id:brandId}}).catch(()=>[]),
      ]);
      setMembers(m as any[]); setInvites(i as any[]);
      setRolePerms(rp as any[]); setSectorPerms(sp as any[]); setAgentPerms(ap as any[]);
    } finally { setUmLoading(false); }
  }, [brandId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const sendInvite = async () => {
    if (!invEmail.trim()) return toast.error("Email required");
    try {
      const inv:any = await teamApi.invite(brandId, invEmail.trim(), invRole);
      await navigator.clipboard.writeText(`${location.origin}/accept-invite/${inv.token}`).catch(()=>{});
      toast.success("Invite sent — link copied"); setInvEmail(""); setInvOpen(false); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const saveRP = async () => {
    if (!rpForm.resource_type) return toast.error("Resource required");
    try {
      if (rpId) await extApi.update("role_permissions",rpId,{...rpForm,brand_id:brandId});
      else await extApi.create("role_permissions",{...rpForm,brand_id:brandId});
      toast.success("Saved"); setRpOpen(false); setRpId(null); setRpForm(emptyRP()); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const saveSP = async () => {
    if (!spForm.sector) return toast.error("Sector required");
    const pl = {...spForm,brand_id:brandId,ai_agent_codes:spForm.ai_agent_codes?spForm.ai_agent_codes.split(",").map((s:string)=>s.trim()).filter(Boolean):[]};
    try {
      if (spId) await extApi.update("sector_permissions",spId,pl);
      else await extApi.create("sector_permissions",pl);
      toast.success("Saved"); setSpOpen(false); setSpId(null); setSpForm(emptySP()); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const saveAP = async () => {
    if (!apForm.agent_code) return toast.error("Agent code required");
    const pl = {...apForm,brand_id:brandId,allowed_tables:apForm.allowed_tables?apForm.allowed_tables.split(",").map((s:string)=>s.trim()).filter(Boolean):[],allowed_actions:apForm.allowed_actions?apForm.allowed_actions.split(",").map((s:string)=>s.trim()).filter(Boolean):["read"]};
    try {
      if (apId) await extApi.update("agent_permissions",apId,pl);
      else await extApi.create("agent_permissions",pl);
      toast.success("Saved"); setApOpen(false); setApId(null); setApForm(emptyAP()); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const seedDefaults = async () => {
    try {
      const {data:{user}} = await supabase.auth.getUser();
      const {error} = await supabase.rpc("seed_default_role_permissions" as any,{p_brand_id:brandId,p_user_id:user?.id});
      if (error) throw error;
      toast.success("Default permissions seeded"); loadAll();
    } catch(e:any) { toast.error(e.message); }
  };

  const UM_TABS = [
    {key:"members",    label:"Members",      icon:Users,  cnt:members.length},
    {key:"invitations",label:"Invitations",  icon:Mail,   cnt:invites.filter((i:any)=>!i.accepted_at).length},
    {key:"roles",      label:"Role Perms",   icon:Shield, cnt:rolePerms.length},
    {key:"sectors",    label:"Sector Perms", icon:Layers, cnt:sectorPerms.length},
    {key:"agentsP",    label:"Agent Perms",  icon:Bot,    cnt:agentPerms.length},
  ];

  const frp = rolePerms.filter(r=>!search||r.role?.includes(search)||r.resource_type?.includes(search));

  if (!brandId) return (
    <Card><div className="p-10 text-center text-sm text-muted-foreground">Select a brand from the filter above to manage its users and permissions.</div></Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground font-display tracking-wide">MANAGING: <span className="text-primary">{brands.find((b:any)=>b.id===brandId)?.name??brandId}</span></p>
        <Button variant="outline" size="sm" onClick={loadAll} disabled={umLoading}><RefreshCw className={`w-4 h-4 ${umLoading?"animate-spin":""}`}/></Button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {UM_TABS.map(t=>(
          <button key={t.key} onClick={()=>setUmTab(t.key)} className={`p-3 rounded-lg border text-center transition-all ${umTab===t.key?"bg-primary/10 border-primary/40 text-primary":"bg-card border-border text-muted-foreground hover:bg-secondary/50"}`}>
            <t.icon className="w-4 h-4 mx-auto mb-1"/>
            <p className="text-[10px] font-display tracking-wide hidden sm:block">{t.label}</p>
            <p className="font-display text-lg">{t.cnt}</p>
          </button>
        ))}
      </div>

      <Tabs value={umTab} onValueChange={setUmTab}>
        <TabsList className="w-full grid grid-cols-5 h-auto">
          {UM_TABS.map(t=>(
            <TabsTrigger key={t.key} value={t.key} className="text-[11px] py-2 flex items-center gap-1">
              <t.icon className="w-3 h-3"/><span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="members">
          <Card>
            <div className="p-3 border-b border-border flex justify-between items-center">
              <p className="text-sm font-medium">{members.length} member(s)</p>
              <div className="flex gap-2"><ExportButton data={members} filename="members" title="Members"/><Button size="sm" onClick={()=>setInvOpen(true)}><Plus className="w-4 h-4 mr-1"/>Invite</Button></div>
            </div>
            {members.length===0?<p className="p-10 text-center text-sm text-muted-foreground">No members yet.</p>:(
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-xs"><tr><th className="text-left p-3">User ID</th><th className="text-left p-3">Role</th><th className="text-left p-3">Joined</th><th className="p-3 w-12"/></tr></thead>
                  <tbody>
                    {members.map((m:any)=>(
                      <tr key={m.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="p-3 font-mono text-xs text-muted-foreground">{m.user_id?.slice(0,16)}…</td>
                        <td className="p-3"><Badge className={`text-[10px] border ${RC[m.role]||"bg-muted border-border"}`}>{m.role}</Badge></td>
                        <td className="p-3 text-xs text-muted-foreground">{m.created_at?new Date(m.created_at).toLocaleDateString():"—"}</td>
                        <td className="p-3"><Button size="sm" variant="ghost" onClick={async()=>{if(!confirm("Remove member?"))return;await teamApi.removeMember(m.id);toast.success("Removed");loadAll();}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <div className="p-3 border-b border-border flex justify-between items-center">
              <p className="text-sm font-medium">Pending: {invites.filter((i:any)=>!i.accepted_at).length} / Total: {invites.length}</p>
              <Button size="sm" onClick={()=>setInvOpen(true)}><Plus className="w-4 h-4 mr-1"/>New Invite</Button>
            </div>
            {invites.length===0?<p className="p-10 text-center text-sm text-muted-foreground">No invitations sent yet.</p>:(
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-xs"><tr><th className="text-left p-3">Email</th><th className="text-left p-3">Role</th><th className="text-left p-3">Status</th><th className="text-left p-3">Expires</th><th className="p-3 w-24"/></tr></thead>
                  <tbody>
                    {invites.map((i:any)=>(
                      <tr key={i.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="p-3">{i.email}</td>
                        <td className="p-3"><Badge className={`text-[10px] border ${RC[i.role]||"bg-muted border-border"}`}>{i.role}</Badge></td>
                        <td className="p-3"><Badge variant={i.accepted_at?"default":"secondary"} className="text-[10px]">{i.accepted_at?"✓ Accepted":"⏳ Pending"}</Badge></td>
                        <td className="p-3 text-xs text-muted-foreground">{i.expires_at?new Date(i.expires_at).toLocaleDateString():"—"}</td>
                        <td className="p-3 flex gap-1">
                          {!i.accepted_at&&<Button size="sm" variant="ghost" onClick={()=>{navigator.clipboard.writeText(`${location.origin}/accept-invite/${i.token}`);toast.success("Link copied");}}><Copy className="w-3.5 h-3.5"/></Button>}
                          <Button size="sm" variant="ghost" onClick={async()=>{await teamApi.revoke(i.id);toast.success("Revoked");loadAll();}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <div className="relative"><Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground"/><Input placeholder="Filter role or resource…" value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 w-64"/></div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={seedDefaults}><UserCheck className="w-4 h-4 mr-1"/>Seed Defaults</Button>
                <ExportButton data={rolePerms} filename="role_permissions" title="Role Permissions"/>
                <Button size="sm" onClick={()=>{setRpId(null);setRpForm(emptyRP());setRpOpen(true);}}><Plus className="w-4 h-4 mr-1"/>Add Rule</Button>
              </div>
            </div>
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs"><tr><th className="text-left p-3">Role</th><th className="text-left p-3">Resource</th><th className="p-3 text-center">Read</th><th className="p-3 text-center">Create</th><th className="p-3 text-center">Update</th><th className="p-3 text-center">Delete</th><th className="p-3 text-center">Export</th><th className="p-3 text-center">Approve</th><th className="p-3 w-20"/></tr></thead>
                <tbody>
                  {frp.length===0?<tr><td colSpan={9} className="p-10 text-center text-muted-foreground text-sm">No rules yet. Click "Seed Defaults" to auto-populate.</td></tr>:frp.map((r:any)=>(
                    <tr key={r.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="p-3"><Badge className={`text-[10px] border ${RC[r.role]||"bg-muted border-border"}`}>{r.role}</Badge></td>
                      <td className="p-3 text-xs font-mono">{r.resource_type}</td>
                      <td className="p-3 text-center"><Dot v={r.can_read}/></td>
                      <td className="p-3 text-center"><Dot v={r.can_create}/></td>
                      <td className="p-3 text-center"><Dot v={r.can_update}/></td>
                      <td className="p-3 text-center"><Dot v={r.can_delete}/></td>
                      <td className="p-3 text-center"><Dot v={r.can_export}/></td>
                      <td className="p-3 text-center"><Dot v={r.can_approve}/></td>
                      <td className="p-3 flex gap-1">
                        <Button size="sm" variant="ghost" onClick={()=>{setRpId(r.id);setRpForm({role:r.role,resource_type:r.resource_type,can_read:r.can_read,can_create:r.can_create,can_update:r.can_update,can_delete:r.can_delete,can_export:r.can_export,can_approve:r.can_approve});setRpOpen(true);}}><Edit className="w-3.5 h-3.5"/></Button>
                        <Button size="sm" variant="ghost" onClick={async()=>{await extApi.remove("role_permissions",r.id);toast.success("Deleted");loadAll();}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sectors">
          <div className="space-y-3">
            <div className="flex justify-end gap-2">
              <ExportButton data={sectorPerms} filename="sector_permissions" title="Sector Permissions"/>
              <Button size="sm" onClick={()=>{setSpId(null);setSpForm(emptySP());setSpOpen(true);}}><Plus className="w-4 h-4 mr-1"/>Add Sector Rule</Button>
            </div>
            {sectorPerms.length===0?<Card className="p-10 text-center text-sm text-muted-foreground">No sector permissions. Grant per-user, per-sector access here.</Card>:(
              <div className="space-y-2">
                {sectorPerms.map((s:any)=>(
                  <Card key={s.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/30">{s.sector}</Badge>
                          {s.ai_managed&&<Badge className="text-[10px] bg-purple-500/20 text-purple-400">AI Managed</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{s.target_user_id||"—"}</p>
                        <div className="flex gap-2 flex-wrap text-[10px]">
                          {s.can_read&&<span className="text-emerald-400">✓ Read</span>}
                          {s.can_write&&<span className="text-blue-400">✓ Write</span>}
                          {s.can_delete&&<span className="text-red-400">✓ Delete</span>}
                          {s.can_approve&&<span className="text-yellow-400">✓ Approve</span>}
                          {s.can_export&&<span className="text-cyan-400">✓ Export</span>}
                        </div>
                        {Array.isArray(s.ai_agent_codes)&&s.ai_agent_codes.length>0&&<p className="text-[10px] text-purple-400">Agents: {s.ai_agent_codes.join(", ")}</p>}
                        {s.notes&&<p className="text-xs text-muted-foreground">{s.notes}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={()=>{setSpId(s.id);setSpForm({...s,ai_agent_codes:Array.isArray(s.ai_agent_codes)?s.ai_agent_codes.join(", "):""});setSpOpen(true);}}><Edit className="w-3.5 h-3.5"/></Button>
                        <Button size="sm" variant="ghost" onClick={async()=>{await extApi.remove("sector_permissions",s.id);toast.success("Deleted");loadAll();}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="agentsP">
          <div className="space-y-3">
            <div className="flex justify-end gap-2">
              <ExportButton data={agentPerms} filename="agent_permissions" title="Agent Permissions"/>
              <Button size="sm" onClick={()=>{setApId(null);setApForm(emptyAP());setApOpen(true);}}><Plus className="w-4 h-4 mr-1"/>Add Agent Rule</Button>
            </div>
            {agentPerms.length===0?<Card className="p-10 text-center text-sm text-muted-foreground">No agent permissions.</Card>:(
              <div className="space-y-2">
                {agentPerms.map((a:any)=>(
                  <Card key={a.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Bot className="w-4 h-4 text-purple-400"/>
                          <span className="font-display text-sm text-primary">{a.agent_code}</span>
                          {a.sandbox_mode&&<Badge className="text-[10px] bg-yellow-500/20 text-yellow-400">Sandbox</Badge>}
                          {a.requires_approval&&<Badge className="text-[10px] bg-orange-500/20 text-orange-400">Needs Approval</Badge>}
                          {a.can_escalate&&<Badge className="text-[10px] bg-emerald-500/20 text-emerald-400">Can Escalate</Badge>}
                        </div>
                        <div className="flex gap-3 text-[10px] text-muted-foreground flex-wrap">
                          {a.max_daily_ops&&<span>Max ops/day: <strong>{a.max_daily_ops}</strong></span>}
                          {!!a.max_spend_eur&&<span>Spend cap: <strong>{a.max_spend_eur} EUR</strong></span>}
                        </div>
                        {Array.isArray(a.allowed_actions)&&<p className="text-[10px] text-primary">Actions: {a.allowed_actions.join(", ")}</p>}
                        {Array.isArray(a.allowed_tables)&&a.allowed_tables.length>0&&<p className="text-[10px] text-muted-foreground">Tables: {a.allowed_tables.join(", ")}</p>}
                        {a.notes&&<p className="text-xs text-muted-foreground">{a.notes}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={()=>{setApId(a.id);setApForm({...a,allowed_tables:Array.isArray(a.allowed_tables)?a.allowed_tables.join(", "):"",allowed_actions:Array.isArray(a.allowed_actions)?a.allowed_actions.join(", "):"read"});setApOpen(true);}}><Edit className="w-3.5 h-3.5"/></Button>
                        <Button size="sm" variant="ghost" onClick={async()=>{await extApi.remove("agent_permissions",a.id);toast.success("Deleted");loadAll();}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={invOpen} onOpenChange={setInvOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Invite User to Brand</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Email</Label><Input type="email" placeholder="user@example.com" value={invEmail} onChange={e=>setInvEmail(e.target.value)} className="mt-1 bg-secondary border-border"/></div>
            <div><Label>Role</Label>
              <Select value={invRole} onValueChange={setInvRole}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue/></SelectTrigger>
                <SelectContent>{ROLES.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setInvOpen(false)}>Cancel</Button><Button onClick={sendInvite}><Mail className="w-4 h-4 mr-1"/>Send Invite</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Perm Dialog */}
      <Dialog open={rpOpen} onOpenChange={setRpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{rpId?"Edit":"Add"} Role Permission</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Role</Label>
              <Select value={rpForm.role} onValueChange={v=>setRpForm((p:any)=>({...p,role:v}))}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue/></SelectTrigger>
                <SelectContent>{ROLES.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Resource Type</Label>
              <Select value={rpForm.resource_type} onValueChange={v=>setRpForm((p:any)=>({...p,resource_type:v}))}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue/></SelectTrigger>
                <SelectContent>{SECTORS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["can_read","can_create","can_update","can_delete","can_export","can_approve"] as const).map(k=>(
                <label key={k} className="flex items-center gap-2 text-xs cursor-pointer">
                  <Switch checked={!!rpForm[k]} onCheckedChange={v=>setRpForm((p:any)=>({...p,[k]:v}))}/>{k.replace("can_","")}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setRpOpen(false)}>Cancel</Button><Button onClick={saveRP}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sector Perm Dialog */}
      <Dialog open={spOpen} onOpenChange={setSpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{spId?"Edit":"Add"} Sector Permission</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Sector</Label>
              <Select value={spForm.sector} onValueChange={v=>setSpForm((p:any)=>({...p,sector:v}))}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue/></SelectTrigger>
                <SelectContent>{SECTORS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Target User ID</Label><Input value={spForm.target_user_id||""} onChange={e=>setSpForm((p:any)=>({...p,target_user_id:e.target.value}))} className="mt-1 bg-secondary border-border text-xs" placeholder="user UUID"/></div>
            <div className="grid grid-cols-3 gap-3">
              {(["can_read","can_write","can_delete","can_approve","can_export","ai_managed"] as const).map(k=>(
                <label key={k} className="flex items-center gap-2 text-xs cursor-pointer">
                  <Switch checked={!!spForm[k]} onCheckedChange={v=>setSpForm((p:any)=>({...p,[k]:v}))}/>{k.replace("can_","").replace("ai_managed","AI")}
                </label>
              ))}
            </div>
            <div><Label className="text-xs">AI Agent Codes (comma-sep)</Label><Input value={spForm.ai_agent_codes||""} onChange={e=>setSpForm((p:any)=>({...p,ai_agent_codes:e.target.value}))} className="mt-1 bg-secondary border-border text-xs" placeholder="AG-001, AG-002"/></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={spForm.notes||""} onChange={e=>setSpForm((p:any)=>({...p,notes:e.target.value}))} className="mt-1 bg-secondary border-border text-xs" rows={2}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setSpOpen(false)}>Cancel</Button><Button onClick={saveSP}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Perm Dialog */}
      <Dialog open={apOpen} onOpenChange={setApOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{apId?"Edit":"Add"} Agent Permission</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Agent Code *</Label><Input value={apForm.agent_code||""} onChange={e=>setApForm((p:any)=>({...p,agent_code:e.target.value}))} className="mt-1 bg-secondary border-border text-xs" placeholder="AG-001"/></div>
            <div><Label className="text-xs">Allowed Tables (comma-sep)</Label><Input value={apForm.allowed_tables||""} onChange={e=>setApForm((p:any)=>({...p,allowed_tables:e.target.value}))} className="mt-1 bg-secondary border-border text-xs"/></div>
            <div><Label className="text-xs">Allowed Actions (comma-sep)</Label><Input value={apForm.allowed_actions||""} onChange={e=>setApForm((p:any)=>({...p,allowed_actions:e.target.value}))} className="mt-1 bg-secondary border-border text-xs" placeholder="read, create"/></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Max Daily Ops</Label><Input type="number" value={apForm.max_daily_ops||1000} onChange={e=>setApForm((p:any)=>({...p,max_daily_ops:Number(e.target.value)}))} className="mt-1 bg-secondary border-border text-xs"/></div>
              <div><Label className="text-xs">Max Spend (EUR)</Label><Input type="number" value={apForm.max_spend_eur||0} onChange={e=>setApForm((p:any)=>({...p,max_spend_eur:Number(e.target.value)}))} className="mt-1 bg-secondary border-border text-xs"/></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["can_escalate","requires_approval","sandbox_mode"] as const).map(k=>(
                <label key={k} className="flex items-center gap-2 text-xs cursor-pointer">
                  <Switch checked={!!apForm[k]} onCheckedChange={v=>setApForm((p:any)=>({...p,[k]:v}))}/>{k.replace(/_/g," ")}
                </label>
              ))}
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={apForm.notes||""} onChange={e=>setApForm((p:any)=>({...p,notes:e.target.value}))} className="mt-1 bg-secondary border-border text-xs" rows={2}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setApOpen(false)}>Cancel</Button><Button onClick={saveAP}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── WorkflowMapTab ────────────────────────────────────────── */
function WorkflowMapTab({ activeBrandId }: { activeBrandId: string | null }) {
  const DEP_TYPES = ["sequential","parallel","conditional","trigger"];
  const ACTION_TYPES = ["task","decision","parallel","wait","notify","webhook"];
  const emptyEdge = () => ({ from_agent_code:"", to_agent_code:"", dependency_type:"sequential", description:"", workflow_name:"", workflow_version:"1.0", is_active:true, priority:1, condition_expr:"", timeout_seconds:"", retry_count:0 });
  const emptyStep = () => ({ workflow_name:"", step_order:1, step_label:"", agent_code:"", action_type:"task", condition_expr:"", timeout_seconds:"", retry_count:0, is_active:true, notes:"" });

  const [wfTab, setWfTab] = useState<"edges"|"steps"|"executions">("edges");
  const [edges, setEdges] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [wfLoading, setWfLoading] = useState(true);
  const [edgeForm, setEdgeForm] = useState<any>(emptyEdge());
  const [stepForm, setStepForm] = useState<any>(emptyStep());
  const [showEdgeForm, setShowEdgeForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [editEdgeId, setEditEdgeId] = useState<string|null>(null);
  const [editStepId, setEditStepId] = useState<string|null>(null);
  const [filterWorkflow, setFilterWorkflow] = useState("all");

  const load = useCallback(async () => {
    setWfLoading(true);
    try {
      const [e,s,ex] = await Promise.all([
        extApi.list("workflow_map").catch(()=>[]),
        extApi.list("workflow_steps").catch(()=>[]),
        extApi.list("workflow_executions").catch(()=>[]),
      ]);
      setEdges(e as any[]); setSteps(s as any[]); setExecutions(ex as any[]);
    } finally { setWfLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const workflowNames = Array.from(new Set([...edges.map(e=>e.workflow_name),...steps.map(s=>s.workflow_name)].filter(Boolean))) as string[];
  const filteredEdges = filterWorkflow==="all"?edges:edges.filter(e=>e.workflow_name===filterWorkflow);
  const filteredSteps = filterWorkflow==="all"?steps:steps.filter(s=>s.workflow_name===filterWorkflow);

  const saveEdge = async () => {
    if (!edgeForm.from_agent_code||!edgeForm.to_agent_code) { toast.error("From/To agents required"); return; }
    const payload = {...edgeForm,timeout_seconds:edgeForm.timeout_seconds?Number(edgeForm.timeout_seconds):null};
    try {
      if (editEdgeId) { await extApi.update("workflow_map",editEdgeId,payload); toast.success("Updated"); }
      else { await extApi.create("workflow_map",payload); toast.success("Edge added"); }
      setShowEdgeForm(false); setEdgeForm(emptyEdge()); setEditEdgeId(null); load();
    } catch(ex:any) { toast.error(ex.message); }
  };

  const saveStep = async () => {
    if (!stepForm.workflow_name||!stepForm.step_label) { toast.error("Workflow name & label required"); return; }
    const payload = {...stepForm,step_order:Number(stepForm.step_order),timeout_seconds:stepForm.timeout_seconds?Number(stepForm.timeout_seconds):null};
    try {
      if (editStepId) { await extApi.update("workflow_steps",editStepId,payload); toast.success("Updated"); }
      else { await extApi.create("workflow_steps",payload); toast.success("Step added"); }
      setShowStepForm(false); setStepForm(emptyStep()); setEditStepId(null); load();
    } catch(ex:any) { toast.error(ex.message); }
  };

  const depColor: Record<string,string> = { sequential:"bg-blue-500/20 text-blue-400", parallel:"bg-green-500/20 text-green-400", conditional:"bg-yellow-500/20 text-yellow-400", trigger:"bg-purple-500/20 text-purple-400" };
  const statusColor: Record<string,string> = { completed:"bg-green-500/20 text-green-400", running:"bg-blue-500/20 text-blue-400", failed:"bg-red-500/20 text-red-400", cancelled:"bg-gray-500/20 text-gray-400" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {(["edges","steps","executions"] as const).map(t=>(
            <button key={t} onClick={()=>setWfTab(t)} className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-display transition-colors ${wfTab===t?"bg-primary/20 text-primary border border-primary/30":"text-muted-foreground border border-transparent"}`}>
              {t==="edges"&&<Network className="w-3 h-3"/>}
              {t==="steps"&&<List className="w-3 h-3"/>}
              {t==="executions"&&<Play className="w-3 h-3"/>}
              {t==="edges"?`Edges (${edges.length})`:t==="steps"?`Steps (${steps.length})`:`Executions (${executions.length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <ExportButton data={wfTab==="steps"?filteredSteps:filteredEdges} filename={`workflow-${wfTab}`} title="Workflow"/>
          <Button variant="outline" size="sm" onClick={load} disabled={wfLoading}><RefreshCw className={`w-4 h-4 ${wfLoading?"animate-spin":""}`}/></Button>
          {wfTab==="edges"&&<Button size="sm" onClick={()=>{setEdgeForm(emptyEdge());setEditEdgeId(null);setShowEdgeForm(true);}} className="gap-1 text-xs"><Plus className="w-4 h-4"/>Add Edge</Button>}
          {wfTab==="steps"&&<Button size="sm" onClick={()=>{setStepForm(emptyStep());setEditStepId(null);setShowStepForm(true);}} className="gap-1 text-xs"><Plus className="w-4 h-4"/>Add Step</Button>}
        </div>
      </div>

      {workflowNames.length>0&&(
        <div className="flex gap-2 flex-wrap">
          {["all",...workflowNames].map(n=>(
            <button key={n} onClick={()=>setFilterWorkflow(n)} className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${filterWorkflow===n?"bg-primary/20 text-primary border border-primary/30":"text-muted-foreground border border-transparent"}`}>
              {n==="all"?"All Workflows":n}
            </button>
          ))}
        </div>
      )}

      {wfLoading?(
        <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-14 w-full"/>)}</div>
      ):wfTab==="edges"?(
        <div className="space-y-3">
          {filteredEdges.length===0&&<p className="text-center text-muted-foreground text-sm py-8">No workflow edges. Add one to map agent connections.</p>}
          {filteredEdges.map(e=>(
            <Card key={e.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-sm text-primary">{e.from_agent_code}</span>
                    <span className="text-muted-foreground text-xs">→</span>
                    <span className="font-display text-sm text-emerald-400">{e.to_agent_code}</span>
                    <Badge className={`text-[10px] ${depColor[e.dependency_type]||"bg-muted text-muted-foreground"}`}>{e.dependency_type}</Badge>
                    {e.workflow_name&&<Badge className="text-[10px] bg-primary/10 text-primary">{e.workflow_name} {e.workflow_version}</Badge>}
                    {!e.is_active&&<Badge className="text-[10px] bg-muted text-muted-foreground">Inactive</Badge>}
                  </div>
                  {e.description&&<p className="text-xs text-muted-foreground">{e.description}</p>}
                  {e.condition_expr&&<p className="text-[10px] text-yellow-400 font-mono">if: {e.condition_expr}</p>}
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    {e.priority!=null&&<span>Priority: {e.priority}</span>}
                    {e.timeout_seconds!=null&&<span>Timeout: {e.timeout_seconds}s</span>}
                    {!!e.retry_count&&<span>Retry: {e.retry_count}x</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="w-7 h-7" onClick={()=>{setEdgeForm({...e,timeout_seconds:e.timeout_seconds??""});setEditEdgeId(e.id);setShowEdgeForm(true);}}><Edit className="w-3.5 h-3.5"/></Button>
                  <Button size="icon" variant="ghost" className="w-7 h-7" onClick={async()=>{await extApi.remove("workflow_map",e.id);setEdges(p=>p.filter((x:any)=>x.id!==e.id));toast.success("Deleted");}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ):wfTab==="steps"?(
        <div className="space-y-3">
          {filteredSteps.length===0&&<p className="text-center text-muted-foreground text-sm py-8">No workflow steps.</p>}
          {[...filteredSteps].sort((a,b)=>(a.step_order??0)-(b.step_order??0)).map(s=>(
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-xs text-muted-foreground">#{s.step_order}</span>
                    <span className="font-display text-sm text-primary">{s.step_label}</span>
                    <Badge className="text-[10px] bg-primary/10 text-primary">{s.workflow_name}</Badge>
                    <Badge className="text-[10px] bg-secondary text-muted-foreground">{s.action_type}</Badge>
                    {!s.is_active&&<Badge className="text-[10px] bg-muted text-muted-foreground">Inactive</Badge>}
                  </div>
                  {s.agent_code&&<p className="text-xs text-emerald-400">Agent: {s.agent_code}</p>}
                  {s.condition_expr&&<p className="text-[10px] text-yellow-400 font-mono">if: {s.condition_expr}</p>}
                  {s.notes&&<p className="text-xs text-muted-foreground">{s.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="w-7 h-7" onClick={()=>{setStepForm({...s,timeout_seconds:s.timeout_seconds??""});setEditStepId(s.id);setShowStepForm(true);}}><Edit className="w-3.5 h-3.5"/></Button>
                  <Button size="icon" variant="ghost" className="w-7 h-7" onClick={async()=>{await extApi.remove("workflow_steps",s.id);setSteps(p=>p.filter((x:any)=>x.id!==s.id));toast.success("Deleted");}}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ):(
        <div className="space-y-3">
          {executions.length===0&&<p className="text-center text-muted-foreground text-sm py-8">No workflow executions recorded yet.</p>}
          {executions.map(ex=>(
            <Card key={ex.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm text-primary">{ex.workflow_name}</span>
                    <Badge className={`text-[10px] ${statusColor[ex.status]||"bg-muted text-muted-foreground"}`}>{ex.status}</Badge>
                    {ex.trigger_source&&<Badge className="text-[10px] bg-secondary text-muted-foreground">{ex.trigger_source}</Badge>}
                  </div>
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    {ex.initiated_by&&<span>By: {ex.initiated_by}</span>}
                    <span>{new Date(ex.started_at||ex.created_at).toLocaleString()}</span>
                  </div>
                  {ex.error_message&&<p className="text-[10px] text-destructive">{ex.error_message}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edge Form Dialog */}
      <Dialog open={showEdgeForm} onOpenChange={setShowEdgeForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display">{editEdgeId?"Edit":"New"} Workflow Edge</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">From Agent *</Label><Input value={edgeForm.from_agent_code} onChange={e=>setEdgeForm((p:any)=>({...p,from_agent_code:e.target.value}))} placeholder="AG-001" className="mt-1 bg-secondary border-border text-xs"/></div>
              <div><Label className="text-xs">To Agent *</Label><Input value={edgeForm.to_agent_code} onChange={e=>setEdgeForm((p:any)=>({...p,to_agent_code:e.target.value}))} placeholder="AG-002" className="mt-1 bg-secondary border-border text-xs"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Dependency Type</Label>
                <Select value={edgeForm.dependency_type} onValueChange={v=>setEdgeForm((p:any)=>({...p,dependency_type:v}))}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue/></SelectTrigger>
                  <SelectContent>{DEP_TYPES.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Workflow Name</Label><Input value={edgeForm.workflow_name} onChange={e=>setEdgeForm((p:any)=>({...p,workflow_name:e.target.value}))} className="mt-1 bg-secondary border-border text-xs"/></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Version</Label><Input value={edgeForm.workflow_version} onChange={e=>setEdgeForm((p:any)=>({...p,workflow_version:e.target.value}))} className="mt-1 bg-secondary border-border text-xs"/></div>
              <div><Label className="text-xs">Priority</Label><Input type="number" value={edgeForm.priority} onChange={e=>setEdgeForm((p:any)=>({...p,priority:Number(e.target.value)}))} className="mt-1 bg-secondary border-border text-xs"/></div>
              <div><Label className="text-xs">Timeout (s)</Label><Input type="number" value={edgeForm.timeout_seconds} onChange={e=>setEdgeForm((p:any)=>({...p,timeout_seconds:e.target.value}))} className="mt-1 bg-secondary border-border text-xs"/></div>
            </div>
            <div><Label className="text-xs">Condition Expression</Label><Input value={edgeForm.condition_expr} onChange={e=>setEdgeForm((p:any)=>({...p,condition_expr:e.target.value}))} className="mt-1 bg-secondary border-border text-xs font-mono"/></div>
            <div><Label className="text-xs">Description</Label><Textarea value={edgeForm.description} onChange={e=>setEdgeForm((p:any)=>({...p,description:e.target.value}))} rows={2} className="mt-1 bg-secondary border-border text-xs"/></div>
            <label className="flex items-center gap-2 text-xs cursor-pointer"><Switch checked={!!edgeForm.is_active} onCheckedChange={v=>setEdgeForm((p:any)=>({...p,is_active:v}))}/>Active</label>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setShowEdgeForm(false)}>Cancel</Button><Button onClick={saveEdge}>{editEdgeId?"Save":"Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Form Dialog */}
      <Dialog open={showStepForm} onOpenChange={setShowStepForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display">{editStepId?"Edit":"New"} Workflow Step</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Workflow Name *</Label><Input value={stepForm.workflow_name} onChange={e=>setStepForm((p:any)=>({...p,workflow_name:e.target.value}))} className="mt-1 bg-secondary border-border text-xs"/></div>
              <div><Label className="text-xs">Step Order</Label><Input type="number" value={stepForm.step_order} onChange={e=>setStepForm((p:any)=>({...p,step_order:e.target.value}))} className="mt-1 bg-secondary border-border text-xs"/></div>
            </div>
            <div><Label className="text-xs">Step Label *</Label><Input value={stepForm.step_label} onChange={e=>setStepForm((p:any)=>({...p,step_label:e.target.value}))} className="mt-1 bg-secondary border-border text-xs"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Action Type</Label>
                <Select value={stepForm.action_type} onValueChange={v=>setStepForm((p:any)=>({...p,action_type:v}))}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue/></SelectTrigger>
                  <SelectContent>{ACTION_TYPES.map(a=><SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Agent Code</Label><Input value={stepForm.agent_code} onChange={e=>setStepForm((p:any)=>({...p,agent_code:e.target.value}))} className="mt-1 bg-secondary border-border text-xs"/></div>
            </div>
            <div><Label className="text-xs">Condition Expression</Label><Input value={stepForm.condition_expr} onChange={e=>setStepForm((p:any)=>({...p,condition_expr:e.target.value}))} className="mt-1 bg-secondary border-border text-xs font-mono"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Timeout (s)</Label><Input type="number" value={stepForm.timeout_seconds} onChange={e=>setStepForm((p:any)=>({...p,timeout_seconds:e.target.value}))} className="mt-1 bg-secondary border-border text-xs"/></div>
              <div><Label className="text-xs">Retry Count</Label><Input type="number" value={stepForm.retry_count} onChange={e=>setStepForm((p:any)=>({...p,retry_count:Number(e.target.value)}))} className="mt-1 bg-secondary border-border text-xs"/></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={stepForm.notes} onChange={e=>setStepForm((p:any)=>({...p,notes:e.target.value}))} rows={2} className="mt-1 bg-secondary border-border text-xs"/></div>
            <label className="flex items-center gap-2 text-xs cursor-pointer"><Switch checked={!!stepForm.is_active} onCheckedChange={v=>setStepForm((p:any)=>({...p,is_active:v}))}/>Active</label>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setShowStepForm(false)}>Cancel</Button><Button onClick={saveStep}>{editStepId?"Save":"Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
