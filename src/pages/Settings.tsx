import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, User, Shield, ScrollText, Globe, Plug, Database, Lock, FileText, Bell, ChevronRight, Plus, Trash2, Edit, Upload, Key, Webhook, Copy, ToggleLeft, ToggleRight, Clock, AlertTriangle, CreditCard, BookOpen, Search, Zap, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { settingsApi, rolesApi, auditApi, heirsApi, dmsApi, gdprApi, profileApi, type Heir } from "@/services/system";
import { apiKeysApi, webhooksApi } from "@/services/entities";
import { useAuth } from "@/hooks/useAuth";
import UserRolesAdmin from "@/components/settings/UserRolesAdmin";
import TwoFactorSetup from "@/components/settings/TwoFactorSetup";
import BackupsManager from "@/components/settings/BackupsManager";
import DeliveriesLog from "@/components/settings/DeliveriesLog";
import { InstallAndPush } from "@/components/settings/InstallAndPush";
import NotificationRulesManager from "@/components/settings/NotificationRulesManager";
import BillingPlansManager from "@/components/settings/BillingPlansManager";
import { supabase } from "@/integrations/supabase/client";

const helpSections = [
  { icon: Zap, title: "Getting Started", topics: [
    { q: "How do I add my first brand?", a: "Click the + next to Brands in the sidebar, fill in name, industry, logo and click Save." },
    { q: "How do I invite team members?", a: "Go to User Management → Invitations, enter email and role. They'll receive an invite link." },
    { q: "How do I use Command Palette?", a: "Press Ctrl+K (Windows) or ⌘K (Mac) anywhere in the app to search and navigate quickly." },
  ]},
  { icon: Shield, title: "Security", topics: [
    { q: "How do I enable 2FA?", a: "Go to Settings → Profile & Security → Two-Factor Authentication, scan the QR with Google Authenticator." },
    { q: "What is IP Whitelisting?", a: "Restrict admin access to specific IP ranges. Found in Security → IP Whitelist." },
  ]},
  { icon: CreditCard, title: "Billing", topics: [
    { q: "How do I create a coupon?", a: "Go to Finance Analytics → Coupons → New Coupon." },
    { q: "How do refunds work?", a: "Customers request refunds from their portal. You approve/reject from Finance Analytics → Refunds." },
    { q: "What payment methods are supported?", a: "Stripe, Paddle, manual bank transfer, and crypto. Configure in Payment Gateways." },
  ]},
  { icon: Database, title: "Data & API", topics: [
    { q: "How do I export data?", a: "Every list page has an Export button (CSV/PDF) at the top right." },
    { q: "Where do I get an API key?", a: "Settings → API Hub. Create with a label and use in your integrations." },
  ]},
  { icon: Bot, title: "AI Features", topics: [
    { q: "How does the AI Assistant work?", a: "Bottom-right floating button — ask anything about your data or operations." },
    { q: "What are AI Insights?", a: "On Finance Analytics, use AI-powered analysis to understand trends." },
  ]},
];

const settingsSections = [
  { id: "profile", icon: User, label: "Profile & Security", desc: "Account settings, password, 2FA" },
  { id: "permissions", icon: Shield, label: "Permissions Management", desc: "Role-based access control" },
  { id: "logs", icon: ScrollText, label: "System Logs", desc: "Audit trail & activity monitoring" },
  { id: "preferences", icon: Globe, label: "System Preferences", desc: "Language, timezone, display" },
  { id: "api", icon: Plug, label: "API Hub", desc: "API keys & integrations" },
  { id: "backup", icon: Database, label: "Backup Management", desc: "Automated & manual backups" },
  { id: "emergency", icon: Lock, label: "Emergency & Digital Inheritance", desc: "Key of Death, heir settings" },
  { id: "legal", icon: FileText, label: "Legal & Privacy Policy", desc: "Terms, compliance, GDPR" },
  { id: "billing", icon: CreditCard, label: "Billing & Plans", desc: "Subscriptions, payment methods" },
  { id: "notifications", icon: Bell, label: "Notifications & Support", desc: "Alert preferences, help center" },
];

