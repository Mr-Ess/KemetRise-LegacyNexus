import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import VendorLayout from "@/layouts/VendorLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Search, ImageIcon, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  category?: string;
  image_url?: string;
  stock_qty?: number;
  is_active?: boolean;
  vendor_user_id?: string;
};

const EMPTY: Omit<Product, "id" | "vendor_user_id"> = {
  name: "", description: "", price_cents: 0, category: "", image_url: "", stock_qty: 0, is_active: true,
};

export default function VendorProducts() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const R = i18n.language === "ar";
  const db = supabase as any;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<Partial<Product>>(EMPTY);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await db.from("public_products").select("*").eq("vendor_user_id", user.id).order("created_at", { ascending: false });
    if (!error) setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const openAdd = () => { setCurrent({ ...EMPTY }); setModal("add"); };
  const openEdit = (p: Product) => { setCurrent({ ...p }); setModal("edit"); };

  const save = async () => {
    if (!current.name?.trim()) { toast.error(R ? "يجب إدخال اسم المنتج" : "Product name is required"); return; }
    if (!current.price_cents || current.price_cents <= 0) { toast.error(R ? "يجب إدخال سعر صالح" : "Valid price is required"); return; }
    setSaving(true);
    if (modal === "add") {
      const { error } = await db.from("public_products").insert({ ...current, vendor_user_id: user!.id, created_at: new Date().toISOString() });
      if (error) { toast.error(error.message); } else { toast.success(R ? "تم إضافة المنتج" : "Product added"); setModal(null); load(); }
    } else {
      const { id, vendor_user_id, ...rest } = current as Product;
      const { error } = await db.from("public_products").update(rest).eq("id", id).eq("vendor_user_id", user!.id);
      if (error) { toast.error(error.message); } else { toast.success(R ? "تم تحديث المنتج" : "Product updated"); setModal(null); load(); }
    }
    setSaving(false);
  };

  const remove = async (p: Product) => {
    if (!confirm(R ? `حذف "${p.name}"؟` : `Delete "${p.name}"?`)) return;
    const { error } = await db.from("public_products").delete().eq("id", p.id).eq("vendor_user_id", user!.id);
    if (error) toast.error(error.message);
    else { toast.success(R ? "تم الحذف" : "Deleted"); load(); }
  };

  const toggle = async (p: Product) => {
    await db.from("public_products").update({ is_active: !p.is_active }).eq("id", p.id).eq("vendor_user_id", user!.id);
    load();
  };

  const price = (cents: number) =>
    new Intl.NumberFormat(R ? "ar-EG" : "en-US", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(cents / 100);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <VendorLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black">{R ? "منتجاتي" : "My Products"}</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} {R ? "منتج" : "products"}</p>
          </div>
          <Button onClick={openAdd} className="gap-2 gold-glow">
            <Plus className="w-4 h-4" />{R ? "إضافة منتج" : "Add Product"}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={R ? "ابحث..." : "Search..."} className="pl-9 text-xs h-9" />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 rounded-2xl bg-secondary/20 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{R ? "لا توجد منتجات بعد" : "No products yet"}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={openAdd}>{R ? "أضف أول منتج" : "Add your first product"}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => (
              <Card key={p.id} className={cn("border-border/40 hover:border-orange-500/20 transition-all", !p.is_active && "opacity-60")}>
                <CardContent className="p-0">
                  <div className="h-28 bg-gradient-to-br from-orange-500/10 to-secondary/20 flex items-center justify-center border-b border-border/30 relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-10 h-10 text-orange-400/40" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge className={cn("text-[9px]", p.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30")}>
                        {p.is_active ? (R ? "نشط" : "Active") : (R ? "معطل" : "Inactive")}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold truncate">{p.name}</h3>
                        {p.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-orange-400">{price(p.price_cents)}</span>
                          {p.stock_qty !== undefined && <span className="text-[10px] text-muted-foreground">Qty: {p.stock_qty}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="flex-1 h-7 text-[10px] gap-1">
                        <Pencil className="w-3 h-3" />{R ? "تعديل" : "Edit"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggle(p)} className={cn("h-7 text-[10px] px-2", p.is_active ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300")}>
                        {p.is_active ? (R ? "تعطيل" : "Disable") : (R ? "تفعيل" : "Enable")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(p)} className="h-7 text-[10px] px-2 text-red-400 hover:text-red-300">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modal !== null} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal === "add" ? (R ? "إضافة منتج جديد" : "Add New Product") : (R ? "تعديل المنتج" : "Edit Product")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{R ? "اسم المنتج *" : "Product Name *"}</label>
              <Input value={current.name ?? ""} onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))} className="text-xs h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{R ? "الوصف" : "Description"}</label>
              <textarea value={current.description ?? ""} onChange={e => setCurrent(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{R ? "السعر (بيزة) *" : "Price (cents) *"}</label>
                <Input type="number" min="0" value={current.price_cents ?? 0} onChange={e => setCurrent(p => ({ ...p, price_cents: parseInt(e.target.value) || 0 }))} className="text-xs h-9" />
                <p className="text-[9px] text-muted-foreground mt-0.5">{R ? "١٠٠ بيزة = ١ جنيه" : "100 cents = 1 EGP"}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{R ? "الكمية" : "Stock Qty"}</label>
                <Input type="number" min="0" value={current.stock_qty ?? 0} onChange={e => setCurrent(p => ({ ...p, stock_qty: parseInt(e.target.value) || 0 }))} className="text-xs h-9" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{R ? "الفئة" : "Category"}</label>
              <Input value={current.category ?? ""} onChange={e => setCurrent(p => ({ ...p, category: e.target.value }))} className="text-xs h-9" placeholder={R ? "مثال: إلكترونيات" : "e.g. Electronics"} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{R ? "رابط الصورة" : "Image URL"}</label>
              <Input value={current.image_url ?? ""} onChange={e => setCurrent(p => ({ ...p, image_url: e.target.value }))} className="text-xs h-9" placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModal(null)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button size="sm" onClick={save} disabled={saving} className="gold-glow">
              {saving ? (R ? "جارٍ الحفظ..." : "Saving...") : (modal === "add" ? (R ? "إضافة" : "Add") : (R ? "حفظ" : "Save"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VendorLayout>
  );
}
