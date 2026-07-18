import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Layers, Edit2, Trash2, Plus, Search, CheckCircle2,
  Mail, Phone, Building2, MessageSquare, RefreshCw, Loader2,
  Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WsService {
  id: string;
  name_ar: string;
  name_en: string;
  desc_ar: string;
  desc_en: string;
  category: string;
  color: string;
  icon_name: string;
  features_ar: string[];
  features_en: string[];
  is_active: boolean;
  sort_order: number;
}

interface ServiceRequest {
  id: string;
  service_name_ar: string | null;
  service_name_en: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { value: "business",  ar: "الأعمال",              en: "Business" },
  { value: "commerce",  ar: "التجارة",              en: "Commerce" },
  { value: "marketing", ar: "التسويق",              en: "Marketing" },
  { value: "sales",     ar: "المبيعات",             en: "Sales" },
  { value: "tech",      ar: "التقنية",              en: "Technology" },
  { value: "telecom",   ar: "الاتصالات",            en: "Telecom" },
  { value: "media",     ar: "الإعلام والإنتاج",     en: "Media & Production" },
  { value: "legal",     ar: "الملكية الفكرية",      en: "Legal & IP" },
  { value: "agency",    ar: "التوكيلات التجارية",   en: "Commercial Agencies" },
];

const STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-500/20 text-blue-400 border-blue-500/40",
  inprogress:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  done:        "bg-green-500/20 text-green-400 border-green-500/40",
  rejected:    "bg-red-500/20 text-red-400 border-red-500/40",
};

