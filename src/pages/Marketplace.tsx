import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Store, Star, Download, Check, Search, X,
  Shield, Zap, Globe, Package, Code, BarChart2, MessageCircle,
  FileText, RefreshCw, Sparkles, TrendingUp, Heart,
  ExternalLink, Tag, Info, ChevronRight, Grid3X3, List,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

/* ─── Category icon map ──────────────────────────────────────────────────── */
const CAT_ICONS: Record<string, React.ElementType> = {
  All: Package, Analytics: BarChart2, Communication: MessageCircle,
  Security: Shield, Productivity: Zap, Finance: TrendingUp,
  Legal: FileText, Integration: Globe, Development: Code,
  Marketing: Sparkles, AI: Sparkles,
};

/* ─── Stars display ──────────────────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= Math.round(rating||0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`}/>
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating?.toFixed(1) || "—"}</span>
    </span>
  );
}

/* ─── App Card ───────────────────────────────────────────────────────────── */
function AppCard({ app, isInstalled, onInstall, onDetails, grid }: {
  app: any; isInstalled: boolean; onInstall: (a: any) => void; onDetails: (a: any) => void; grid: boolean;
}) {
  const CatIcon = CAT_ICONS[app.category] ?? Package;
  if (!grid) {
    return (
      <Card className="flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => onDetails(app)}>
        <div className="text-4xl shrink-0 w-12 text-center">{app.icon || "📦"}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm text-primary">{app.name}</span>
            {app.featured && <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/50">Featured</Badge>}
            {app.is_new && <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/50">New</Badge>}
            {app.verified && <Shield className="w-3 h-3 text-blue-400"/>}
          </div>
          <p className="text-xs text-muted-foreground truncate">{app.description}</p>
          <div className="flex items-center gap-3 mt-1">
            <Stars rating={app.rating}/>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Download className="w-3 h-3"/>{app.installs?.toLocaleString()||0}</span>
            <Badge variant="outline" className="text-[9px] flex items-center gap-0.5"><CatIcon className="w-2.5 h-2.5"/>{app.category}</Badge>
          </div>
        </div>
        <div className="shrink-0 text-right space-y-1">
          <p className="text-xs font-bold text-primary">{app.price_cents>0?`$${(app.price_cents/100).toFixed(2)}/mo`:"Free"}</p>
          <Button size="sm" variant={isInstalled?"outline":"default"} className="text-xs h-7 gap-1" onClick={e=>{e.stopPropagation();onInstall(app);}}>
            {isInstalled?<><Check className="w-3 h-3"/>Installed</>:<><Download className="w-3 h-3"/>Install</>}
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <Card className="p-5 flex flex-col hover:border-primary/40 transition-colors cursor-pointer group" onClick={()=>onDetails(app)}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-4xl">{app.icon||"📦"}</div>
        <div className="flex flex-col items-end gap-1">
          {app.featured&&<Badge className="text-[9px] px-1.5 bg-amber-500/20 text-amber-400 border-amber-500/50">Featured</Badge>}
          {app.is_new&&<Badge className="text-[9px] px-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/50">New</Badge>}
          {app.verified&&<Shield className="w-3.5 h-3.5 text-blue-400"/>}
        </div>
      </div>
      <h3 className="font-display text-sm text-primary group-hover:underline">{app.name}</h3>
      <p className="text-xs text-muted-foreground mb-3 flex-1 line-clamp-2">{app.description}</p>
      <Stars rating={app.rating}/>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2 mb-3">
        <span className="flex items-center gap-1"><Download className="w-3 h-3"/>{app.installs?.toLocaleString()||0} installs</span>
        <span className="ml-auto font-medium text-xs text-primary">{app.price_cents>0?`$${(app.price_cents/100).toFixed(2)}/mo`:"Free"}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[9px] flex items-center gap-0.5 flex-1 justify-center"><CatIcon className="w-2.5 h-2.5"/>{app.category}</Badge>
        <Button size="sm" variant={isInstalled?"outline":"default"} className="text-xs h-7 gap-1" onClick={e=>{e.stopPropagation();onInstall(app);}}>
          {isInstalled?<><Check className="w-3 h-3"/>Installed</>:<><Download className="w-3 h-3"/>Install</>}
        </Button>
      </div>
    </Card>
  );
}

/* ─── App Detail Dialog ──────────────────────────────────────────────────── */
function AppDetailDialog({ app, open, onClose, isInstalled, onInstall }: {
  app: any; open: boolean; onClose: ()=>void; isInstalled: boolean; onInstall: (a:any)=>void;
}) {
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  if (!app) return null;
  const CatIcon = CAT_ICONS[app.category]??Package;
  const submitReview = async () => {
    if (!reviewText.trim()) return;
    setSubmitting(true);
    try { await tenantDb.insert("app_reviews",{app_id:app.id,rating:reviewRating,review:reviewText.trim()}); toast.success("Review submitted!"); setReviewText(""); setReviewRating(5); }
    catch { toast.error("Failed to submit review"); } finally { setSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-4xl">{app.icon||"📦"}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-primary">{app.name}</span>
                {app.verified&&<Badge className="text-[9px] gap-1 bg-blue-500/20 text-blue-400 border-blue-500/50"><Shield className="w-2.5 h-2.5"/>Verified</Badge>}
              </div>
              <div className="flex items-center gap-2 mt-1"><Stars rating={app.rating}/><span className="text-[10px] text-muted-foreground">{app.installs?.toLocaleString()||0} installs</span></div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-1">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1"><CatIcon className="w-3 h-3"/>{app.category||"General"}</Badge>
            <Badge variant="outline" className="gap-1"><Tag className="w-3 h-3"/>{app.price_cents>0?`$${(app.price_cents/100).toFixed(2)}/mo`:"Free"}</Badge>
            {app.featured&&<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">⭐ Featured</Badge>}
            {app.version&&<Badge variant="outline" className="gap-1"><Code className="w-3 h-3"/>v{app.version}</Badge>}
          </div>
          <div>
            <h4 className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-2">About</h4>
            <p className="text-sm">{app.description||"No description provided."}</p>
            {app.long_description&&<p className="text-sm text-muted-foreground mt-2">{app.long_description}</p>}
          </div>
          {Array.isArray(app.features)&&app.features.length>0&&(
            <div>
              <h4 className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-2">Key Features</h4>
              <ul className="space-y-1">{app.features.map((f:string,i:number)=>(
                <li key={i} className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>{f}</li>
              ))}</ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-xs border rounded-lg p-3 bg-secondary/30">
            {app.publisher&&<div><span className="text-muted-foreground">Publisher</span><p className="font-medium mt-0.5">{app.publisher}</p></div>}
            {app.version&&<div><span className="text-muted-foreground">Version</span><p className="font-medium mt-0.5">{app.version}</p></div>}
            {app.last_updated&&<div><span className="text-muted-foreground">Updated</span><p className="font-medium mt-0.5">{new Date(app.last_updated).toLocaleDateString()}</p></div>}
            {app.support_url&&<div><span className="text-muted-foreground">Support</span><a href={app.support_url} target="_blank" rel="noreferrer" className="text-primary underline flex items-center gap-1 mt-0.5"><ExternalLink className="w-3 h-3"/>Docs</a></div>}
          </div>
          {app.requirements&&(
            <div className="flex items-start gap-2 p-3 border border-amber-500/30 bg-amber-500/5 rounded-lg text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/>
              <div><p className="font-semibold text-amber-400 mb-0.5">Requirements</p><p className="text-muted-foreground">{app.requirements}</p></div>
            </div>
          )}
          <div>
            <h4 className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-2">Write a Review</h4>
            <div className="space-y-2">
              <div className="flex gap-1">{[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>setReviewRating(n)}><Star className={`w-5 h-5 ${n<=reviewRating?"text-amber-400 fill-amber-400":"text-muted-foreground"}`}/></button>
              ))}</div>
              <Textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Share your experience…" rows={3} className="text-sm"/>
              <Button size="sm" onClick={submitReview} disabled={submitting||!reviewText.trim()}>Submit Review</Button>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant={isInstalled?"outline":"default"} className="gap-2" onClick={()=>{onInstall(app);onClose();}}>
            {isInstalled?<><X className="w-4 h-4"/>Uninstall</>:<><Download className="w-4 h-4"/>Install Now</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Request App Dialog ─────────────────────────────────────────────────── */
function RequestAppDialog({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  const [form, setForm] = useState({name:"",description:"",use_case:"",contact:""});
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!form.name.trim()||!form.description.trim()) return toast.error("Name and description required");
    setLoading(true);
    try { await tenantDb.insert("app_requests",form); toast.success("Request submitted!"); setForm({name:"",description:"",use_case:"",contact:""}); onClose(); }
    catch { toast.error("Failed to submit"); } finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-display">Request an App</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label className="text-xs">App Name *</Label><Input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Slack Integration" className="mt-1"/></div>
          <div><Label className="text-xs">Description *</Label><Textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="What should this app do?" rows={3} className="mt-1 text-sm"/></div>
          <div><Label className="text-xs">Use Case</Label><Input value={form.use_case} onChange={e=>setForm(p=>({...p,use_case:e.target.value}))} placeholder="How would you use it?" className="mt-1"/></div>
          <div><Label className="text-xs">Contact Email (optional)</Label><Input type="email" value={form.contact} onChange={e=>setForm(p=>({...p,contact:e.target.value}))} placeholder="for follow-up" className="mt-1"/></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>Submit Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Marketplace ───────────────────────────────────────────────────── */
export default function Marketplace() {
  const nav = useNavigate();  const { t } = useTranslation();  const [apps, setApps] = useState<any[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState<"featured"|"rating"|"installs"|"newest">("featured");
  const [priceFilter, setPriceFilter] = useState<"all"|"free"|"paid">("all");
  const [grid, setGrid] = useState(true);
  const [detailApp, setDetailApp] = useState<any>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await tenantDb.select("marketplace_apps", { orderBy: "featured", ascending: false });
      setApps((data as any) || []);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const ins = await tenantDb.select("installed_apps", { eq: { user_id: user.id } });
        setInstalled(new Set((ins as any)?.map((x: any) => x.app_id) || []));
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const install = async (app: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Sign in required");
    const isInstalled = installed.has(app.id);
    try {
      if (isInstalled) {
        await tenantDb.remove("installed_apps", { eq: { user_id: user.id, app_id: app.id } } as any);
        setInstalled(s => { const n = new Set(s); n.delete(app.id); return n; });
        toast.success(`${app.name} uninstalled`);
      } else {
        await tenantDb.insert("installed_apps", { user_id: user.id, app_id: app.id, installed_at: new Date().toISOString() });
        setInstalled(s => new Set(s).add(app.id));
        toast.success(`${app.name} installed! ✓`);
      }
    } catch { toast.error("Action failed"); }
  };

  const cats = ["All", ...Array.from(new Set(apps.map(a => a.category).filter(Boolean)))];
  const filtered = useMemo(() => {
    let list = apps;
    if (tab === "installed") list = list.filter(a => installed.has(a.id));
    if (tab === "featured")  list = list.filter(a => a.featured);
    if (cat !== "All") list = list.filter(a => a.category === cat);
    if (priceFilter === "free") list = list.filter(a => !a.price_cents);
    if (priceFilter === "paid") list = list.filter(a => a.price_cents > 0);
    if (search) { const q = search.toLowerCase(); list = list.filter(a => a.name?.toLowerCase().includes(q)||a.description?.toLowerCase().includes(q)||a.category?.toLowerCase().includes(q)); }
    return [...list].sort((a,b) => {
      if (sort==="rating")   return (b.rating||0)-(a.rating||0);
      if (sort==="installs") return (b.installs||0)-(a.installs||0);
      if (sort==="newest")   return new Date(b.created_at||0).getTime()-new Date(a.created_at||0).getTime();
      return (b.featured?1:0)-(a.featured?1:0);
    });
  }, [apps, tab, cat, priceFilter, search, sort, installed]);

  const featuredApps = apps.filter(a => a.featured).slice(0,3);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky Header ── */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => nav("/")} className="gap-1"><ArrowLeft className="w-4 h-4"/>{t('back_btn')}</Button>
              <Store className="w-5 h-5 text-primary"/><span className="font-display text-lg text-primary">{t('marketplace')}</span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <Input placeholder="Search apps…" value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 h-9"/>
                {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5"/></button>}
              </div>
              <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-3.5 h-3.5"/></Button>
              <Button size="sm" variant="outline" onClick={()=>setGrid(g=>!g)} title={grid?"List view":"Grid view"}>
                {grid?<List className="w-3.5 h-3.5"/>:<Grid3X3 className="w-3.5 h-3.5"/>}
              </Button>
            </div>
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={()=>setRequestOpen(true)}>
              <Sparkles className="w-3.5 h-3.5"/>{t('request_app_btn')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {label:t('total_apps_label'),  value:apps.length,     icon:Package,  color:"text-primary"},
            {label:t('free_apps_label'),   value:apps.filter(a=>!a.price_cents).length, icon:Heart, color:"text-emerald-400"},
            {label:t('installed'),   value:installed.size,  icon:Check,    color:"text-blue-400"},
            {label:t('categories_count_label'),  value:cats.length-1,   icon:Tag,      color:"text-amber-400"},
          ].map(k=>(
            <Card key={k.label} className="p-3 flex items-center gap-3">
              <k.icon className={`w-6 h-6 ${k.color} opacity-80`}/>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</p><p className="text-xl font-bold">{k.value}</p></div>
            </Card>
          ))}
        </div>

        {/* ── Featured Banner ── */}
        {featuredApps.length > 0 && (
          <div>
            <h2 className="font-display text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400"/>{t('featured')}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {featuredApps.map(app=>(
                <Card key={app.id} className="p-4 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent cursor-pointer hover:border-amber-500/60 transition-colors" onClick={()=>setDetailApp(app)}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{app.icon||"📦"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-primary">{app.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{app.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Stars rating={app.rating}/>
                        <span className="ml-auto text-xs font-bold text-primary">{app.price_cents>0?`$${(app.price_cents/100).toFixed(2)}/mo`:"Free"}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Category + Filters row ── */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 flex-wrap">
            {cats.map(c => { const Icon=CAT_ICONS[c]??Package; return (
              <Button key={c} size="sm" variant={cat===c?"default":"outline"} className="h-7 text-xs gap-1" onClick={()=>setCat(c)}>
                <Icon className="w-3 h-3"/>{c}
              </Button>
            ); })}
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{t('price')}:</span>
            {(["all","free","paid"] as const).map(p=>(
              <Button key={p} size="sm" variant={priceFilter===p?"default":"outline"} className="h-7 text-xs" onClick={()=>setPriceFilter(p)}>
                {p==="all"?t('all_notifications'):p==="free"?t('free_app'):t('paid_app')}
              </Button>
            ))}
            <select value={sort} onChange={e=>setSort(e.target.value as any)} className="h-7 text-xs bg-secondary border border-border rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-primary/50">
              <option value="featured">Featured</option>
              <option value="rating">Top Rated</option>
              <option value="installs">Most Installed</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* ── Main Tabs ── */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="text-xs">{t('all_apps')} ({apps.length})</TabsTrigger>
            <TabsTrigger value="featured" className="text-xs">{t('featured')} ({apps.filter(a=>a.featured).length})</TabsTrigger>
            <TabsTrigger value="installed" className="text-xs">{t('installed')} ({installed.size})</TabsTrigger>
          </TabsList>
          {["all","featured","installed"].map(t=>(
            <TabsContent key={t} value={t}>
              {loading ? (
                <div className={grid?"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4":"space-y-3"}>
                  {Array.from({length:8}).map((_,i)=>(
                    <Card key={i} className="p-5 animate-pulse">
                      <div className="h-10 w-10 bg-secondary rounded mb-3"/><div className="h-4 bg-secondary rounded w-3/4 mb-2"/><div className="h-3 bg-secondary rounded w-full mb-1"/><div className="h-3 bg-secondary rounded w-5/6"/>
                    </Card>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30"/>
                  <p className="text-muted-foreground">{tab==="installed"?t('no_apps_installed'):t('no_apps_match')}</p>
                  {tab!=="installed"&&<Button variant="link" className="mt-2" onClick={()=>setRequestOpen(true)}>{t('request_new_app_btn')} <ChevronRight className="w-3.5 h-3.5"/></Button>}
                </div>
              ) : (
                <div className={grid?"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4":"space-y-3"}>
                  {filtered.map(app=>(
                    <AppCard key={app.id} app={app} isInstalled={installed.has(app.id)} onInstall={install} onDetails={setDetailApp} grid={grid}/>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* ── Empty marketplace ── */}
        {!loading && apps.length === 0 && (
          <Card className="p-12 text-center border-dashed">
            <Store className="w-16 h-16 mx-auto mb-4 text-primary/30"/>
            <h3 className="font-display text-lg text-primary mb-2">Marketplace Coming Soon</h3>
            <p className="text-sm text-muted-foreground mb-4">Apps will appear here once published. You can request apps to be added.</p>
            <Button onClick={()=>setRequestOpen(true)} className="gap-2"><Sparkles className="w-4 h-4"/>Request an App</Button>
          </Card>
        )}

        {/* ── Info footer ── */}
        <div className="flex items-start gap-2 p-4 bg-secondary/30 rounded-lg text-xs text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400"/>
          <p>All apps are verified for security and compatibility. Installed apps may request access to your brand data. You can uninstall any app at any time. For enterprise integrations, <button className="text-primary underline" onClick={()=>setRequestOpen(true)}>contact us</button>.</p>
        </div>
      </div>

      <AppDetailDialog app={detailApp} open={!!detailApp} onClose={()=>setDetailApp(null)} isInstalled={detailApp?installed.has(detailApp.id):false} onInstall={install}/>
      <RequestAppDialog open={requestOpen} onClose={()=>setRequestOpen(false)}/>
    </div>
  );
}
