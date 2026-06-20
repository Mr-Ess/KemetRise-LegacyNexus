import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Crown, Users, Briefcase, FolderOpen, Building2, DollarSign, Tag, RotateCcw,
  Webhook, Code, Bell, FileText, BarChart3, Settings, Lock, Map, Store, Globe, Share2, Shield,
  Search, Sparkles, UserCircle, Box, Loader2, Database, Mic, Video, MessageSquare, ShoppingCart,
  FileCheck, Truck, Palette, HeartHandshake, Gavel, Package, BarChart2, Workflow, KeyRound,
  ClipboardList, UserCog, Import, HelpCircle, Activity, CreditCard, Newspaper, Users2,
} from "lucide-react";
import { tenantDb } from "@/lib/tenantDb";

const navItems = [
  // تنقّل
  { group: "تنقّل", icon: LayoutDashboard, label: "لوحة التحكم", path: "/" },
  { group: "تنقّل", icon: Crown,           label: "العلامات التجارية", path: "/brands/add" },
  { group: "تنقّل", icon: Briefcase,       label: "الخدمات", path: "/services" },
  { group: "تنقّل", icon: FolderOpen,      label: "المشاريع", path: "/projects" },
  { group: "تنقّل", icon: Users,           label: "العملاء", path: "/customers" },
  { group: "تنقّل", icon: UserCircle,      label: "Clients", path: "/clients" },
  { group: "تنقّل", icon: Building2,       label: "الفروع", path: "/branches" },
  { group: "تنقّل", icon: Users,           label: "الموظفين", path: "/employees" },
  { group: "تنقّل", icon: Users2,          label: "الفريق", path: "/team" },
  { group: "تنقّل", icon: Map,             label: "مركز العمليات", path: "/operations" },
  // العمليات
  { group: "العمليات", icon: Box,          label: "المخزون", path: "/inventory" },
  { group: "العمليات", icon: Package,      label: "المواد", path: "/materials" },
  { group: "العمليات", icon: Truck,        label: "اللوجستيات", path: "/logistics" },
  { group: "العمليات", icon: ShoppingCart, label: "أوامر الشراء", path: "/operations?tab=procurement" },
  { group: "العمليات", icon: ClipboardList,label: "الموارد البشرية", path: "/operations?tab=hr" },
  { group: "العمليات", icon: Workflow,     label: "خريطة العمل", path: "/workflow-map" },
  { group: "العمليات", icon: Activity,     label: "الأتمتة", path: "/automations" },
  { group: "العمليات", icon: Import,       label: "استيراد / تصدير", path: "/import-export" },
  // المالية
  { group: "المالية", icon: DollarSign,    label: "لوحة الإيرادات", path: "/revenue" },
  { group: "المالية", icon: BarChart2,     label: "تحليلات المالية", path: "/finance" },
  { group: "المالية", icon: Tag,           label: "الكوبونات", path: "/coupons" },
  { group: "المالية", icon: RotateCcw,     label: "المرتجعات", path: "/refunds" },
  { group: "المالية", icon: DollarSign,    label: "الأسعار", path: "/pricing" },
  { group: "المالية", icon: CreditCard,    label: "بوابات الدفع", path: "/payment-gateways" },
  // التسويق
  { group: "التسويق", icon: BarChart3,     label: "الحملات التسويقية", path: "/marketing" },
  { group: "التسويق", icon: HeartHandshake,label: "CRM التفاعلات", path: "/crm" },
  { group: "التسويق", icon: Share2,        label: "الإحالات", path: "/referrals" },
  { group: "التسويق", icon: HeartHandshake,label: "شركاء النجاح", path: "/success-partners" },
  { group: "التسويق", icon: Newspaper,     label: "المدونة", path: "/blog" },
  // الأصول والإنتاج
  { group: "الأصول", icon: Database,       label: "إدارة الأصول", path: "/assets" },
  { group: "الأصول", icon: Palette,        label: "الإنتاج الفني", path: "/artistic-production" },
  { group: "الأصول", icon: Gavel,          label: "الخزينة القانونية", path: "/legal-vault" },
  { group: "الأصول", icon: Sparkles,       label: "الرحلة الأسطورية", path: "/legendary-journey" },
  // التواصل والذكاء الاصطناعي
  { group: "الذكاء الاصطناعي", icon: Mic,          label: "المساعد الصوتي", path: "/voice" },
  { group: "الذكاء الاصطناعي", icon: Video,         label: "مؤتمر الفيديو", path: "/video" },
  { group: "الذكاء الاصطناعي", icon: MessageSquare, label: "المحادثات", path: "/voice?tab=history" },
  // المطورين
  { group: "المطورين", icon: Webhook,      label: "Webhooks", path: "/webhooks" },
  { group: "المطورين", icon: Code,         label: "API Docs", path: "/api-docs" },
  { group: "المطورين", icon: Store,        label: "المنتجات", path: "/products" },
  { group: "المطورين", icon: KeyRound,     label: "المطور", path: "/developer" },
  // النظام
  { group: "النظام", icon: Bell,           label: "الإشعارات", path: "/notifications" },
  { group: "النظام", icon: FileText,       label: "سجلات النظام", path: "/audit-logs" },
  { group: "النظام", icon: Activity,       label: "سجلات الوكلاء", path: "/agent-logs" },
  { group: "النظام", icon: BarChart3,      label: "التقارير", path: "/reports" },
  { group: "النظام", icon: Sparkles,       label: "سجل التحديثات", path: "/changelog" },
  { group: "النظام", icon: Database,       label: "النسخ الاحتياطية", path: "/backups" },
  { group: "النظام", icon: Settings,       label: "الإعدادات", path: "/settings" },
  { group: "النظام", icon: HelpCircle,     label: "المساعدة", path: "/help" },
  // إدارة المستخدمين
  { group: "المستخدمون", icon: UserCog,    label: "إدارة المستخدمين", path: "/user-management" },
  { group: "المستخدمون", icon: Shield,     label: "الصلاحيات", path: "/permissions" },
  { group: "المستخدمون", icon: FileCheck,  label: "الشركاء التابعون", path: "/affiliates" },
  // الأمان
  { group: "الأمان", icon: Shield,         label: "الجلسات", path: "/security/sessions" },
  { group: "الأمان", icon: Lock,           label: "IP Whitelist", path: "/security/ip-whitelist" },
  { group: "الأمان", icon: Shield,         label: "SSO/SAML", path: "/security/sso" },
  // العلامة
  { group: "العلامة", icon: Globe,         label: "White Label", path: "/white-label" },
];

