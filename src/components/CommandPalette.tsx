import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Crown, Users, Briefcase, FolderOpen, Building2, DollarSign, Tag, RotateCcw,
  Webhook, Code, Bell, FileText, BarChart3, Settings, Lock, Map, Store, Globe, Share2, Shield,
  Search, Sparkles, UserCircle, Box, Loader2, Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";

const navItems = [
  { group: "تنقّل", icon: LayoutDashboard, label: "لوحة التحكم", path: "/" },
  { group: "تنقّل", icon: Crown, label: "العلامات التجارية", path: "/brands/add" },
  { group: "تنقّل", icon: Briefcase, label: "الخدمات", path: "/services" },
  { group: "تنقّل", icon: FolderOpen, label: "المشاريع", path: "/projects" },
  { group: "تنقّل", icon: Users, label: "العملاء", path: "/customers" },
  { group: "تنقّل", icon: UserCircle, label: "Clients", path: "/clients" },
  { group: "تنقّل", icon: Building2, label: "الفروع", path: "/branches" },
  { group: "تنقّل", icon: Users, label: "الموظفين", path: "/employees" },
  { group: "تنقّل", icon: Map, label: "مركز العمليات", path: "/operations" },
  { group: "العمليات", icon: Box, label: "المخزون", path: "/inventory" },
  { group: "العمليات", icon: Box, label: "المواد", path: "/materials" },
  { group: "العمليات", icon: Map, label: "اللوجستيات", path: "/logistics" },
  { group: "المالية", icon: DollarSign, label: "الإيرادات", path: "/revenue" },
  { group: "المالية", icon: Tag, label: "الكوبونات", path: "/coupons" },
  { group: "المالية", icon: RotateCcw, label: "المرتجعات", path: "/refunds" },
  { group: "المالية", icon: DollarSign, label: "الأسعار", path: "/pricing" },
  { group: "المطورين", icon: Webhook, label: "Webhooks", path: "/webhooks" },
  { group: "المطورين", icon: Code, label: "API Docs", path: "/api-docs" },
  { group: "المطورين", icon: Store, label: "متجر التطبيقات", path: "/marketplace" },
  { group: "النظام", icon: Bell, label: "الإشعارات", path: "/notifications" },
  { group: "النظام", icon: FileText, label: "سجلات النظام", path: "/audit-logs" },
  { group: "النظام", icon: BarChart3, label: "التقارير", path: "/reports" },
  { group: "النظام", icon: Sparkles, label: "سجل التحديثات", path: "/changelog" },
  { group: "النظام", icon: Database, label: "النسخ الاحتياطية", path: "/backups" },
  { group: "النظام", icon: Settings, label: "الإعدادات", path: "/settings" },
  { group: "الأمان", icon: Shield, label: "الجلسات", path: "/security/sessions" },
  { group: "الأمان", icon: Lock, label: "IP Whitelist", path: "/security/ip-whitelist" },
  { group: "الأمان", icon: Shield, label: "SSO/SAML", path: "/security/sso" },
  { group: "العلامة", icon: Globe, label: "White Label", path: "/white-label" },
  { group: "التسويق", icon: Share2, label: "الإحالات", path: "/referrals" },
];

type Hit = { table: string; id: string; label: string; sub?: string; path: string };

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fuzzy global search across DB tables
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setHits([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const q = `%${query.trim()}%`;
        const [brands, customers, clients, projects, employees, branches] = await Promise.all([
          tenantDb.select("brands", { select: "id,name", ilike: { column: "name", value: q }, limit: 4 }),
          tenantDb.select("customers", { select: "id,name", ilike: { column: "name", value: q }, limit: 4 }),
          tenantDb.select("clients", { select: "id,full_name,email", ilike: { column: "full_name", value: q }, limit: 4 }),
          tenantDb.select("legendary_journey", { select: "id,name", ilike: { column: "name", value: q }, limit: 4 }),
          tenantDb.select("employees", { select: "id,name,position", ilike: { column: "name", value: q }, limit: 4 }),
          tenantDb.select("branches", { select: "id,name,address", ilike: { column: "name", value: q }, limit: 4 }),
        ]);
        const out: Hit[] = [];
        (brands as any[])?.forEach(r => out.push({ table: "علامات", id: r.id, label: r.name, path: `/brands/${r.id}` }));
        (customers as any[])?.forEach(r => out.push({ table: "عملاء", id: r.id, label: r.name, path: `/customers` }));
        (clients as any[])?.forEach(r => out.push({ table: "Clients", id: r.id, label: r.full_name, sub: r.email, path: `/clients` }));
        (projects as any[])?.forEach(r => out.push({ table: "مشاريع", id: r.id, label: r.name, path: `/projects` }));
        (employees as any[])?.forEach(r => out.push({ table: "موظفين", id: r.id, label: r.name, sub: r.position, path: `/employees` }));
        (branches as any[])?.forEach(r => out.push({ table: "فروع", id: r.id, label: r.name, sub: r.address, path: `/branches` }));
        setHits(out);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const groups = Array.from(new Set(navItems.map(i => i.group)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="ابحث في كل المنصة... (Ctrl+K)" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{loading ? "جاري البحث..." : "لا توجد نتائج"}</CommandEmpty>

        {hits.length > 0 && (
          <>
            <CommandGroup heading="نتائج البحث">
              {hits.map(h => (
                <CommandItem key={`${h.table}-${h.id}`} onSelect={() => { setOpen(false); nav(h.path); }}>
                  <Search className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{h.label}</span>
                      <span className="text-xs text-muted-foreground">{h.table}</span>
                    </div>
                    {h.sub && <div className="text-xs text-muted-foreground">{h.sub}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 mr-2 animate-spin" /> جاري البحث في قواعد البيانات...
          </div>
        )}

        {groups.map((g, idx) => (
          <div key={g}>
            <CommandGroup heading={g}>
              {navItems.filter(i => i.group === g).map(i => (
                <CommandItem key={i.path} onSelect={() => { setOpen(false); nav(i.path); }}>
                  <i.icon className="mr-2 h-4 w-4" />
                  <span>{i.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {idx < groups.length - 1 && <CommandSeparator />}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
