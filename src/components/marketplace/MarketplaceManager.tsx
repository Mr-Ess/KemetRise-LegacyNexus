import { useEffect, useState } from "react";
import {
  Plus, Trash2, Pencil, X, Check, RefreshCw, Settings,
  PackagePlus, FolderPlus, ClipboardList, CheckCircle2, XCircle,
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
type ListingType = "digital" | "physical" | "service" | "subscription";
type PricingModel = "free" | "one_time" | "monthly" | "annual" | "contact";

export interface Listing {
  id: string;
  listing_type: ListingType;
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

interface ListingForm {
  listing_type: ListingType;
  name: string; description: string; long_description: string;
  thumbnail_url: string; category: string; sub_category: string; tags: string;
  price_cents: string; currency: string; pricing_model: PricingModel;
  publisher_name: string; is_featured: boolean; is_new: boolean; is_verified: boolean;
  // digital
  file_type: string; file_size: string; version: string;
  compatibility: string; license_type: string; demo_url: string;
  // physical
  weight_kg: string; dimensions: string; sku: string;
  stock_qty: string; shipping_zones: string; material: string; brand: string;
  // service
  delivery_days: string; revisions: string;
  packages: Array<{ name: string; price_cents: string; features: string[] }>;
  // subscription
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

const TYPE_CFG = {
  digital:      { label: "Digital Products",   icon: "💾", badgeClass: "bg-violet-500/20 text-violet-300 border-violet-500/40",  categories: ["Software","Templates","E-books","Online Courses","Plugins","UI Kits","Fonts","Audio","Video","Graphics"] },
  physical:     { label: "Physical Products",  icon: "📦", badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", categories: ["Electronics","Fashion","Furniture","Food & Beverage","Handcraft","Books","Sports","Tools","Accessories","Art"] },
  service:      { label: "Services",           icon: "🛠️", badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",   categories: ["Design","Development","Marketing","Writing & Translation","Consulting","Legal","Finance","Coaching","Photography","Videography"] },
  subscription: { label: "Subscriptions",      icon: "♾️", badgeClass: "bg-pink-500/20 text-pink-300 border-pink-500/40",     categories: ["SaaS Tools","Media Streaming","Education","Fitness","Business","Entertainment","News & Data","Cloud Storage"] },
} as const;

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
  open, onClose, listing, onSaved, allCategories,
}: {
  open: boolean; onClose: () => void;
  listing: Listing | null; onSaved: () => void;
  allCategories: MpCategory[];
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
      setForm({ ...EMPTY_FORM });
    }
  }, [listing, open]);

  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mainCats = allCategories.filter((c) => c.listing_type === form.listing_type && !c.parent_id);
  const allMainCats = [...new Set([
    ...(TYPE_CFG[form.listing_type]?.categories || []),
    ...mainCats.map((c) => c.name),
  ])];
  const parentCat = mainCats.find((c) => c.name === form.category);
  const filteredSubs = parentCat
    ? allCategories.filter((c) => c.parent_id === parentCat.id)
    : [];

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
      m.packages = form.packages
        .filter((p) => p.name.trim())
        .map((p) => ({ name: p.name, price_cents: parseInt(p.price_cents) || 0, features: p.features.filter((f) => f.trim()) }));
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
        name: form.name.trim(),
        description: form.description.trim(),
        long_description: form.long_description.trim() || null,
        thumbnail_url: form.thumbnail_url.trim() || null,
        category: form.category || null,
        sub_category: form.sub_category.trim() || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        price_cents: form.pricing_model === "free" ? 0 : parseInt(form.price_cents) || 0,
        currency: form.currency,
        pricing_model: form.pricing_model,
        publisher_name: form.publisher_name.trim() || user?.email || "",
        publisher_user_id: user?.id || null,
        is_featured: form.is_featured,
        is_new: form.is_new,
        is_verified: form.is_verified,
        meta: buildMeta(),
        is_active: true,
      };
      if (listing?.id) {
        await db.from("mp_listings").update(payload).eq("id", listing.id);
        toast.success("Listing updated");
      } else {
        await db.from("mp_listings").insert(payload);
        toast.success("Listing created");
      }
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save listing");
    } finally {
      setLoading(false);
    }
  };

  /* Package helpers */
  const addPackage = () => form.packages.length < 3 && set("packages", [...form.packages, { name: "", price_cents: "0", features: [""] }]);
  const removePackage = (i: number) => set("packages", form.packages.filter((_, j) => j !== i));
  const updatePackage = (i: number, k: string, v: any) => { const p = [...form.packages]; p[i] = { ...p[i], [k]: v }; set("packages", p); };
  const addPkgFeature = (i: number) => { const p = [...form.packages]; p[i] = { ...p[i], features: [...p[i].features, ""] }; set("packages", p); };
  const updatePkgFeature = (i: number, j: number, v: string) => { const p = [...form.packages]; const f = [...p[i].features]; f[j] = v; p[i] = { ...p[i], features: f }; set("packages", p); };
  const removePkgFeature = (i: number, j: number) => { const p = [...form.packages]; p[i] = { ...p[i], features: p[i].features.filter((_, k) => k !== j) }; set("packages", p); };

  /* Subscription feature helpers */
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
          {/* ── Basic Info ── */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Basic Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Listing Type *</Label>
                <Select value={form.listing_type} onValueChange={(v) => set("listing_type", v as ListingType)} disabled={!!listing}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">💾 Digital Product</SelectItem>
                    <SelectItem value="physical">📦 Physical Product</SelectItem>
                    <SelectItem value="service">🛠️ Service</SelectItem>
                    <SelectItem value="subscription">♾️ Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Name *</Label>
                <Input className="mt-1 h-9" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Listing name" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Short Description * <span className="text-muted-foreground font-normal">(shown in cards)</span></Label>
              <Textarea className="mt-1" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description..." />
            </div>
            <div>
              <Label className="text-xs">Detailed Description <span className="text-muted-foreground font-normal">(shown in detail view)</span></Label>
              <Textarea className="mt-1" rows={3} value={form.long_description} onChange={(e) => set("long_description", e.target.value)} placeholder="Full description..." />
            </div>
            <div>
              <Label className="text-xs">Thumbnail URL</Label>
              <Input className="mt-1 h-9" value={form.thumbnail_url} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="https://..." />
            </div>
          </section>

          <div className="border-t border-border/30" />

          {/* ── Classification ── */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Classification</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Main Category</Label>
                <Select value={form.category || "__none__"} onValueChange={(v) => set("category", v === "__none__" ? "" : v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {allMainCats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
              <Label className="text-xs">Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
              <Input className="mt-1 h-9" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="react, typescript, dashboard" />
            </div>
          </section>

          <div className="border-t border-border/30" />

          {/* ── Pricing ── */}
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
                <Label className="text-xs">Price (in cents) <span className="text-muted-foreground font-normal">2999 = $29.99</span></Label>
                <Input className="mt-1 h-9" type="number" min="0" value={form.price_cents} onChange={(e) => set("price_cents", e.target.value)} disabled={isFree} />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EGP">EGP</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Publisher / Seller Name</Label>
              <Input className="mt-1 h-9" value={form.publisher_name} onChange={(e) => set("publisher_name", e.target.value)} placeholder="Your name or brand" />
            </div>
            <div className="flex items-center gap-6">
              {([
                { key: "is_featured", label: "⭐ Featured" },
                { key: "is_new",      label: "🆕 New" },
                { key: "is_verified", label: "✅ Verified" },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form[key] as boolean}
                    onChange={(e) => set(key, e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer" />
                  <span className="text-xs">{label}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="border-t border-border/30" />

          {/* ── Type-specific Details ── */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {TYPE_CFG[form.listing_type].icon} {TYPE_CFG[form.listing_type].label} Details
            </p>

            {/* Digital */}
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
                <div>
                  <Label className="text-xs">File Size</Label>
                  <Input className="mt-1 h-9" value={form.file_size} onChange={(e) => set("file_size", e.target.value)} placeholder="e.g. 45 MB" />
                </div>
                <div>
                  <Label className="text-xs">Version</Label>
                  <Input className="mt-1 h-9" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="e.g. 2.1.0" />
                </div>
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
                <div className="col-span-2">
                  <Label className="text-xs">Compatibility / Requirements</Label>
                  <Input className="mt-1 h-9" value={form.compatibility} onChange={(e) => set("compatibility", e.target.value)} placeholder="e.g. React 18+, Node.js 20+" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Demo URL</Label>
                  <Input className="mt-1 h-9" value={form.demo_url} onChange={(e) => set("demo_url", e.target.value)} placeholder="https://demo.example.com" />
                </div>
              </div>
            )}

            {/* Physical */}
            {form.listing_type === "physical" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Brand</Label>
                  <Input className="mt-1 h-9" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Brand name" />
                </div>
                <div>
                  <Label className="text-xs">SKU</Label>
                  <Input className="mt-1 h-9" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="PROD-001" />
                </div>
                <div>
                  <Label className="text-xs">Stock Quantity</Label>
                  <Input className="mt-1 h-9" type="number" min="0" value={form.stock_qty} onChange={(e) => set("stock_qty", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs">Weight (kg)</Label>
                  <Input className="mt-1 h-9" type="number" step="0.01" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} placeholder="0.5" />
                </div>
                <div>
                  <Label className="text-xs">Dimensions</Label>
                  <Input className="mt-1 h-9" value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder="30×20×10 cm" />
                </div>
                <div>
                  <Label className="text-xs">Material</Label>
                  <Input className="mt-1 h-9" value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="e.g. Aluminum, Cotton" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Shipping Zones</Label>
                  <Input className="mt-1 h-9" value={form.shipping_zones} onChange={(e) => set("shipping_zones", e.target.value)} placeholder="Egypt, Saudi Arabia, UAE, Worldwide" />
                </div>
              </div>
            )}

            {/* Service */}
            {form.listing_type === "service" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Delivery (days)</Label>
                    <Input className="mt-1 h-9" type="number" min="1" value={form.delivery_days} onChange={(e) => set("delivery_days", e.target.value)} placeholder="e.g. 3" />
                  </div>
                  <div>
                    <Label className="text-xs">Revisions</Label>
                    <Input className="mt-1 h-9" type="number" min="0" value={form.revisions} onChange={(e) => set("revisions", e.target.value)} placeholder="e.g. 3" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Service Packages <span className="text-muted-foreground font-normal">(max 3)</span></Label>
                    {form.packages.length < 3 && (
                      <button onClick={addPackage} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" />Add Package
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {form.packages.map((pkg, i) => (
                      <div key={i} className="rounded-lg border border-border/50 p-3 bg-secondary/10 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input className="h-8 text-xs flex-1" value={pkg.name} onChange={(e) => updatePackage(i, "name", e.target.value)} placeholder="Package name (e.g. Basic)" />
                          <Input className="h-8 text-xs w-32" type="number" min="0" value={pkg.price_cents} onChange={(e) => updatePackage(i, "price_cents", e.target.value)} placeholder="Price (cents)" />
                          {form.packages.length > 1 && (
                            <button onClick={() => removePackage(i)} className="text-red-400 hover:text-red-300 p-1 shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {pkg.features.map((f, j) => (
                            <div key={j} className="flex items-center gap-1.5">
                              <Input className="h-7 text-xs flex-1" value={f} onChange={(e) => updatePkgFeature(i, j, e.target.value)} placeholder={`Feature ${j + 1}`} />
                              {pkg.features.length > 1 && (
                                <button onClick={() => removePkgFeature(i, j)} className="text-muted-foreground hover:text-red-400 p-1"><X className="w-3 h-3" /></button>
                              )}
                            </div>
                          ))}
                          <button onClick={() => addPkgFeature(i)} className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
                            <Plus className="w-3 h-3" />Add feature
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Subscription */}
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
                  <div>
                    <Label className="text-xs">Trial Days</Label>
                    <Input className="mt-1 h-9" type="number" min="0" value={form.trial_days} onChange={(e) => set("trial_days", e.target.value)} placeholder="e.g. 14" />
                  </div>
                  <div>
                    <Label className="text-xs">Max Users</Label>
                    <Input className="mt-1 h-9" type="number" min="1" value={form.max_users} onChange={(e) => set("max_users", e.target.value)} placeholder="e.g. 5" />
                  </div>
                  <div>
                    <Label className="text-xs">Storage (GB)</Label>
                    <Input className="mt-1 h-9" type="number" min="0" value={form.storage_gb} onChange={(e) => set("storage_gb", e.target.value)} placeholder="e.g. 100" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Features Included</Label>
                    <button onClick={addFeature} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" />Add
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {form.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Input className="h-8 text-xs flex-1" value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
                        {form.features.length > 1 && (
                          <button onClick={() => removeFeature(i)} className="text-muted-foreground hover:text-red-400 p-1"><X className="w-3 h-3" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
        <DialogHeader><DialogTitle>Delete Listing</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong className="text-foreground">{name}</strong>? This action cannot be undone.
        </p>
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
   CATEGORY MANAGER DIALOG
═══════════════════════════════════════════════════════════ */
export function CategoryManagerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [categories, setCategories] = useState<MpCategory[]>([]);
  const [activeType, setActiveType] = useState<ListingType>("digital");
  const [newMain, setNewMain] = useState("");
  const [newSub, setNewSub] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const db = supabase as any;

  const loadCats = async () => {
    const { data } = await db.from("mp_categories").select("*").eq("listing_type", activeType).order("sort_order,name");
    setCategories(data || []);
  };
  useEffect(() => { if (open) loadCats(); }, [open, activeType]);

  const addMain = async () => {
    if (!newMain.trim()) return;
    await db.from("mp_categories").insert({ listing_type: activeType, name: newMain.trim(), parent_id: null });
    setNewMain(""); loadCats(); toast.success("Category added");
  };
  const addSub = async () => {
    if (!newSub.trim() || !selectedParent) return toast.error("Select a parent category first");
    await db.from("mp_categories").insert({ listing_type: activeType, name: newSub.trim(), parent_id: selectedParent });
    setNewSub(""); loadCats(); toast.success("Sub-category added");
  };
  const deleteCat = async (id: string) => {
    await db.from("mp_categories").delete().eq("id", id);
    loadCats(); toast.success("Deleted");
  };

  const mainCats = categories.filter((c) => !c.parent_id);
  const subOf = (pid: string) => categories.filter((c) => c.parent_id === pid);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Manage Categories</DialogTitle></DialogHeader>

        {/* Type selector */}
        <div className="flex gap-1.5 flex-wrap">
          {(["digital","physical","service","subscription"] as ListingType[]).map((t) => (
            <button key={t} onClick={() => setActiveType(t)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${activeType === t ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"}`}>
              {TYPE_CFG[t].icon} {TYPE_CFG[t].label}
            </button>
          ))}
        </div>

        {/* Tree */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto rounded-lg border border-border/50 p-2 bg-secondary/5">
          {mainCats.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No custom categories yet.</p>
          ) : mainCats.map((cat) => (
            <div key={cat.id} className="rounded-lg border border-border/40 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary/20">
                <FolderPlus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium flex-1">{cat.name}</span>
                <button onClick={() => deleteCat(cat.id)} className="text-red-400 hover:text-red-300 p-0.5"><Trash2 className="w-3 h-3" /></button>
              </div>
              {subOf(cat.id).map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 pl-8 pr-3 py-1.5 border-t border-border/20 bg-secondary/5">
                  <span className="text-[11px] text-muted-foreground flex-1">└ {sub.name}</span>
                  <button onClick={() => deleteCat(sub.id)} className="text-red-400 hover:text-red-300 p-0.5"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Add main */}
        <div className="space-y-1.5 pt-3 border-t border-border/30">
          <p className="text-xs font-semibold text-muted-foreground">Add Main Category</p>
          <div className="flex gap-2">
            <Input className="h-8 text-sm flex-1" value={newMain} onChange={(e) => setNewMain(e.target.value)} placeholder="Category name" onKeyDown={(e) => e.key === "Enter" && addMain()} />
            <Button size="sm" className="h-8 gap-1 text-xs shrink-0" onClick={addMain}><Plus className="w-3 h-3" />Add</Button>
          </div>
        </div>

        {/* Add sub */}
        {mainCats.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Add Sub-category</p>
            <div className="flex gap-2">
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger className="h-8 text-xs w-40 shrink-0"><SelectValue placeholder="Under..." /></SelectTrigger>
                <SelectContent>{mainCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="h-8 text-sm flex-1" value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Sub-category name" onKeyDown={(e) => e.key === "Enter" && addSub()} />
              <Button size="sm" className="h-8 gap-1 text-xs shrink-0" onClick={addSub}><Plus className="w-3 h-3" />Add</Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════
   MANAGEMENT PANEL
═══════════════════════════════════════════════════════════ */
export default function ManagementPanel({
  currentUserId, onListingChange, onCategoryChange,
}: {
  currentUserId: string | null;
  onListingChange: () => void;
  onCategoryChange: () => void;
}) {
  const [tab, setTab] = useState<"listings" | "requests">("listings");
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingL, setLoadingL] = useState(false);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Listing | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [allCategories, setAllCategories] = useState<MpCategory[]>([]);
  const db = supabase as any;

  const loadMyListings = async () => {
    if (!currentUserId) return;
    setLoadingL(true);
    const { data } = await db.from("mp_listings").select("*").eq("publisher_user_id", currentUserId).order("created_at", { ascending: false });
    setMyListings(data || []);
    setLoadingL(false);
  };
  const loadRequests = async () => {
    const { data } = await db.from("mp_listing_requests").select("*").order("created_at", { ascending: false });
    setRequests(data || []);
  };
  const loadCategories = async () => {
    const { data } = await db.from("mp_categories").select("*").order("sort_order,name");
    setAllCategories(data || []);
  };

  useEffect(() => {
    loadMyListings();
    loadRequests();
    loadCategories();
  }, [currentUserId]);

  const deleteListing = async (id: string) => {
    await db.from("mp_listings").delete().eq("id", id);
    setDeleteId(null);
    loadMyListings();
    onListingChange();
    toast.success("Listing deleted");
  };
  const updateRequest = async (id: string, status: "approved" | "rejected") => {
    await db.from("mp_listing_requests").update({ status }).eq("id", id);
    loadRequests();
    toast.success(`Request ${status}`);
  };
  const handleSaved = () => { loadMyListings(); onListingChange(); };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="px-4 max-w-7xl mx-auto mb-4">
      <div className="rounded-xl border border-border bg-secondary/5 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-secondary/10">
          <Settings className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Marketplace Manager</span>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => { setEditTarget(null); setShowAddEdit(true); }}
              className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <PackagePlus className="w-3.5 h-3.5" />Add Listing
            </button>
            <button
              onClick={() => setShowCatMgr(true)}
              className="flex items-center gap-1.5 text-xs border border-border/60 px-3 py-1.5 rounded-lg hover:bg-secondary/30 transition-colors ml-1"
            >
              <FolderPlus className="w-3.5 h-3.5" />Categories
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/30">
          {([
            { id: "listings", label: "My Listings", Icon: PackagePlus, count: myListings.length },
            { id: "requests", label: "Requests", Icon: ClipboardList, count: pendingCount },
          ] as const).map(({ id, label, Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-3.5 h-3.5" />{label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* My Listings tab */}
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
                      {["Name","Type","Category","Price","Status","Actions"].map((h) => (
                        <th key={h} className={`py-2 font-medium text-muted-foreground ${h === "Actions" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myListings.map((l) => {
                      const cfg = TYPE_CFG[l.listing_type];
                      return (
                        <tr key={l.id} className="border-b border-border/20 hover:bg-secondary/10">
                          <td className="py-2.5 font-medium max-w-40 truncate pr-2">{l.name}</td>
                          <td className="py-2.5 pr-2">
                            <Badge className={`text-[9px] px-1.5 py-0 ${cfg.badgeClass}`}>{cfg.icon} {cfg.label}</Badge>
                          </td>
                          <td className="py-2.5 text-muted-foreground pr-2">{l.category || "—"}</td>
                          <td className="py-2.5 pr-2"><PriceBadge price_cents={l.price_cents} pricing_model={l.pricing_model} /></td>
                          <td className="py-2.5 text-center pr-2">
                            <Badge className={`text-[9px] px-1.5 py-0 ${l.is_active !== false ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-secondary text-muted-foreground"}`}>
                              {l.is_active !== false ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { setEditTarget(l); setShowAddEdit(true); }}
                                className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => setDeleteId(l.id)}
                                className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
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

          {/* Requests tab */}
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
                        <Badge className={`text-[9px] px-1.5 py-0 ml-auto ${req.status === "approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : req.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-amber-500/20 text-amber-400 border-amber-500/40"}`}>
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{req.description}</p>
                      {req.contact && <p className="text-[10px] text-muted-foreground mt-0.5">{req.contact}</p>}
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => updateRequest(req.id, "approved")}
                          className="p-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => updateRequest(req.id, "rejected")}
                          className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddEditListingDialog
        open={showAddEdit}
        onClose={() => { setShowAddEdit(false); setEditTarget(null); }}
        listing={editTarget}
        onSaved={handleSaved}
        allCategories={allCategories}
      />
      <CategoryManagerDialog
        open={showCatMgr}
        onClose={() => { setShowCatMgr(false); loadCategories(); onCategoryChange(); }}
      />
      <DeleteConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteListing(deleteId)}
        name={myListings.find((l) => l.id === deleteId)?.name || ""}
      />
    </div>
  );
}