type Hit = { table: string; id: string; label: string; sub?: string; path: string };

// Icon map for search result groups
const groupIcon: Record<string, any> = {
  "علامات": Crown, "عملاء": Users, "Clients": UserCircle, "مشاريع": FolderOpen,
  "موظفين": Users, "موارد بشرية": Users2, "فروع": Building2, "مهام": ClipboardList,
  "مخزون": Box, "مواد": Package, "شحنات": Truck, "موردون": HeartHandshake,
  "أوامر شراء": ShoppingCart, "عقود": FileCheck, "تسويق": BarChart3,
  "فواتير": DollarSign, "معاملات": CreditCard, "قسائم": Tag,
  "تذاكر دعم": MessageSquare, "أصول": Database, "قانوني": Gavel,
  "خدمات": Briefcase, "مدونة": Newspaper, "إنتاج": Palette,
};

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

  // Full global search across all major DB tables
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setHits([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const q = `%${query.trim()}%`;
        const results = await Promise.allSettled([
          tenantDb.select("brands",              { select: "id,name",                       ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("customers",           { select: "id,name,email",                 ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("clients",             { select: "id,full_name,email",            ilike: { column: "full_name",  value: q }, limit: 4 }),
          tenantDb.select("legendary_journey",   { select: "id,name,status",               ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("employees",           { select: "id,name,position",             ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("hr_employees",        { select: "id,full_name,job_title",       ilike: { column: "full_name",  value: q }, limit: 4 }),
          tenantDb.select("branches",            { select: "id,name,address",              ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("tasks",               { select: "id,title,status",              ilike: { column: "title",      value: q }, limit: 4 }),
          tenantDb.select("inventory",           { select: "id,name,sku",                  ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("materials",           { select: "id,name,unit",                 ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("logistics_shipping",  { select: "id,tracking_number,status",   ilike: { column: "tracking_number", value: q }, limit: 4 }),
          tenantDb.select("suppliers",           { select: "id,name,contact_email",        ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("purchase_orders",     { select: "id,po_number,vendor_name",     ilike: { column: "po_number",  value: q }, limit: 4 }),
          tenantDb.select("vendor_contracts",    { select: "id,contract_title,vendor_name",ilike: { column: "contract_title", value: q }, limit: 4 }),
          tenantDb.select("marketing_campaigns", { select: "id,name,status",               ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("invoices",            { select: "id,invoice_number,client_name",ilike: { column: "invoice_number", value: q }, limit: 4 }),
          tenantDb.select("coupons",             { select: "id,code,description",          ilike: { column: "code",       value: q }, limit: 4 }),
          tenantDb.select("support_tickets",     { select: "id,subject,status",            ilike: { column: "subject",    value: q }, limit: 4 }),
          tenantDb.select("assets_management",   { select: "id,name,asset_type",           ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("legal_vault",         { select: "id,title,category",            ilike: { column: "title",      value: q }, limit: 4 }),
          tenantDb.select("services",            { select: "id,name,category",             ilike: { column: "name",       value: q }, limit: 4 }),
          tenantDb.select("blog_posts",          { select: "id,title,status",              ilike: { column: "title",      value: q }, limit: 4 }),
          tenantDb.select("artistic_production", { select: "id,title,type",                ilike: { column: "title",      value: q }, limit: 4 }),
        ]);

        const safe = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? (r.value as any[]) || [] : [];
        const [
          brands, customers, clients, projects, employees, hrEmployees,
          branches, tasksList, inventoryItems, materialsList, shipments, suppliersList,
          poList, contracts, campaigns, invoicesList, couponsList, tickets,
          assets, legalDocs, servicesList, blogList, productionList,
        ] = results.map(safe);

        const out: Hit[] = [];
        brands.forEach((r:any)         => out.push({ table: "علامات",      id: r.id, label: r.name,             path: `/brands/${r.id}` }));
        customers.forEach((r:any)      => out.push({ table: "عملاء",       id: r.id, label: r.name,     sub: r.email,        path: `/customers` }));
        clients.forEach((r:any)        => out.push({ table: "Clients",     id: r.id, label: r.full_name, sub: r.email,        path: `/clients` }));
        projects.forEach((r:any)       => out.push({ table: "مشاريع",      id: r.id, label: r.name,     sub: r.status,       path: `/projects` }));
        employees.forEach((r:any)      => out.push({ table: "موظفين",      id: r.id, label: r.name,     sub: r.position,     path: `/employees` }));
        hrEmployees.forEach((r:any)    => out.push({ table: "موارد بشرية", id: r.id, label: r.full_name, sub: r.job_title,   path: `/operations?tab=hr` }));
        branches.forEach((r:any)       => out.push({ table: "فروع",        id: r.id, label: r.name,     sub: r.address,      path: `/branches` }));
        tasksList.forEach((r:any)      => out.push({ table: "مهام",        id: r.id, label: r.title,    sub: r.status,       path: `/projects` }));
        inventoryItems.forEach((r:any) => out.push({ table: "مخزون",       id: r.id, label: r.name,     sub: r.sku,          path: `/inventory` }));
        materialsList.forEach((r:any)  => out.push({ table: "مواد",        id: r.id, label: r.name,     sub: r.unit,         path: `/materials` }));
        shipments.forEach((r:any)      => out.push({ table: "شحنات",       id: r.id, label: r.tracking_number, sub: r.status, path: `/logistics` }));
        suppliersList.forEach((r:any)  => out.push({ table: "موردون",      id: r.id, label: r.name,     sub: r.contact_email, path: `/operations` }));
        poList.forEach((r:any)         => out.push({ table: "أوامر شراء",  id: r.id, label: r.po_number, sub: r.vendor_name, path: `/operations?tab=procurement` }));
        contracts.forEach((r:any)      => out.push({ table: "عقود",        id: r.id, label: r.contract_title, sub: r.vendor_name, path: `/operations?tab=procurement` }));
        campaigns.forEach((r:any)      => out.push({ table: "تسويق",       id: r.id, label: r.name,     sub: r.status,       path: `/marketing` }));
        invoicesList.forEach((r:any)   => out.push({ table: "فواتير",      id: r.id, label: r.invoice_number, sub: r.client_name, path: `/revenue` }));
        couponsList.forEach((r:any)    => out.push({ table: "قسائم",       id: r.id, label: r.code,     sub: r.description,  path: `/coupons` }));
        tickets.forEach((r:any)        => out.push({ table: "تذاكر دعم",   id: r.id, label: r.subject,  sub: r.status,       path: `/` }));
        assets.forEach((r:any)         => out.push({ table: "أصول",        id: r.id, label: r.name,     sub: r.asset_type,   path: `/assets` }));
        legalDocs.forEach((r:any)      => out.push({ table: "قانوني",      id: r.id, label: r.title,    sub: r.category,     path: `/legal-vault` }));
        servicesList.forEach((r:any)   => out.push({ table: "خدمات",       id: r.id, label: r.name,     sub: r.category,     path: `/services` }));
        blogList.forEach((r:any)       => out.push({ table: "مدونة",       id: r.id, label: r.title,    sub: r.status,       path: `/blog` }));
        productionList.forEach((r:any) => out.push({ table: "إنتاج",       id: r.id, label: r.title,    sub: r.type,         path: `/artistic-production` }));

        setHits(out);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Filter navItems by query for page search
  const filteredNav = query.trim().length >= 1
    ? navItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || i.path.toLowerCase().includes(query.toLowerCase()))
    : navItems;

  const groups = Array.from(new Set(filteredNav.map(i => i.group)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="ابحث في كل المنصة... (Ctrl+K)" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{loading ? "جاري البحث..." : "لا توجد نتائج"}</CommandEmpty>

        {loading && (
          <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 mr-2 animate-spin" /> جاري البحث في قواعد البيانات...
          </div>
        )}

        {hits.length > 0 && (
          <>
            <CommandGroup heading={`نتائج البحث (${hits.length})`}>
              {hits.map(h => {
                const Icon = groupIcon[h.table] ?? Search;
                return (
                  <CommandItem key={`${h.table}-${h.id}`} onSelect={() => { setOpen(false); nav(h.path); }}>
                    <Icon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{h.label}</span>
                        <span className="text-xs text-muted-foreground shrink-0 bg-muted px-1 rounded">{h.table}</span>
                      </div>
                      {h.sub && <div className="text-xs text-muted-foreground truncate">{h.sub}</div>}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {groups.map((g, idx) => (
          <div key={g}>
            <CommandGroup heading={g}>
              {filteredNav.filter(i => i.group === g).map(i => (
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
