import { useEffect, useState } from "react";
import {
  Plus, Trash2, Pencil, X, Check, RefreshCw, Settings,
  PackagePlus, FolderPlus, ClipboardList, CheckCircle2, XCircle,
  Layers, ChevronDown, ChevronRight, Copy, EyeOff, Eye, GripVertical,
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
            {!["digital","physical","service","subscription"].includes(form.listing_type) && (
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
    const { data: t, error: tErr } = await db.from("mp_listing_types").select("*").order("sort_order,label");
    let loadedTypes: MpListingType[] = t || [];
    // Auto-seed the 4 built-in types if table is empty
    if (!tErr && loadedTypes.length === 0) {
      const defaults = [
        { code:"digital",      label:"Digital Products",  label_ar:"منتجات رقمية",  icon:"💾", color:"violet",  sort_order:1, is_active:true, is_built_in:true, default_categories:["Software","Templates","E-books","Online Courses","Plugins","UI Kits","Fonts","Audio","Video","Graphics"] },
        { code:"physical",     label:"Physical Products", label_ar:"منتجات ملموسة", icon:"📦", color:"emerald", sort_order:2, is_active:true, is_built_in:true, default_categories:["Electronics","Fashion","Furniture","Food & Beverage","Handcraft","Books","Sports","Tools","Accessories","Art"] },
        { code:"service",      label:"Services",          label_ar:"خدمات",          icon:"🛠️", color:"amber",   sort_order:3, is_active:true, is_built_in:true, default_categories:["Design","Development","Marketing","Writing & Translation","Consulting","Legal","Finance","Coaching","Photography","Videography"] },
        { code:"subscription", label:"Subscriptions",     label_ar:"اشتراكات",       icon:"♾️", color:"pink",    sort_order:4, is_active:true, is_built_in:true, default_categories:["SaaS Tools","Media Streaming","Education","Fitness","Business","Entertainment","News & Data","Cloud Storage"] },
      ];
      const { data: seeded } = await db.from("mp_listing_types").upsert(defaults, { onConflict: "code" }).select();
      loadedTypes = seeded || [];
    }
    const { data: c } = await db.from("mp_categories").select("*").order("sort_order,name");
    setTypes(loadedTypes); setCategories(c || []);
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
   MANAGEMENT PANEL  (default export)
═══════════════════════════════════════════════════════════ */
export default function ManagementPanel({
  currentUserId, onListingChange, onCategoryChange,
}: {
  currentUserId: string | null;
  onListingChange: () => void;
  onCategoryChange: () => void;
}) {
  const [tab, setTab] = useState<"listings" | "types" | "requests">("listings");
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [allTypes, setAllTypes] = useState<MpListingType[]>([]);
  const [allCategories, setAllCategories] = useState<MpCategory[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingL, setLoadingL] = useState(false);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Listing | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const db = supabase as any;

  const loadMyListings = async () => {
    if (!currentUserId) return;
    setLoadingL(true);
    const { data } = await db.from("mp_listings").select("*").eq("publisher_user_id", currentUserId).order("created_at", { ascending: false });
    setMyListings(data || []); setLoadingL(false);
  };
  const loadRequests = async () => {
    const { data } = await db.from("mp_listing_requests").select("*").order("created_at", { ascending: false });
    setRequests(data || []);
  };
  const loadMeta = async () => {
    const { data: t } = await db.from("mp_listing_types").select("*").order("sort_order,label");
    const { data: c } = await db.from("mp_categories").select("*").order("sort_order,name");
    setAllTypes(t || []); setAllCategories(c || []);
  };

  useEffect(() => { loadMyListings(); loadRequests(); loadMeta(); }, [currentUserId]);

  const deleteListing = async (id: string) => {
    await db.from("mp_listings").delete().eq("id", id);
    setDeleteId(null); loadMyListings(); onListingChange(); toast.success("Listing deleted");
  };
  const toggleListingActive = async (l: Listing) => {
    await db.from("mp_listings").update({ is_active: !l.is_active }).eq("id", l.id);
    loadMyListings(); onListingChange();
    toast.success(`"${l.name}" ${!l.is_active ? "activated" : "deactivated"}`);
  };
  const duplicateListing = async (l: Listing) => {
    const { id, created_at, rating, reviews_count, sales_count, ...rest } = l;
    await db.from("mp_listings").insert({ ...rest, name: l.name + " (Copy)", is_featured: false, is_new: true, rating: 0, reviews_count: 0, sales_count: 0 });
    loadMyListings(); onListingChange(); toast.success("Listing duplicated");
  };
  const updateRequest = async (id: string, status: "approved" | "rejected") => {
    await db.from("mp_listing_requests").update({ status }).eq("id", id);
    loadRequests(); toast.success(`Request ${status}`);
  };
  const handleSaved = () => { loadMyListings(); onListingChange(); };
  const handleTypesChange = () => { loadMeta(); onCategoryChange(); };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const typeMap: Record<string, MpListingType> = Object.fromEntries(allTypes.map((t) => [t.code, t]));

  return (
    <div className="px-4 max-w-7xl mx-auto mb-4">
      <div className="rounded-xl border border-border bg-secondary/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-secondary/10">
          <Settings className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Marketplace Manager</span>
          <button
            onClick={() => { setEditTarget(null); setShowAddEdit(true); }}
            className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors ml-auto"
          >
            <PackagePlus className="w-3.5 h-3.5" />Add Listing
          </button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-border/30">
          {([
            { id:"listings", label:"My Listings",          Icon:PackagePlus, count:myListings.length },
            { id:"types",    label:"Types & Categories",    Icon:Layers,      count:allTypes.length },
            { id:"requests", label:"Requests",              Icon:ClipboardList, count:pendingCount },
          ] as const).map(({ id, label, Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-3.5 h-3.5" />{label}
              {count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>{count}</span>}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* LISTINGS TAB */}
          {tab === "listings" && (
            loadingL ? (
              <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-11 animate-pulse bg-secondary/20 rounded-lg" />)}</div>
            ) : myListings.length === 0 ? (
              <div className="text-center py-8">
                <PackagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-1">No listings yet</p>
                <button onClick={() => { setEditTarget(null); setShowAddEdit(true); }} className="text-xs text-primary hover:underline">Add your first listing</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      {["Name","Type","Category","Price","Status",""].map((h, i) => (
                        <th key={i} className={`py-2 font-medium text-muted-foreground text-left ${i === 5 ? "text-right" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myListings.map((l) => {
                      const t = typeMap[l.listing_type];
                      const pal = t ? (COLOR_PALETTE[t.color] || COLOR_PALETTE.violet) : COLOR_PALETTE.violet;
                      return (
                        <tr key={l.id} className="border-b border-border/20 hover:bg-secondary/10">
                          <td className="py-2.5 font-medium max-w-40 truncate pr-2">{t?.icon || "📦"} {l.name}</td>
                          <td className="py-2.5 pr-2">
                            <Badge className={`text-[9px] px-1.5 py-0 ${pal.badgeClass}`}>{t?.label || l.listing_type}</Badge>
                          </td>
                          <td className="py-2.5 text-muted-foreground pr-2">{l.category || "—"}</td>
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
                              <button onClick={() => { setEditTarget(l); setShowAddEdit(true); }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" title="Edit">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => duplicateListing(l)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" title="Duplicate">
                                <Copy className="w-3 h-3" />
                              </button>
                              <button onClick={() => setDeleteId(l.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400" title="Delete">
                                <Trash2 className="w-3 h-3" />
                              </button>
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

          {/* TYPES & CATEGORIES TAB */}
          {tab === "types" && <TypesAndCategoriesPanel onTypesChange={handleTypesChange} />}

          {/* REQUESTS TAB */}
          {tab === "requests" && (
            requests.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No listing requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((req) => (
                  <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-secondary/10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{req.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{req.listing_type}</Badge>
                        <Badge className={`text-[9px] px-1.5 py-0 ml-auto ${req.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : req.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-amber-500/20 text-amber-400 border-amber-500/40"}`}>{req.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{req.description}</p>
                      {req.contact && <p className="text-[10px] text-muted-foreground mt-0.5">{req.contact}</p>}
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => updateRequest(req.id, "approved")} className="p-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => updateRequest(req.id, "rejected")} className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400"><XCircle className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
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
        name={myListings.find((l) => l.id === deleteId)?.name || ""}
      />
    </div>
  );
}
