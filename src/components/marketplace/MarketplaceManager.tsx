import { useEffect, useState, useMemo } from "react";
import {
  Plus, Trash2, Pencil, X, Check, RefreshCw, Settings,
  PackagePlus, FolderPlus, ClipboardList, CheckCircle2, XCircle,
  Layers, ChevronDown, ChevronRight, Copy, EyeOff, Eye, GripVertical,
  LayoutDashboard, BarChart2, Store, Search, ShoppingBag,
} from "lucide-react";
import { seedMarketplaceDefaults, MARKETPLACE_SEED_TYPES } from "./marketplaceSeed";
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

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
export type PricingModel = "free" | "one_time" | "monthly" | "annual" | "contact";

export interface Listing {
  id: string;
  listing_type: string;
  name: string;
  description: string;
  long_description?: string;
  thumbnail_url?: string;
  category: string;
  sub_category?: string;
  tags: string[];
  price_cents: number;
  currency: string;
  pricing_model: PricingModel;
  publisher_name: string;
  publisher_avatar?: string;
  publisher_user_id?: string;
  rating: number;
  reviews_count: number;
  sales_count: number;
  is_featured: boolean;
  is_new: boolean;
  is_verified: boolean;
  is_active?: boolean;
  meta: Record<string, any>;
  created_at: string;
}

export interface MpCategory {
  id: string;
  listing_type: string;
  name: string;
  parent_id: string | null;
  sort_order?: number;
}

export interface MpListingType {
  id: string;
  code: string;
  label: string;
  label_ar: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  is_built_in: boolean;
  default_categories: string[];
}

/* ═══════════════════════════════════════════════════════════
   COLOR PALETTE  (static so Tailwind never purges these)
═══════════════════════════════════════════════════════════ */
export const COLOR_PALETTE: Record<string, {
  gradient: string; border: string; badgeClass: string;
  hoverBorder: string; shadow: string;
}> = {
  violet:  { gradient:"from-violet-600/20 via-blue-600/10 to-transparent",  border:"border-violet-500/40",  badgeClass:"bg-violet-500/20 text-violet-300 border-violet-500/40",   hoverBorder:"hover:border-violet-500/50",  shadow:"hover:shadow-violet-500/5"  },
  emerald: { gradient:"from-emerald-600/20 via-teal-600/10 to-transparent",  border:"border-emerald-500/40", badgeClass:"bg-emerald-500/20 text-emerald-300 border-emerald-500/40",  hoverBorder:"hover:border-emerald-500/50", shadow:"hover:shadow-emerald-500/5" },
  amber:   { gradient:"from-amber-600/20 via-orange-600/10 to-transparent",  border:"border-amber-500/40",   badgeClass:"bg-amber-500/20 text-amber-300 border-amber-500/40",     hoverBorder:"hover:border-amber-500/50",   shadow:"hover:shadow-amber-500/5"   },
  pink:    { gradient:"from-pink-600/20 via-rose-600/10 to-transparent",     border:"border-pink-500/40",    badgeClass:"bg-pink-500/20 text-pink-300 border-pink-500/40",        hoverBorder:"hover:border-pink-500/50",    shadow:"hover:shadow-pink-500/5"    },
  blue:    { gradient:"from-blue-600/20 via-cyan-600/10 to-transparent",     border:"border-blue-500/40",    badgeClass:"bg-blue-500/20 text-blue-300 border-blue-500/40",        hoverBorder:"hover:border-blue-500/50",    shadow:"hover:shadow-blue-500/5"    },
  rose:    { gradient:"from-rose-600/20 via-pink-600/10 to-transparent",     border:"border-rose-500/40",    badgeClass:"bg-rose-500/20 text-rose-300 border-rose-500/40",        hoverBorder:"hover:border-rose-500/50",    shadow:"hover:shadow-rose-500/5"    },
  cyan:    { gradient:"from-cyan-600/20 via-teal-600/10 to-transparent",     border:"border-cyan-500/40",    badgeClass:"bg-cyan-500/20 text-cyan-300 border-cyan-500/40",        hoverBorder:"hover:border-cyan-500/50",    shadow:"hover:shadow-cyan-500/5"    },
  orange:  { gradient:"from-orange-600/20 via-amber-600/10 to-transparent",  border:"border-orange-500/40",  badgeClass:"bg-orange-500/20 text-orange-300 border-orange-500/40",  hoverBorder:"hover:border-orange-500/50",  shadow:"hover:shadow-orange-500/5"  },
  purple:  { gradient:"from-purple-600/20 via-violet-600/10 to-transparent", border:"border-purple-500/40",  badgeClass:"bg-purple-500/20 text-purple-300 border-purple-500/40",  hoverBorder:"hover:border-purple-500/50",  shadow:"hover:shadow-purple-500/5"  },
  teal:    { gradient:"from-teal-600/20 via-emerald-600/10 to-transparent",  border:"border-teal-500/40",    badgeClass:"bg-teal-500/20 text-teal-300 border-teal-500/40",        hoverBorder:"hover:border-teal-500/50",    shadow:"hover:shadow-teal-500/5"    },
  red:     { gradient:"from-red-600/20 via-rose-600/10 to-transparent",      border:"border-red-500/40",     badgeClass:"bg-red-500/20 text-red-300 border-red-500/40",           hoverBorder:"hover:border-red-500/50",     shadow:"hover:shadow-red-500/5"     },
  yellow:  { gradient:"from-yellow-600/20 via-amber-600/10 to-transparent",  border:"border-yellow-500/40",  badgeClass:"bg-yellow-500/20 text-yellow-300 border-yellow-500/40",  hoverBorder:"hover:border-yellow-500/50",  shadow:"hover:shadow-yellow-500/5"  },
};

