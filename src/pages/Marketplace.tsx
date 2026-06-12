import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Store, Star, Search, Shield,
  Download, Check, Heart, Grid3X3, List, Sparkles,
  ShoppingCart, Clock, RefreshCw, X, ChevronRight,
  Monitor, Box, Wrench, Repeat, Tag, Users,
  SlidersHorizontal, Truck, Plus, Pencil, Trash2, Settings,
} from "lucide-react";
import ManagementPanel, { DeleteConfirmDialog, COLOR_PALETTE, type MpCategory, type MpListingType } from "@/components/marketplace/MarketplaceManager";
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

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */
type ListingType = string;
type PricingModel = "free" | "one_time" | "monthly" | "annual" | "contact";

interface Listing {
  id: string;
  listing_type: ListingType;
  name: string;
  description: string;
  long_description?: string;
  thumbnail_url?: string;
  category: string;
  tags: string[];
  price_cents: number;
  currency: string;
  pricing_model: PricingModel;
  publisher_name: string;
  publisher_avatar?: string;
  rating: number;
  reviews_count: number;
  sales_count: number;
  is_featured: boolean;
  is_new: boolean;
  is_verified: boolean;
  meta: Record<string, any>;
  created_at: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIGURATION  — runtime config is built from DB; static fallback below
═══════════════════════════════════════════════════════════════════════════ */
type TypeCfg = {
  label: string; labelAr: string; icon: string;
  gradient: string; border: string; badgeClass: string;
  hoverBorder: string; shadow: string; categories: string[];
};
const FALLBACK_CFG: TypeCfg = {
  label: "Other", labelAr: "أخرى", icon: "📦",
  ...COLOR_PALETTE.violet,
  categories: [],
};
function buildTypeConfig(types: MpListingType[]): Record<string, TypeCfg> {
  return Object.fromEntries(
    types.map((t) => [
      t.code,
      {
        label: t.label, labelAr: t.label_ar, icon: t.icon,
        ...(COLOR_PALETTE[t.color] || COLOR_PALETTE.violet),
        categories: t.default_categories || [],
      },
    ])
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function formatPrice(price_cents: number, pricing_model: PricingModel) {
  if (pricing_model === "free" || price_cents === 0) return "Free";
  if (pricing_model === "contact") return "Contact";
  const amount = `$${(price_cents / 100).toFixed(0)}`;
  if (pricing_model === "monthly") return `${amount}/mo`;
  if (pricing_model === "annual") return `${amount}/yr`;
  return amount;
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const sz = size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sz} ${
            n <= Math.round(rating || 0)
              ? "text-amber-400 fill-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-[10px] text-muted-foreground">
        {rating?.toFixed(1) || "—"}
      </span>
    </span>
  );
}

function PriceBadge({ price_cents, pricing_model }: { price_cents: number; pricing_model: PricingModel }) {
  const label = formatPrice(price_cents, pricing_model);
  const cls =
    label === "Free" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
    : label === "Contact" ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
    : "bg-primary/20 text-primary border-primary/40";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${cls}`}>{label}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARDS
═══════════════════════════════════════════════════════════════════════════ */

/* ── Digital ─────────────────────────────────────────────────────────────── */
function DigitalCard({ item, cfg, onDetails, onWishlist, wishlisted }: {
  item: Listing; cfg: TypeCfg; onDetails: (i: Listing) => void;
  onWishlist: (id: string) => void; wishlisted: boolean;
}) {
  return (
    <Card
      className={`group relative flex flex-col p-4 cursor-pointer ${cfg.hoverBorder} transition-all hover:shadow-lg ${cfg.shadow} bg-background/60 backdrop-blur-sm`}
      onClick={() => onDetails(item)}
    >
      <button
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onWishlist(item.id); }}
      >
        <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-400 text-rose-400" : "text-muted-foreground"}`} />
      </button>
      <div className="flex items-start gap-3 mb-3">
        <div className={`text-3xl w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${cfg.gradient} border ${cfg.border} shrink-0 overflow-hidden`}>
          {item.thumbnail_url ? <img src={item.thumbnail_url} className="w-8 h-8 object-contain" alt={item.name} /> : "💾"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-foreground truncate">{item.name}</span>
            {item.is_verified && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {item.is_featured && <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/40">Featured</Badge>}
            {item.is_new && <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/40">New</Badge>}
            <Badge className={`text-[9px] px-1.5 py-0 ${cfg.badgeClass}`}>{item.category}</Badge>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{item.description}</p>
      {item.meta?.file_type && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
          <Tag className="w-3 h-3" />{item.meta.file_type}
          {item.meta?.version && <span className="ml-auto">v{item.meta.version}</span>}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <Stars rating={item.rating} size="xs" />
        <PriceBadge price_cents={item.price_cents} pricing_model={item.pricing_model} />
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
        <Download className="w-3 h-3" />{item.sales_count.toLocaleString()} downloads
        <span className="ml-auto truncate">{item.publisher_name}</span>
      </div>
    </Card>
  );
}

/* ── Physical ────────────────────────────────────────────────────────────── */
function PhysicalCard({ item, cfg, onDetails, onWishlist, wishlisted }: {
  item: Listing; cfg: TypeCfg; onDetails: (i: Listing) => void;
  onWishlist: (id: string) => void; wishlisted: boolean;
}) {
  
  const inStock = item.meta?.stock_qty === undefined || item.meta.stock_qty > 0;
  return (
    <Card
      className={`group relative flex flex-col p-4 cursor-pointer ${cfg.hoverBorder} transition-all hover:shadow-lg ${cfg.shadow} bg-background/60 backdrop-blur-sm`}
      onClick={() => onDetails(item)}
    >
      <button
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onWishlist(item.id); }}
      >
        <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-400 text-rose-400" : "text-muted-foreground"}`} />
      </button>
      <div className={`w-full h-28 rounded-lg mb-3 flex items-center justify-center bg-gradient-to-br ${cfg.gradient} border ${cfg.border} text-4xl overflow-hidden`}>
        {item.thumbnail_url ? <img src={item.thumbnail_url} className="h-full w-full object-contain" alt={item.name} /> : "📦"}
      </div>
      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className="font-semibold text-sm text-foreground">{item.name}</span>
        {item.is_verified && <Shield className="w-3 h-3 text-blue-400" />}
      </div>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <Badge className={`text-[9px] px-1.5 py-0 ${cfg.badgeClass}`}>{item.category}</Badge>
        {item.is_new && <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/40">New</Badge>}
        <Badge className={`text-[9px] px-1.5 py-0 ml-auto ${inStock ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-red-500/20 text-red-400 border-red-500/40"}`}>
          {inStock ? "In Stock" : "Out of Stock"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{item.description}</p>
      {item.meta?.shipping_zones && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
          <Truck className="w-3 h-3" />Ships to: {item.meta.shipping_zones}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <Stars rating={item.rating} size="xs" />
        <PriceBadge price_cents={item.price_cents} pricing_model={item.pricing_model} />
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
        <ShoppingCart className="w-3 h-3" />{item.sales_count.toLocaleString()} sold
        <span className="ml-auto truncate">{item.publisher_name}</span>
      </div>
    </Card>
  );
}

/* ── Service ─────────────────────────────────────────────────────────────── */
function ServiceCard({ item, cfg, onDetails, onWishlist, wishlisted }: {
  item: Listing; cfg: TypeCfg; onDetails: (i: Listing) => void;
  onWishlist: (id: string) => void; wishlisted: boolean;
}) {
  return (
    <Card
      className={`group relative flex flex-col p-4 cursor-pointer ${cfg.hoverBorder} transition-all hover:shadow-lg ${cfg.shadow} bg-background/60 backdrop-blur-sm`}
      onClick={() => onDetails(item)}
    >
      <button
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onWishlist(item.id); }}
      >
        <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-400 text-rose-400" : "text-muted-foreground"}`} />
      </button>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gradient-to-br ${cfg.gradient} border ${cfg.border} shrink-0 overflow-hidden`}>
          {item.publisher_avatar ? <img src={item.publisher_avatar} className="w-full h-full object-cover" alt={item.publisher_name} /> : "🛠️"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{item.publisher_name}</p>
          <div className="flex items-center gap-1">
            {item.is_verified && <Shield className="w-3 h-3 text-blue-400" />}
            <Badge className={`text-[9px] px-1.5 py-0 ${cfg.badgeClass}`}>{item.category}</Badge>
          </div>
        </div>
      </div>
      <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-amber-400 transition-colors line-clamp-2">{item.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{item.description}</p>
      <div className="grid grid-cols-2 gap-1.5 mb-3 text-[10px] text-muted-foreground">
        {item.meta?.delivery_days && (
          <div className="flex items-center gap-1 bg-secondary/30 rounded-md px-2 py-1">
            <Clock className="w-3 h-3 text-amber-400" />{item.meta.delivery_days}d delivery
          </div>
        )}
        {item.meta?.revisions && (
          <div className="flex items-center gap-1 bg-secondary/30 rounded-md px-2 py-1">
            <RefreshCw className="w-3 h-3 text-amber-400" />{item.meta.revisions} revisions
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <Stars rating={item.rating} size="xs" />
        <div className="text-right">
          <div className="text-[9px] text-muted-foreground">Starting at</div>
          <PriceBadge price_cents={item.price_cents} pricing_model={item.pricing_model} />
        </div>
      </div>
    </Card>
  );
}

/* ── Subscription ────────────────────────────────────────────────────────── */
function SubscriptionCard({ item, cfg, onDetails, onWishlist, wishlisted }: {
  item: Listing; cfg: TypeCfg; onDetails: (i: Listing) => void;
  onWishlist: (id: string) => void; wishlisted: boolean;
}) {
  const features: string[] = item.meta?.features || [];
  return (
    <Card
      className={`group relative flex flex-col p-4 cursor-pointer ${cfg.hoverBorder} transition-all hover:shadow-lg ${cfg.shadow} bg-background/60 backdrop-blur-sm`}
      onClick={() => onDetails(item)}
    >
      <button
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onWishlist(item.id); }}
      >
        <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-400 text-rose-400" : "text-muted-foreground"}`} />
      </button>
      <div className="flex items-start gap-3 mb-3">
        <div className={`text-3xl w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${cfg.gradient} border ${cfg.border} shrink-0 overflow-hidden`}>
          {item.thumbnail_url ? <img src={item.thumbnail_url} className="w-8 h-8 object-contain" alt={item.name} /> : "♾️"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">{item.name}</span>
            {item.is_verified && <Shield className="w-3 h-3 text-blue-400" />}
          </div>
          <Badge className={`text-[9px] px-1.5 py-0 mt-0.5 ${cfg.badgeClass}`}>{item.category}</Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
      {features.length > 0 && (
        <ul className="space-y-1 mb-3 flex-1">
          {features.slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Check className="w-3 h-3 text-pink-400 shrink-0" />{f}
            </li>
          ))}
          {features.length > 3 && <li className="text-[10px] text-muted-foreground pl-4">+{features.length - 3} more</li>}
        </ul>
      )}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
        {item.meta?.max_users && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Up to {item.meta.max_users} users</span>}
        {item.meta?.storage_gb && <span className="flex items-center gap-1 ml-auto"><Download className="w-3 h-3" />{item.meta.storage_gb}GB</span>}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <Stars rating={item.rating} size="xs" />
        <PriceBadge price_cents={item.price_cents} pricing_model={item.pricing_model} />
      </div>
      {item.meta?.trial_days && (
        <div className="text-[10px] text-pink-400 mt-1 text-center">{item.meta.trial_days}-day free trial</div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LISTING DETAIL DIALOG
═══════════════════════════════════════════════════════════════════════════ */
function ListingDetailDialog({ item, cfg, open, onClose, onPurchase, isPurchased, onWishlist, wishlisted }: {
  item: Listing | null; cfg: TypeCfg; open: boolean; onClose: () => void;
  onPurchase: (i: Listing) => void; isPurchased: boolean;
  onWishlist: (id: string) => void; wishlisted: boolean;
}) {
  if (!item) return null;
  const price = formatPrice(item.price_cents, item.pricing_model);
  const features: string[] = item.meta?.features || [];
  const packages: any[] = item.meta?.packages || [];
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`text-4xl w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${cfg.gradient} border ${cfg.border} shrink-0 overflow-hidden`}>
              {item.thumbnail_url ? <img src={item.thumbnail_url} className="w-10 h-10 object-contain" alt={item.name} /> : cfg.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg">{item.name}</DialogTitle>
                {item.is_verified && <Shield className="w-4 h-4 text-blue-400" />}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={`text-[9px] px-2 py-0.5 ${cfg.badgeClass}`}>{cfg.label}</Badge>
                <Badge variant="outline" className="text-[9px] px-2 py-0.5">{item.category}</Badge>
                {item.is_featured && <Badge className="text-[9px] px-2 py-0.5 bg-amber-500/20 text-amber-400 border-amber-500/40">Featured</Badge>}
                {item.is_new && <Badge className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/40">New</Badge>}
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="flex items-center gap-4 py-3 border-y border-border/50">
          <Stars rating={item.rating} />
          <span className="text-xs text-muted-foreground">({item.reviews_count} reviews)</span>
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            {item.listing_type === "service" ? <><Users className="w-3 h-3" />{item.sales_count} orders</>
             : item.listing_type === "subscription" ? <><Users className="w-3 h-3" />{item.sales_count} subscribers</>
             : <><Download className="w-3 h-3" />{item.sales_count.toLocaleString()} sold</>}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{item.long_description || item.description}</p>
        {item.listing_type === "digital" && Object.keys(item.meta || {}).length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {item.meta.file_type && <div className="bg-secondary/20 rounded-lg p-3"><p className="text-[10px] text-muted-foreground">File Type</p><p className="text-sm font-medium">{item.meta.file_type}</p></div>}
            {item.meta.file_size && <div className="bg-secondary/20 rounded-lg p-3"><p className="text-[10px] text-muted-foreground">File Size</p><p className="text-sm font-medium">{item.meta.file_size}</p></div>}
            {item.meta.version && <div className="bg-secondary/20 rounded-lg p-3"><p className="text-[10px] text-muted-foreground">Version</p><p className="text-sm font-medium">{item.meta.version}</p></div>}
            {item.meta.license_type && <div className="bg-secondary/20 rounded-lg p-3"><p className="text-[10px] text-muted-foreground">License</p><p className="text-sm font-medium">{item.meta.license_type}</p></div>}
            {item.meta.compatibility && <div className="bg-secondary/20 rounded-lg p-3 col-span-2"><p className="text-[10px] text-muted-foreground">Compatibility</p><p className="text-sm font-medium">{item.meta.compatibility}</p></div>}
          </div>
        )}
        {item.listing_type === "physical" && Object.keys(item.meta || {}).length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {item.meta.weight_kg && <div className="bg-secondary/20 rounded-lg p-3"><p className="text-[10px] text-muted-foreground">Weight</p><p className="text-sm font-medium">{item.meta.weight_kg} kg</p></div>}
            {item.meta.dimensions && <div className="bg-secondary/20 rounded-lg p-3"><p className="text-[10px] text-muted-foreground">Dimensions</p><p className="text-sm font-medium">{item.meta.dimensions}</p></div>}
            {item.meta.sku && <div className="bg-secondary/20 rounded-lg p-3"><p className="text-[10px] text-muted-foreground">SKU</p><p className="text-sm font-medium">{item.meta.sku}</p></div>}
            {item.meta.material && <div className="bg-secondary/20 rounded-lg p-3"><p className="text-[10px] text-muted-foreground">Material</p><p className="text-sm font-medium">{item.meta.material}</p></div>}
            {item.meta.shipping_zones && <div className="bg-secondary/20 rounded-lg p-3 col-span-2"><p className="text-[10px] text-muted-foreground">Ships To</p><p className="text-sm font-medium flex items-center gap-1"><Truck className="w-3 h-3" />{item.meta.shipping_zones}</p></div>}
          </div>
        )}
        {item.listing_type === "service" && packages.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2">Packages</p>
            <div className="grid grid-cols-3 gap-2">
              {packages.map((pkg: any, i: number) => (
                <div key={i} className="bg-secondary/20 rounded-lg p-3 border border-border/50">
                  <p className="text-xs font-semibold">{pkg.name}</p>
                  <p className="text-primary text-sm font-bold">${(pkg.price_cents / 100).toFixed(0)}</p>
                  <ul className="mt-1 space-y-0.5">
                    {pkg.features?.map((f: string, j: number) => (
                      <li key={j} className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 text-amber-400 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        {item.listing_type === "subscription" && features.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2">What&apos;s included</p>
            <div className="grid grid-cols-2 gap-1.5">
              {features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/20 rounded-md px-2 py-1.5">
                  <Check className="w-3 h-3 text-pink-400 shrink-0" />{f}
                </div>
              ))}
            </div>
            {(item.meta?.max_users || item.meta?.storage_gb || item.meta?.trial_days) && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {item.meta.max_users && <span className="flex items-center gap-1"><Users className="w-3 h-3 text-pink-400" />Up to {item.meta.max_users} users</span>}
                {item.meta.storage_gb && <span className="flex items-center gap-1"><Download className="w-3 h-3 text-pink-400" />{item.meta.storage_gb}GB storage</span>}
                {item.meta.trial_days && <span className="text-pink-400">{item.meta.trial_days}-day free trial</span>}
              </div>
            )}
          </div>
        )}
        {item.tags?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3 h-3 text-muted-foreground" />
            {item.tags.map((t) => <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">{t}</Badge>)}
          </div>
        )}
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-sm overflow-hidden shrink-0">
            {item.publisher_avatar ? <img src={item.publisher_avatar} className="w-full h-full object-cover" alt={item.publisher_name} /> : "👤"}
          </div>
          <div>
            <p className="text-xs font-medium">{item.publisher_name}</p>
            <p className="text-[10px] text-muted-foreground">Publisher / Seller</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => onWishlist(item.id)}>
              <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-400 text-rose-400" : ""}`} />
              {wishlisted ? "Saved" : "Save"}
            </Button>
            <Button size="sm" className="gap-1 text-xs" disabled={isPurchased} onClick={() => onPurchase(item)}>
              {isPurchased ? <><Check className="w-3 h-3" />Owned</>
               : item.pricing_model === "free" || item.price_cents === 0 ? <><Download className="w-3 h-3" />Get Free</>
               : item.listing_type === "service" ? <><Wrench className="w-3 h-3" />Order Now</>
               : item.listing_type === "subscription" ? <><Repeat className="w-3 h-3" />Subscribe</>
               : <><ShoppingCart className="w-3 h-3" />Purchase — {price}</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REQUEST LISTING DIALOG
═══════════════════════════════════════════════════════════════════════════ */
function RequestListingDialog({ open, onClose, listingTypes }: { open: boolean; onClose: () => void; listingTypes: MpListingType[] }) {
  const firstType = listingTypes[0]?.code || "digital";
  const [form, setForm] = useState({ name: "", listing_type: firstType, description: "", contact: "" });
  const [loading, setLoading] = useState(false);
  const db = supabase as any;
  const submit = async () => {
    if (!form.name.trim() || !form.description.trim()) return toast.error("Please fill in name and description");
    setLoading(true);
    try {
      await db.from("mp_listing_requests").insert(form);
      toast.success("Request submitted! We will review it shortly.");
      onClose();
      setForm({ name: "", listing_type: "digital", description: "", contact: "" });
    } catch { toast.error("Failed to submit request"); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Request a Listing</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name / Title *</Label>
            <Input className="mt-1" placeholder="e.g. React UI Kit Pro" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Type *</Label>
            <Select value={form.listing_type} onValueChange={(v) => setForm((f) => ({ ...f, listing_type: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {listingTypes.filter((t) => t.is_active).map((t) => (
                  <SelectItem key={t.code} value={t.code}>{t.icon} {t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Description *</Label>
            <Textarea className="mt-1" rows={3} placeholder="Describe the product or service..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Contact / URL (optional)</Label>
            <Input className="mt-1" placeholder="Email or website URL" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={loading} onClick={submit}>
            {loading ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIST-VIEW ROW
═══════════════════════════════════════════════════════════════════════════ */
function ListingRow({ item, cfg, onDetails, onWishlist, wishlisted }: {
  item: Listing; cfg: TypeCfg; onDetails: (i: Listing) => void;
  onWishlist: (id: string) => void; wishlisted: boolean;
}) {
  return (
    <Card className="flex items-center gap-4 p-3 cursor-pointer hover:bg-secondary/20 transition-colors" onClick={() => onDetails(item)}>
      <div className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br ${cfg.gradient} border ${cfg.border} shrink-0 overflow-hidden`}>
        {item.thumbnail_url ? <img src={item.thumbnail_url} className="w-7 h-7 object-contain" alt={item.name} /> : cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{item.name}</span>
          {item.is_verified && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
          <Badge className={`text-[9px] px-1.5 py-0 ${cfg.badgeClass}`}>{cfg.label}</Badge>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{item.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
        <div className="flex items-center gap-3 mt-1">
          <Stars rating={item.rating} size="xs" />
          <span className="text-[10px] text-muted-foreground">{item.publisher_name}</span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); onWishlist(item.id); }}>
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-400 text-rose-400" : "text-muted-foreground"}`} />
        </button>
        <PriceBadge price_cents={item.price_cents} pricing_model={item.pricing_model} />
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Marketplace() {
  const navigate = useNavigate();
  const db = supabase as any;

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingTypes, setListingTypes] = useState<MpListingType[]>([]);
  const [typeConfigMap, setTypeConfigMap] = useState<Record<string, TypeCfg>>({});
  const [purchased, setPurchased] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<"all" | ListingType>("all");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewGrid, setViewGrid] = useState(true);
  const [detailItem, setDetailItem] = useState<Listing | null>(null);
  const [showRequest, setShowRequest] = useState(false);

  // Management mode
  const [isManageMode, setIsManageMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [mpCategories, setMpCategories] = useState<MpCategory[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadCategories = async () => {
    const { data } = await (db as any).from("mp_categories").select("*").order("sort_order,name");
    setMpCategories(data || []);
  };

  const loadTypes = async () => {
    const { data, error } = await (db as any).from("mp_listing_types").select("*").eq("is_active", true).order("sort_order,label");
    let types: MpListingType[] = data || [];
    // Auto-seed defaults if table is empty or doesn't exist yet
    if (!error && types.length === 0) {
      const defaults = [
        { code:"digital",      label:"Digital Products",  label_ar:"منتجات رقمية",  icon:"💾", color:"violet",  sort_order:1, is_active:true, is_built_in:true, default_categories:["Software","Templates","E-books","Online Courses","Plugins","UI Kits","Fonts","Audio","Video","Graphics"] },
        { code:"physical",     label:"Physical Products", label_ar:"منتجات ملموسة", icon:"📦", color:"emerald", sort_order:2, is_active:true, is_built_in:true, default_categories:["Electronics","Fashion","Furniture","Food & Beverage","Handcraft","Books","Sports","Tools","Accessories","Art"] },
        { code:"service",      label:"Services",          label_ar:"خدمات",          icon:"🛠️", color:"amber",   sort_order:3, is_active:true, is_built_in:true, default_categories:["Design","Development","Marketing","Writing & Translation","Consulting","Legal","Finance","Coaching","Photography","Videography"] },
        { code:"subscription", label:"Subscriptions",     label_ar:"اشتراكات",       icon:"♾️", color:"pink",    sort_order:4, is_active:true, is_built_in:true, default_categories:["SaaS Tools","Media Streaming","Education","Fitness","Business","Entertainment","News & Data","Cloud Storage"] },
      ];
      const { data: seeded } = await (db as any).from("mp_listing_types").upsert(defaults, { onConflict: "code" }).select();
      types = seeded || [];
    }
    setListingTypes(types);
    setTypeConfigMap(buildTypeConfig(types));
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await db.from("mp_listings").select("*").eq("is_active", true);
      setListings(data || []);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pur } = await db.from("mp_purchases").select("listing_id").eq("user_id", user.id);
        setPurchased((pur || []).map((p: any) => p.listing_id));
        const { data: wl } = await db.from("mp_wishlist").select("listing_id").eq("user_id", user.id);
        setWishlist((wl || []).map((w: any) => w.listing_id));
      }
    } catch { /* tables may not exist yet */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    loadCategories();
    loadTypes();
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

  const handleTypeChange = (type: "all" | ListingType) => {
    setActiveType(type);
    setActiveCategory("All");
    setActiveSubCategory("All");
  };

  const handlePurchase = async (item: Listing) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Please sign in to purchase");
    try {
      await db.from("mp_purchases").insert({ listing_id: item.id, user_id: user.id, amount_cents: item.price_cents });
      setPurchased((prev) => [...prev, item.id]);
      toast.success(`${item.name} added to your library!`);
    } catch { toast.error("Purchase failed"); }
  };

  const handleWishlist = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Please sign in");
    const isWished = wishlist.includes(id);
    if (isWished) {
      await db.from("mp_wishlist").delete().eq("listing_id", id).eq("user_id", user.id);
      setWishlist((prev) => prev.filter((w) => w !== id));
    } else {
      await db.from("mp_wishlist").insert({ listing_id: id, user_id: user.id });
      setWishlist((prev) => [...prev, id]);
    }
  };

  const filtered = useMemo(() => {
    let result = [...listings];
    if (activeType !== "all") result = result.filter((l) => l.listing_type === activeType);
    if (activeCategory !== "All") result = result.filter((l) => l.category === activeCategory);
    if (activeSubCategory !== "All") result = result.filter((l) => l.sub_category === activeSubCategory);
    if (priceFilter === "free") result = result.filter((l) => l.pricing_model === "free" || l.price_cents === 0);
    if (priceFilter === "paid") result = result.filter((l) => l.pricing_model !== "free" && l.price_cents > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.name?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q) || l.publisher_name?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "featured":    result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break;
      case "rating":      result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "popular":     result.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)); break;
      case "newest":      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case "price_low":   result.sort((a, b) => a.price_cents - b.price_cents); break;
      case "price_high":  result.sort((a, b) => b.price_cents - a.price_cents); break;
    }
    return result;
  }, [listings, activeType, activeCategory, activeSubCategory, priceFilter, search, sortBy]);

  const filterCategories = useMemo(() => {
    if (activeType === "all") return ["All", ...Array.from(new Set(listings.map((l) => l.category).filter(Boolean)))];
    return ["All", ...(typeConfigMap[activeType]?.categories || [])];
  }, [activeType, listings, typeConfigMap]);

  // Sub-categories for the currently selected main category (from mp_categories DB)
  const filterSubCategories = useMemo(() => {
    if (activeCategory === "All") return [];
    // Find the DB category row whose name matches activeCategory and has the right type
    const parentRow = mpCategories.find(
      (c) => c.name === activeCategory && (activeType === "all" || c.listing_type === activeType) && !c.parent_id
    );
    if (!parentRow) return [];
    return mpCategories.filter((c) => c.parent_id === parentRow.id).map((c) => c.name);
  }, [activeCategory, activeType, mpCategories]);

  const kpis = useMemo(() => ({
    total: listings.length,
    purchased: purchased.length,
    wishlist: wishlist.length,
  }), [listings, purchased, wishlist]);

  const renderCard = (item: Listing) => {
    const cfg = typeConfigMap[item.listing_type] || FALLBACK_CFG;
    const cardProps = { item, cfg, onDetails: setDetailItem, onWishlist: handleWishlist, wishlisted: wishlist.includes(item.id) };
    const isOwner = !!currentUserId && item.publisher_user_id === currentUserId;
    let card: React.ReactNode;
    switch (item.listing_type) {
      case "digital":      card = <DigitalCard {...cardProps} />; break;
      case "physical":     card = <PhysicalCard {...cardProps} />; break;
      case "service":      card = <ServiceCard {...cardProps} />; break;
      case "subscription": card = <SubscriptionCard {...cardProps} />; break;
      default:             card = <DigitalCard {...cardProps} />; break;
    }
    return (
      <div key={item.id} className={isOwner ? "relative group/owner" : ""}>
        {card}
        {isOwner && (
          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover/owner:opacity-100 transition-opacity z-20">
            <button
              title="Edit"
              onClick={(e) => { e.stopPropagation(); /* handled via ManagementPanel */ setIsManageMode(true); }}
              className="p-1.5 rounded-md bg-background/90 border border-border shadow-sm hover:bg-secondary text-muted-foreground hover:text-foreground">
              <Pencil className="w-3 h-3" />
            </button>
            <button
              title="Delete"
              onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}
              className="p-1.5 rounded-md bg-background/90 border border-red-500/40 shadow-sm hover:bg-red-500/10 text-red-400">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 shrink-0">
            <Store className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-base">Marketplace</span>
          </div>
          <div className="relative flex-1 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="pl-9 h-8 text-sm bg-secondary/30"
              placeholder="Search products, services, subscriptions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={load} title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewGrid(!viewGrid)} title={viewGrid ? "List view" : "Grid view"}>
              {viewGrid ? <List className="w-3.5 h-3.5" /> : <Grid3X3 className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="sm" variant={isManageMode ? "default" : "outline"}
              className={`gap-1.5 text-xs h-8 ml-1 ${isManageMode ? "" : ""}`}
              onClick={() => setIsManageMode(!isManageMode)}
            >
              <Settings className="w-3.5 h-3.5" />{isManageMode ? "Exit Manager" : "Manage"}
            </Button>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowRequest(true)}>
              <Sparkles className="w-3.5 h-3.5" />Request Listing
            </Button>
          </div>
        </div>
      </header>

      {/* ══ MANAGEMENT PANEL ═════════════════════════════════════════════ */}
      {isManageMode && (
        <ManagementPanel
          currentUserId={currentUserId}
          onListingChange={load}
          onCategoryChange={() => { loadCategories(); loadTypes(); }}
        />
      )}

      <div className="px-4 py-4 max-w-7xl mx-auto space-y-4">
        {/* ══ KPI STRIP ════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: "Total",     value: kpis.total,     Icon: Store,        color: "text-primary" },
            { label: "Purchased", value: kpis.purchased, Icon: ShoppingCart,  color: "text-blue-400" },
            { label: "Wishlist",  value: kpis.wishlist,  Icon: Heart,         color: "text-rose-400" },
          ].map(({ label, value, Icon, color }) => (
            <Card key={label} className="p-3 flex items-center gap-2.5 bg-secondary/10">
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
                <p className="text-lg font-bold leading-tight">{value}</p>
              </div>
            </Card>
          ))}
          {listingTypes.map((t) => {
            const count = listings.filter((l) => l.listing_type === t.code).length;
            const pal = COLOR_PALETTE[t.color] || COLOR_PALETTE.violet;
            return (
              <Card key={t.code} className="p-3 flex items-center gap-2.5 bg-secondary/10">
                <span className="text-base shrink-0">{t.icon}</span>
                <div>
                  <p className="text-[10px] text-muted-foreground leading-none">{t.label}</p>
                  <p className="text-lg font-bold leading-tight">{count}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* ══ TYPE SELECTOR ════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => handleTypeChange("all")}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
              activeType === "all"
                ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                : "border-border/50 hover:border-border hover:bg-secondary/20"
            }`}
          >
            <span className="text-2xl">🛒</span>
            <div>
              <p className="text-xs font-semibold">All</p>
              <p className="text-[10px] text-muted-foreground">{kpis.total} listings</p>
            </div>
          </button>
          {listingTypes.map((t) => {
            const cfg = typeConfigMap[t.code] || FALLBACK_CFG;
            const count = listings.filter((l) => l.listing_type === t.code).length;
            return (
              <button
                key={t.code}
                onClick={() => handleTypeChange(t.code)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                  activeType === t.code
                    ? `${cfg.border} bg-gradient-to-r ${cfg.gradient} shadow-sm`
                    : "border-border/50 hover:border-border hover:bg-secondary/20"
                }`}
              >
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-xs font-semibold">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.label_ar} · {count}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ══ FILTER BAR ═══════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1 min-w-0">
            {filterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setActiveSubCategory("All"); }}
                className={`shrink-0 text-xs px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center border border-border/50 rounded-lg overflow-hidden text-xs">
              {(["all", "free", "paid"] as const).map((p) => (
                <button key={p} onClick={() => setPriceFilter(p)}
                  className={`px-2.5 py-1 capitalize transition-colors ${priceFilter === p ? "bg-primary text-primary-foreground" : "hover:bg-secondary/30"}`}>
                  {p}
                </button>
              ))}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs w-36 gap-1">
                <SlidersHorizontal className="w-3 h-3 shrink-0" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ══ SUB-CATEGORY ROW (shows when a main category has sub-categories) ═══ */}
        {filterSubCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />{activeCategory}
            </span>
            {["All", ...filterSubCategories].map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSubCategory(sub)}
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full border transition-all whitespace-nowrap ${
                  activeSubCategory === sub
                    ? "bg-secondary text-foreground border-border"
                    : "border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground"
                }`}
              >
                {sub === "All" ? `All ${activeCategory}` : sub}
              </button>
            ))}
          </div>
        )}

        {/* ══ RESULTS COUNT ════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
            {activeType !== "all" && <span className="ml-1 text-foreground font-medium">in {typeConfigMap[activeType]?.label || activeType}</span>}
          </span>
          {(search || activeType !== "all" || activeCategory !== "All" || priceFilter !== "all") && (
            <button className="flex items-center gap-1 text-primary hover:underline ml-2"
              onClick={() => { setSearch(""); setActiveType("all"); setActiveCategory("All"); setActiveSubCategory("All"); setPriceFilter("all"); }}>
              <X className="w-3 h-3" />Clear filters
            </button>
          )}
        </div>

        {/* ══ CONTENT ══════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => <Card key={i} className="h-48 animate-pulse bg-secondary/20" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Store className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-sm mb-1">
              {listings.length === 0 ? "No listings available yet" : "No listings match your filters"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {listings.length === 0 ? "Be the first to list a product or service" : "Try adjusting your search or filters"}
            </p>
            <button className="text-primary text-sm flex items-center gap-1 hover:underline" onClick={() => setShowRequest(true)}>
              Request a listing <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : viewGrid ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((item) => renderCard(item))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <ListingRow key={item.id} item={item} cfg={typeConfigMap[item.listing_type] || FALLBACK_CFG} onDetails={setDetailItem} onWishlist={handleWishlist} wishlisted={wishlist.includes(item.id)} />
            ))}
          </div>
        )}
      </div>

      {/* ══ DIALOGS ══════════════════════════════════════════════════════════ */}
      <ListingDetailDialog
        item={detailItem} cfg={detailItem ? (typeConfigMap[detailItem.listing_type] || FALLBACK_CFG) : FALLBACK_CFG} open={!!detailItem} onClose={() => setDetailItem(null)}
        onPurchase={handlePurchase}
        isPurchased={detailItem ? purchased.includes(detailItem.id) : false}
        onWishlist={handleWishlist}
        wishlisted={detailItem ? wishlist.includes(detailItem.id) : false}
      />
      <RequestListingDialog open={showRequest} onClose={() => setShowRequest(false)} listingTypes={listingTypes} />
      <DeleteConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await (db as any).from("mp_listings").delete().eq("id", deleteId); setDeleteId(null); load(); } }}
        name={listings.find((l) => l.id === deleteId)?.name || ""}
      />
    </div>
  );
}
