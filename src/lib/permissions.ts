// ─── Role Metadata & Static Page Permissions ─────────────────────────────────

export type AppRole =
  | "superadmin" | "admin" | "manager" | "staff"
  | "provider"   | "partner" | "agent" | "vendor"
  | "marketing"  | "viewer"  | "user";

export interface RoleMeta {
  value:   AppRole;
  labelEn: string;
  labelAr: string;
  descEn:  string;
  descAr:  string;
  color:   string;
  badge:   string;
}

export const ROLE_META: RoleMeta[] = [
  {
    value:   "superadmin",
    labelEn: "Super Admin",   labelAr: "مدير النظام",
    descEn:  "Full system access — all permissions bypassed",
    descAr:  "وصول كامل للنظام — تجاوز جميع الصلاحيات",
    color:   "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
    badge:   "bg-yellow-500/20 text-yellow-300",
  },
  {
    value:   "admin",
    labelEn: "Admin",         labelAr: "مسؤول",
    descEn:  "Manage users, roles, and platform settings",
    descAr:  "إدارة المستخدمين والأدوار وإعدادات المنصة",
    color:   "bg-primary/15 text-primary border border-primary/30",
    badge:   "bg-primary/20 text-primary",
  },
  {
    value:   "manager",
    labelEn: "Manager",       labelAr: "مدير",
    descEn:  "Manage teams, operations, and reports",
    descAr:  "إدارة الفرق والعمليات والتقارير",
    color:   "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    badge:   "bg-blue-500/20 text-blue-300",
  },
  {
    value:   "staff",
    labelEn: "Staff",         labelAr: "موظف",
    descEn:  "Day-to-day operational tasks",
    descAr:  "المهام التشغيلية اليومية",
    color:   "bg-green-500/15 text-green-400 border border-green-500/30",
    badge:   "bg-green-500/20 text-green-300",
  },
  {
    value:   "provider",
    labelEn: "Provider",      labelAr: "مزود خدمة",
    descEn:  "Provide services and manage listings",
    descAr:  "تقديم الخدمات وإدارة القوائم",
    color:   "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    badge:   "bg-purple-500/20 text-purple-300",
  },
  {
    value:   "partner",
    labelEn: "Partner",       labelAr: "شريك",
    descEn:  "Strategic partnership with revenue sharing",
    descAr:  "شراكة استراتيجية مع تقاسم العائد",
    color:   "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
    badge:   "bg-indigo-500/20 text-indigo-300",
  },
  {
    value:   "agent",
    labelEn: "Agent",         labelAr: "وكيل",
    descEn:  "Sales and client acquisition",
    descAr:  "المبيعات واستقطاب العملاء",
    color:   "bg-orange-500/15 text-orange-400 border border-orange-500/30",
    badge:   "bg-orange-500/20 text-orange-300",
  },
  {
    value:   "vendor",
    labelEn: "Vendor",        labelAr: "بائع",
    descEn:  "Sell products and manage orders",
    descAr:  "بيع المنتجات وإدارة الطلبات",
    color:   "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    badge:   "bg-amber-500/20 text-amber-300",
  },
  {
    value:   "marketing",
    labelEn: "Marketing",     labelAr: "تسويق",
    descEn:  "Manage campaigns, leads, and analytics",
    descAr:  "إدارة الحملات والعملاء المحتملين والتحليلات",
    color:   "bg-pink-500/15 text-pink-400 border border-pink-500/30",
    badge:   "bg-pink-500/20 text-pink-300",
  },
  {
    value:   "viewer",
    labelEn: "Viewer",        labelAr: "مشاهد",
    descEn:  "Read-only access to permitted areas",
    descAr:  "وصول للقراءة فقط في المناطق المسموحة",
    color:   "bg-slate-500/15 text-slate-400 border border-slate-500/30",
    badge:   "bg-slate-500/20 text-slate-300",
  },
  {
    value:   "user",
    labelEn: "User",          labelAr: "مستخدم",
    descEn:  "Standard platform user",
    descAr:  "مستخدم عادي في المنصة",
    color:   "bg-muted text-muted-foreground border border-border",
    badge:   "bg-muted text-muted-foreground",
  },
];

export const ROLE_MAP: Record<AppRole, RoleMeta> = Object.fromEntries(
  ROLE_META.map(r => [r.value, r])
) as Record<AppRole, RoleMeta>;

// ─── Static Page Permissions (fallback if DB unavailable) ─────────────────────
export const PAGE_PERMS: Record<string, AppRole[]> = {
  "/dashboard":           ["superadmin","admin","manager","staff","partner","agent","vendor","marketing","user"],
  "/permissions":         ["superadmin","admin"],
  "/admin":               ["superadmin","admin"],
  "/admin/users":         ["superadmin","admin"],
  "/admin/sectors":       ["superadmin","admin"],
  "/admin/analytics":     ["superadmin","admin"],
  "/admin/website":       ["superadmin","admin"],
  "/admin/monitor":       ["superadmin","admin"],
  "/admin/providers":     ["superadmin","admin"],
  "/admin/orders":        ["superadmin","admin"],
  "/admin/ai-agent":      ["superadmin","admin"],
  "/dashboard/ai-agent":  ["superadmin","admin"],
  "/operations":          ["superadmin","admin","manager"],
  "/audit-logs":          ["superadmin","admin"],
  "/employees":           ["superadmin","admin","manager"],
  "/finance-analytics":   ["superadmin","admin","manager"],
  "/settings":            ["superadmin","admin","manager","staff","user"],
  "/brands":              ["superadmin","admin","manager"],
  "/erp":                 ["superadmin","admin","manager"],
  "/marketing":           ["superadmin","admin","manager","marketing"],
  "/reports":             ["superadmin","admin","manager"],
  "/notifications":       ["superadmin","admin","manager","staff","user"],
  "/digital-inheritance": ["superadmin","admin"],
  "/legendary-journey":   ["superadmin","admin","manager"],
  "/payment-gateways":    ["superadmin","admin"],
  "/backups":             ["superadmin","admin"],
  "/automations":         ["superadmin","admin","manager"],
  "/team":                ["superadmin","admin","manager"],
  "/referrals":           ["superadmin","admin","manager","agent"],
  "/affiliates":          ["superadmin","admin","manager"],
  "/manager":             ["superadmin","admin","manager"],
  "/staff":               ["superadmin","admin","manager","staff"],
  "/provider":            ["superadmin","admin","manager","provider"],
  "/partner":             ["superadmin","admin","manager","partner"],
  "/agent":               ["superadmin","admin","manager","agent"],
  "/vendor":              ["superadmin","admin","manager","vendor"],
};