export default function WebsiteServicesAdmin() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  // Services state
  const [services, setServices] = useState<WsService[]>([]);
  const [svcLoading, setSvcLoading] = useState(true);
  const [svcSearch, setSvcSearch] = useState("");

  // Requests state
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(true);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editSvc, setEditSvc] = useState<Partial<WsService> | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Fetch ──────────────────────────────────────────
  const fetchServices = async () => {
    setSvcLoading(true);
    const { data } = await db.from("website_services").select("*").order("sort_order");
    setServices(data || []);
    setSvcLoading(false);
  };

  const fetchRequests = async () => {
    setReqLoading(true);
    const { data } = await db
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setReqLoading(false);
  };

  useEffect(() => { fetchServices(); fetchRequests(); }, []);

  // ── Toggle active ─────────────────────────────────
  const toggleActive = async (id: string, current: boolean) => {
    await db.from("website_services").update({ is_active: !current }).eq("id", id);
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
    toast.success(R ? "تم التحديث" : "Updated");
  };

  // ── Open edit dialog ──────────────────────────────
  const openEdit = (svc: WsService) => {
    setEditSvc({ ...svc, features_ar: svc.features_ar, features_en: svc.features_en });
    setEditOpen(true);
  };

  const openNew = () => {
    setEditSvc({
      name_ar: "", name_en: "", desc_ar: "", desc_en: "",
      category: "tech", color: "#3B82F6", icon_name: "Layers",
      features_ar: [], features_en: [], is_active: true, sort_order: 999,
    });
    setEditOpen(true);
  };

  // ── Save service ──────────────────────────────────
  const saveService = async () => {
    if (!editSvc?.name_ar || !editSvc?.name_en) {
      toast.error(R ? "الاسم مطلوب بالعربي والانجليزي" : "Name required in both languages");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name_ar: editSvc.name_ar,
        name_en: editSvc.name_en,
        desc_ar: editSvc.desc_ar || "",
        desc_en: editSvc.desc_en || "",
        category: editSvc.category || "tech",
        color: editSvc.color || "#3B82F6",
        icon_name: editSvc.icon_name || "Layers",
        features_ar: editSvc.features_ar || [],
        features_en: editSvc.features_en || [],
        is_active: editSvc.is_active ?? true,
        sort_order: editSvc.sort_order || 999,
      };
      if (editSvc.id) {
        await db.from("website_services").update(payload).eq("id", editSvc.id);
      } else {
        await db.from("website_services").insert(payload);
      }
      toast.success(R ? "تم الحفظ بنجاح" : "Saved successfully");
      setEditOpen(false);
      fetchServices();
    } catch {
      toast.error(R ? "خطأ في الحفظ" : "Save error");
    }
    setSaving(false);
  };

  // ── Delete service ────────────────────────────────
  const deleteService = async (id: string) => {
    if (!window.confirm(R ? "هل تريد حذف هذه الخدمة؟" : "Delete this service?")) return;
    await db.from("website_services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
    toast.success(R ? "تم الحذف" : "Deleted");
  };

  // ── Update request status ─────────────────────────
  const updateReqStatus = async (id: string, status: string) => {
    await db.from("service_requests").update({ status }).eq("id", id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const filteredSvcs = services.filter(s =>
    svcSearch === "" ||
    s.name_ar.includes(svcSearch) ||
    s.name_en.toLowerCase().includes(svcSearch.toLowerCase())
  );

  // ── Helpers for features editing ──────────────────
  const setFeaturesFromString = (lang: "ar" | "en", val: string) => {
    const arr = val.split("\n").map(x => x.trim()).filter(Boolean);
    setEditSvc(p => p ? { ...p, [`features_${lang}`]: arr } : p);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold font-display">
              {R ? "إدارة خدمات الموقع" : "Website Services Management"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {R ? "أضف وعدّل خدمات صفحة الخدمات العامة وراجع طلبات العملاء" : "Manage public services page and review customer requests"}
            </p>
          </div>
          <Button size="sm" onClick={openNew} className="gap-2">
            <Plus className="w-3.5 h-3.5" />
            {R ? "إضافة خدمة" : "Add Service"}
          </Button>
        </div>

        <Tabs defaultValue="services">
          <TabsList className="h-8">
            <TabsTrigger value="services" className="text-xs">
              {R ? `الخدمات (${services.length})` : `Services (${services.length})`}
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs">
              {R ? `طلبات العملاء (${requests.length})` : `Customer Requests (${requests.length})`}
              {requests.filter(r => r.status === "new").length > 0 && (
                <Badge className="ml-1.5 text-[8px] px-1 py-0 bg-red-500/20 text-red-400 border-red-500/40">
                  {requests.filter(r => r.status === "new").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Services Tab ── */}
          <TabsContent value="services" className="mt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={svcSearch}
                  onChange={e => setSvcSearch(e.target.value)}
                  placeholder={R ? "ابحث..." : "Search..."}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Button size="sm" variant="outline" onClick={fetchServices} className="h-8 gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>

            {svcLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-10 rounded-lg bg-secondary/20 animate-pulse" />)}
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="text-[10px]">
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>{R ? "الاسم" : "Name"}</TableHead>
                      <TableHead>{R ? "التصنيف" : "Category"}</TableHead>
                      <TableHead>{R ? "المميزات" : "Features"}</TableHead>
                      <TableHead>{R ? "الترتيب" : "Order"}</TableHead>
                      <TableHead>{R ? "نشط" : "Active"}</TableHead>
                      <TableHead>{R ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSvcs.map((s, i) => (
                      <TableRow key={s.id} className={cn("text-xs", !s.is_active && "opacity-50")}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <div>
                              <p className="font-medium">{R ? s.name_ar : s.name_en}</p>
                              <p className="text-[9px] text-muted-foreground">{R ? s.name_en : s.name_ar}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="text-[9px] px-1.5"
                            style={{ color: s.color, borderColor: s.color + "40", backgroundColor: s.color + "15" }}
                          >
                            {s.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[10px]">
                          {(s.features_ar || []).length} {R ? "مزايا" : "features"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.sort_order}</TableCell>
                        <TableCell>
                          <Switch
                            checked={s.is_active}
                            onCheckedChange={() => toggleActive(s.id, s.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7"
                              onClick={() => openEdit(s)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 text-red-400 hover:text-red-300"
                              onClick={() => deleteService(s.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredSvcs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {R ? "لا توجد خدمات" : "No services found"}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Requests Tab ── */}
          <TabsContent value="requests" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {["new", "inprogress", "done", "rejected"].map(st => (
                  <Badge key={st} className={cn("text-[9px] px-2 cursor-pointer", STATUS_COLORS[st])}>
                    {st} ({requests.filter(r => r.status === st).length})
                  </Badge>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={fetchRequests} className="h-8 gap-1.5 text-xs">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>

            {reqLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-secondary/20 animate-pulse" />)}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {R ? "لا توجد طلبات بعد" : "No requests yet"}
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map(req => (
                  <Card key={req.id} className="border border-border/40">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{req.full_name}</p>
                            {(req.service_name_ar || req.service_name_en) && (
                              <Badge className="text-[9px] px-1.5 bg-primary/10 text-primary border-primary/20">
                                {R ? req.service_name_ar : req.service_name_en}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 flex-wrap text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{req.email}</span>
                            {req.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{req.phone}</span>}
                            {req.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{req.company}</span>}
                          </div>
                          {req.message && (
                            <p className="text-[11px] text-muted-foreground border-t border-border/30 pt-1.5 mt-1.5">
                              <MessageSquare className="w-3 h-3 inline mr-1" />
                              {req.message}
                            </p>
                          )}
                          <p className="text-[9px] text-muted-foreground">
                            {new Date(req.created_at).toLocaleString(R ? "ar-EG" : "en-US")}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Badge className={cn("text-[9px] px-1.5 mb-1", STATUS_COLORS[req.status] || STATUS_COLORS.new)}>
                            {req.status}
                          </Badge>
                          <select
                            value={req.status}
                            onChange={e => updateReqStatus(req.id, e.target.value)}
                            className="text-[9px] rounded-md border border-border/40 bg-secondary/20 px-1.5 py-1 text-foreground"
                          >
                            <option value="new">new</option>
                            <option value="inprogress">inprogress</option>
                            <option value="done">done</option>
                            <option value="rejected">rejected</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Edit / Add Service Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={R ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editSvc?.id
                ? (R ? "تعديل الخدمة" : "Edit Service")
                : (R ? "إضافة خدمة جديدة" : "Add New Service")}
            </DialogTitle>
          </DialogHeader>

          {editSvc && (
            <div className="space-y-4 py-2">
              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "الاسم بالعربي *" : "Name (Arabic) *"}</Label>
                  <Input
                    value={editSvc.name_ar || ""}
                    onChange={e => setEditSvc(p => p ? { ...p, name_ar: e.target.value } : p)}
                    className="h-8 text-xs"
                    placeholder="اسم الخدمة بالعربي"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "الاسم بالانجليزي *" : "Name (English) *"}</Label>
                  <Input
                    value={editSvc.name_en || ""}
                    onChange={e => setEditSvc(p => p ? { ...p, name_en: e.target.value } : p)}
                    className="h-8 text-xs"
                    placeholder="Service name in English"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "الوصف بالعربي" : "Description (Arabic)"}</Label>
                  <Textarea
                    value={editSvc.desc_ar || ""}
                    onChange={e => setEditSvc(p => p ? { ...p, desc_ar: e.target.value } : p)}
                    className="text-xs resize-none"
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "الوصف بالانجليزي" : "Description (English)"}</Label>
                  <Textarea
                    value={editSvc.desc_en || ""}
                    onChange={e => setEditSvc(p => p ? { ...p, desc_en: e.target.value } : p)}
                    className="text-xs resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Category / Color / Icon / Order */}
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "التصنيف" : "Category"}</Label>
                  <select
                    value={editSvc.category || "tech"}
                    onChange={e => setEditSvc(p => p ? { ...p, category: e.target.value } : p)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{R ? c.ar : c.en}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "اللون" : "Color"}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editSvc.color || "#3B82F6"}
                      onChange={e => setEditSvc(p => p ? { ...p, color: e.target.value } : p)}
                      className="w-8 h-8 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={editSvc.color || "#3B82F6"}
                      onChange={e => setEditSvc(p => p ? { ...p, color: e.target.value } : p)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "اسم الأيقونة" : "Icon Name"}</Label>
                  <Input
                    value={editSvc.icon_name || "Layers"}
                    onChange={e => setEditSvc(p => p ? { ...p, icon_name: e.target.value } : p)}
                    className="h-8 text-xs"
                    placeholder="e.g. BarChart3"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "الترتيب" : "Sort Order"}</Label>
                  <Input
                    type="number"
                    value={editSvc.sort_order ?? 999}
                    onChange={e => setEditSvc(p => p ? { ...p, sort_order: +e.target.value } : p)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "المزايا بالعربي (سطر لكل ميزة)" : "Features Arabic (one per line)"}</Label>
                  <Textarea
                    value={(editSvc.features_ar || []).join("\n")}
                    onChange={e => setFeaturesFromString("ar", e.target.value)}
                    className="text-xs resize-none font-mono"
                    rows={5}
                    placeholder={"ميزة 1\nميزة 2\nميزة 3"}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "المزايا بالانجليزي (سطر لكل ميزة)" : "Features English (one per line)"}</Label>
                  <Textarea
                    value={(editSvc.features_en || []).join("\n")}
                    onChange={e => setFeaturesFromString("en", e.target.value)}
                    className="text-xs resize-none font-mono"
                    rows={5}
                    placeholder={"Feature 1\nFeature 2\nFeature 3"}
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={editSvc.is_active ?? true}
                  onCheckedChange={v => setEditSvc(p => p ? { ...p, is_active: v } : p)}
                />
                <Label className="text-xs">{R ? "نشط — يظهر في الموقع" : "Active — visible on website"}</Label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              {R ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={saveService} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {R ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
