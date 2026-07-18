import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PartnerLayout from "@/layouts/PartnerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Building2, Plus, Edit, Trash2, RefreshCcw, Search, Globe, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const empty = { name: "", description: "", industry: "", website: "", logo_url: "" };

export default function PartnerBrands() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db.from("brands").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
    setBrands(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = brands.filter(b =>
    search === "" ||
    (b.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (b.industry ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditId(null); setForm(empty); setModal("add"); };
  const openEdit = (b: any) => {
    setEditId(b.id);
    setForm({ name: b.name || "", description: b.description || "", industry: b.industry || "", website: b.website || "", logo_url: b.logo_url || "" });
    setModal("edit");
  };

  const save = async () => {
    if (!form.name.trim() || !user) return toast.error(R ? "الاسم مطلوب" : "Name required");
    if (editId) {
      const { error } = await db.from("brands").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editId);
      if (error) return toast.error(error.message);
      toast.success(R ? "تم التحديث" : "Updated");
    } else {
      const { error } = await db.from("brands").insert({ ...form, owner_id: user.id });
      if (error) return toast.error(error.message);
      toast.success(R ? "تمت الإضافة" : "Brand added");
    }
    setModal(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(R ? "حذف العلامة التجارية؟" : "Delete this brand?")) return;
    const { error } = await db.from("brands").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم الحذف" : "Deleted");
    load();
  };

  return (
    <PartnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-400" />
              {R ? "علاماتي التجارية" : "My Brands"}
            </h1>
            <p className="text-sm text-muted-foreground">{brands.length} {R ? "علامة" : "brands"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={openAdd} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" />{R ? "علامة جديدة" : "Add Brand"}
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={R ? "بحث..." : "Search brands..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا توجد علامات تجارية" : "No brands yet"}</p>
            <Button size="sm" onClick={openAdd} className="mt-4 bg-indigo-600 hover:bg-indigo-700">{R ? "أضف علامة جديدة" : "Add Your First Brand"}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(b => (
              <Card key={b.id} className="border-border/50 hover:border-indigo-500/30 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg font-bold text-indigo-400">
                        {b.logo_url ? <img src={b.logo_url} alt={b.name} className="w-full h-full rounded-xl object-cover" /> : b.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{b.name}</p>
                        {b.industry && <p className="text-xs text-muted-foreground">{b.industry}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(b)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => remove(b.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {b.description && <p className="text-xs text-muted-foreground line-clamp-2">{b.description}</p>}
                  {b.website && (
                    <a href={b.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      <Globe className="w-3 h-3" />{b.website}<ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-400/30 bg-indigo-400/10">
                      {R ? "نشط" : "Active"}
                    </Badge>
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
            <DialogTitle>{modal === "edit" ? (R ? "تعديل العلامة" : "Edit Brand") : (R ? "علامة جديدة" : "New Brand")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>{R ? "اسم العلامة *" : "Brand Name *"}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>{R ? "الصناعة / القطاع" : "Industry"}</Label><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
            <div><Label>{R ? "الوصف" : "Description"}</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><Label>{R ? "الموقع الإلكتروني" : "Website"}</Label><Input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://" /></div>
            <div><Label>{R ? "رابط الشعار" : "Logo URL"}</Label><Input type="url" value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={save} className="bg-indigo-600 hover:bg-indigo-700">{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PartnerLayout>
  );
}
