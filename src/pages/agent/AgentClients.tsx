import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AgentLayout from "@/layouts/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Edit, Trash2, RefreshCcw, Search, Phone, Mail, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  onboarding: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  active:     "text-green-400 bg-green-500/10 border-green-500/30",
  qualified:  "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  converted:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  inactive:   "text-muted-foreground bg-secondary border-border",
  lost:       "text-red-400 bg-red-500/10 border-red-500/30",
};
const STATUSES = ["onboarding", "active", "qualified", "converted", "inactive", "lost"];
const STATUS_AR: Record<string, string> = { onboarding: "تأهيل", active: "نشط", qualified: "مؤهل", converted: "محوّل", inactive: "غير نشط", lost: "خسارة" };
const emptyForm = { client_name: "", client_email: "", client_phone: "", client_company: "", status: "onboarding", estimated_value: "" };

export default function AgentClients() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [agentId, setAgentId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: ap } = await db.from("agent_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (ap) {
      setAgentId(ap.id);
      const { data } = await db.from("agent_clients").select("*").eq("agent_id", ap.id).order("created_at", { ascending: false });
      setClients(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c => {
    const matchSearch = search === "" || (c.client_name ?? "").toLowerCase().includes(search.toLowerCase()) || (c.client_email ?? "").toLowerCase().includes(search.toLowerCase()) || (c.client_company ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setModal("add"); };
  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({ client_name: c.client_name || "", client_email: c.client_email || "", client_phone: c.client_phone || "", client_company: c.client_company || "", status: c.status || "onboarding", estimated_value: String(c.estimated_value || "") });
    setModal("edit");
  };

  const save = async () => {
    if (!form.client_name.trim()) return toast.error(R ? "اسم العميل مطلوب" : "Client name required");
    const payload = { ...form, estimated_value: form.estimated_value ? Number(form.estimated_value) : null };
    if (editId) {
      const { error } = await db.from("agent_clients").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editId);
      if (error) return toast.error(error.message);
      toast.success(R ? "تم التحديث" : "Updated");
    } else {
      if (!agentId) return toast.error("Agent profile not found");
      const { error } = await db.from("agent_clients").insert({ ...payload, agent_id: agentId });
      if (error) return toast.error(error.message);
      toast.success(R ? "تم إضافة العميل" : "Client added");
    }
    setModal(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(R ? "حذف العميل؟" : "Delete client?")) return;
    const { error } = await db.from("agent_clients").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم الحذف" : "Deleted");
    load();
  };

  return (
    <AgentLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              {R ? "عملائي" : "My Clients"}
            </h1>
            <p className="text-sm text-muted-foreground">{filtered.length} / {clients.length} {R ? "عميل" : "clients"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={openAdd} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />{R ? "عميل جديد" : "Add Client"}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={R ? "بحث..." : "Search clients..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder={R ? "الحالة" : "Status"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{R ? "الكل" : "All"}</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{R ? STATUS_AR[s] : s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا يوجد عملاء" : "No clients found"}</p>
            <Button size="sm" onClick={openAdd} className="mt-4 bg-emerald-600 hover:bg-emerald-700">{R ? "أضف عميلاً" : "Add First Client"}</Button>
          </div>
        ) : (
          <Card className="border-border/50">
            <div className="divide-y divide-border/50">
              {filtered.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400 shrink-0">
                      {c.client_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.client_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {c.client_email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{c.client_email}</span>}
                        {c.client_phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.client_phone}</span>}
                        {c.client_company && <span className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-2.5 h-2.5" />{c.client_company}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.estimated_value && <span className="text-xs font-semibold text-emerald-400">${c.estimated_value.toLocaleString()}</span>}
                    <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[c.status] || "")}>{R ? STATUS_AR[c.status] : c.status}</Badge>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Edit className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => remove(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal === "edit" ? (R ? "تعديل العميل" : "Edit Client") : (R ? "عميل جديد" : "New Client")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>{R ? "اسم العميل *" : "Client Name *"}</Label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
            <div><Label>{R ? "البريد الإلكتروني" : "Email"}</Label><Input type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} /></div>
            <div><Label>{R ? "الهاتف" : "Phone"}</Label><Input value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} /></div>
            <div><Label>{R ? "الشركة" : "Company"}</Label><Input value={form.client_company} onChange={e => setForm({ ...form, client_company: e.target.value })} /></div>
            <div><Label>{R ? "القيمة التقديرية ($)" : "Estimated Value ($)"}</Label><Input type="number" value={form.estimated_value} onChange={e => setForm({ ...form, estimated_value: e.target.value })} /></div>
            <div>
              <Label>{R ? "الحالة" : "Status"}</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{R ? STATUS_AR[s] : s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700">{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AgentLayout>
  );
}
