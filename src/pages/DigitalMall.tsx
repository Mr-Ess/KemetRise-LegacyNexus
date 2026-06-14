import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Store, Star, Search, Shield, Heart,
  Grid3X3, List, Sparkles, ShoppingBag, Package,
  RefreshCw, X, ChevronRight, Users, MapPin,
  TrendingUp, Award, Zap, Plus, Settings,
  Eye, EyeOff, Pencil, Trash2, Check, Clock,
  CheckCircle2, XCircle, BarChart2, ExternalLink,
  Phone, Mail, Globe, Copy, LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  seedMallDefaults, SEED_FLOORS, MALL_FLOOR_COLORS, FALLBACK_FLOOR_CFG,
  type MallFloor, type MallStore, type MallProduct,
} from "@/components/mall/mallSeed";

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function formatPrice(cents: number, model: string) {
  if (model === "free" || cents === 0) return "Free";
  if (model === "contact") return "Contact";
  const amt = `$${(cents / 100).toFixed(0)}`;
  if (model === "monthly") return `${amt}/mo`;
  if (model === "annual") return `${amt}/yr`;
  return amt;
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const sz = size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3";
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={`${sz} ${n <= Math.round(rating||0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="ml-1 text-[10px] text-muted-foreground">{(rating||0).toFixed(1)}</span>
    </span>
  );
}

function PriceBadge({ cents, model }: { cents: number; model: string }) {
  const label = formatPrice(cents, model);
  const cls = label === "Free" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
    : label === "Contact" ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
    : "bg-primary/20 text-primary border-primary/40";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${cls}`}>{label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    active:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    pending:   "bg-amber-500/20 text-amber-400 border-amber-500/40",
    suspended: "bg-red-500/20 text-red-400 border-red-500/40",
    rejected:  "bg-slate-500/20 text-slate-400 border-slate-500/40",
  };
  return <Badge className={`text-[9px] px-1.5 py-0 capitalize ${cfg[status] || cfg.pending}`}>{status}</Badge>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   STORE CARD
═══════════════════════════════════════════════════════════════════════════ */
function StoreCard({ store, floor, followed, onFollow, onView }: {
  store: MallStore; floor: MallFloor | null;
  followed: boolean; onFollow: (id: string) => void;
  onView: (s: MallStore) => void;
}) {
  const pal = MALL_FLOOR_COLORS[store.cover_color] || FALLBACK_FLOOR_CFG;
  return (
    <Card
      className={`group relative flex flex-col overflow-hidden cursor-pointer ${pal.hoverBorder} border transition-all hover:shadow-lg ${pal.shadow} bg-background/60 backdrop-blur-sm`}
      onClick={() => onView(store)}
    >
      {/* Banner */}
      <div className={`h-20 bg-gradient-to-br ${pal.gradient} border-b ${pal.border} relative`}>
        {store.banner_url && (
          <img src={store.banner_url} className="w-full h-full object-cover opacity-40" alt="" />
        )}
        <button
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50"
          onClick={(e) => { e.stopPropagation(); onFollow(store.id); }}
        >
          <Heart className={`w-3 h-3 ${followed ? "fill-rose-400 text-rose-400" : "text-muted-foreground"}`} />
        </button>
        {store.is_featured && (
          <div className="absolute top-2 left-2">
            <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/80 text-amber-950 border-amber-400">⭐ Featured</Badge>
          </div>
        )}
      </div>

      {/* Logo */}
      <div className={`absolute top-11 left-3 w-14 h-14 rounded-xl border-2 border-background bg-gradient-to-br ${pal.gradient} border-2 ${pal.border} flex items-center justify-center text-2xl shadow-md overflow-hidden`}>
        {store.logo_url ? <img src={store.logo_url} className="w-full h-full object-cover" alt={store.name} /> : "🏪"}
      </div>

      <div className="pt-9 px-3 pb-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-1 mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground truncate">{store.name}</span>
              {store.is_verified && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
              {store.is_new && <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/40">New</Badge>}
            </div>
            {floor && <Badge className={`text-[9px] px-1.5 py-0 mt-0.5 ${pal.badgeClass}`}>{floor.icon} {floor.name}</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">{store.description}</p>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <Stars rating={store.rating} size="xs" />
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><Package className="w-3 h-3" />{store.products_count}</span>
            <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{store.followers_count}</span>
          </div>
        </div>
        {store.owner_name && (
          <p className="text-[10px] text-muted-foreground mt-1 truncate">{store.owner_name}</p>
        )}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════════════════════════════════════ */
function ProductCard({ product, store }: { product: MallProduct; store: MallStore | null }) {
  const pal = MALL_FLOOR_COLORS[store?.cover_color || "violet"] || FALLBACK_FLOOR_CFG;
  const discount = product.compare_price_cents && product.compare_price_cents > product.price_cents
    ? Math.round(((product.compare_price_cents - product.price_cents) / product.compare_price_cents) * 100)
    : null;
  return (
    <Card className={`group flex flex-col p-3 ${pal.hoverBorder} border transition-all hover:shadow-md ${pal.shadow} bg-background/60 backdrop-blur-sm`}>
      <div className={`w-full h-24 rounded-lg mb-2 flex items-center justify-center bg-gradient-to-br ${pal.gradient} border ${pal.border} text-3xl overflow-hidden relative`}>
        {product.thumbnail_url
          ? <img src={product.thumbnail_url} className="h-full w-full object-cover" alt={product.name} />
          : "📦"}
        {discount && (
          <div className="absolute top-1.5 left-1.5">
            <Badge className="text-[9px] px-1.5 py-0 bg-red-500 text-white border-red-600">-{discount}%</Badge>
          </div>
        )}
      </div>
      <span className="font-medium text-xs line-clamp-2 mb-1">{product.name}</span>
      {store && (
        <p className="text-[10px] text-muted-foreground mb-1.5 truncate flex items-center gap-1">
          🏪 {store.name}
        </p>
      )}
      <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-border/40">
        <div>
          <PriceBadge cents={product.price_cents} model={product.pricing_model} />
          {discount && product.compare_price_cents && (
            <span className="ml-1 text-[10px] text-muted-foreground line-through">
              ${(product.compare_price_cents / 100).toFixed(0)}
            </span>
          )}
        </div>
        <Stars rating={product.rating} size="xs" />
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STORE DETAIL DIALOG
═══════════════════════════════════════════════════════════════════════════ */
function StoreDetailDialog({ store, floor, products, open, onClose, followed, onFollow }: {
  store: MallStore | null; floor: MallFloor | null; products: MallProduct[];
  open: boolean; onClose: () => void; followed: boolean; onFollow: (id: string) => void;
}) {
  if (!store) return null;
  const pal = MALL_FLOOR_COLORS[store.cover_color] || FALLBACK_FLOOR_CFG;
  const storeProds = products.filter((p) => p.store_id === store.id && p.is_active);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        {/* Banner */}
        <div className={`h-32 bg-gradient-to-br ${pal.gradient} border-b ${pal.border} relative flex items-end p-4`}>
          {store.banner_url && <img src={store.banner_url} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />}
          <div className="relative flex items-end gap-3">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${pal.gradient} border-2 border-background shadow-lg flex items-center justify-center text-3xl overflow-hidden`}>
              {store.logo_url ? <img src={store.logo_url} className="w-full h-full object-cover" alt={store.name} /> : "🏪"}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-base">{store.name}</span>
                {store.is_verified && <Shield className="w-4 h-4 text-blue-400" />}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {floor && <Badge className={`text-[9px] px-1.5 py-0 ${pal.badgeClass}`}>{floor.icon} {floor.name}</Badge>}
                <StatusBadge status={store.status} />
                {store.is_featured && <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/80 text-amber-950">⭐ Featured</Badge>}
              </div>
            </div>
          </div>
          <Button size="sm" variant="secondary" className="ml-auto relative gap-1.5 text-xs" onClick={() => onFollow(store.id)}>
            <Heart className={`w-3.5 h-3.5 ${followed ? "fill-rose-400 text-rose-400" : ""}`} />
            {followed ? "Following" : "Follow"}
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Rating",    value: (store.rating||0).toFixed(1), icon: "⭐" },
              { label: "Products",  value: store.products_count,          icon: "📦" },
              { label: "Sales",     value: store.sales_count,             icon: "🛍️" },
              { label: "Followers", value: store.followers_count,         icon: "👥" },
            ].map(({ label, value, icon }) => (
              <Card key={label} className="p-2.5 text-center bg-secondary/10">
                <p className="text-base mb-0.5">{icon}</p>
                <p className="text-sm font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </Card>
            ))}
          </div>

          {/* Description */}
          {store.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">About</p>
              <p className="text-sm text-muted-foreground">{store.long_description || store.description}</p>
            </div>
          )}

          {/* Contact */}
          {(store.contact_email || store.contact_phone || store.website_url) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact</p>
              <div className="flex flex-wrap gap-2">
                {store.contact_email && (
                  <a href={`mailto:${store.contact_email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="w-3.5 h-3.5" />{store.contact_email}
                  </a>
                )}
                {store.website_url && (
                  <a href={store.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <Globe className="w-3.5 h-3.5" />Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {store.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {store.tags.map((t) => <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">{t}</Badge>)}
            </div>
          )}

          {/* Products */}
          {storeProds.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Products ({storeProds.length})</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {storeProds.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 hover:bg-secondary/20 transition-colors">
                    <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${pal.gradient} border ${pal.border} flex items-center justify-center text-sm shrink-0 overflow-hidden`}>
                      {p.thumbnail_url ? <img src={p.thumbnail_url} className="w-full h-full object-cover" alt={p.name} /> : "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium truncate">{p.name}</p>
                      <PriceBadge cents={p.price_cents} model={p.pricing_model} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APPLY TO OPEN STORE DIALOG
═══════════════════════════════════════════════════════════════════════════ */
function ApplyStoreDialog({ open, onClose, floors }: {
  open: boolean; onClose: () => void; floors: MallFloor[];
}) {
  const db = supabase as any;
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({ store_name:"", floor_id:"", description:"", contact_name:"", contact_email:"", contact_phone:"", website_url:"", reason:"" });
  const set = (k: keyof typeof form, v: string) => { setSubmitError(null); setForm((f) => ({ ...f, [k]: v })); };

  const submit = async () => {
    setSubmitError(null);
    if (!form.store_name.trim() || !form.contact_email.trim()) {
      setSubmitError("Store name and email are required.");
      return;
    }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) console.warn("[ApplyStore] auth error:", authError.message);
      const user = authData?.user ?? null;
      const floor_id = form.floor_id && !form.floor_id.startsWith("seed-") ? form.floor_id : null;
      const payload = {
        store_name: form.store_name.trim(),
        floor_id,
        description: form.description.trim(),
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || null,
        website_url: form.website_url.trim() || null,
        reason: form.reason.trim() || null,
        applicant_user_id: user?.id ?? null,
        status: "pending",
      };
      console.log("[ApplyStore] inserting:", payload);
      const { data: inserted, error } = await db.from("mall_store_applications").insert(payload).select().single();
      console.log("[ApplyStore] result:", { inserted, error });
      if (error) throw error;
      toast.success("Application submitted! We'll review it shortly.", { duration: 5000 });
      setForm({ store_name:"", floor_id:"", description:"", contact_name:"", contact_email:"", contact_phone:"", website_url:"", reason:"" });
      onClose();
    } catch (e: any) {
      const msg = e?.message || "Failed to submit application.";
      console.error("[ApplyStore] error:", e);
      setSubmitError(msg);
      toast.error(msg, { duration: 6000 });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Store className="w-4 h-4 text-primary" />Open Your Store</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-muted-foreground">
            🏬 Join the Digital Mall and reach thousands of customers. Fill out the form and our team will review your application within 24 hours.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Store Name *</Label>
              <Input className="h-8 text-sm" placeholder="My Awesome Store" value={form.store_name} onChange={(e) => set("store_name", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Store Category / Floor</Label>
              <Select value={form.floor_id} onValueChange={(v) => set("floor_id", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select floor" /></SelectTrigger>
                <SelectContent>
                  {floors.map((f) => <SelectItem key={f.id} value={f.id}>{f.icon} {f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Store Description</Label>
              <Textarea className="text-sm resize-none" rows={2} placeholder="What do you sell?" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Contact Name *</Label>
              <Input className="h-8 text-sm" placeholder="Your name" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Email *</Label>
              <Input className="h-8 text-sm" type="email" placeholder="your@email.com" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Phone</Label>
              <Input className="h-8 text-sm" placeholder="+1 234 567 890" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Website</Label>
              <Input className="h-8 text-sm" placeholder="https://..." value={form.website_url} onChange={(e) => set("website_url", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Why do you want to join?</Label>
              <Textarea className="text-sm resize-none" rows={2} placeholder="Tell us about yourself…" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
            </div>
          </div>
        </div>
        {submitError && (
          <div className="mx-2 mb-1 px-3 py-2 rounded-lg bg-destructive/15 border border-destructive/30 text-xs text-destructive font-medium">
            ⚠️ {submitError}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={loading} className="gap-1.5">
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MANAGEMENT DRAWER
═══════════════════════════════════════════════════════════════════════════ */
function MallManagerDrawer({ onClose, currentUserId }: { onClose: () => void; currentUserId: string | null }) {
  const db = supabase as any;
  const [tab, setTab] = useState<"overview" | "stores" | "products" | "applications" | "floors" | "analytics">("overview");
  const [stores, setStores] = useState<MallStore[]>([]);
  const [products, setProducts] = useState<MallProduct[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [floors, setFloors] = useState<MallFloor[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const [storeStatus, setStoreStatus] = useState("all");
  const [editStore, setEditStore] = useState<MallStore | null>(null);
  const [editForm, setEditForm] = useState({ name:"", description:"", floor_id:"", owner_name:"", contact_email:"", contact_phone:"", website_url:"", cover_color:"violet", status:"active" });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<MallStore | null>(null);

  // Products management state
  const [productSearch, setProductSearch] = useState("");
  const [productStoreFilter, setProductStoreFilter] = useState("all");
  const [editProduct, setEditProduct] = useState<MallProduct | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<MallProduct | null>(null);
  const [productFormLoading, setProductFormLoading] = useState(false);
  const EMPTY_PRODUCT_FORM = { name:"", description:"", store_id:"", category:"", price_cents:"0", compare_price_cents:"", pricing_model:"one_time", stock_qty:"", is_digital:false, is_featured:false, thumbnail_url:"" };
  const [productForm, setProductForm] = useState<typeof EMPTY_PRODUCT_FORM>(EMPTY_PRODUCT_FORM);
  const setPF = (k: keyof typeof EMPTY_PRODUCT_FORM, v: string | boolean) => setProductForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }, { data: a }, { data: f }] = await Promise.all([
      db.from("mall_stores").select("*").order("created_at", { ascending: false }),
      db.from("mall_products").select("*").order("created_at", { ascending: false }),
      db.from("mall_store_applications").select("*").order("created_at", { ascending: false }),
      db.from("mall_floors").select("*").order("sort_order"),
    ]);
    setStores(s || []); setProducts(p || []);
    setApplications(a || []); setFloors(f?.length ? f : SEED_FLOORS.map((s, i) => ({ ...s, id: `seed-${i}` })) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const pendingApps = applications.filter((a) => a.status === "pending").length;
  const activeStores = stores.filter((s) => s.is_active && s.status === "active").length;

  const toggleStore = async (s: MallStore) => {
    await db.from("mall_stores").update({ is_active: !s.is_active }).eq("id", s.id);
    load(); toast.success(`"${s.name}" ${!s.is_active ? "activated" : "deactivated"}`);
  };
  const toggleFeatured = async (s: MallStore) => {
    await db.from("mall_stores").update({ is_featured: !s.is_featured }).eq("id", s.id);
    load(); toast.success(`"${s.name}" ${!s.is_featured ? "featured" : "unfeatured"}`);
  };
  const toggleVerified = async (s: MallStore) => {
    await db.from("mall_stores").update({ is_verified: !s.is_verified }).eq("id", s.id);
    load();
  };
  const approveApp = async (id: string, approved: boolean) => {
    // Update application status
    const { error: updErr } = await db
      .from("mall_store_applications")
      .update({ status: approved ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (updErr) { toast.error(updErr.message); return; }

    // If approved → create a store in mall_stores
    if (approved) {
      const app = applications.find((a) => a.id === id);
      if (app) {
        const slug = (app.store_name as string)
          .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
        const { error: storeErr } = await db.from("mall_stores").insert({
          name: app.store_name,
          name_ar: "",
          slug,
          description: app.description || "",
          owner_name: app.contact_name || "",
          contact_email: app.contact_email || null,
          contact_phone: app.contact_phone || null,
          website_url: app.website_url || null,
          floor_id: app.floor_id || null,
          owner_user_id: app.applicant_user_id || null,
          cover_color: "violet",
          status: "active",
          is_active: true,
          is_new: true,
          is_featured: false,
          is_verified: false,
        });
        if (storeErr) { toast.error("Application approved but store creation failed: " + storeErr.message); load(); return; }
      }
    }
    load(); toast.success(`Application ${approved ? "approved — store created!" : "rejected"}`);
  };
  const deleteProduct = async (id: string) => {
    await db.from("mall_products").delete().eq("id", id);
    load(); toast.success("Product removed");
  };

  const openEdit = (s: MallStore) => {
    setEditStore(s);
    setEditForm({
      name: s.name || "",
      description: (s as any).description || "",
      floor_id: s.floor_id || "",
      owner_name: s.owner_name || "",
      contact_email: s.contact_email || "",
      contact_phone: (s as any).contact_phone || "",
      website_url: (s as any).website_url || "",
      cover_color: s.cover_color || "violet",
      status: s.status || "active",
    });
  };

  const saveEdit = async () => {
    if (!editStore) return;
    setEditLoading(true);
    const { error } = await db.from("mall_stores").update({
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      floor_id: editForm.floor_id && !editForm.floor_id.startsWith("seed-") ? editForm.floor_id : null,
      owner_name: editForm.owner_name.trim(),
      contact_email: editForm.contact_email.trim() || null,
      contact_phone: editForm.contact_phone.trim() || null,
      website_url: editForm.website_url.trim() || null,
      cover_color: editForm.cover_color,
      status: editForm.status,
      is_active: editForm.status === "active",
    }).eq("id", editStore.id);
    setEditLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${editForm.name}" updated`);
    setEditStore(null);
    load();
  };

  const deleteStore = async (s: MallStore) => {
    const { error } = await db.from("mall_stores").delete().eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    setDeleteConfirm(null);
    toast.success(`"${s.name}" deleted`);
    load();
  };

  const suspendToggle = async (s: MallStore) => {
    const newStatus = s.status === "suspended" ? "active" : "suspended";
    await db.from("mall_stores").update({ status: newStatus, is_active: newStatus === "active" }).eq("id", s.id);
    toast.success(`"${s.name}" ${newStatus === "suspended" ? "suspended" : "reactivated"}`);
    load();
  };

  // ── Product helpers ──────────────────────────────────────────────
  const openEditProduct = (p: MallProduct) => {
    setEditProduct(p);
    setProductForm({
      name: p.name || "",
      description: p.description || "",
      store_id: p.store_id || "",
      category: p.category || "",
      price_cents: String(p.price_cents ?? 0),
      compare_price_cents: p.compare_price_cents != null ? String(p.compare_price_cents) : "",
      pricing_model: p.pricing_model || "one_time",
      stock_qty: p.stock_qty != null ? String(p.stock_qty) : "",
      is_digital: p.is_digital ?? false,
      is_featured: p.is_featured ?? false,
      thumbnail_url: (p as any).thumbnail_url || "",
    });
  };

  const saveProduct = async (isNew: boolean) => {
    if (!productForm.name.trim() || !productForm.store_id || productForm.store_id === "__none__") {
      toast.error("Product name and store are required"); return;
    }
    setProductFormLoading(true);
    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      store_id: productForm.store_id,
      category: productForm.category.trim(),
      price_cents: Math.round(parseFloat(productForm.price_cents || "0") * 100),
      compare_price_cents: productForm.compare_price_cents ? Math.round(parseFloat(productForm.compare_price_cents) * 100) : null,
      pricing_model: productForm.pricing_model,
      stock_qty: productForm.stock_qty !== "" ? parseInt(productForm.stock_qty) : null,
      is_digital: productForm.is_digital,
      is_featured: productForm.is_featured,
      thumbnail_url: productForm.thumbnail_url.trim() || null,
      is_active: true,
      is_new: isNew,
      name_ar: "",
      tags: [],
      currency: "USD",
    };
    let error: any = null;
    if (isNew || !editProduct) {
      ({ error } = await db.from("mall_products").insert(payload));
    } else {
      ({ error } = await db.from("mall_products").update(payload).eq("id", editProduct.id));
    }
    setProductFormLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isNew ? "Product added!" : `"${productForm.name}" updated`);
    setEditProduct(null); setShowAddProduct(false);
    setProductForm(EMPTY_PRODUCT_FORM);
    load();
  };

  const toggleProductActive = async (p: MallProduct) => {
    await db.from("mall_products").update({ is_active: !p.is_active }).eq("id", p.id);
    toast.success(`"${p.name}" ${!p.is_active ? "shown" : "hidden"}`);
    load();
  };

  const confirmDeleteProduct = async (p: MallProduct) => {
    const { error } = await db.from("mall_products").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    setDeleteProductConfirm(null);
    toast.success(`"${p.name}" deleted`);
    load();
  };

  const filteredProducts = products.filter((p) => {
    if (productStoreFilter !== "all" && p.store_id !== productStoreFilter) return false;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      if (!p.name?.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredStores = useMemo(() => {
    let r = [...stores];
    if (storeStatus !== "all") r = r.filter((s) => s.status === storeStatus);
    if (storeSearch.trim()) { const q = storeSearch.toLowerCase(); r = r.filter((s) => s.name?.toLowerCase().includes(q) || s.owner_name?.toLowerCase().includes(q)); }
    return r;
  }, [stores, storeStatus, storeSearch]);

  const floorMap = Object.fromEntries(floors.map((f) => [f.id, f]));

  const NAV = [
    { id: "overview",      label: "Overview",      Icon: LayoutDashboard, count: 0              },
    { id: "stores",        label: "Stores",         Icon: Store,           count: stores.length  },
    { id: "products",      label: "Products",       Icon: Package,         count: products.length },
    { id: "applications",  label: "Applications",   Icon: CheckCircle2,    count: pendingApps    },
    { id: "floors",        label: "Floors",         Icon: MapPin,          count: floors.length  },
    { id: "analytics",     label: "Analytics",      Icon: BarChart2,       count: 0              },
  ] as const;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-5xl shadow-2xl border-l border-border">
        {/* Sidebar */}
        <div className="w-52 shrink-0 flex flex-col bg-card border-r border-border/50">
          <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/50 bg-secondary/20">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Settings className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm">Mall Manager</span>
            <button onClick={onClose} className="ml-auto p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {NAV.map(({ id, label, Icon, count }) => (
              <button key={id} onClick={() => setTab(id as typeof tab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${tab === id ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${tab === id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>{count}</span>
                )}
                {id === "applications" && pendingApps > 0 && tab !== "applications" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ml-1" />
                )}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-border/50 space-y-1.5">
            <button onClick={load} className="w-full flex items-center justify-center gap-1.5 text-xs bg-secondary/50 text-foreground px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />Refresh Data
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-background overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/50 bg-card/60 shrink-0">
            <span className="font-semibold text-sm">{NAV.find((n) => n.id === tab)?.label}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5">

            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label:"Total Stores",     value:stores.length,         emoji:"🏪", c:"text-primary"     },
                    { label:"Active Stores",    value:activeStores,          emoji:"✅", c:"text-emerald-400"  },
                    { label:"Total Products",   value:products.length,       emoji:"📦", c:"text-violet-400"   },
                    { label:"Pending Apps",     value:pendingApps,           emoji:"📋", c:"text-amber-400"    },
                    { label:"Mall Floors",      value:floors.length,         emoji:"🏬", c:"text-blue-400"     },
                    { label:"Featured Stores",  value:stores.filter((s) => s.is_featured).length, emoji:"⭐", c:"text-yellow-400" },
                  ].map(({ label, value, emoji, c }) => (
                    <Card key={label} className="p-4 flex items-center gap-3 bg-secondary/10">
                      <span className="text-2xl shrink-0">{emoji}</span>
                      <div><p className={`text-2xl font-bold ${c}`}>{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>
                    </Card>
                  ))}
                </div>
                {stores.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Recent Stores</p>
                    <div className="space-y-1.5">
                      {stores.slice(0, 6).map((s) => {
                        const f = floorMap[s.floor_id || ""];
                        const pal = MALL_FLOOR_COLORS[s.cover_color] || FALLBACK_FLOOR_CFG;
                        return (
                          <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 hover:bg-secondary/20">
                            <span className="text-lg shrink-0 w-6 text-center">🏪</span>
                            <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{s.name}</p><p className="text-[10px] text-muted-foreground truncate">{s.owner_name}</p></div>
                            {f && <Badge className={`text-[9px] px-1.5 py-0 shrink-0 ${pal.badgeClass}`}>{f.icon} {f.name}</Badge>}
                            <StatusBadge status={s.status} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STORES */}
            {tab === "stores" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input className="pl-8 h-8 text-xs bg-secondary/20" placeholder="Search stores…" value={storeSearch} onChange={(e) => setStoreSearch(e.target.value)} />
                  </div>
                  <Select value={storeStatus} onValueChange={setStoreStatus}>
                    <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">{filteredStores.length} stores</span>
                </div>
                {loading ? (
                  <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="h-10 animate-pulse bg-secondary/20 rounded-lg" />)}</div>
                ) : filteredStores.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center"><Store className="w-10 h-10 mb-2 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">No stores found</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/50">
                          {["Name","Floor","Owner","Status","Featured","Verified",""].map((h, i) => (
                            <th key={i} className={`py-2.5 font-semibold text-muted-foreground text-left ${i === 6 ? "text-right" : ""}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStores.map((s) => {
                          const f = floorMap[s.floor_id || ""];
                          const pal = MALL_FLOOR_COLORS[s.cover_color] || FALLBACK_FLOOR_CFG;
                          return (
                            <tr key={s.id} className="border-b border-border/20 hover:bg-secondary/10">
                              <td className="py-2.5 font-medium max-w-36 truncate pr-2">🏪 {s.name}</td>
                              <td className="py-2.5 pr-2">
                                {f ? <Badge className={`text-[9px] px-1.5 py-0 ${pal.badgeClass}`}>{f.icon} {f.name}</Badge> : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="py-2.5 text-muted-foreground pr-2 max-w-28 truncate">{s.owner_name || "—"}</td>
                              <td className="py-2.5 pr-2">
                                <Badge className={`text-[9px] px-1.5 py-0 ${s.is_active && s.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : s.status === "suspended" ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-secondary text-muted-foreground"}`}>
                                  {s.is_active ? s.status : "hidden"}
                                </Badge>
                              </td>
                              <td className="py-2.5 pr-2">
                                <button onClick={() => toggleFeatured(s)}>
                                  <Badge className={`text-[9px] px-1.5 py-0 cursor-pointer ${s.is_featured ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-secondary text-muted-foreground border-border/40"}`}>
                                    {s.is_featured ? "⭐ Yes" : "No"}
                                  </Badge>
                                </button>
                              </td>
                              <td className="py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Suspend / Resume */}
                                  <button onClick={() => suspendToggle(s)} title={s.status === "suspended" ? "Resume store" : "Suspend store"}
                                    className={`p-1.5 rounded-lg transition-colors ${s.status === "suspended" ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400" : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-400"}`}>
                                    {s.status === "suspended" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                  </button>
                                  {/* Edit */}
                                  <button onClick={() => openEdit(s)} title="Edit store"
                                    className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 transition-colors">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Delete */}
                                  <button onClick={() => setDeleteConfirm(s)} title="Delete store"
                                    className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PRODUCTS */}
            {tab === "products" && (
              <div className="space-y-3">
                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input className="pl-8 h-8 text-xs bg-secondary/20" placeholder="Search products…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                  </div>
                  <Select value={productStoreFilter} onValueChange={setProductStoreFilter}>
                    <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All stores" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All stores</SelectItem>
                      {stores.map((s) => <SelectItem key={s.id} value={s.id}>🏪 {s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">{filteredProducts.length} products</span>
                  <button onClick={() => { setProductForm(EMPTY_PRODUCT_FORM); setShowAddProduct(true); }}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                    <Plus className="w-3.5 h-3.5" />Add Product
                  </button>
                </div>
                {loading ? (
                  <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="h-10 animate-pulse bg-secondary/20 rounded-lg" />)}</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="w-10 h-10 mb-2 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">No products yet</p>
                    <button onClick={() => { setProductForm(EMPTY_PRODUCT_FORM); setShowAddProduct(true); }}
                      className="mt-3 text-xs text-primary hover:underline">+ Add your first product</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/50">
                          {["Product","Store","Category","Price","Status","Featured","Sales",""].map((h, i) => (
                            <th key={i} className={`py-2.5 font-semibold text-muted-foreground text-left ${i === 7 ? "text-right" : ""} pr-2`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p) => {
                          const s = stores.find((st) => st.id === p.store_id);
                          return (
                            <tr key={p.id} className="border-b border-border/20 hover:bg-secondary/10">
                              <td className="py-2.5 font-medium max-w-36 pr-2">
                                <div className="flex items-center gap-1.5">
                                  {(p as any).thumbnail_url
                                    ? <img src={(p as any).thumbnail_url} className="w-6 h-6 rounded object-cover shrink-0" />
                                    : <span className="text-base shrink-0">📦</span>}
                                  <span className="truncate">{p.name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 text-muted-foreground pr-2 max-w-28 truncate">{s?.name || "—"}</td>
                              <td className="py-2.5 text-muted-foreground pr-2 max-w-24 truncate">{p.category || "—"}</td>
                              <td className="py-2.5 pr-2"><PriceBadge cents={p.price_cents} model={p.pricing_model} /></td>
                              <td className="py-2.5 pr-2">
                                <button onClick={() => toggleProductActive(p)}>
                                  <Badge className={`text-[9px] px-1.5 py-0 cursor-pointer ${p.is_active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-secondary text-muted-foreground"}`}>
                                    {p.is_active ? "Active" : "Hidden"}
                                  </Badge>
                                </button>
                              </td>
                              <td className="py-2.5 pr-2">
                                <button onClick={() => { db.from("mall_products").update({ is_featured: !p.is_featured }).eq("id", p.id); load(); }}>
                                  <Badge className={`text-[9px] px-1.5 py-0 cursor-pointer ${p.is_featured ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-secondary text-muted-foreground border-border/40"}`}>
                                    {p.is_featured ? "⭐ Yes" : "No"}
                                  </Badge>
                                </button>
                              </td>
                              <td className="py-2.5 pr-2 text-muted-foreground">{p.sales_count}</td>
                              <td className="py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => openEditProduct(p)} title="Edit product"
                                    className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 transition-colors">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setDeleteProductConfirm(p)} title="Delete product"
                                    className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* APPLICATIONS */}
            {tab === "applications" && (
              applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center"><CheckCircle2 className="w-10 h-10 mb-2 text-muted-foreground/20" /><p className="text-sm text-muted-foreground">No applications yet</p></div>
              ) : (
                <div className="space-y-2">
                  {applications.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-border/50 hover:bg-secondary/10">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{a.store_name}</span>
                          <Badge className={`text-[9px] px-1.5 py-0 ml-auto ${a.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : a.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-amber-500/20 text-amber-400 border-amber-500/40"}`}>{a.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1">
                          {a.contact_name && <span>👤 {a.contact_name}</span>}
                          {a.contact_email && <span>📧 {a.contact_email}</span>}
                          {a.contact_phone && <span>📞 {a.contact_phone}</span>}
                        </div>
                        {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                        {a.reason && <p className="text-[10px] text-muted-foreground mt-1 italic">"{a.reason}"</p>}
                      </div>
                      {a.status === "pending" && (
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => approveApp(a.id, true)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400" title="Approve"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => approveApp(a.id, false)} className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400" title="Reject"><XCircle className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                      {a.status === "approved" && (
                        <button onClick={() => approveApp(a.id, true)} className="shrink-0 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-medium flex items-center gap-1" title="Create store (re-approve)">
                          <Store className="w-3 h-3" />Create Store
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* FLOORS */}
            {tab === "floors" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {floors.map((f) => {
                    const pal = MALL_FLOOR_COLORS[f.color] || FALLBACK_FLOOR_CFG;
                    const count = stores.filter((s) => s.floor_id === f.id).length;
                    return (
                      <Card key={f.id} className={`p-3 flex items-center gap-3 ${pal.hoverBorder} border transition-colors bg-secondary/10`}>
                        <span className="text-2xl">{f.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{f.name}</p>
                          <p className="text-[10px] text-muted-foreground">{f.name_ar}</p>
                          <p className="text-[10px] text-muted-foreground">{count} stores</p>
                        </div>
                        <Badge className={`text-[9px] px-1.5 py-0 ${pal.badgeClass}`}>{f.color}</Badge>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ANALYTICS */}
            {tab === "analytics" && (
              <div className="space-y-7">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-4 bg-secondary/10 text-center"><p className="text-2xl font-bold text-primary">{stores.length}</p><p className="text-[10px] text-muted-foreground">Total Stores</p></Card>
                  <Card className="p-4 bg-secondary/10 text-center"><p className="text-2xl font-bold text-emerald-400">{activeStores}</p><p className="text-[10px] text-muted-foreground">Active</p></Card>
                  <Card className="p-4 bg-secondary/10 text-center"><p className="text-2xl font-bold text-amber-400">{products.length}</p><p className="text-[10px] text-muted-foreground">Products</p></Card>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stores by Floor</p>
                  <div className="space-y-3">
                    {floors.map((f) => {
                      const cnt = stores.filter((s) => s.floor_id === f.id).length;
                      const pct = stores.length ? Math.round((cnt / stores.length) * 100) : 0;
                      const pal = MALL_FLOOR_COLORS[f.color] || FALLBACK_FLOOR_CFG;
                      return (
                        <div key={f.id} className="flex items-center gap-3">
                          <span className="text-base w-6 text-center">{f.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-medium">{f.name}</span>
                              <span className="text-muted-foreground">{cnt} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-secondary/40">
                              <div className={`h-full rounded-full ${pal.barColor} transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Store Status</p>
                  <div className="grid grid-cols-4 gap-2">
                    {["active","pending","suspended","rejected"].map((st) => (
                      <Card key={st} className="p-3 bg-secondary/10 text-center">
                        <p className="text-xl font-bold">{stores.filter((s) => s.status === st).length}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{st}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add / Edit Product Dialog ─────────────────────────── */}
      {(showAddProduct || !!editProduct) && (() => {
        const isNew = !editProduct;
        return (
          <Dialog open={true} onOpenChange={(v) => { if (!v) { setShowAddProduct(false); setEditProduct(null); setProductForm(EMPTY_PRODUCT_FORM); } }}>
            <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {isNew ? <Plus className="w-4 h-4 text-primary" /> : <Pencil className="w-4 h-4 text-primary" />}
                  {isNew ? "Add Product" : "Edit Product"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5 block">Product Name *</Label>
                    <Input className="h-8 text-sm" placeholder="My Product" value={productForm.name} onChange={(e) => setPF("name", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5 block">Description</Label>
                    <Textarea className="text-sm resize-none" rows={2} placeholder="What is this product?" value={productForm.description} onChange={(e) => setPF("description", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5 block">Store *</Label>
                    <Select value={productForm.store_id || "__none__"} onValueChange={(v) => setPF("store_id", v === "__none__" ? "" : v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select store" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Select store —</SelectItem>
                        {stores.map((s) => <SelectItem key={s.id} value={s.id}>🏪 {s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Category</Label>
                    <Input className="h-8 text-sm" placeholder="e.g. Electronics" value={productForm.category} onChange={(e) => setPF("category", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Pricing Model</Label>
                    <Select value={productForm.pricing_model} onValueChange={(v) => setPF("pricing_model", v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">One-time</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="contact">Contact for price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Price (USD)</Label>
                    <Input className="h-8 text-sm" type="number" min="0" step="0.01" placeholder="0.00" value={productForm.price_cents} onChange={(e) => setPF("price_cents", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Compare Price (optional)</Label>
                    <Input className="h-8 text-sm" type="number" min="0" step="0.01" placeholder="Original price" value={productForm.compare_price_cents} onChange={(e) => setPF("compare_price_cents", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Stock Qty</Label>
                    <Input className="h-8 text-sm" type="number" min="0" placeholder="Leave blank = unlimited" value={productForm.stock_qty} onChange={(e) => setPF("stock_qty", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs mb-1.5 block">Thumbnail URL</Label>
                    <Input className="h-8 text-sm" placeholder="https://…" value={productForm.thumbnail_url} onChange={(e) => setPF("thumbnail_url", e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_digital" checked={productForm.is_digital as boolean} onChange={(e) => setPF("is_digital", e.target.checked)} className="accent-primary" />
                    <Label htmlFor="is_digital" className="text-xs cursor-pointer">Digital product</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_featured_p" checked={productForm.is_featured as boolean} onChange={(e) => setPF("is_featured", e.target.checked)} className="accent-primary" />
                    <Label htmlFor="is_featured_p" className="text-xs cursor-pointer">Featured ⭐</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { setShowAddProduct(false); setEditProduct(null); setProductForm(EMPTY_PRODUCT_FORM); }}>Cancel</Button>
                <Button size="sm" onClick={() => saveProduct(isNew)} disabled={productFormLoading} className="gap-1.5">
                  {productFormLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : isNew ? <Plus className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                  {isNew ? "Add Product" : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ── Delete Product Confirm ───────────────────────────────── */}
      <Dialog open={!!deleteProductConfirm} onOpenChange={(v) => !v && setDeleteProductConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="w-4 h-4" />Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Delete <span className="font-semibold text-foreground">"{deleteProductConfirm?.name}"</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteProductConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => deleteProductConfirm && confirmDeleteProduct(deleteProductConfirm)} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Store Dialog ─────────────────────────────────────── */}
      <Dialog open={!!editStore} onOpenChange={(v) => !v && setEditStore(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4 text-primary" />Edit Store</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">Store Name *</Label>
                <Input className="h-8 text-sm" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">Description</Label>
                <Textarea className="text-sm resize-none" rows={2} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">Floor / Category</Label>
                <Select value={editForm.floor_id || "__none__"} onValueChange={(v) => setEditForm((f) => ({ ...f, floor_id: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select floor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {floors.map((fl) => <SelectItem key={fl.id} value={fl.id}>{fl.icon} {fl.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Owner Name</Label>
                <Input className="h-8 text-sm" value={editForm.owner_name} onChange={(e) => setEditForm((f) => ({ ...f, owner_name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Email</Label>
                <Input className="h-8 text-sm" type="email" value={editForm.contact_email} onChange={(e) => setEditForm((f) => ({ ...f, contact_email: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Phone</Label>
                <Input className="h-8 text-sm" value={editForm.contact_phone} onChange={(e) => setEditForm((f) => ({ ...f, contact_phone: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1.5 block">Website</Label>
                <Input className="h-8 text-sm" value={editForm.website_url} onChange={(e) => setEditForm((f) => ({ ...f, website_url: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditStore(null)}>Cancel</Button>
            <Button size="sm" onClick={saveEdit} disabled={editLoading} className="gap-1.5">
              {editLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="w-4 h-4" />Delete Store</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteConfirm?.name}"</span>? This action cannot be undone and will remove all associated data.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => deleteConfirm && deleteStore(deleteConfirm)} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function DigitalMall() {
  const navigate = useNavigate();
  const db = supabase as any;

  const [floors, setFloors] = useState<MallFloor[]>([]);
  const [stores, setStores] = useState<MallStore[]>([]);
  const [products, setProducts] = useState<MallProduct[]>([]);
  const [followed, setFollowed] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFloor, setActiveFloor] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewGrid, setViewGrid] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [viewMode, setViewMode] = useState<"stores" | "products">("stores");
  const [detailStore, setDetailStore] = useState<MallStore | null>(null);

  const load = async () => {
    setLoading(true);
    await seedMallDefaults(db);
    const [{ data: f }, { data: s }, { data: p }] = await Promise.all([
      db.from("mall_floors").select("*").eq("is_active", true).order("sort_order"),
      db.from("mall_stores").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      db.from("mall_products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);
    setFloors(f?.length ? f : SEED_FLOORS.map((s, i) => ({ ...s, id: `seed-${i}` })) as any);
    setStores(s || []);
    setProducts(p || []);

    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);
    if (user) {
      const { data: fol } = await db.from("mall_store_followers").select("store_id").eq("user_id", user.id);
      setFollowed((fol || []).map((x: any) => x.store_id));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFollow = async (storeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth?tab=signin&redirect=/digital-mall"); return; }
    const isFollowed = followed.includes(storeId);
    if (isFollowed) {
      await db.from("mall_store_followers").delete().eq("store_id", storeId).eq("user_id", user.id);
      setFollowed((prev) => prev.filter((x) => x !== storeId));
      await db.from("mall_stores").update({ followers_count: (stores.find((s) => s.id === storeId)?.followers_count || 1) - 1 }).eq("id", storeId);
    } else {
      await db.from("mall_store_followers").insert({ store_id: storeId, user_id: user.id });
      setFollowed((prev) => [...prev, storeId]);
      await db.from("mall_stores").update({ followers_count: (stores.find((s) => s.id === storeId)?.followers_count || 0) + 1 }).eq("id", storeId);
    }
  };

  const floorMap = Object.fromEntries(floors.map((f) => [f.id, f]));

  const filteredStores = useMemo(() => {
    let r = [...stores];
    if (activeFloor !== "all") r = r.filter((s) => s.floor_id === activeFloor);
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter((s) => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.tags?.some((t) => t.toLowerCase().includes(q))); }
    switch (sortBy) {
      case "featured": r.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break;
      case "rating":   r.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "popular":  r.sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0)); break;
      case "newest":   r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return r;
  }, [stores, activeFloor, search, sortBy]);

  const filteredProducts = useMemo(() => {
    let r = [...products];
    if (activeFloor !== "all") {
      const floorStoreIds = stores.filter((s) => s.floor_id === activeFloor).map((s) => s.id);
      r = r.filter((p) => floorStoreIds.includes(p.store_id));
    }
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter((p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)); }
    if (sortBy === "price_low") r.sort((a, b) => a.price_cents - b.price_cents);
    if (sortBy === "price_high") r.sort((a, b) => b.price_cents - a.price_cents);
    if (sortBy === "rating") r.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === "popular") r.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
    return r;
  }, [products, activeFloor, search, stores, sortBy]);

  const kpis = {
    stores: stores.length,
    products: products.length,
    followed: followed.length,
    floors: floors.length,
  };

  const featuredStores = stores.filter((s) => s.is_featured);
  const newStores = stores.filter((s) => s.is_new).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-display font-bold text-base">Digital Mall</span>
          </div>
          <div className="relative flex-1 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="pl-9 h-8 text-sm bg-secondary/30"
              placeholder="Search stores, products, brands…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}><X className="w-3 h-3 text-muted-foreground" /></button>}
          </div>
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={load} title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <div className="flex items-center border border-border/50 rounded-lg overflow-hidden text-xs">
              <button onClick={() => setViewMode("stores")} className={`flex items-center gap-1 px-2.5 py-1.5 transition-colors ${viewMode === "stores" ? "bg-primary text-primary-foreground" : "hover:bg-secondary/30 text-muted-foreground"}`}>
                <Store className="w-3 h-3" />Stores
              </button>
              <button onClick={() => setViewMode("products")} className={`flex items-center gap-1 px-2.5 py-1.5 transition-colors ${viewMode === "products" ? "bg-primary text-primary-foreground" : "hover:bg-secondary/30 text-muted-foreground"}`}>
                <Package className="w-3 h-3" />Products
              </button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewGrid(!viewGrid)}>
              {viewGrid ? <List className="w-3.5 h-3.5" /> : <Grid3X3 className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => setShowManager(true)}>
              <Settings className="w-3.5 h-3.5" />Manage
            </Button>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowApply(true)}>
              <Plus className="w-3.5 h-3.5" />Open Store
            </Button>
          </div>
        </div>
      </header>

      {/* ══ MANAGER DRAWER ══════════════════════════════════════════════════ */}
      {showManager && <MallManagerDrawer onClose={() => setShowManager(false)} currentUserId={currentUserId} />}

      <div className="px-4 py-4 max-w-7xl mx-auto space-y-5">

        {/* ══ HERO BANNER ══════════════════════════════════════════════════ */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-violet-600/10 to-pink-600/5 border border-primary/20 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏬</span>
                <Badge className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary border-primary/40">Digital Mall</Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1.5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Your Online Shopping Destination
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Browse hundreds of stores and thousands of products in one place. From electronics to fashion, food to digital services.
              </p>
              <div className="flex items-center gap-4 mt-3">
                {[
                  { value: kpis.stores,   label: "Stores",   icon: "🏪" },
                  { value: kpis.products, label: "Products", icon: "📦" },
                  { value: kpis.floors,   label: "Floors",   icon: "🏬" },
                ].map(({ value, label, icon }) => (
                  <div key={label} className="text-center">
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{icon} {label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {currentUserId ? (
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowApply(true)}>
                  <Sparkles className="w-3.5 h-3.5" />Open Your Store
                </Button>
              ) : (
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/auth?tab=signin&redirect=/digital-mall")}>
                  Sign In to Shop
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ══ KPI STRIP ════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label:"Total Stores",    value: kpis.stores,   icon:"🏪", color:"text-primary"     },
            { label:"Products",        value: kpis.products,  icon:"📦", color:"text-violet-400"  },
            { label:"Following",       value: kpis.followed,  icon:"❤️", color:"text-rose-400"    },
            { label:"Mall Floors",     value: kpis.floors,    icon:"🏬", color:"text-blue-400"    },
          ].map(({ label, value, icon, color }) => (
            <Card key={label} className="p-3 flex items-center gap-2.5 bg-secondary/10">
              <span className="text-base shrink-0">{icon}</span>
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
                <p className={`text-lg font-bold leading-tight ${color}`}>{value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* ══ FEATURED STORES STRIP ════════════════════════════════════════ */}
        {featuredStores.length > 0 && viewMode === "stores" && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold">Featured Stores</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {featuredStores.map((s) => {
                const pal = MALL_FLOOR_COLORS[s.cover_color] || FALLBACK_FLOOR_CFG;
                return (
                  <div
                    key={s.id}
                    className={`shrink-0 w-48 p-3 rounded-xl border ${pal.border} bg-gradient-to-br ${pal.gradient} cursor-pointer ${pal.hoverBorder} transition-all hover:shadow-lg ${pal.shadow}`}
                    onClick={() => setDetailStore(s)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-10 h-10 rounded-lg bg-background/30 flex items-center justify-center text-xl overflow-hidden border ${pal.border}`}>
                        {s.logo_url ? <img src={s.logo_url} className="w-full h-full object-cover" alt={s.name} /> : "🏪"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{s.name}</p>
                        {s.is_verified && <Shield className="w-3 h-3 text-blue-400" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1.5">{s.description}</p>
                    <div className="flex items-center justify-between">
                      <Stars rating={s.rating} size="xs" />
                      <span className="text-[9px] text-muted-foreground">{s.products_count} items</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ NEW STORES ════════════════════════════════════════════════════ */}
        {newStores.length > 0 && viewMode === "stores" && activeFloor === "all" && !search && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold">New Arrivals</span>
              <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ml-1">New</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {newStores.map((s) => {
                const pal = MALL_FLOOR_COLORS[s.cover_color] || FALLBACK_FLOOR_CFG;
                const floor = floorMap[s.floor_id || ""];
                return (
                  <div key={s.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${pal.border} bg-gradient-to-r ${pal.gradient} cursor-pointer ${pal.hoverBorder} transition-all`} onClick={() => setDetailStore(s)}>
                    <span className="text-xl shrink-0">🏪</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{s.name}</p>
                      {floor && <p className="text-[10px] text-muted-foreground truncate">{floor.icon} {floor.name}</p>}
                    </div>
                    <Badge className="text-[9px] px-1 py-0 bg-emerald-500/30 text-emerald-400 border-emerald-500/40 shrink-0">New</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ FLOOR SELECTOR ════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFloor("all")}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${activeFloor === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground hover:bg-secondary/20"}`}
          >
            🏬 All Floors <span className="text-[10px] opacity-70">{stores.length}</span>
          </button>
          {floors.map((f) => {
            const pal = MALL_FLOOR_COLORS[f.color] || FALLBACK_FLOOR_CFG;
            const count = stores.filter((s) => s.floor_id === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFloor(f.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${activeFloor === f.id ? `${pal.border} bg-gradient-to-r ${pal.gradient} shadow-sm` : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground hover:bg-secondary/20"}`}
              >
                {f.icon} {f.name} <span className="text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {/* ══ FILTER BAR ═══════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {viewMode === "stores" ? filteredStores.length : filteredProducts.length}
            {" "}{viewMode}
            {activeFloor !== "all" && <span className="ml-1 font-medium text-foreground">in {floors.find((f) => f.id === activeFloor)?.name}</span>}
          </span>
          {(search || activeFloor !== "all") && (
            <button className="text-xs text-primary hover:underline flex items-center gap-1" onClick={() => { setSearch(""); setActiveFloor("all"); }}>
              <X className="w-3 h-3" />Clear
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-7 text-xs w-36 gap-1">
                <TrendingUp className="w-3 h-3 shrink-0" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                {viewMode === "products" && <SelectItem value="price_low">Price: Low → High</SelectItem>}
                {viewMode === "products" && <SelectItem value="price_high">Price: High → Low</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ══ CONTENT ══════════════════════════════════════════════════════ */}
        {loading ? (
          <div className={`grid gap-3 ${viewGrid ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
            {Array.from({ length: 8 }).map((_, i) => <Card key={i} className="h-44 animate-pulse bg-secondary/20" />)}
          </div>
        ) : viewMode === "stores" ? (
          filteredStores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Store className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm mb-1">{stores.length === 0 ? "No stores yet" : "No stores match your filters"}</p>
              <p className="text-xs text-muted-foreground mb-4">{stores.length === 0 ? "Be the first to open a store!" : "Try adjusting your search"}</p>
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowApply(true)}>
                <Plus className="w-3.5 h-3.5" />Open Your Store
              </Button>
            </div>
          ) : viewGrid ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredStores.map((s) => (
                <StoreCard key={s.id} store={s} floor={floorMap[s.floor_id || ""] || null} followed={followed.includes(s.id)} onFollow={handleFollow} onView={setDetailStore} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStores.map((s) => {
                const pal = MALL_FLOOR_COLORS[s.cover_color] || FALLBACK_FLOOR_CFG;
                const floor = floorMap[s.floor_id || ""];
                return (
                  <Card key={s.id} className={`flex items-center gap-4 p-3 cursor-pointer ${pal.hoverBorder} border transition-colors hover:bg-secondary/10`} onClick={() => setDetailStore(s)}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pal.gradient} border ${pal.border} flex items-center justify-center text-xl shrink-0 overflow-hidden`}>
                      {s.logo_url ? <img src={s.logo_url} className="w-full h-full object-cover" alt={s.name} /> : "🏪"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm">{s.name}</span>
                        {s.is_verified && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
                        {floor && <Badge className={`text-[9px] px-1.5 py-0 ${pal.badgeClass}`}>{floor.icon} {floor.name}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <Stars rating={s.rating} size="xs" />
                        <span className="text-[10px] text-muted-foreground">{s.products_count} products · {s.followers_count} followers</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleFollow(s.id); }}>
                        <Heart className={`w-3.5 h-3.5 ${followed.includes(s.id) ? "fill-rose-400 text-rose-400" : "text-muted-foreground"}`} />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          // Products view
          filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm mb-1">{products.length === 0 ? "No products yet" : "No products match your filters"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} store={stores.find((s) => s.id === p.store_id) || null} />
              ))}
            </div>
          )
        )}
      </div>

      {/* ══ DIALOGS ══════════════════════════════════════════════════════════ */}
      <StoreDetailDialog
        store={detailStore}
        floor={detailStore ? (floorMap[detailStore.floor_id || ""] || null) : null}
        products={products}
        open={!!detailStore}
        onClose={() => setDetailStore(null)}
        followed={detailStore ? followed.includes(detailStore.id) : false}
        onFollow={handleFollow}
      />
      <ApplyStoreDialog open={showApply} onClose={() => setShowApply(false)} floors={floors} />
    </div>
  );
}