const COLOR_DOTS: Record<string, string> = {
  violet:"bg-violet-500", emerald:"bg-emerald-500", amber:"bg-amber-500", pink:"bg-pink-500",
  blue:"bg-blue-500", rose:"bg-rose-500", cyan:"bg-cyan-500", orange:"bg-orange-500",
  purple:"bg-purple-500", teal:"bg-teal-500", red:"bg-red-500", yellow:"bg-yellow-500",
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
interface ListingForm {
  listing_type: string;
  name: string; description: string; long_description: string;
  thumbnail_url: string; category: string; sub_category: string; tags: string;
  price_cents: string; currency: string; pricing_model: PricingModel;
  publisher_name: string; is_featured: boolean; is_new: boolean; is_verified: boolean;
  file_type: string; file_size: string; version: string;
  compatibility: string; license_type: string; demo_url: string;
  weight_kg: string; dimensions: string; sku: string;
  stock_qty: string; shipping_zones: string; material: string; brand: string;
  delivery_days: string; revisions: string;
  packages: Array<{ name: string; price_cents: string; features: string[] }>;
  max_users: string; storage_gb: string; trial_days: string;
  billing_cycle: string; features: string[];
  platform: string; region_lock: string;
}

const EMPTY_FORM: ListingForm = {
  listing_type: "digital", name: "", description: "", long_description: "",
  thumbnail_url: "", category: "", sub_category: "", tags: "",
  price_cents: "0", currency: "USD", pricing_model: "free",
  publisher_name: "", is_featured: false, is_new: false, is_verified: false,
  file_type: "", file_size: "", version: "", compatibility: "", license_type: "", demo_url: "",
  weight_kg: "", dimensions: "", sku: "", stock_qty: "", shipping_zones: "", material: "", brand: "",
  delivery_days: "", revisions: "",
  packages: [{ name: "Basic", price_cents: "0", features: [""] }],
  max_users: "", storage_gb: "", trial_days: "", billing_cycle: "monthly", features: [""],
  platform: "", region_lock: "",
};

function PriceBadge({ price_cents, pricing_model }: { price_cents: number; pricing_model: PricingModel }) {
  const label =
    pricing_model === "free" || price_cents === 0 ? "Free"
    : pricing_model === "contact" ? "Contact"
    : `$${(price_cents / 100).toFixed(0)}${pricing_model === "monthly" ? "/mo" : pricing_model === "annual" ? "/yr" : ""}`;
  const cls =
    label === "Free" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
    : label === "Contact" ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
    : "bg-primary/20 text-primary border-primary/40";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${cls}`}>{label}</span>;
}

/* ═══════════════════════════════════════════════════════════
   ADD / EDIT LISTING DIALOG
═══════════════════════════════════════════════════════════ */
export function AddEditListingDialog({
  open, onClose, listing, onSaved, allCategories, allTypes,
}: {
  open: boolean; onClose: () => void;
  listing: Listing | null; onSaved: () => void;
  allCategories: MpCategory[]; allTypes: MpListingType[];
}) {
  const [form, setForm] = useState<ListingForm>({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const db = supabase as any;

  useEffect(() => {
    if (!open) return;
    if (listing) {
      setForm({
        listing_type: listing.listing_type,
        name: listing.name || "",
        description: listing.description || "",
        long_description: listing.long_description || "",
        thumbnail_url: listing.thumbnail_url || "",
        category: listing.category || "",
        sub_category: listing.sub_category || "",
        tags: (listing.tags || []).join(", "),
        price_cents: String(listing.price_cents ?? 0),
        currency: listing.currency || "USD",
        pricing_model: listing.pricing_model || "free",
        publisher_name: listing.publisher_name || "",
        is_featured: listing.is_featured || false,
        is_new: listing.is_new || false,
        is_verified: listing.is_verified || false,
        file_type: listing.meta?.file_type || "",
        file_size: listing.meta?.file_size || "",
        version: listing.meta?.version || "",
        compatibility: listing.meta?.compatibility || "",
        license_type: listing.meta?.license_type || "",
        demo_url: listing.meta?.demo_url || "",
        weight_kg: String(listing.meta?.weight_kg ?? ""),
        dimensions: listing.meta?.dimensions || "",
        sku: listing.meta?.sku || "",
        stock_qty: String(listing.meta?.stock_qty ?? ""),
        shipping_zones: listing.meta?.shipping_zones || "",
        material: listing.meta?.material || "",
        brand: listing.meta?.brand || "",
        delivery_days: String(listing.meta?.delivery_days ?? ""),
        revisions: String(listing.meta?.revisions ?? ""),
        packages: listing.meta?.packages?.length
          ? listing.meta.packages.map((p: any) => ({ name: p.name, price_cents: String(p.price_cents), features: p.features?.length ? p.features : [""] }))
          : [{ name: "Basic", price_cents: "0", features: [""] }],
        max_users: String(listing.meta?.max_users ?? ""),
        storage_gb: String(listing.meta?.storage_gb ?? ""),
        trial_days: String(listing.meta?.trial_days ?? ""),
        billing_cycle: listing.meta?.billing_cycle || "monthly",
        features: listing.meta?.features?.length ? listing.meta.features : [""],
        platform: listing.meta?.platform || "",
        region_lock: listing.meta?.region_lock || "",
      });
    } else {
      setForm({ ...EMPTY_FORM, listing_type: allTypes[0]?.code || "digital" });
    }
  }, [listing, open]);

  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const activeType = allTypes.find((t) => t.code === form.listing_type);
  const mainCats = allCategories.filter((c) => c.listing_type === form.listing_type && !c.parent_id);
  const builtInCats = activeType?.default_categories || [];
  const allMainCatNames = [...new Set([...builtInCats, ...mainCats.map((c) => c.name)])];
  const parentCat = mainCats.find((c) => c.name === form.category);
  const filteredSubs = parentCat ? allCategories.filter((c) => c.parent_id === parentCat.id) : [];

  const buildMeta = (): Record<string, any> => {
    const m: Record<string, any> = {};
    if (form.listing_type === "digital") {
      if (form.file_type) m.file_type = form.file_type;
      if (form.file_size) m.file_size = form.file_size;
      if (form.version) m.version = form.version;
      if (form.compatibility) m.compatibility = form.compatibility;
      if (form.license_type) m.license_type = form.license_type;
      if (form.demo_url) m.demo_url = form.demo_url;
    } else if (form.listing_type === "physical") {
      if (form.weight_kg) m.weight_kg = parseFloat(form.weight_kg);
      if (form.dimensions) m.dimensions = form.dimensions;
      if (form.sku) m.sku = form.sku;
      if (form.stock_qty !== "") m.stock_qty = parseInt(form.stock_qty) || 0;
      if (form.shipping_zones) m.shipping_zones = form.shipping_zones;
      if (form.material) m.material = form.material;
      if (form.brand) m.brand = form.brand;
    } else if (form.listing_type === "service") {
      if (form.delivery_days) m.delivery_days = parseInt(form.delivery_days);
      if (form.revisions) m.revisions = parseInt(form.revisions);
      m.packages = form.packages.filter((p) => p.name.trim()).map((p) => ({
        name: p.name, price_cents: parseInt(p.price_cents) || 0,
        features: p.features.filter((f) => f.trim()),
      }));
    } else if (form.listing_type === "subscription") {
      if (form.max_users) m.max_users = parseInt(form.max_users);
      if (form.storage_gb) m.storage_gb = parseInt(form.storage_gb);
      if (form.trial_days) m.trial_days = parseInt(form.trial_days);
      if (form.billing_cycle) m.billing_cycle = form.billing_cycle;
      m.features = form.features.filter((f) => f.trim());
    } else if (form.listing_type === "virtual") {
      if (form.platform) m.platform = form.platform;
      if (form.region_lock) m.region_lock = form.region_lock;
      if (form.version) m.version = form.version;
    }
    return m;
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.description.trim()) return toast.error("Description is required");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        listing_type: form.listing_type,
        name: form.name.trim(), description: form.description.trim(),
        long_description: form.long_description.trim() || null,
        thumbnail_url: form.thumbnail_url.trim() || null,
        category: form.category || null, sub_category: form.sub_category.trim() || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        price_cents: form.pricing_model === "free" ? 0 : parseInt(form.price_cents) || 0,
        currency: form.currency, pricing_model: form.pricing_model,
        publisher_name: form.publisher_name.trim() || user?.email || "",
        publisher_user_id: user?.id || null,
        is_featured: form.is_featured, is_new: form.is_new, is_verified: form.is_verified,
        meta: buildMeta(), is_active: true,
      };
      if (listing?.id) {
        await db.from("mp_listings").update(payload).eq("id", listing.id);
        toast.success("Listing updated");
      } else {
        await db.from("mp_listings").insert(payload);
        toast.success("Listing created");
      }
      onSaved(); onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save listing");
    } finally { setLoading(false); }
  };

  const addPackage = () => form.packages.length < 3 && set("packages", [...form.packages, { name: "", price_cents: "0", features: [""] }]);
  const removePackage = (i: number) => set("packages", form.packages.filter((_, j) => j !== i));
  const updatePackage = (i: number, k: string, v: any) => { const p = [...form.packages]; p[i] = { ...p[i], [k]: v }; set("packages", p); };
  const addPkgFeature = (i: number) => { const p = [...form.packages]; p[i] = { ...p[i], features: [...p[i].features, ""] }; set("packages", p); };
  const updatePkgFeature = (i: number, j: number, v: string) => { const p = [...form.packages]; const f = [...p[i].features]; f[j] = v; p[i] = { ...p[i], features: f }; set("packages", p); };
  const removePkgFeature = (i: number, j: number) => { const p = [...form.packages]; p[i] = { ...p[i], features: p[i].features.filter((_, k) => k !== j) }; set("packages", p); };
  const addFeature = () => set("features", [...form.features, ""]);
  const updateFeature = (i: number, v: string) => { const f = [...form.features]; f[i] = v; set("features", f); };
  const removeFeature = (i: number) => set("features", form.features.filter((_, j) => j !== i));
  const isFree = form.pricing_model === "free" || form.pricing_model === "contact";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{listing ? "Edit Listing" : "Add New Listing"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Basic Info */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Basic Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Listing Type *</Label>
                <Select value={form.listing_type} onValueChange={(v) => set("listing_type", v)} disabled={!!listing}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allTypes.filter((t) => t.is_active).map((t) => (
                      <SelectItem key={t.code} value={t.code}>{t.icon} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Name *</Label>
                <Input className="mt-1 h-9" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Listing name" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Short Description *</Label>
              <Textarea className="mt-1" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description..." />
            </div>
            <div>
              <Label className="text-xs">Detailed Description</Label>
              <Textarea className="mt-1" rows={3} value={form.long_description} onChange={(e) => set("long_description", e.target.value)} placeholder="Full description..." />
            </div>
            <div>
              <Label className="text-xs">Thumbnail URL</Label>
              <Input className="mt-1 h-9" value={form.thumbnail_url} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="https://..." />
            </div>
          </section>
          <div className="border-t border-border/30" />
          {/* Classification */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Classification</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Main Category</Label>
                <Select value={form.category || "__none__"} onValueChange={(v) => set("category", v === "__none__" ? "" : v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {allMainCatNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Sub-category</Label>
                {filteredSubs.length > 0 ? (
                  <Select value={form.sub_category || "__none__"} onValueChange={(v) => set("sub_category", v === "__none__" ? "" : v)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select sub-category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {filteredSubs.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input className="mt-1 h-9" value={form.sub_category} onChange={(e) => set("sub_category", e.target.value)} placeholder="e.g. Frontend Tools" />
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input className="mt-1 h-9" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="react, typescript, dashboard" />
            </div>
          </section>
          <div className="border-t border-border/30" />
          {/* Pricing */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pricing & Publisher</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Pricing Model *</Label>
                <Select value={form.pricing_model} onValueChange={(v) => set("pricing_model", v as PricingModel)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="one_time">One-time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Price (cents) 2999=$29.99</Label>
                <Input className="mt-1 h-9" type="number" min="0" value={form.price_cents} onChange={(e) => set("price_cents", e.target.value)} disabled={isFree} />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["USD","EUR","GBP","EGP","SAR","AED"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Publisher / Seller Name</Label>
              <Input className="mt-1 h-9" value={form.publisher_name} onChange={(e) => set("publisher_name", e.target.value)} placeholder="Your name or brand" />
            </div>
            <div className="flex items-center gap-6">
              {([{ key:"is_featured",label:"⭐ Featured" },{ key:"is_new",label:"🆕 New" },{ key:"is_verified",label:"✅ Verified" }] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form[key] as boolean} onChange={(e) => set(key, e.target.checked)} className="w-4 h-4 rounded border-border accent-primary cursor-pointer" />
                  <span className="text-xs">{label}</span>
                </label>
              ))}
            </div>
          </section>
          <div className="border-t border-border/30" />
          {/* Type-specific Details */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {activeType?.icon || "📦"} {activeType?.label || form.listing_type} Details
            </p>
            {form.listing_type === "digital" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">File Type</Label>
                  <Select value={form.file_type || "__none__"} onValueChange={(v) => set("file_type", v === "__none__" ? "" : v)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {["ZIP","PDF","PNG/PSD","MP4","MP3","EPUB","HTML","JS/TS","Python","Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">File Size</Label><Input className="mt-1 h-9" value={form.file_size} onChange={(e) => set("file_size", e.target.value)} placeholder="e.g. 45 MB" /></div>
                <div><Label className="text-xs">Version</Label><Input className="mt-1 h-9" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="e.g. 2.1.0" /></div>
                <div>
                  <Label className="text-xs">License Type</Label>
                  <Select value={form.license_type || "__none__"} onValueChange={(v) => set("license_type", v === "__none__" ? "" : v)}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {["MIT","GPL","Apache 2.0","Commercial","Personal Use Only","Extended Commercial","SaaS License"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label className="text-xs">Compatibility / Requirements</Label><Input className="mt-1 h-9" value={form.compatibility} onChange={(e) => set("compatibility", e.target.value)} placeholder="e.g. React 18+, Node.js 20+" /></div>
                <div className="col-span-2"><Label className="text-xs">Demo URL</Label><Input className="mt-1 h-9" value={form.demo_url} onChange={(e) => set("demo_url", e.target.value)} placeholder="https://demo.example.com" /></div>
              </div>
            )}
            {form.listing_type === "physical" && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Brand</Label><Input className="mt-1 h-9" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Brand name" /></div>
                <div><Label className="text-xs">SKU</Label><Input className="mt-1 h-9" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="PROD-001" /></div>
                <div><Label className="text-xs">Stock Quantity</Label><Input className="mt-1 h-9" type="number" min="0" value={form.stock_qty} onChange={(e) => set("stock_qty", e.target.value)} placeholder="0" /></div>
                <div><Label className="text-xs">Weight (kg)</Label><Input className="mt-1 h-9" type="number" step="0.01" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} placeholder="0.5" /></div>
                <div><Label className="text-xs">Dimensions</Label><Input className="mt-1 h-9" value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder="30×20×10 cm" /></div>
                <div><Label className="text-xs">Material</Label><Input className="mt-1 h-9" value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="e.g. Aluminum" /></div>
                <div className="col-span-2"><Label className="text-xs">Shipping Zones</Label><Input className="mt-1 h-9" value={form.shipping_zones} onChange={(e) => set("shipping_zones", e.target.value)} placeholder="Egypt, Saudi Arabia, UAE, Worldwide" /></div>
              </div>
            )}
            {form.listing_type === "service" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Delivery (days)</Label><Input className="mt-1 h-9" type="number" min="1" value={form.delivery_days} onChange={(e) => set("delivery_days", e.target.value)} placeholder="e.g. 3" /></div>
                  <div><Label className="text-xs">Revisions</Label><Input className="mt-1 h-9" type="number" min="0" value={form.revisions} onChange={(e) => set("revisions", e.target.value)} placeholder="e.g. 3" /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Service Packages (max 3)</Label>
                    {form.packages.length < 3 && <button onClick={addPackage} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add Package</button>}
                  </div>
                  <div className="space-y-3">
                    {form.packages.map((pkg, i) => (
                      <div key={i} className="rounded-lg border border-border/50 p-3 bg-secondary/10 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input className="h-8 text-xs flex-1" value={pkg.name} onChange={(e) => updatePackage(i, "name", e.target.value)} placeholder="Package name" />
                          <Input className="h-8 text-xs w-32" type="number" min="0" value={pkg.price_cents} onChange={(e) => updatePackage(i, "price_cents", e.target.value)} placeholder="Price (cents)" />
                          {form.packages.length > 1 && <button onClick={() => removePackage(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                        <div className="space-y-1.5">
                          {pkg.features.map((f, j) => (
                            <div key={j} className="flex items-center gap-1.5">
                              <Input className="h-7 text-xs flex-1" value={f} onChange={(e) => updatePkgFeature(i, j, e.target.value)} placeholder={`Feature ${j + 1}`} />
                              {pkg.features.length > 1 && <button onClick={() => removePkgFeature(i, j)} className="text-muted-foreground hover:text-red-400 p-1"><X className="w-3 h-3" /></button>}
                            </div>
                          ))}
                          <button onClick={() => addPkgFeature(i)} className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1"><Plus className="w-3 h-3" />Add feature</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {form.listing_type === "subscription" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Billing Cycle</Label>
                    <Select value={form.billing_cycle} onValueChange={(v) => set("billing_cycle", v)}>
                      <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="lifetime">Lifetime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Trial Days</Label><Input className="mt-1 h-9" type="number" min="0" value={form.trial_days} onChange={(e) => set("trial_days", e.target.value)} placeholder="e.g. 14" /></div>
                  <div><Label className="text-xs">Max Users</Label><Input className="mt-1 h-9" type="number" min="1" value={form.max_users} onChange={(e) => set("max_users", e.target.value)} placeholder="e.g. 5" /></div>
                  <div><Label className="text-xs">Storage (GB)</Label><Input className="mt-1 h-9" type="number" min="0" value={form.storage_gb} onChange={(e) => set("storage_gb", e.target.value)} placeholder="e.g. 100" /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Features Included</Label>
                    <button onClick={addFeature} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                  </div>
                  <div className="space-y-1.5">
                    {form.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Input className="h-8 text-xs flex-1" value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                        {form.features.length > 1 && <button onClick={() => removeFeature(i)} className="text-muted-foreground hover:text-red-400 p-1"><X className="w-3 h-3" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {form.listing_type === "virtual" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Platform / Game</Label>
                  <Input className="mt-1 h-9" value={form.platform} onChange={(e) => set("platform", e.target.value)} placeholder="e.g. Steam, Roblox, PSN, PC" />
                </div>
                <div>
                  <Label className="text-xs">Version / Type</Label>
                  <Input className="mt-1 h-9" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="e.g. Key, Account, NFT" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Region Lock</Label>
                  <Input className="mt-1 h-9" value={form.region_lock} onChange={(e) => set("region_lock", e.target.value)} placeholder="e.g. Global, US only, EU, MENA" />
                </div>
              </div>
            )}
            {!["digital","physical","service","subscription","virtual"].includes(form.listing_type) && (
              <p className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3">
                This is a custom listing type. Add any relevant information in the description fields above.
              </p>
            )}
          </section>
        </div>
        <DialogFooter className="pt-4 border-t border-border/30">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={loading} onClick={save} className="gap-1.5">
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {listing ? "Update Listing" : "Create Listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════
   DELETE CONFIRM
═══════════════════════════════════════════════════════════ */
export function DeleteConfirmDialog({ open, onClose, onConfirm, name }: {
  open: boolean; onClose: () => void; onConfirm: () => void; name: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete <strong className="text-foreground">{name}</strong>? This action cannot be undone.</p>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="destructive" onClick={() => { onConfirm(); onClose(); }} className="gap-1.5">
            <Trash2 className="w-3 h-3" />Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════
   TYPE ADD/EDIT DIALOG
═══════════════════════════════════════════════════════════ */
function TypeFormDialog({ open, onClose, type: t, onSaved }: {
  open: boolean; onClose: () => void;
  type: MpListingType | null; onSaved: () => void;
}) {
  const [form, setForm] = useState({ label:"", label_ar:"", icon:"📦", color:"violet", sort_order:"0" });
  const [loading, setLoading] = useState(false);
  const db = supabase as any;

  useEffect(() => {
    if (!open) return;
    if (t) setForm({ label: t.label, label_ar: t.label_ar, icon: t.icon, color: t.color, sort_order: String(t.sort_order) });
    else setForm({ label:"", label_ar:"", icon:"📦", color:"violet", sort_order:"0" });
  }, [t, open]);

  const s = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.label.trim()) return toast.error("Label is required");
    setLoading(true);
    try {
      if (t?.id) {
        await db.from("mp_listing_types").update({
          label: form.label.trim(), label_ar: form.label_ar.trim(),
          icon: form.icon.trim(), color: form.color, sort_order: parseInt(form.sort_order) || 0,
        }).eq("id", t.id);
        toast.success("Type section updated");
      } else {
        const code = form.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
        await db.from("mp_listing_types").insert({
          code, label: form.label.trim(), label_ar: form.label_ar.trim(),
          icon: form.icon.trim(), color: form.color,
          sort_order: parseInt(form.sort_order) || 0,
          is_active: true, is_built_in: false, default_categories: [],
        });
        toast.success("Type section created");
      }
      onSaved(); onClose();
    } catch (e: any) { toast.error(e?.message || "Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t ? "Edit Type Section" : "Add Type Section"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Label (English) *</Label>
            <Input className="mt-1 h-9" value={form.label} onChange={(e) => s("label", e.target.value)} placeholder="e.g. Events & Tickets" />
          </div>
          <div>
            <Label className="text-xs">Label (Arabic)</Label>
            <Input className="mt-1 h-9 text-right" dir="rtl" value={form.label_ar} onChange={(e) => s("label_ar", e.target.value)} placeholder="e.g. فعاليات وتذاكر" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Icon (emoji)</Label>
              <Input className="mt-1 h-9 text-center text-lg" value={form.icon} onChange={(e) => s("icon", e.target.value)} placeholder="📦" maxLength={4} />
            </div>
            <div>
              <Label className="text-xs">Sort Order</Label>
              <Input className="mt-1 h-9" type="number" min="0" value={form.sort_order} onChange={(e) => s("sort_order", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {Object.keys(COLOR_PALETTE).map((c) => (
                <button key={c} onClick={() => s("color", c)}
                  className={`w-6 h-6 rounded-full transition-all ${COLOR_DOTS[c]} ${form.color === c ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-125" : "opacity-70 hover:opacity-100"}`}
                  title={c}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Selected: <span className="text-foreground font-medium">{form.color}</span></p>
          </div>
          {!t && (
            <p className="text-[10px] text-muted-foreground bg-secondary/20 rounded-md p-2">
              Code will be auto-generated from the label. You can manage categories for this type in the Types & Categories tab.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={loading} onClick={save} className="gap-1.5">
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {t ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════
   TYPES & CATEGORIES TAB
═══════════════════════════════════════════════════════════ */
function TypesAndCategoriesPanel({ onTypesChange }: { onTypesChange: () => void }) {
  const [types, setTypes] = useState<MpListingType[]>([]);
  const [categories, setCategories] = useState<MpCategory[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editType, setEditType] = useState<MpListingType | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);
  const [newMainCat, setNewMainCat] = useState<Record<string, string>>({});
  const [newSubCat, setNewSubCat] = useState<Record<string, string>>({});
  const [subParent, setSubParent] = useState<Record<string, string>>({});
  // inline rename
  const [editingCat, setEditingCat] = useState<string | null>(null); // "builtin_<typeCode>_<name>" or cat.id
  const [editingCatVal, setEditingCatVal] = useState("");
  const db = supabase as any;

  const load = async () => {
    await seedMarketplaceDefaults(db);
    const { data: t } = await db.from("mp_listing_types").select("*").order("sort_order").order("label");
    const { data: c } = await db.from("mp_categories").select("*").order("sort_order").order("name");
    const types: MpListingType[] = t?.length
      ? t
      : MARKETPLACE_SEED_TYPES.map((s) => ({ ...s, id: `fallback-${s.code}` })) as MpListingType[];
    setTypes(types); setCategories(c || []);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (t: MpListingType) => {
    await db.from("mp_listing_types").update({ is_active: !t.is_active }).eq("id", t.id);
    load(); onTypesChange();
    toast.success(`"${t.label}" ${!t.is_active ? "enabled" : "disabled"}`);
  };
  const deleteType = async (id: string) => {
    await db.from("mp_listing_types").delete().eq("id", id);
    load(); onTypesChange(); toast.success("Type section deleted");
  };
  const addMainCat = async (typeCode: string) => {
    const name = (newMainCat[typeCode] || "").trim();
    if (!name) return;
    await db.from("mp_categories").insert({ listing_type: typeCode, name, parent_id: null });
    setNewMainCat((p) => ({ ...p, [typeCode]: "" })); load();
    toast.success("Category added");
  };
  const addSubCat = async (typeCode: string) => {
    const name = (newSubCat[typeCode] || "").trim();
    const pid = subParent[typeCode];
    if (!name || !pid) return toast.error("Select a parent category first");
    await db.from("mp_categories").insert({ listing_type: typeCode, name, parent_id: pid });
    setNewSubCat((p) => ({ ...p, [typeCode]: "" })); load();
    toast.success("Sub-category added");
  };
  const deleteBuiltIn = async (typeCode: string, catName: string) => {
    // "delete" built-in = add it to the type's exclusions. 
    // Simple approach: re-save the type's default_categories without it.
    const t = types.find((t) => t.code === typeCode);
    if (!t) return;
    const updated = (t.default_categories || []).filter((c) => c !== catName);
    await db.from("mp_listing_types").update({ default_categories: updated }).eq("id", t.id);
    load(); toast.success("Category removed");
  };
  const deleteCat = async (id: string) => {
    await db.from("mp_categories").delete().eq("id", id);
    load(); toast.success("Deleted");
  };
  const addBuiltInCatName = async (typeCode: string, name: string) => {
    if (!name.trim()) return;
    const t = types.find((t) => t.code === typeCode);
    if (!t) return;
    const updated = [...(t.default_categories || []), name.trim()];
    await db.from("mp_listing_types").update({ default_categories: updated }).eq("id", t.id);
    setNewMainCat((p) => ({ ...p, [typeCode]: "" })); load();
    toast.success("Category added");
  };
  const startEditCat = (key: string, currentName: string) => {
    setEditingCat(key);
    setEditingCatVal(currentName);
  };
  const saveEditBuiltIn = async (typeCode: string, oldName: string) => {
    const newName = editingCatVal.trim();
    if (!newName) return setEditingCat(null);
    const t = types.find((ty) => ty.code === typeCode);
    if (!t) return;
    const updated = (t.default_categories || []).map((c) => c === oldName ? newName : c);
    await db.from("mp_listing_types").update({ default_categories: updated }).eq("id", t.id);
    setEditingCat(null); load(); toast.success("Category renamed");
  };
  const saveEditDbCat = async (id: string) => {
    const newName = editingCatVal.trim();
    if (!newName) return setEditingCat(null);
    await db.from("mp_categories").update({ name: newName }).eq("id", id);
    setEditingCat(null); load(); toast.success("Category renamed");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">Manage type sections and their categories. Built-in types can be edited but not deleted.</p>
        <button
          onClick={() => { setEditType(null); setShowTypeForm(true); }}
          className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />Add Type
        </button>
      </div>

      {types.length === 0 ? (
        <div className="text-center py-8"><Layers className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No type sections yet</p></div>
      ) : types.map((t) => {
        const pal = COLOR_PALETTE[t.color] || COLOR_PALETTE.violet;
        const dot = COLOR_DOTS[t.color] || "bg-violet-500";
        const isExpanded = expanded === t.code;
        const customCats = categories.filter((c) => c.listing_type === t.code && !c.parent_id);
        const builtInCats = t.default_categories || [];
        const allMainCats = [
          ...builtInCats.map((n) => ({ id: "builtin_" + n, name: n, isBuiltIn: true })),
          ...customCats.map((c) => ({ id: c.id, name: c.name, isBuiltIn: false })),
        ];

        return (
          <div key={t.id} className={`rounded-xl border ${pal.border} overflow-hidden`}>
            {/* Type header row */}
            <div className={`flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r ${pal.gradient}`}>
              <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              <span className="text-lg shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t.label}</span>
                  {t.label_ar && <span className="text-xs text-muted-foreground">{t.label_ar}</span>}
                  {t.is_built_in && <Badge className="text-[9px] px-1.5 py-0 bg-secondary text-muted-foreground border-border">Built-in</Badge>}
                  {!t.is_active && <Badge className="text-[9px] px-1.5 py-0 bg-secondary/50 text-muted-foreground border-border">Hidden</Badge>}
                  <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                  <span className="text-[10px] text-muted-foreground">code: {t.code}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{allMainCats.length} categories</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setExpanded(isExpanded ? null : t.code)} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground" title="Manage categories">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => { setEditType(t); setShowTypeForm(true); }} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground" title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleActive(t)} className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground" title={t.is_active ? "Hide from marketplace" : "Show in marketplace"}>
                  {t.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                {!t.is_built_in && (
                  <button onClick={() => setDeleteTypeId(t.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded categories section */}
            {isExpanded && (
              <div className="px-3 pb-3 pt-2 bg-secondary/5 space-y-3">
                {/* Category list */}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {allMainCats.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No categories yet. Add one below.</p>
                  ) : allMainCats.map((cat) => {
                    const dbCat = customCats.find((c) => c.id === cat.id);
                    const subs = dbCat ? categories.filter((c) => c.parent_id === dbCat.id) : [];
                    const editKey = cat.isBuiltIn ? `builtin_${t.code}_${cat.name}` : cat.id;
                    const isEditing = editingCat === editKey;
                    return (
                      <div key={cat.id} className="rounded-lg border border-border/40 overflow-hidden">
                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-secondary/20">
                          <FolderPlus className="w-3 h-3 text-muted-foreground shrink-0" />
                          {isEditing ? (
                            <>
                              <input
                                autoFocus
                                className="text-xs flex-1 bg-background border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                value={editingCatVal}
                                onChange={(e) => setEditingCatVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") cat.isBuiltIn ? saveEditBuiltIn(t.code, cat.name) : saveEditDbCat(cat.id);
                                  if (e.key === "Escape") setEditingCat(null);
                                }}
                              />
                              <button onClick={() => cat.isBuiltIn ? saveEditBuiltIn(t.code, cat.name) : saveEditDbCat(cat.id)} className="p-0.5 text-emerald-400 hover:text-emerald-300"><Check className="w-3 h-3" /></button>
                              <button onClick={() => setEditingCat(null)} className="p-0.5 text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs flex-1">{cat.name}</span>
                              {cat.isBuiltIn
                                ? <Badge className="text-[8px] px-1 py-0 bg-secondary/50 text-muted-foreground border-border/50">default</Badge>
                                : null}
                              <button onClick={() => startEditCat(editKey, cat.name)} className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                              <button
                                onClick={() => cat.isBuiltIn ? deleteBuiltIn(t.code, cat.name) : deleteCat(cat.id)}
                                className="p-0.5 text-red-400 hover:text-red-300"
                              ><Trash2 className="w-3 h-3" /></button>
                            </>
                          )}
                        </div>
                        {subs.map((sub) => {
                          const subEditKey = sub.id;
                          const isSubEditing = editingCat === subEditKey;
                          return (
                            <div key={sub.id} className="flex items-center gap-2 pl-7 pr-2.5 py-1 border-t border-border/20 bg-secondary/5">
                              {isSubEditing ? (
                                <>
                                  <span className="text-[10px] text-muted-foreground shrink-0">└</span>
                                  <input
                                    autoFocus
                                    className="text-xs flex-1 bg-background border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                    value={editingCatVal}
                                    onChange={(e) => setEditingCatVal(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveEditDbCat(sub.id);
                                      if (e.key === "Escape") setEditingCat(null);
                                    }}
                                  />
                                  <button onClick={() => saveEditDbCat(sub.id)} className="p-0.5 text-emerald-400 hover:text-emerald-300"><Check className="w-3 h-3" /></button>
                                  <button onClick={() => setEditingCat(null)} className="p-0.5 text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-muted-foreground flex-1">└ {sub.name}</span>
                                  <button onClick={() => startEditCat(subEditKey, sub.name)} className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                                  <button onClick={() => deleteCat(sub.id)} className="p-0.5 text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Add main category */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Add Category</p>
                  <div className="flex gap-2">
                    <Input
                      className="h-8 text-xs flex-1"
                      placeholder="Category name"
                      value={newMainCat[t.code] || ""}
                      onChange={(e) => setNewMainCat((p) => ({ ...p, [t.code]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addBuiltInCatName(t.code, newMainCat[t.code] || "")}
                    />
                    <Button size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={() => addBuiltInCatName(t.code, newMainCat[t.code] || "")}>
                      <Plus className="w-3 h-3" />Add
                    </Button>
                  </div>
                </div>

                {/* Add sub-category */}
                {allMainCats.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Add Sub-category</p>
                    <div className="flex gap-2">
                      <Select value={subParent[t.code] || ""} onValueChange={(v) => setSubParent((p) => ({ ...p, [t.code]: v }))}>
                        <SelectTrigger className="h-8 text-xs w-36 shrink-0"><SelectValue placeholder="Under..." /></SelectTrigger>
                        <SelectContent>{customCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input
                        className="h-8 text-xs flex-1"
                        placeholder="Sub-category name"
                        value={newSubCat[t.code] || ""}
                        onChange={(e) => setNewSubCat((p) => ({ ...p, [t.code]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addSubCat(t.code)}
                      />
                      <Button size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={() => addSubCat(t.code)}>
                        <Plus className="w-3 h-3" />Add
                      </Button>
                    </div>
                    {!subParent[t.code] && <p className="text-[10px] text-muted-foreground">Only custom categories (non-default) can have sub-categories. Select one in the dropdown.</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <TypeFormDialog
        open={showTypeForm}
        onClose={() => { setShowTypeForm(false); setEditType(null); }}
        type={editType}
        onSaved={() => { load(); onTypesChange(); }}
      />
      <DeleteConfirmDialog
        open={!!deleteTypeId}
        onClose={() => setDeleteTypeId(null)}
        onConfirm={() => { if (deleteTypeId) deleteType(deleteTypeId); setDeleteTypeId(null); }}
        name={types.find((t) => t.id === deleteTypeId)?.label || ""}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MANAGEMENT PANEL  (default export) — right-side drawer
═══════════════════════════════════════════════════════════ */
export default function ManagementPanel({
  currentUserId, onListingChange, onCategoryChange, onClose,
}: {
  currentUserId: string | null;
  onListingChange: () => void;
  onCategoryChange: () => void;
  onClose?: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "listings" | "all" | "types" | "requests" | "analytics" | "orders">("overview");
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [allMarketListings, setAllMarketListings] = useState<Listing[]>([]);
  const [allTypes, setAllTypes] = useState<MpListingType[]>([]);
  const [allCategories, setAllCategories] = useState<MpCategory[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingL, setLoadingL] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Listing | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [allSearch, setAllSearch] = useState("");
  const [allTypeFilter, setAllTypeFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const db = supabase as any;

  const loadMyListings = async () => {
    if (!currentUserId) return;
    setLoadingL(true);
    const { data } = await db.from("mp_listings").select("*").eq("publisher_user_id", currentUserId).order("created_at", { ascending: false });
    setMyListings(data || []); setLoadingL(false);
  };
  const loadAllListings = async () => {
    setLoadingAll(true);
    const { data } = await db.from("mp_listings").select("*").order("created_at", { ascending: false });
    setAllMarketListings(data || []); setLoadingAll(false);
  };
  const loadRequests = async () => {
    const { data } = await db.from("mp_listing_requests").select("*").order("created_at", { ascending: false });
    setRequests(data || []);
  };
  const loadOrders = async () => {
    if (!currentUserId) return;
    try {
      // Get this seller's listing IDs
      const { data: sellerListings } = await db
        .from("mp_listings")
        .select("id")
        .eq("publisher_user_id", currentUserId);
      if (!sellerListings?.length) { setOrders([]); return; }

      const listingIds = sellerListings.map((l: any) => l.id);

      // Find order IDs that contain at least one of the seller's listings
      const { data: orderItemRows } = await db
        .from("mp_order_items")
        .select("order_id")
        .in("listing_id", listingIds);
      if (!orderItemRows?.length) { setOrders([]); return; }

      const orderIds = [...new Set(orderItemRows.map((oi: any) => oi.order_id))];

      // Fetch full orders with their items
      const { data: orderRows } = await db
        .from("mp_orders")
        .select("*, items:mp_order_items(*)")
        .in("id", orderIds)
        .order("created_at", { ascending: false });

      setOrders(orderRows || []);
    } catch { setOrders([]); }
  };
  const loadMeta = async () => {
    const { data: t } = await db.from("mp_listing_types").select("*").order("sort_order").order("label");
    const { data: c } = await db.from("mp_categories").select("*").order("sort_order").order("name");
    const types: MpListingType[] = t?.length
      ? t
      : MARKETPLACE_SEED_TYPES.map((s) => ({ ...s, id: `fallback-${s.code}` })) as MpListingType[];
    setAllTypes(types); setAllCategories(c || []);
  };

  useEffect(() => {
    loadMyListings(); loadRequests(); loadMeta(); loadAllListings(); loadOrders();
  }, [currentUserId]);

  const deleteListing = async (id: string) => {
    await db.from("mp_listings").delete().eq("id", id);
    setDeleteId(null); loadMyListings(); loadAllListings(); onListingChange(); toast.success("Listing deleted");
  };
  const toggleListingActive = async (l: Listing) => {
    await db.from("mp_listings").update({ is_active: !l.is_active }).eq("id", l.id);
    loadMyListings(); loadAllListings(); onListingChange();
    toast.success(`"${l.name}" ${!l.is_active ? "activated" : "deactivated"}`);
  };
  const toggleAllFeatured = async (l: Listing) => {
    await db.from("mp_listings").update({ is_featured: !l.is_featured }).eq("id", l.id);
    loadAllListings(); onListingChange();
    toast.success(`"${l.name}" ${!l.is_featured ? "featured" : "unfeatured"}`);
  };
  const duplicateListing = async (l: Listing) => {
    const { id, created_at, rating, reviews_count, sales_count, ...rest } = l;
    await db.from("mp_listings").insert({ ...rest, name: l.name + " (Copy)", is_featured: false, is_new: true, rating: 0, reviews_count: 0, sales_count: 0 });
    loadMyListings(); loadAllListings(); onListingChange(); toast.success("Listing duplicated");
  };
  const updateRequest = async (id: string, status: "approved" | "rejected") => {
    await db.from("mp_listing_requests").update({ status }).eq("id", id);
    loadRequests(); toast.success(`Request ${status}`);
  };
  const handleSaved = () => { loadMyListings(); loadAllListings(); onListingChange(); };
  const handleTypesChange = () => { loadMeta(); onCategoryChange(); };
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await db.from("mp_orders").update({ status }).eq("id", orderId);
      loadOrders();
      toast.success("Order status updated to " + status);
    } catch { toast.error("Failed to update status"); }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const typeMap: Record<string, MpListingType> = Object.fromEntries(allTypes.map((t) => [t.code, t]));

  /* ── Analytics computed values ── */
  const activeCount = allMarketListings.filter((l) => l.is_active !== false).length;
  const featuredCount = allMarketListings.filter((l) => l.is_featured).length;
  const listingsByType = allTypes.map((t) => ({
    ...t,
    count: allMarketListings.filter((l) => l.listing_type === t.code).length,
  }));
  const pricingBreakdown = [
    { label: "Free",     count: allMarketListings.filter((l) => l.pricing_model === "free").length,      dot: "bg-emerald-500" },
    { label: "One-time", count: allMarketListings.filter((l) => l.pricing_model === "one_time").length,  dot: "bg-blue-500"    },
    { label: "Monthly",  count: allMarketListings.filter((l) => l.pricing_model === "monthly").length,   dot: "bg-violet-500"  },
    { label: "Annual",   count: allMarketListings.filter((l) => l.pricing_model === "annual").length,    dot: "bg-pink-500"    },
    { label: "Contact",  count: allMarketListings.filter((l) => l.pricing_model === "contact").length,   dot: "bg-amber-500"   },
  ];
  const topCategories = useMemo(() => {
    const cc: Record<string, number> = {};
    allMarketListings.forEach((l) => { if (l.category) cc[l.category] = (cc[l.category] || 0) + 1; });
    return Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [allMarketListings]);

  /* ── All-listings filtered ── */
  const filteredAllListings = useMemo(() => {
    let r = [...allMarketListings];
    if (allTypeFilter !== "all") r = r.filter((l) => l.listing_type === allTypeFilter);
    if (allSearch.trim()) {
      const q = allSearch.toLowerCase();
      r = r.filter((l) => l.name?.toLowerCase().includes(q) || l.publisher_name?.toLowerCase().includes(q));
    }
    return r;
  }, [allMarketListings, allTypeFilter, allSearch]);

  /* ── Nav items ── */
  const NAV = [
    { id: "overview",  label: "Overview",          Icon: LayoutDashboard, count: 0                     },
    { id: "listings",  label: "My Listings",        Icon: PackagePlus,     count: myListings.length      },
    { id: "orders",    label: "Orders",             Icon: ShoppingBag,     count: orders.length          },
    { id: "all",       label: "All Listings",       Icon: Store,           count: allMarketListings.length},
    { id: "types",     label: "Types & Categories", Icon: Layers,          count: allTypes.length        },
    { id: "requests",  label: "Requests",           Icon: ClipboardList,   count: pendingCount           },
    { id: "analytics", label: "Analytics",          Icon: BarChart2,       count: 0                     },
  ] as const;

  const typeBarColor: Record<string, string> = {
    violet:"bg-violet-500", emerald:"bg-emerald-500", amber:"bg-amber-500",
    pink:"bg-pink-500", blue:"bg-blue-500", rose:"bg-rose-500",
    cyan:"bg-cyan-500", orange:"bg-orange-500", purple:"bg-purple-500",
    teal:"bg-teal-500", red:"bg-red-500", yellow:"bg-yellow-500",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-5xl shadow-2xl border-l border-border">

        {/* ── Sidebar ── */}
        <div className="w-52 shrink-0 flex flex-col bg-card border-r border-border/50">
          {/* Logo/title */}
          <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/50 bg-secondary/20">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Settings className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm">Manager</span>
            <button
              onClick={onClose}
              className="ml-auto p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {NAV.map(({ id, label, Icon, count }) => (
              <button
                key={id}
                onClick={() => setTab(id as typeof tab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                  tab === id
                    ? "bg-primary/15 text-primary font-medium shadow-sm shadow-primary/10"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${
                    tab === id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>{count}</span>
                )}
                {id === "requests" && pendingCount > 0 && tab !== "requests" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ml-1" />
                )}
              </button>
            ))}
          </nav>

          {/* Add listing CTA */}
          <div className="p-3 border-t border-border/50 space-y-2">
            <button
              onClick={() => { setEditTarget(null); setShowAddEdit(true); }}
              className="w-full flex items-center justify-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              <PackagePlus className="w-3.5 h-3.5" />New Listing
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col bg-background overflow-hidden">
          {/* Content header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/50 bg-card/60 shrink-0">
            <span className="font-semibold text-sm">{NAV.find((n) => n.id === tab)?.label}</span>
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => { loadMyListings(); loadAllListings(); loadRequests(); loadMeta(); }}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable tab content */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* ══ OVERVIEW ══════════════════════════════════════════════ */}
            {tab === "overview" && (
              <div className="space-y-6">
                {/* KPI grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Total Listings",    value: allMarketListings.length, emoji: "🛒", color: "text-primary"      },
                    { label: "My Listings",        value: myListings.length,        emoji: "📦", color: "text-violet-400"   },
                    { label: "Active",             value: activeCount,              emoji: "✅", color: "text-emerald-400"  },
                    { label: "Featured",           value: featuredCount,            emoji: "⭐", color: "text-amber-400"    },
                    { label: "Pending Requests",   value: pendingCount,             emoji: "📋", color: "text-orange-400"   },
                    { label: "Listing Types",      value: allTypes.length,          emoji: "🏷️", color: "text-blue-400"    },
                  ].map(({ label, value, emoji, color }) => (
                    <Card key={label} className="p-4 flex items-center gap-3 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                      <span className="text-2xl shrink-0">{emoji}</span>
                      <div>
                        <p className={`text-2xl font-bold leading-tight ${color}`}>{value}</p>
                        <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{label}</p>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Quick actions */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Quick Actions</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: "New Listing",        Icon: PackagePlus,     onClick: () => { setEditTarget(null); setShowAddEdit(true); }, cls: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"         },
                      { label: "My Orders",          Icon: ShoppingBag,     onClick: () => setTab("orders"),    cls: "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"            },
                      { label: "All Listings",       Icon: Store,           onClick: () => setTab("all"),       cls: "border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"  },
                      { label: "Types & Categories", Icon: Layers,          onClick: () => setTab("types"),     cls: "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"          },
                      { label: "Requests",           Icon: ClipboardList,   onClick: () => setTab("requests"),  cls: "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"      },
                      { label: "My Listings",        Icon: PackagePlus,     onClick: () => setTab("listings"),  cls: "border-border/50 bg-secondary/40 text-foreground hover:bg-secondary/70"         },
                      { label: "Analytics",          Icon: BarChart2,       onClick: () => setTab("analytics"), cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"},
                    ].map(({ label, Icon, onClick, cls }) => (
                      <button key={label} onClick={onClick} className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all ${cls}`}>
                        <Icon className="w-4 h-4 shrink-0" />{label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent listings */}
                {allMarketListings.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Listings</p>
                      <button onClick={() => setTab("all")} className="text-xs text-primary hover:underline">View all →</button>
                    </div>
                    <div className="space-y-1.5">
                      {allMarketListings.slice(0, 6).map((l) => {
                        const t = typeMap[l.listing_type];
                        const pal = t ? (COLOR_PALETTE[t.color] || COLOR_PALETTE.violet) : COLOR_PALETTE.violet;
                        return (
                          <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 hover:bg-secondary/20 transition-colors">
                            <span className="text-base shrink-0 w-6 text-center">{t?.icon || "📦"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{l.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{l.publisher_name}</p>
                            </div>
                            <Badge className={`text-[9px] px-1.5 py-0 shrink-0 ${pal.badgeClass}`}>{t?.label || l.listing_type}</Badge>
                            <PriceBadge price_cents={l.price_cents} pricing_model={l.pricing_model} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {allMarketListings.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Store className="w-14 h-14 mb-4 text-muted-foreground/15" />
                    <p className="text-sm font-medium text-muted-foreground mb-1">Marketplace is empty</p>
                    <p className="text-xs text-muted-foreground mb-4">Add your first listing to get started</p>
                    <button
                      onClick={() => { setEditTarget(null); setShowAddEdit(true); }}
                      className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-1.5 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />Add First Listing
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ══ MY LISTINGS ═══════════════════════════════════════════ */}
            {tab === "listings" && (
              loadingL ? (
                <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="h-11 animate-pulse bg-secondary/20 rounded-lg" />)}</div>
              ) : myListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <PackagePlus className="w-12 h-12 mb-3 text-muted-foreground/20" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">No listings yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Start selling by creating your first listing</p>
                  <button onClick={() => { setEditTarget(null); setShowAddEdit(true); }} className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-1.5 font-medium">
                    <Plus className="w-3.5 h-3.5" />Add First Listing
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        {["Name","Type","Category","Price","Status",""].map((h, i) => (
                          <th key={i} className={`py-2.5 font-semibold text-muted-foreground text-left ${i === 5 ? "text-right" : ""}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myListings.map((l) => {
                        const t = typeMap[l.listing_type];
                        const pal = t ? (COLOR_PALETTE[t.color] || COLOR_PALETTE.violet) : COLOR_PALETTE.violet;
                        return (
                          <tr key={l.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                            <td className="py-2.5 font-medium max-w-44 truncate pr-2">{t?.icon || "📦"} {l.name}</td>
                            <td className="py-2.5 pr-2"><Badge className={`text-[9px] px-1.5 py-0 ${pal.badgeClass}`}>{t?.label || l.listing_type}</Badge></td>
                            <td className="py-2.5 text-muted-foreground pr-2 max-w-28 truncate">{l.category || "—"}</td>
                            <td className="py-2.5 pr-2"><PriceBadge price_cents={l.price_cents} pricing_model={l.pricing_model} /></td>
                            <td className="py-2.5 pr-2">
                              <button onClick={() => toggleListingActive(l)}>
                                <Badge className={`text-[9px] px-1.5 py-0 cursor-pointer ${l.is_active !== false ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-secondary text-muted-foreground"}`}>
                                  {l.is_active !== false ? <><Eye className="w-2.5 h-2.5 inline mr-0.5" />Active</> : <><EyeOff className="w-2.5 h-2.5 inline mr-0.5" />Hidden</>}
                                </Badge>
                              </button>
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => { setEditTarget(l); setShowAddEdit(true); }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3 h-3" /></button>
                                <button onClick={() => duplicateListing(l)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Duplicate"><Copy className="w-3 h-3" /></button>
                                <button onClick={() => setDeleteId(l.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* ══ ORDERS (SELLER DASHBOARD) ════════════════════════════ */}
            {tab === "orders" && (() => {
              const STATUS_FILTERS = [
                { id: "all", label: "All", color: "" },
                { id: "pending", label: "Pending", color: "text-amber-400" },
                { id: "processing", label: "Processing", color: "text-blue-400" },
                { id: "completed", label: "Completed", color: "text-emerald-400" },
                { id: "cancelled", label: "Cancelled", color: "text-red-400" },
                { id: "refunded", label: "Refunded", color: "text-rose-400" },
              ];
              const STATUS_BADGE: Record<string, string> = {
                pending:    "bg-amber-500/20 text-amber-400 border-amber-500/40",
                processing: "bg-blue-500/20 text-blue-400 border-blue-500/40",
                completed:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                cancelled:  "bg-red-500/20 text-red-400 border-red-500/40",
                refunded:   "bg-rose-500/20 text-rose-400 border-rose-500/40",
                failed:     "bg-red-500/20 text-red-400 border-red-500/40",
              };
              const NEXT_STATUS: Record<string, string[]> = {
                pending:    ["processing", "completed", "cancelled"],
                processing: ["completed", "cancelled"],
                completed:  ["refunded"],
                cancelled:  [],
                refunded:   [],
                failed:     ["pending"],
              };
              const filtered = orderStatusFilter === "all"
                ? orders
                : orders.filter((o: any) => o.status === orderStatusFilter);
              const totalRevenue = filtered
                .filter((o: any) => o.status === "completed")
                .reduce((s: number, o: any) => s + (o.total_cents || 0), 0);
              const currency = filtered[0]?.currency || "USD";

              return (
                <div className="space-y-4">
                  {/* Revenue KPIs */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-3 bg-secondary/10 text-center">
                      <p className="text-xl font-bold text-primary">{filtered.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Orders</p>
                    </Card>
                    <Card className="p-3 bg-secondary/10 text-center">
                      <p className="text-xl font-bold text-emerald-400">
                        {totalRevenue === 0 ? "—" : `${(totalRevenue / 100).toFixed(0)} ${currency}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Revenue</p>
                    </Card>
                    <Card className="p-3 bg-secondary/10 text-center">
                      <p className="text-xl font-bold text-amber-400">
                        {orders.filter((o: any) => o.status === "pending").length}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Pending</p>
                    </Card>
                  </div>

                  {/* Status filter tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    {STATUS_FILTERS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setOrderStatusFilter(f.id)}
                        className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
                          orderStatusFilter === f.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        {f.label}
                        {f.id !== "all" && (
                          <span className="ml-1 opacity-70">
                            ({orders.filter((o: any) => o.status === f.id).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Orders list */}
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ShoppingBag className="w-10 h-10 mb-3 text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground">No orders found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filtered.map((order: any) => {
                        const isExpanded = expandedOrder === order.id;
                        const items: any[] = order.items || [];
                        const nextStatuses = NEXT_STATUS[order.status] || [];
                        return (
                          <div key={order.id} className="border border-border/50 rounded-xl overflow-hidden">
                            {/* Order header row */}
                            <div
                              className="flex items-center gap-3 p-3 hover:bg-secondary/10 transition-colors cursor-pointer"
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            >
                              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold font-mono">{order.order_number}</span>
                                  <Badge className={`text-[9px] px-1.5 py-0 ${STATUS_BADGE[order.status] || "bg-secondary text-muted-foreground"}`}>
                                    {order.status}
                                  </Badge>
                                  {!order.invoice_sent && (
                                    <Badge className="text-[9px] px-1.5 py-0 bg-secondary/50 text-muted-foreground border-border/40">
                                      📧 Invoice pending
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground truncate max-w-32">{order.buyer_name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate">{order.buyer_email}</span>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-xs font-bold text-primary">
                                  {order.total_cents === 0 ? "Free" : `${(order.total_cents / 100).toFixed(2)} ${order.currency}`}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="border-t border-border/40 bg-secondary/5 p-4 space-y-4">
                                {/* Items */}
                                {items.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                                    <div className="space-y-1.5">
                                      {items.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between text-xs bg-background/50 rounded-lg px-3 py-2">
                                          <span className="text-muted-foreground">{item.listing_name}</span>
                                          <div className="flex items-center gap-3 shrink-0 ml-2">
                                            <span className="text-muted-foreground">×{item.quantity}</span>
                                            <span className="font-medium">{(item.total_price / 100).toFixed(2)} {item.currency}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Buyer info + Payment */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Buyer</p>
                                    <p className="font-medium">{order.buyer_name}</p>
                                    <p className="text-muted-foreground">{order.buyer_email}</p>
                                    {order.buyer_phone && <p className="text-muted-foreground">{order.buyer_phone}</p>}
                                    {order.buyer_address && <p className="text-muted-foreground">{order.buyer_address}</p>}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Payment</p>
                                    <p className="font-medium capitalize">{order.payment_method?.replace(/_/g, " ")}</p>
                                    {order.notes && <p className="text-muted-foreground mt-1 italic">"{order.notes}"</p>}
                                  </div>
                                </div>

                                {/* Status actions */}
                                {nextStatuses.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Update Status</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {nextStatuses.map((ns) => (
                                        <button
                                          key={ns}
                                          onClick={() => updateOrderStatus(order.id, ns)}
                                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${STATUS_BADGE[ns]} hover:opacity-80`}
                                        >
                                          Mark as {ns}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══ ALL LISTINGS ══════════════════════════════════════════ */}
            {tab === "all" && (
              <div className="space-y-3">
                {/* Search + filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input className="pl-8 h-8 text-xs bg-secondary/20" placeholder="Search by name or publisher…" value={allSearch} onChange={(e) => setAllSearch(e.target.value)} />
                  </div>
                  <Select value={allTypeFilter} onValueChange={setAllTypeFilter}>
                    <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {allTypes.map((t) => <SelectItem key={t.code} value={t.code}>{t.icon} {t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground shrink-0">{filteredAllListings.length} listings</span>
                </div>

                {loadingAll ? (
                  <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-10 animate-pulse bg-secondary/20 rounded-lg" />)}</div>
                ) : filteredAllListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Store className="w-10 h-10 mb-2 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">{allSearch || allTypeFilter !== "all" ? "No results found" : "Marketplace is empty"}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/50">
                          {["Name","Type","Publisher","Price","Featured","Status",""].map((h, i) => (
                            <th key={i} className={`py-2.5 font-semibold text-muted-foreground text-left ${i === 6 ? "text-right" : ""}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAllListings.map((l) => {
                          const t = typeMap[l.listing_type];
                          const pal = t ? (COLOR_PALETTE[t.color] || COLOR_PALETTE.violet) : COLOR_PALETTE.violet;
                          return (
                            <tr key={l.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                              <td className="py-2.5 font-medium max-w-40 truncate pr-2">{t?.icon || "📦"} {l.name}</td>
                              <td className="py-2.5 pr-2"><Badge className={`text-[9px] px-1.5 py-0 ${pal.badgeClass}`}>{t?.label || l.listing_type}</Badge></td>
                              <td className="py-2.5 text-muted-foreground pr-2 max-w-28 truncate">{l.publisher_name || "—"}</td>
                              <td className="py-2.5 pr-2"><PriceBadge price_cents={l.price_cents} pricing_model={l.pricing_model} /></td>
                              <td className="py-2.5 pr-2">
                                <button onClick={() => toggleAllFeatured(l)}>
                                  <Badge className={`text-[9px] px-1.5 py-0 cursor-pointer ${l.is_featured ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-secondary text-muted-foreground border-border/40"}`}>
                                    {l.is_featured ? "⭐ Yes" : "No"}
                                  </Badge>
                                </button>
                              </td>
                              <td className="py-2.5 pr-2">
                                <button onClick={() => toggleListingActive(l)}>
                                  <Badge className={`text-[9px] px-1.5 py-0 cursor-pointer ${l.is_active !== false ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-secondary text-muted-foreground"}`}>
                                    {l.is_active !== false ? "Active" : "Hidden"}
                                  </Badge>
                                </button>
                              </td>
                              <td className="py-2.5">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => { setEditTarget(l); setShowAddEdit(true); }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="w-3 h-3" /></button>
                                  <button onClick={() => setDeleteId(l.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-3 h-3" /></button>
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

            {/* ══ TYPES & CATEGORIES ════════════════════════════════════ */}
            {tab === "types" && <TypesAndCategoriesPanel onTypesChange={handleTypesChange} />}

            {/* ══ REQUESTS ══════════════════════════════════════════════ */}
            {tab === "requests" && (
              requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ClipboardList className="w-12 h-12 mb-3 text-muted-foreground/20" />
                  <p className="text-sm font-medium text-muted-foreground">No listing requests yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.map((req) => (
                    <div key={req.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-border/50 hover:bg-secondary/10 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{req.name}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{req.listing_type}</Badge>
                          <Badge className={`text-[9px] px-1.5 py-0 ml-auto ${
                            req.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : req.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/40"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          }`}>{req.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>
                        {req.contact && <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">📧 {req.contact}</p>}
                      </div>
                      {req.status === "pending" && (
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => updateRequest(req.id, "approved")} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors" title="Approve">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => updateRequest(req.id, "rejected")} className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors" title="Reject">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ══ ANALYTICS ═════════════════════════════════════════════ */}
            {tab === "analytics" && (
              <div className="space-y-7">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-4 bg-secondary/10 text-center">
                    <p className="text-2xl font-bold text-primary">{allMarketListings.length}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Total Listings</p>
                  </Card>
                  <Card className="p-4 bg-secondary/10 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Active</p>
                  </Card>
                  <Card className="p-4 bg-secondary/10 text-center">
                    <p className="text-2xl font-bold text-amber-400">{featuredCount}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Featured</p>
                  </Card>
                </div>

                {/* By type */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Listings by Type</p>
                  <div className="space-y-3">
                    {listingsByType.map((t) => {
                      const pct = allMarketListings.length ? Math.round((t.count / allMarketListings.length) * 100) : 0;
                      const bar = typeBarColor[t.color] || "bg-violet-500";
                      return (
                        <div key={t.code} className="flex items-center gap-3">
                          <span className="text-base shrink-0 w-6 text-center">{t.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-medium">{t.label}</span>
                              <span className="text-muted-foreground">{t.count} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-secondary/40">
                              <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing breakdown */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pricing Models</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {pricingBreakdown.map(({ label, count, dot }) => (
                      <Card key={label} className="p-3 bg-secondary/10 flex flex-col items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-full ${dot}`} />
                        <p className="text-lg font-bold leading-none">{count}</p>
                        <p className="text-[10px] text-muted-foreground text-center">{label}</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Top categories */}
                {topCategories.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top Categories</p>
                    <div className="space-y-2.5">
                      {topCategories.map(([cat, count], i) => (
                        <div key={cat} className="flex items-center gap-3 text-xs">
                          <span className={`w-5 text-center font-mono shrink-0 ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>#{i + 1}</span>
                          <span className="flex-1 font-medium truncate">{cat}</span>
                          <span className="text-muted-foreground shrink-0">{count}</span>
                          <div className="w-28 h-1.5 rounded-full bg-secondary/40 shrink-0">
                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${(count / (topCategories[0]?.[1] || 1)) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active ratio */}
                {allMarketListings.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active vs Hidden</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 rounded-full bg-secondary/40 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(activeCount / allMarketListings.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {activeCount} active / {allMarketListings.length - activeCount} hidden
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      <AddEditListingDialog
        open={showAddEdit}
        onClose={() => { setShowAddEdit(false); setEditTarget(null); }}
        listing={editTarget} onSaved={handleSaved}
        allCategories={allCategories} allTypes={allTypes}
      />
      <DeleteConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteListing(deleteId)}
        name={[...myListings, ...allMarketListings].find((l) => l.id === deleteId)?.name || ""}
      />
    </>
  );
}
