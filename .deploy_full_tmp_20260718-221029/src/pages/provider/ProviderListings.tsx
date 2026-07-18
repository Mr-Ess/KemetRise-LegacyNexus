import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/context/UserRoleContext";
import ProviderLayout from "@/layouts/ProviderLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Package, Plus, Edit, Trash2, RefreshCcw, Search, DollarSign, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  active:   "text-green-400 bg-green-500/10 border-green-500/30",
  inactive: "text-muted-foreground bg-muted border-border",
  pending:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  sold_out: "text-red-400 bg-red-500/10 border-red-500/30",
};
const STATUS_AR: Record<string, string> = { active: "نشط", inactive: "غير نشط", pending: "معلق", sold_out: "نفد" };
const emptyForm = { title: "", description: "", price_cents: "", category: "", status: "active", stock_quantity: "" };

export default function ProviderListings() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { profile } = useRole();
  const db = supabase as any;

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await db.from("mp_listings").select("*").eq("publisher_user_id", profile.id).order("created_at", { ascending: false });
    setListings(data ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const filtered = listings.filter(l => {
    const matchSearch = search === "" || (l.name ?? "").toLowerCase().includes(search.toLowerCase()) || (l.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? l.is_active === true : l.is_active === false);
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setModal("add"); };
  const openEdit = (l: any) => {
    setEditId(l.id);
    setForm({ title: l.name || "", description: l.description || "", price_cents: l.price_cents ? String(l.price_cents) : "", category: l.category || "", status: l.is_active ? "active" : "inactive", stock_quantity: l.stock_quantity != null ? String(l.stock_quantity) : "" });
    setModal("edit");
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error(R ? "العنوان مطلوب" : "Title required");
    const payload = { name: form.title, description: form.description, price_cents: form.price_cents ? Number(form.price_cents) : null, category: form.category, is_active: form.status === "active", stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : null };
    if (editId) {
      const { error } = await db.from("mp_listings").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editId);
      if (error) return toast.error(error.message);
      toast.success(R ? "تم التحديث" : "Updated");
    } else {
      const { error } = await db.from("mp_listings").insert({ ...payload, publisher_user_id: profile!.id });
      if (error) return toast.error(error.message);
      toast.success(R ? "تمت الإضافة" : "Added");
    }
    setModal(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm(R ? "حذف الإدراج؟" : "Delete listing?")) return;
    const { error } = await db.from("mp_listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم الحذف" : "Deleted");
    load();
  };

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-400" />
              {R ? "إدراجاتي" : "My Listings"}
            </h1>
            <p className="text-sm text-muted-foreground">{filtered.length} / {listings.length} {R ? "إدراج" : "listings"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={openAdd} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />{R ? "إدراج جديد" : "New Listing"}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={R ? "بحث..." : "Search listings..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder={R ? "الحالة" : "Status"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{R ? "الكل" : "All"}</SelectItem>
              {["active","inactive","pending","sold_out"].map(s => <SelectItem key={s} value={s}>{R ? STATUS_AR[s] : s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا توجد إدراجات" : "No listings found"}</p>
            <Button size="sm" onClick={openAdd} className="mt-4 bg-blue-600 hover:bg-blue-700">{R ? "أضف إدراجاً" : "Add First Listing"}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(l => (
              <Card key={l.id} className="border-border/50 hover:border-blue-500/30 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{l.title}</p>
                      {l.category && <p className="text-xs text-muted-foreground">{l.category}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(l)}><Edit className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => remove(l.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  {l.description && <p className="text-xs text-muted-foreground line-clamp-2">{l.description}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1 text-sm font-semibold text-blue-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      {l.price_cents ? (l.price_cents / 100).toFixed(2) : "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      {l.stock_quantity != null && <span className="text-xs text-muted-foreground">{R ? "المخزون:" : "Stock:"} {l.stock_quantity}</span>}
                      <Badge variant="outline" className={cn("text-xs", STATUS_STYLE[l.status] || "")}>{R ? STATUS_AR[l.status] : l.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal === "edit" ? (R ? "تعديل الإدراج" : "Edit Listing") : (R ? "إدراج جديد" : "New Listing")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>{R ? "العنوان *" : "Title *"}</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>{R ? "الوصف" : "Description"}</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{R ? "السعر (سنت)" : "Price (cents)"}</Label><Input type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} placeholder="1000 = $10" /></div>
              <div><Label>{R ? "المخزون" : "Stock"}</Label><Input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} /></div>
            </div>
            <div><Label>{R ? "الفئة" : "Category"}</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
            <div>
              <Label>{R ? "الحالة" : "Status"}</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["active","inactive","pending","sold_out"].map(s => <SelectItem key={s} value={s}>{R ? STATUS_AR[s] : s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={save} className="bg-blue-600 hover:bg-blue-700">{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProviderLayout>
  );
}
