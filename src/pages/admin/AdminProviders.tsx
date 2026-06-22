import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/layouts/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Search, UserCheck, UserX, RefreshCcw, Briefcase, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type ProviderProfile = {
  id: string;
  username?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
  is_suspended?: boolean;
  created_at?: string;
};

const PROVIDER_ROLES = ["vendor", "provider"];

const ROLE_COLORS: Record<string, string> = {
  vendor:   "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  provider: "text-blue-400 border-blue-400/30 bg-blue-400/10",
};

export default function AdminProviders() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "vendor" | "provider">("all");
  const [detailModal, setDetailModal] = useState<ProviderProfile | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await db
      .from("user_profiles")
      .select("*")
      .in("role", PROVIDER_ROLES)
      .order("created_at", { ascending: false });
    setProviders(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = providers.filter((p) =>
    (roleFilter === "all" || p.role === roleFilter) &&
    (search === "" ||
      (p.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.username ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSuspend = async (p: ProviderProfile) => {
    const next = !p.is_suspended;
    const { error } = await db.from("user_profiles").update({ is_suspended: next }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? (R ? "تم تعليق المزود" : "Provider suspended") : (R ? "تم رفع التعليق" : "Provider unsuspended"));
    load();
  };

  const promoteToAdmin = async (p: ProviderProfile) => {
    const { error } = await db.from("user_profiles").update({ role: "admin" }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success(R ? "تمت الترقية إلى مسؤول" : "Promoted to admin");
    setDetailModal(null);
    load();
  };

  const fmt = (s?: string) => s ? new Date(s).toLocaleDateString(R ? "ar-EG" : "en-US") : "—";
  const avatar = (p: ProviderProfile) =>
    p.full_name?.charAt(0).toUpperCase() ?? p.username?.charAt(0).toUpperCase() ?? "?";

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              {R ? "مزودو الخدمة" : "Providers & Vendors"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {R ? "مزود" : "providers"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={R ? "بحث..." : "Search providers..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "vendor", "provider"] as const).map((r) => (
              <Button
                key={r}
                variant={roleFilter === r ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter(r)}
              >
                {r === "all" ? (R ? "الكل" : "All") : r}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: R ? "إجمالي المزودين" : "Total Providers", value: providers.length, icon: Users, color: "text-blue-400" },
            { label: R ? "بائعون" : "Vendors", value: providers.filter(p => p.role === "vendor").length, icon: Star, color: "text-yellow-400" },
            { label: R ? "مزودو خدمة" : "Providers", value: providers.filter(p => p.role === "provider").length, icon: Briefcase, color: "text-blue-400" },
            { label: R ? "موقوفون" : "Suspended", value: providers.filter(p => p.is_suspended).length, icon: UserX, color: "text-red-400" },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn("w-8 h-8", s.color)} />
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{R ? "قائمة المزودين" : "Providers List"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                {R ? "لا يوجد مزودون" : "No providers found"}
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setDetailModal(p)}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
                      {avatar(p)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.full_name || p.username || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.email || p.id}</div>
                    </div>
                    {/* Role badge */}
                    <Badge variant="outline" className={cn("text-xs", ROLE_COLORS[p.role ?? ""] ?? "")}>
                      {p.role}
                    </Badge>
                    {/* Suspended */}
                    {p.is_suspended && (
                      <Badge variant="destructive" className="text-xs">
                        {R ? "موقوف" : "Suspended"}
                      </Badge>
                    )}
                    {/* Date */}
                    <span className="text-xs text-muted-foreground hidden md:block">{fmt(p.created_at)}</span>
                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("gap-1 text-xs", p.is_suspended ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300")}
                      onClick={(e) => { e.stopPropagation(); toggleSuspend(p); }}
                    >
                      {p.is_suspended ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                      {p.is_suspended ? (R ? "رفع الوقف" : "Unsuspend") : (R ? "وقف" : "Suspend")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{R ? "تفاصيل المزود" : "Provider Details"}</DialogTitle>
          </DialogHeader>
          {detailModal && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-bold">
                  {avatar(detailModal)}
                </div>
                <div>
                  <div className="font-medium">{detailModal.full_name || "—"}</div>
                  <div className="text-muted-foreground">{detailModal.email || detailModal.id}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div><span className="text-muted-foreground">{R ? "الدور:" : "Role:"}</span> <Badge variant="outline" className={cn("text-xs ml-1", ROLE_COLORS[detailModal.role ?? ""] ?? "")}>{detailModal.role}</Badge></div>
                <div><span className="text-muted-foreground">{R ? "الانضمام:" : "Joined:"}</span> <span className="ml-1">{fmt(detailModal.created_at)}</span></div>
                <div><span className="text-muted-foreground">{R ? "الحالة:" : "Status:"}</span> <span className={cn("ml-1 font-medium", detailModal.is_suspended ? "text-red-400" : "text-green-400")}>{detailModal.is_suspended ? (R ? "موقوف" : "Suspended") : (R ? "نشط" : "Active")}</span></div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailModal(null)}>{R ? "إغلاق" : "Close"}</Button>
            <Button variant="destructive" onClick={() => detailModal && toggleSuspend(detailModal)}>
              {detailModal?.is_suspended ? (R ? "رفع الوقف" : "Unsuspend") : (R ? "وقف الحساب" : "Suspend")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
