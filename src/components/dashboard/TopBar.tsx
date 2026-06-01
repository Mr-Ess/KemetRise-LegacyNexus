import { Search, Bell, Crown, X, LogOut, Star } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { auditApi, settingsApi, dmsApi } from "@/services/system";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import ShortcutsDialog from "@/components/ShortcutsDialog";
import PresenceIndicator from "@/components/PresenceIndicator";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { tenantDb } from "@/lib/tenantDb";

type Notification = { id: string; title: string; message: string; time: string; type: "info" | "warning" | "error"; read: boolean; created_at: string };

const fmtAgo = (d: string) => {
  const diff = Math.max(0, Date.now() - +new Date(d));
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const AI_AGENTS = ["ANUBIS", "ISIS", "HORUS", "THOTH", "RA", "BASTET"];
const TABLE_MSG: Record<string, string> = {
  brands: "analyzed brand performance for",
  customers: "acquired new customer:",
  tasks: "completed task:",
  branches: "monitored branch activity in",
  transactions: "processed payment for",
  employees: "updated agent profile:",
  audit_logs: "logged system event:",
  marketing_campaigns: "launched campaign:",
  projects: "advanced project milestone:",
  affiliates: "tracked affiliate activity:",
};

const TopBar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [time, setTime] = useState("00:00:00");
  const [seconds, setSeconds] = useState(3 * 24 * 3600);
  const [showNotifications, setShowNotifications] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ table: string; id: string; name: string; sub?: string; path: string }[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardShortcuts({ "mod+k": () => searchRef.current?.focus(), "escape": () => { setSearch(""); searchRef.current?.blur(); } });
  useWhiteLabel();

  const notifications: Notification[] = useMemo(() => logs
    .filter((l: any) => l.level === "warning" || l.level === "error")
    .slice(0, 30)
    .map((l: any) => ({
      id: l.id,
      title: l.module || l.table_name,
      message: l.action,
      time: fmtAgo(l.created_at),
      type: l.level,
      read: readIds.includes(l.id),
      created_at: l.created_at,
    })), [logs, readIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const tickerItems = useMemo(() => {
    const items: string[] = [];
    logs.slice(0, 20).forEach((log: any, i: number) => {
      const agent = AI_AGENTS[i % AI_AGENTS.length];
      const table = (log.table_name || log.module || "system").toLowerCase();
      const verb = TABLE_MSG[table] || "processed event on";
      const target = (log.entity_name || log.details || log.action || table).toString().toUpperCase();
      const when = fmtAgo(log.created_at);
      items.push(`${agent} ${verb} '${target}' · ${when}`);
    });
    return items.length > 0 ? items : ["KemetRise: Legacy Nexus — ALL SYSTEMS ONLINE"];
  }, [logs]);

  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const t = setInterval(() => setTickerIdx(i => (i + 1) % tickerItems.length), 5000);
    return () => clearInterval(t);
  }, [tickerItems.length]);

  useEffect(() => {
    if (!user) return;
    Promise.all([auditApi.list(50), settingsApi.get("read_notifications")])
      .then(([l, r]) => { setLogs(l); if (Array.isArray(r)) setReadIds(r as any); })
      .catch(() => {});
    const ch = supabase.channel("audit-rt-topbar")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, async () => {
        try { setLogs(await auditApi.list(50)); } catch { /* ignore */ }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    dmsApi.get().then(d => {
      if (cancelled || !d) return;
      const total = d.deadline_days * 24 * 3600;
      const elapsed = Math.floor((Date.now() - +new Date(d.last_heartbeat)) / 1000);
      setSeconds(Math.max(0, total - elapsed));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => {
        const ns = Math.max(0, s - 1);
        const days = Math.floor(ns / 86400);
        const h = Math.floor((ns % 86400) / 3600);
        const m = Math.floor((ns % 3600) / 60);
        const sec = ns % 60;
        const pad = (n: number) => n.toString().padStart(2, "0");
        setTime(days > 0 ? `${days}d ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`);
        return ns;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const persistRead = async (ids: string[]) => {
    setReadIds(ids);
    try { await settingsApi.set("read_notifications", ids); } catch { /* ignore */ }
  };
  const markAllRead = () => persistRead([...new Set([...readIds, ...notifications.map(n => n.id)])]);
  const dismissNotification = (id: string) => persistRead([...new Set([...readIds, id])]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const q = search.trim();
    let cancelled = false;
    const safe = (r: PromiseSettledResult<any[]>) => r.status === "fulfilled" ? r.value || [] : [];
    Promise.allSettled([
      tenantDb.select("brands"             as any, { select: "id,name",                        ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("customers"          as any, { select: "id,name,email",                  ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("clients"            as any, { select: "id,full_name,email",             ilike: { column: "full_name",      value: `%${q}%` }, limit: 3 }),
      tenantDb.select("employees"          as any, { select: "id,name,position",               ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("hr_employees"       as any, { select: "id,full_name,job_title",         ilike: { column: "full_name",      value: `%${q}%` }, limit: 3 }),
      tenantDb.select("branches"           as any, { select: "id,name,address",                ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("legendary_journey"  as any, { select: "id,name,status",                 ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("tasks"              as any, { select: "id,title,status",                ilike: { column: "title",          value: `%${q}%` }, limit: 3 }),
      tenantDb.select("inventory"          as any, { select: "id,name,sku",                    ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("materials"          as any, { select: "id,name,unit",                   ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("logistics_shipping" as any, { select: "id,tracking_number,status",      ilike: { column: "tracking_number",value: `%${q}%` }, limit: 3 }),
      tenantDb.select("suppliers"          as any, { select: "id,name,contact_email",          ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("purchase_orders"    as any, { select: "id,po_number,vendor_name",       ilike: { column: "po_number",      value: `%${q}%` }, limit: 3 }),
      tenantDb.select("vendor_contracts"   as any, { select: "id,contract_title,vendor_name",  ilike: { column: "contract_title", value: `%${q}%` }, limit: 3 }),
      tenantDb.select("marketing_campaigns"as any, { select: "id,name,status",                 ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("coupons"            as any, { select: "id,code,description",            ilike: { column: "code",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("support_tickets"    as any, { select: "id,subject,status",              ilike: { column: "subject",        value: `%${q}%` }, limit: 3 }),
      tenantDb.select("assets_management"  as any, { select: "id,name,asset_type",             ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("legal_vault"        as any, { select: "id,title,category",              ilike: { column: "title",          value: `%${q}%` }, limit: 3 }),
      tenantDb.select("services"           as any, { select: "id,name,category",               ilike: { column: "name",           value: `%${q}%` }, limit: 3 }),
      tenantDb.select("blog_posts"         as any, { select: "id,title,status",                ilike: { column: "title",          value: `%${q}%` }, limit: 3 }),
      tenantDb.select("artistic_production"as any, { select: "id,title,type",                  ilike: { column: "title",          value: `%${q}%` }, limit: 3 }),
      tenantDb.select("invoices"           as any, { select: "id,invoice_number,client_name",  ilike: { column: "invoice_number", value: `%${q}%` }, limit: 3 }),
    ]).then(res => {
      if (cancelled) return;
      const [brands,customers,clients,employees,hrEmp,branches,projects,tasksList,
             inventory,materials,shipments,suppliers,poList,contracts,campaigns,
             couponsList,tickets,assets,legalDocs,servicesList,blogList,production,invoices] = res.map(safe);
      const all: { table: string; id: string; name: string; sub?: string; path: string }[] = [];
      brands.forEach((r:any)      => all.push({ table: "علامات",      id: r.id, name: r.name,            path: `/brands/${r.id}` }));
      customers.forEach((r:any)   => all.push({ table: "عملاء",       id: r.id, name: r.name,            sub: r.email,           path: `/customers` }));
      clients.forEach((r:any)     => all.push({ table: "Clients",     id: r.id, name: r.full_name,       sub: r.email,           path: `/clients` }));
      employees.forEach((r:any)   => all.push({ table: "موظفين",      id: r.id, name: r.name,            sub: r.position,        path: `/employees` }));
      hrEmp.forEach((r:any)       => all.push({ table: "HR",          id: r.id, name: r.full_name,       sub: r.job_title,       path: `/operations?tab=hr` }));
      branches.forEach((r:any)    => all.push({ table: "فروع",        id: r.id, name: r.name,            sub: r.address,         path: `/branches` }));
      projects.forEach((r:any)    => all.push({ table: "مشاريع",      id: r.id, name: r.name,            sub: r.status,          path: `/projects` }));
      tasksList.forEach((r:any)   => all.push({ table: "مهام",        id: r.id, name: r.title,           sub: r.status,          path: `/projects` }));
      inventory.forEach((r:any)   => all.push({ table: "مخزون",       id: r.id, name: r.name,            sub: r.sku,             path: `/inventory` }));
      materials.forEach((r:any)   => all.push({ table: "مواد",        id: r.id, name: r.name,            sub: r.unit,            path: `/materials` }));
      shipments.forEach((r:any)   => all.push({ table: "شحنات",       id: r.id, name: r.tracking_number, sub: r.status,          path: `/logistics` }));
      suppliers.forEach((r:any)   => all.push({ table: "موردون",      id: r.id, name: r.name,            sub: r.contact_email,   path: `/operations` }));
      poList.forEach((r:any)      => all.push({ table: "أوامر شراء",  id: r.id, name: r.po_number,       sub: r.vendor_name,     path: `/operations?tab=procurement` }));
      contracts.forEach((r:any)   => all.push({ table: "عقود",        id: r.id, name: r.contract_title,  sub: r.vendor_name,     path: `/operations?tab=procurement` }));
      campaigns.forEach((r:any)   => all.push({ table: "تسويق",       id: r.id, name: r.name,            sub: r.status,          path: `/marketing` }));
      couponsList.forEach((r:any) => all.push({ table: "قسائم",       id: r.id, name: r.code,            sub: r.description,     path: `/coupons` }));
      tickets.forEach((r:any)     => all.push({ table: "تذاكر دعم",   id: r.id, name: r.subject,         sub: r.status,          path: `/` }));
      assets.forEach((r:any)      => all.push({ table: "أصول",        id: r.id, name: r.name,            sub: r.asset_type,      path: `/assets` }));
      legalDocs.forEach((r:any)   => all.push({ table: "قانوني",      id: r.id, name: r.title,           sub: r.category,        path: `/legal-vault` }));
      servicesList.forEach((r:any)=> all.push({ table: "خدمات",       id: r.id, name: r.name,            sub: r.category,        path: `/services` }));
      blogList.forEach((r:any)    => all.push({ table: "مدونة",       id: r.id, name: r.title,           sub: r.status,          path: `/blog` }));
      production.forEach((r:any)  => all.push({ table: "إنتاج",       id: r.id, name: r.title,           sub: r.type,            path: `/artistic-production` }));
      invoices.forEach((r:any)    => all.push({ table: "فواتير",      id: r.id, name: r.invoice_number,  sub: r.client_name,     path: `/revenue` }));
      setResults(all.slice(0, 15));
    });
    return () => { cancelled = true; };
  }, [search]);

  return (
    <div className="shrink-0">
      {/* Main top bar */}
      <header className="h-12 border-b border-border bg-void flex items-center justify-between px-2 sm:px-4 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
          <h1 className="font-display text-[10px] sm:text-xs md:text-sm font-bold text-primary tracking-wider gold-text-glow truncate">
            <span className="hidden sm:inline">PHARAOH'S COMMAND CENTER · </span>
            <span className="sm:hidden">KEMET · </span>
            <span className="text-foreground">KEMET EMPIRE OS</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">


          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-md hover:bg-secondary transition-colors"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blood-red rounded-full text-[9px] font-bold flex items-center justify-center text-foreground">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <span className="font-display text-[10px] font-bold text-foreground tracking-wider">{t("notifications").toUpperCase()}</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-display text-primary hover:underline">
                      {t("mark_all_read")}
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">{t("notification_empty")}</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-2 px-3 py-2.5 border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                          !n.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === "error" ? "bg-blood-red" : n.type === "warning" ? "bg-primary" : "bg-nile"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-display font-bold text-foreground">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground">{n.message}</p>
                          <p className="text-[9px] text-muted-foreground/60 mt-0.5">{n.time}</p>
                        </div>
                        <button onClick={() => dismissNotification(n.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-body text-foreground leading-none truncate max-w-[140px]">{user?.email || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground">{t("pharaoh_king")}</p>
            </div>
            <PresenceIndicator />
            <LanguageSwitcher />
            <ThemeToggle />
            <button onClick={signOut} title="Sign out" className="p-1.5 rounded-md hover:bg-secondary transition-colors">
              <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>
      <ShortcutsDialog />

      {/* Sub header */}
      <div className="h-9 border-b border-border bg-card/50 flex items-center px-2 sm:px-4 gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <Crown className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-[9px] sm:text-[10px] font-bold text-primary tracking-widest hidden sm:inline">EMPIRE OVERVIEW</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] sm:text-xs font-body text-muted-foreground hidden md:inline">Countdown to next heartbeat:</span>
          <span className="text-[10px] sm:text-xs font-body text-muted-foreground md:hidden">Heartbeat:</span>
          <span className="text-[10px] sm:text-xs font-display font-bold text-nile tabular-nums">{time}</span>
        </div>
        <div className="flex-1 overflow-hidden hidden sm:block">
          <div className="flex items-center gap-2 animate-marquee">
            <Star className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-body text-primary whitespace-nowrap">
              {tickerItems[tickerIdx % tickerItems.length]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