type LogEntry = { id: string; action: string; user: string; timestamp: string; level: "info" | "warning" | "error"; module: string; };
type Role = { id: string; name: string; permissions: string[]; };
type ApiKey = { id: string; name: string; key: string; created: string; };
type WebhookEntry = { id: string; url: string; events: string; active: boolean; };

const allPermissions = ["Add", "Edit", "Delete", "View", "Manage Users", "Manage Settings", "Export Data", "Manage Billing", "API Access"];

// Live audit log types replace static sample data

const logLevelColors: Record<string, string> = { info: "bg-nile/20 text-nile", warning: "bg-primary/20 text-primary", error: "bg-blood-red/20 text-blood-red" };

function HelpCenter() {
  const [q, setQ] = useState("");
  const filtered = helpSections.map(s => ({
    ...s,
    topics: s.topics.filter(t => !q || t.q.toLowerCase().includes(q.toLowerCase()) || t.a.toLowerCase().includes(q.toLowerCase()))
  })).filter(s => s.topics.length > 0);
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search help topics…" className="w-full pl-9 pr-3 py-2 text-sm bg-secondary/30 border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>
      {filtered.map(section => (
        <div key={section.title} className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-display text-muted-foreground">
            <section.icon className="w-3.5 h-3.5" /> {section.title}
          </div>
          {section.topics.map(topic => (
            <details key={topic.q} className="group border border-border/50 rounded-md overflow-hidden">
              <summary className="flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-secondary/40 list-none">
                <span className="font-body text-foreground">{topic.q}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-3 pb-3 pt-1 text-xs text-muted-foreground bg-secondary/20">{topic.a}</div>
            </details>
          ))}
        </div>
      ))}
    </div>
  );
}

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");

  // Auto-navigate to section from query param (e.g. /settings?section=notifications)
  useEffect(() => {
    const s = searchParams.get("section");
    if (s) setActiveSection(s);
  }, [searchParams]);

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [profilePic, setProfilePic] = useState("");

  // Permissions
  const [roles, setRoles] = useState<Role[]>([]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState({ name: "", permissions: [] as string[] });

  // Logs
  const [logLevelFilter, setLogLevelFilter] = useState("all");
  const [logModuleFilter, setLogModuleFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");

  // Preferences
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("Africa/Cairo");
  const [locale, setLocale] = useState("en-US");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");

  // API Hub
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ url: "", events: "" });

  // Backup
  const [autoBackup, setAutoBackup] = useState(true);

  // Emergency
  const [protocolDays, setProtocolDays] = useState(30);
  const [emailNotify, setEmailNotify] = useState(true);
  const [smsNotify, setSmsNotify] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState("");
  const [heirs, setHeirs] = useState<Heir[]>([]);
  const [heirForm, setHeirForm] = useState<Heir>({ id: "", name: "", email: "", phone: "", relation: "" });
  const [editHeirId, setEditHeirId] = useState<string | null>(null);
  const [showHeirForm, setShowHeirForm] = useState(false);

  // Dead Man's Switch config
  const [dmsActive, setDmsActive] = useState(true);
  const [dmsDeadlineDays, setDmsDeadlineDays] = useState(3);
  const [dmsWarningDays, setDmsWarningDays] = useState(3);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Notifications
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [notifDeadline, setNotifDeadline] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(true);

  // Legal
  const [showLegalEdit, setShowLegalEdit] = useState<string | null>(null);
  const [legalContent, setLegalContent] = useState("");
  const [legalDocs, setLegalDocs] = useState<Record<string, string>>({});

  // Apply preference (language/dir) immediately
  const applyPreferences = (lang: string, loc: string) => {
    const isAr = lang === "Arabic" || loc === "ar-EG";
    document.documentElement.dir = isAr ? "rtl" : "ltr";
    document.documentElement.lang = isAr ? "ar" : (loc?.split("-")[0] || "en");
  };

  // Load all persisted settings on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [profR, prefR, notifR, emergR, backupR, legalR] = await Promise.all([
          settingsApi.get("profile"),
          settingsApi.get("preferences"),
          settingsApi.get("notifications"),
          settingsApi.get("emergency"),
          settingsApi.get("backup"),
          settingsApi.get("legal"),
        ]);
        const prof = profR as any, pref = prefR as any, notif = notifR as any;
        const emerg = emergR as any, backup = backupR as any, legal = legalR as any;
        if (prof) {
          setDisplayName(prof.displayName ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "");
          setEmail(prof.email ?? user.email ?? "");
          setPhone(prof.phone ?? "");
          setSocialWebsite(prof.website ?? "");
          setSocialLinkedin(prof.linkedin ?? "");
          setTwoFaEnabled(!!prof.twoFa);
          setProfilePic(prof.profilePic ?? "");
        } else if (user.email) {
          setEmail(user.email);
          setDisplayName(user.user_metadata?.full_name ?? user.email.split("@")[0] ?? "");
        }
        if (pref) {
          setLanguage(pref.language ?? "English");
          setTimezone(pref.timezone ?? "Africa/Cairo");
          setLocale(pref.locale ?? "en-US");
          setDateFormat(pref.dateFormat ?? "YYYY-MM-DD");
          applyPreferences(pref.language ?? "English", pref.locale ?? "en-US");
        }
        if (notif) {
          setNotifEmail(!!notif.email);
          setNotifPush(!!notif.push);
          setNotifDeadline(!!notif.deadline);
          setNotifSecurity(!!notif.security);
        }
        if (emerg) {
          setProtocolDays(emerg.protocolDays ?? 30);
          setEmailNotify(!!emerg.emailNotify);
          setSmsNotify(!!emerg.smsNotify);
          setEmergencyContacts(emerg.contacts ?? "");
        }
        if (backup) setAutoBackup(!!backup.autoBackup);
        if (legal && typeof legal === "object") setLegalDocs(legal as Record<string, string>);
      } catch (e: any) { toast.error(e.message); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveSetting = async (key: string, value: any, msg = "Saved") => {
    try { await settingsApi.set(key, value); toast.success(msg); }
    catch (e: any) { toast.error(e.message); }
  };

  // Load system-level API keys & webhooks + heirs + logs + roles from DB
  useEffect(() => {
    if (!user) return;
    const ownerId = user.id;
    Promise.all([
      apiKeysApi.list("system" as any, ownerId),
      webhooksApi.list("system" as any, ownerId),
      heirsApi.list(),
      auditApi.list(200),
      rolesApi.listAll(),
    ]).then(([k, w, h, l, r]) => {
      setApiKeys(k); setWebhooks(w); setHeirs(h); setAuditLogs(l);
      if (r && r.length > 0) {
        setRoles(r.map((row: any) => ({
          id: row.id,
          name: row.role ?? row.name ?? "Unknown",
          permissions: row.data?.permissions ?? [],
        })));
      }
    }).catch((e: any) => toast.error(e.message));

    dmsApi.get().then(d => {
      if (!d) return;
      setDmsActive(!!d.active);
      setDmsDeadlineDays(d.deadline_days ?? 3);
      setDmsWarningDays((d as any).warning_days ?? 3);
    }).catch(() => {});

    const ch = supabase.channel("settings-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, async () => {
        try { setAuditLogs(await auditApi.list(200)); } catch { /* ignore */ }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "digital_inheritance" }, async () => {
        try { setHeirs(await heirsApi.list()); } catch { /* ignore */ }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const saveHeir = async () => {
    if (!heirForm.name.trim() || !heirForm.email.trim()) { toast.error("Name & email required"); return; }
    try {
      await heirsApi.upsert(editHeirId ? { ...heirForm, id: editHeirId } : { ...heirForm, id: "" });
      setHeirs(await heirsApi.list());
      setShowHeirForm(false); setEditHeirId(null);
      setHeirForm({ id: "", name: "", email: "", phone: "", relation: "" });
      toast.success("Heir saved");
    } catch (e: any) { toast.error(e.message); }
  };
  const removeHeir = async (id: string) => {
    try { await heirsApi.remove(id); setHeirs(await heirsApi.list()); toast.success("Heir removed"); }
    catch (e: any) { toast.error(e.message); }
  };


  const ToggleSwitch = ({ checked, onToggle, label, desc }: { checked: boolean; onToggle: () => void; label: string; desc: string }) => (
    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
      <div><p className="text-sm font-body text-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
      <button onClick={onToggle} className="relative">
        <div className={`w-10 h-5 rounded-full transition-colors ${checked ? "bg-scarab" : "bg-muted"}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${checked ? "translate-x-5.5 left-0.5" : "left-0.5"}`}
            style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
        </div>
      </button>
    </div>
  );

  const handleRoleSubmit = () => {
    if (!roleForm.name.trim()) { toast.error("Role name required"); return; }
    if (editRoleId) {
      setRoles(prev => prev.map(r => r.id === editRoleId ? { ...r, ...roleForm } : r));
      toast.success("Role updated");
    } else {
      setRoles(prev => [...prev, { id: crypto.randomUUID(), ...roleForm }]);
      toast.success("Role created");
    }
    setShowRoleForm(false);
    setEditRoleId(null);
    setRoleForm({ name: "", permissions: [] });
  };

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm text-primary">PROFILE & SECURITY</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/30">
                {profilePic ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-primary" />}
              </div>
              <label className="cursor-pointer">
                <span className="px-3 py-1.5 rounded-md bg-secondary border border-border text-xs font-display text-foreground hover:border-primary transition-colors">Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={async e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  try {
                    const url = await profileApi.uploadAvatar(f);
                    setProfilePic(url);
                    toast.success("Avatar uploaded");
                  } catch (err: any) { toast.error(err.message || "Upload failed"); }
                }} />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Display Name</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Website</Label><Input value={socialWebsite} onChange={e => setSocialWebsite(e.target.value)} placeholder="https://..." className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>LinkedIn</Label><Input value={socialLinkedin} onChange={e => setSocialLinkedin(e.target.value)} placeholder="LinkedIn URL" className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="••••••••" className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label className="font-display text-xs text-primary">TWO-FACTOR AUTHENTICATION</Label><TwoFactorSetup /></div>
            <Button onClick={() => saveSetting("profile", { displayName, email, phone, website: socialWebsite, linkedin: socialLinkedin, twoFa: twoFaEnabled, profilePic }, "Profile saved")} className="font-display text-xs">Save Profile</Button>
          </div>
        );

      case "permissions":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm text-primary">PERMISSIONS MANAGEMENT</h2>
              <Button size="sm" onClick={() => { setRoleForm({ name: "", permissions: [] }); setEditRoleId(null); setShowRoleForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-3.5 h-3.5" />New Role</Button>
            </div>
            <div className="space-y-3">
              {roles.map(r => (
                <div key={r.id} className="bg-secondary/30 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-sm text-foreground">{r.name}</h3>
                    <div className="flex gap-1">
                      <button onClick={() => { setRoleForm({ name: r.name, permissions: r.permissions }); setEditRoleId(r.id); setShowRoleForm(true); }} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setRoles(prev => prev.filter(x => x.id !== r.id)); toast.success("Role deleted"); }} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.permissions.map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-display">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <UserRolesAdmin />
          </div>
        );

      case "logs": {
        const modules = [...new Set(auditLogs.map((l: any) => l.module).filter(Boolean))];
        const filteredLogs = auditLogs.filter((l: any) => {
          if (logLevelFilter !== "all" && l.level !== logLevelFilter) return false;
          if (logModuleFilter !== "all" && l.module !== logModuleFilter) return false;
          if (logSearch && !String(l.action || "").toLowerCase().includes(logSearch.toLowerCase())) return false;
          return true;
        });
        return (
          <div className="space-y-4">
            <h2 className="font-display text-sm text-primary">SYSTEM LOGS</h2>
            <div className="flex flex-wrap gap-2">
              <Input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search logs..." className="bg-secondary border-border text-foreground max-w-xs text-xs" />
              <select value={logLevelFilter} onChange={e => setLogLevelFilter(e.target.value)} className="rounded-md bg-secondary border border-border px-2 py-1.5 text-xs font-body text-foreground">
                <option value="all">All Levels</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option>
              </select>
              <select value={logModuleFilter} onChange={e => setLogModuleFilter(e.target.value)} className="rounded-md bg-secondary border border-border px-2 py-1.5 text-xs font-body text-foreground">
                <option value="all">All Modules</option>
                {modules.map((m: any) => <option key={String(m)} value={String(m)}>{String(m)}</option>)}
              </select>
              <span className="ml-auto text-[10px] text-muted-foreground self-center">{filteredLogs.length} entries</span>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {filteredLogs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-display shrink-0 ${logLevelColors[log.level] || logLevelColors.info}`}>{String(log.level).toUpperCase()}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-foreground truncate">{log.action}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()} • <span className="text-primary">{log.module || log.table_name}</span></p>
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No logs yet</p>}
            </div>
          </div>
        );
      }

      case "preferences":
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm text-primary">SYSTEM PREFERENCES</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground">
                  <option>English</option><option>Arabic</option><option>French</option><option>German</option><option>Spanish</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground">
                  <option>Africa/Cairo</option><option>Asia/Dubai</option><option>Europe/London</option><option>America/New_York</option><option>Asia/Tokyo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Locale</Label>
                <select value={locale} onChange={e => setLocale(e.target.value)} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground">
                  <option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="ar-EG">Arabic (Egypt)</option><option value="fr-FR">French</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Date Format</Label>
                <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm font-body text-foreground">
                  <option>YYYY-MM-DD</option><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option>
                </select>
              </div>
            </div>
            <Button onClick={() => { applyPreferences(language, locale); saveSetting("preferences", { language, timezone, locale, dateFormat }, "Preferences saved"); }} className="font-display text-xs">Save Preferences</Button>
          </div>
        );

      case "api":
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm text-primary">API HUB</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs text-foreground">API KEYS</span>
                <Button size="sm" variant="outline" disabled={!user} onClick={async () => {
                  try {
                    const k = await apiKeysApi.create("system" as any, user!.id, `Key ${apiKeys.length + 1}`);
                    setApiKeys(prev => [k, ...prev]);
                    toast.success("New API key generated");
                  } catch (e: any) { toast.error(e.message); }
                }} className="gap-1 text-xs font-display"><Key className="w-3.5 h-3.5" />Generate New Key</Button>
              </div>
              {apiKeys.map(k => (
                <div key={k.id} className="bg-secondary/30 rounded-lg border border-border p-3 flex items-center gap-3">
                  <Key className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display text-foreground">{k.label}</p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">{k.key_value}</p>
                    <p className="text-[9px] text-muted-foreground">Created: {new Date(k.created_at).toISOString().slice(0,10)}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(k.key_value); toast.success("Copied to clipboard"); }} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => { try { await apiKeysApi.remove(k.id); setApiKeys(prev => prev.filter(x => x.id !== k.id)); toast.success("Key revoked"); } catch (e: any) { toast.error(e.message); } }} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {apiKeys.length === 0 && <p className="text-xs text-muted-foreground p-3 bg-secondary/30 rounded-lg border border-border">No API keys yet</p>}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs text-foreground">WEBHOOKS</span>
                <Button size="sm" variant="outline" onClick={() => setShowWebhookForm(true)} className="gap-1 text-xs font-display"><Webhook className="w-3.5 h-3.5" />Add Webhook</Button>
              </div>
              {webhooks.length === 0 && <p className="text-xs text-muted-foreground p-3 bg-secondary/30 rounded-lg border border-border">No webhooks configured</p>}
              {webhooks.map(w => (
                <div key={w.id} className="bg-secondary/30 rounded-lg border border-border p-3 flex items-center gap-3">
                  <Webhook className="w-4 h-4 text-nile shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-foreground truncate">{w.url}</p>
                    <p className="text-[10px] text-muted-foreground">Events: {Array.isArray(w.events) ? w.events.join(", ") : ""}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-display ${w.active ? "bg-scarab/20 text-scarab" : "bg-muted text-muted-foreground"}`}>{w.active ? "ON" : "OFF"}</span>
                  <button onClick={async () => { try { await webhooksApi.remove(w.id); setWebhooks(prev => prev.filter(x => x.id !== w.id)); toast.success("Webhook removed"); } catch (e: any) { toast.error(e.message); } }} className="p-1.5 rounded-md text-muted-foreground hover:text-blood-red hover:bg-blood-red/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        );

      case "backup":
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm text-primary">BACKUP MANAGEMENT</h2>
            <BackupsManager />
            <ToggleSwitch checked={autoBackup} onToggle={() => { const v = !autoBackup; setAutoBackup(v); saveSetting("backup", { autoBackup: v }, v ? "Auto backup enabled" : "Auto backup disabled"); }} label="Auto Backup" desc="Daily automatic backup at 2:00 AM (coming soon)" />
            <div className="pt-4 border-t border-border">
              <h3 className="font-display text-xs text-primary mb-3">WEBHOOK DELIVERIES</h3>
              <DeliveriesLog />
            </div>
            <div className="pt-4 border-t border-border">
              <h3 className="font-display text-xs text-primary mb-3">MOBILE & PUSH</h3>
              <InstallAndPush />
            </div>
          </div>
        );

      case "emergency":
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm text-primary">EMERGENCY & DIGITAL INHERITANCE</h2>

            {/* Unified Dead Man's Switch + Emergency Protocol */}
            <div className="p-4 bg-primary/5 border border-primary/30 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-display text-primary">🔱 Dead Man's Switch & Emergency Protocol</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Single source of truth for inheritance triggers and notifications.</p>
                </div>
                <ToggleSwitch checked={dmsActive} onToggle={() => setDmsActive(!dmsActive)} label="" desc="" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Deadline (days without heartbeat)</Label>
                  <Input type="number" min={1} max={365} value={dmsDeadlineDays} onChange={e => setDmsDeadlineDays(Math.max(1, +e.target.value))} className="bg-secondary border-border text-foreground" />
                  <p className="text-[9px] text-muted-foreground">After this many days, the protocol triggers (Vault lock + heir notification).</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Warning Before (days)</Label>
                  <Input type="number" min={1} max={dmsDeadlineDays} value={dmsWarningDays} onChange={e => setDmsWarningDays(Math.max(1, Math.min(dmsDeadlineDays, +e.target.value)))} className="bg-secondary border-border text-foreground" />
                  <p className="text-[9px] text-muted-foreground">Days before deadline you receive a reminder alert.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Emergency Contacts</Label>
                <Input value={emergencyContacts} onChange={e => setEmergencyContacts(e.target.value)} placeholder="email1@..., email2@..." className="bg-secondary border-border text-foreground" />
                <p className="text-[9px] text-muted-foreground">Comma-separated emails notified when the protocol triggers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ToggleSwitch checked={emailNotify} onToggle={() => setEmailNotify(!emailNotify)} label="Email Notifications" desc="Send email alerts on trigger" />
                <ToggleSwitch checked={smsNotify} onToggle={() => setSmsNotify(!smsNotify)} label="SMS Notifications" desc="Send SMS alerts to contacts" />
              </div>

              <Button
                onClick={async () => {
                  try {
                    await dmsApi.update({ active: dmsActive, deadline_days: dmsDeadlineDays, warning_days: dmsWarningDays });
                    await saveSetting("emergency", { emailNotify, smsNotify, contacts: emergencyContacts }, "");
                    toast.success("Emergency configuration saved");
                  } catch (e: any) { toast.error(e.message); }
                }}
                className="font-display text-xs"
              >
                Save All Emergency Config
              </Button>
            </div>
            <div className="p-4 bg-secondary/30 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body text-foreground">Golden Heirs ({heirs.length})</p>
                  <p className="text-xs text-muted-foreground">Managed in the Digital Inheritors module</p>
                </div>
                <Button size="sm" className="text-xs font-display gap-1" onClick={() => navigate("/digital-inheritance")}>
                  <ChevronRight className="w-3.5 h-3.5" /> Manage Heirs
                </Button>
              </div>
              <div className="space-y-2">
                {heirs.length === 0 && <p className="text-xs text-muted-foreground py-2">No heirs configured yet.</p>}
                {heirs.slice(0, 5).map(h => (
                  <div key={h.id} className="flex items-center gap-3 p-2.5 bg-background/40 rounded-md border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-display font-bold">
                      {(h.name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-display text-foreground truncate">{h.name} {h.relation && <span className="text-muted-foreground">· {h.relation}</span>}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{h.email}{h.phone ? ` · ${h.phone}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "legal":
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm text-primary">LEGAL & PRIVACY POLICY</h2>
            <div className="space-y-3">
              {["Terms of Service", "Privacy Policy", "Data Processing Agreement", "GDPR Compliance"].map(doc => (
                <div key={doc} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-body text-foreground">{doc}</span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs font-display" onClick={() => { setShowLegalEdit(doc); setLegalContent(legalDocs[doc] ?? `[${doc}] content goes here...\n\nLast updated: ${new Date().toISOString().slice(0,10)}`); }}>View / Edit</Button>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="font-display text-xs text-primary">YOUR DATA RIGHTS (GDPR)</h3>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                <div><p className="text-sm font-body text-foreground">Export all my data</p><p className="text-xs text-muted-foreground">Download a JSON archive of every record tied to your account.</p></div>
                <Button size="sm" variant="outline" className="text-xs font-display" onClick={async () => {
                  try {
                    toast.info("Preparing export...");
                    const data = await gdprApi.exportAll();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = `kemetrise-export-${new Date().toISOString().slice(0,10)}.json`; a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Export ready");
                  } catch (e: any) { toast.error(e.message); }
                }}>Export Data</Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-blood-red/10 rounded-lg border border-blood-red/30">
                <div><p className="text-sm font-body text-blood-red">Delete my account</p><p className="text-xs text-muted-foreground">Permanently remove all your data. Cannot be undone.</p></div>
                <Button size="sm" variant="destructive" className="text-xs font-display" onClick={async () => {
                  if (!confirm("Are you absolutely sure? This will permanently delete ALL your data.")) return;
                  if (!confirm("Last chance — type confirm in next prompt.")) return;
                  const c = prompt('Type "DELETE" to confirm');
                  if (c !== "DELETE") { toast.error("Cancelled"); return; }
                  try { await gdprApi.deleteAccount(); toast.success("Account data deleted"); navigate("/auth"); }
                  catch (e: any) { toast.error(e.message); }
                }}>Delete Account</Button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm text-primary">NOTIFICATIONS & SUPPORT</h2>
            <div className="space-y-3">
              <ToggleSwitch checked={notifEmail} onToggle={() => { const v = !notifEmail; setNotifEmail(v); saveSetting("notifications", { email: v, push: notifPush, deadline: notifDeadline, security: notifSecurity }, v ? "Email notifications on" : "Email notifications off"); }} label="Email Notifications" desc="Receive alerts via email" />
              <ToggleSwitch checked={notifPush} onToggle={() => { const v = !notifPush; setNotifPush(v); saveSetting("notifications", { email: notifEmail, push: v, deadline: notifDeadline, security: notifSecurity }, v ? "Push notifications on" : "Push notifications off"); }} label="Push Notifications" desc="Browser push notifications" />
              <ToggleSwitch checked={notifDeadline} onToggle={() => { const v = !notifDeadline; setNotifDeadline(v); saveSetting("notifications", { email: notifEmail, push: notifPush, deadline: v, security: notifSecurity }, v ? "Deadline reminders on" : "Deadline reminders off"); }} label="Deadline Reminders" desc="3 days before deadline" />
              <ToggleSwitch checked={notifSecurity} onToggle={() => { const v = !notifSecurity; setNotifSecurity(v); saveSetting("notifications", { email: notifEmail, push: notifPush, deadline: notifDeadline, security: v }, v ? "Security alerts on" : "Security alerts off"); }} label="Security Alerts" desc="Immediate threat notifications" />
            </div>
            <div className="pt-4 border-t border-border">
              <NotificationRulesManager />
            </div>
            {/* ── HELP CENTER ──────────────────────────────────────────── */}
            <div className="pt-4 border-t border-border space-y-4">
              <h3 className="font-display text-xs text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> HELP CENTER
              </h3>
              <HelpCenter />
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm text-primary">BILLING & PLANS</h2>
            <BillingPlansManager />
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span></button>
        <h1 className="font-display text-lg text-primary mb-6">⚙️ SETTINGS</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            {settingsSections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${activeSection === s.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                <s.icon className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[11px] truncate">{s.label}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{s.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            ))}
          </div>
          <div className="md:col-span-3 bg-card border border-border rounded-lg p-6">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Role Form Dialog */}
      <Dialog open={showRoleForm} onOpenChange={setShowRoleForm}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-primary">{editRoleId ? "Edit" : "New"} Role</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Role Name *</Label><Input value={roleForm.name} onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map(p => (
                  <label key={p} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md border border-border cursor-pointer hover:border-primary/30">
                    <input type="checkbox" checked={roleForm.permissions.includes(p)} onChange={e => {
                      setRoleForm(prev => ({ ...prev, permissions: e.target.checked ? [...prev.permissions, p] : prev.permissions.filter(x => x !== p) }));
                    }} className="accent-primary" />
                    <span className="text-xs font-body text-foreground">{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleRoleSubmit} className="font-display text-xs">{editRoleId ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Form Dialog */}
      <Dialog open={showWebhookForm} onOpenChange={setShowWebhookForm}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-primary">Add Webhook</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Webhook URL *</Label><Input value={webhookForm.url} onChange={e => setWebhookForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2"><Label>Events</Label><Input value={webhookForm.events} onChange={e => setWebhookForm(p => ({ ...p, events: e.target.value }))} placeholder="brand.created, project.updated" className="bg-secondary border-border text-foreground" /></div>
          </div>
          <DialogFooter><Button onClick={async () => {
            if (!webhookForm.url.trim()) { toast.error("URL required"); return; }
            if (!user) return;
            try {
              const events = webhookForm.events.split(",").map(s => s.trim()).filter(Boolean);
              const w = await webhooksApi.create("system" as any, user.id, { label: "System", url: webhookForm.url, events });
              setWebhooks(prev => [w, ...prev]);
              setShowWebhookForm(false);
              setWebhookForm({ url: "", events: "" });
              toast.success("Webhook added");
            } catch (e: any) { toast.error(e.message); }
          }} className="font-display text-xs">Add Webhook</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legal Edit Dialog */}
      <Dialog open={!!showLegalEdit} onOpenChange={() => setShowLegalEdit(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{showLegalEdit}</DialogTitle></DialogHeader>
          <Textarea value={legalContent} onChange={e => setLegalContent(e.target.value)} className="bg-secondary border-border text-foreground min-h-[300px] font-body text-sm" />
          <DialogFooter><Button onClick={() => { if (!showLegalEdit) return; const next = { ...legalDocs, [showLegalEdit]: legalContent }; setLegalDocs(next); saveSetting("legal", next, `${showLegalEdit} saved`); setShowLegalEdit(null); }} className="font-display text-xs">Save Document</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Heir Form Dialog */}
      <Dialog open={showHeirForm} onOpenChange={setShowHeirForm}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="font-display text-primary">{editHeirId ? "Edit Heir" : "Add Heir"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Full Name *</Label><Input value={heirForm.name} onChange={e => setHeirForm({ ...heirForm, name: e.target.value })} className="bg-secondary border-border" /></div>
            <div className="space-y-1"><Label className="text-xs">Email *</Label><Input type="email" value={heirForm.email} onChange={e => setHeirForm({ ...heirForm, email: e.target.value })} className="bg-secondary border-border" /></div>
            <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={heirForm.phone || ""} onChange={e => setHeirForm({ ...heirForm, phone: e.target.value })} className="bg-secondary border-border" /></div>
            <div className="space-y-1"><Label className="text-xs">Relation</Label><Input value={heirForm.relation || ""} onChange={e => setHeirForm({ ...heirForm, relation: e.target.value })} placeholder="Brother / Spouse / Friend" className="bg-secondary border-border" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowHeirForm(false)}>Cancel</Button>
            <Button onClick={saveHeir}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
