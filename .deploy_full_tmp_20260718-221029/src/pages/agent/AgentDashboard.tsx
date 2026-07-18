import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AgentLayout from "@/layouts/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle,
  Plus, ArrowRight, MapPin, Banknote, UserPlus, Edit3, Trash2,
  Phone, Mail, Building2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface Client {
  id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;
  status: string;
  estimated_value: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface Commission {
  id: string;
  source_type: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

interface AgentProfile {
  id: string;
  agent_code: string;
  full_name: string;
  commission_rate: number;
  total_clients: number;
  total_commissions: number;
  regions: string[];
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  onboarding: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  active:     "text-green-400 bg-green-500/10 border-green-500/30",
  qualified:  "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  converted:  "text-primary bg-primary/10 border-primary/30",
  inactive:   "text-muted-foreground bg-secondary border-border",
  lost:       "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function AgentDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const db = supabase as any;
  const R = i18n.language === "ar";
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingClient, setAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({ client_name: "", client_email: "", client_phone: "", client_company: "" });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: ap } = await db.from("agent_profiles").select("*").eq("user_id", user.id).single();
    setAgentProfile(ap);
    if (ap) {
      const [{ data: cl }, { data: cm }] = await Promise.all([
        db.from("agent_clients").select("*").eq("agent_id", ap.id).order("created_at", { ascending: false }),
        db.from("agent_commissions").select("*").eq("agent_id", ap.id).order("created_at", { ascending: false }).limit(10),
      ]);
      setClients(cl || []);
      setCommissions(cm || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addClient = async () => {
    if (!agentProfile || !newClient.client_name.trim()) return;
    const { error } = await db.from("agent_clients").insert({ ...newClient, agent_id: agentProfile.id });
    if (error) { toast.error(error.message); return; }
    toast.success(R ? "تم إضافة العميل" : "Client added");
    setNewClient({ client_name: "", client_email: "", client_phone: "", client_company: "" });
    setAddingClient(false);
    load();
  };

  const updateClientStatus = async (id: string, status: string) => {
    await db.from("agent_clients").update({ status }).eq("id", id);
    setClients(p => p.map(c => c.id === id ? { ...c, status } : c));
  };

  const deleteClient = async (id: string) => {
    if (!confirm(R ? "حذف العميل؟" : "Delete client?")) return;
    await db.from("agent_clients").delete().eq("id", id);
    setClients(p => p.filter(c => c.id !== id));
  };

  const totalPendingComm = commissions.filter(c => c.status === "pending").reduce((s, c) => s + c.amount_cents, 0);
  const totalPaidComm    = commissions.filter(c => c.status === "paid").reduce((s, c) => s + c.amount_cents, 0);

  return (
    <AgentLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">
              {R ? `مرحباً، ${agentProfile?.full_name || "الوكيل"}` : `Welcome, ${agentProfile?.full_name || "Agent"}`}
            </h1>
            {agentProfile && (
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="font-mono text-emerald-400">{agentProfile.agent_code}</span>
                <span>·</span>
                <MapPin className="w-3 h-3" />
                <span>{agentProfile.regions.join(", ") || (R ? "لم تُحدد مناطق" : "No regions assigned")}</span>
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => setAddingClient(true)} className="gap-2">
            <UserPlus className="w-3.5 h-3.5" />{R ? "إضافة عميل" : "Add Client"}
          </Button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users,     label: R ? "إجمالي عملائي" : "Total Clients",     value: clients.length,                   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { icon: CheckCircle,label: R ? "عملاء مُحوَّلون" : "Converted",      value: clients.filter(c=>c.status==="converted").length, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
            { icon: Clock,     label: R ? "عمولات معلقة" : "Pending Commissions", value: `$${(totalPendingComm/100).toFixed(2)}`, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
            { icon: Banknote,  label: R ? "عمولات مدفوعة" : "Paid Commissions",  value: `$${(totalPaidComm/100).toFixed(2)}`, color: "text-primary",    bg: "bg-primary/10 border-primary/20"     },
          ].map(k => (
            <Card key={k.label} className={cn("border", k.bg)}>
              <CardContent className="p-4">
                <k.icon className={cn("w-5 h-5 mb-2", k.color)} />
                <p className={cn("text-xl font-bold font-display", k.color)}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add client form */}
        {addingClient && (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-emerald-400">{R ? "تسجيل عميل جديد" : "Register New Client"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input placeholder={R ? "الاسم الكامل *" : "Full Name *"} value={newClient.client_name} onChange={e => setNewClient(p => ({ ...p, client_name: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "الشركة" : "Company"} value={newClient.client_company} onChange={e => setNewClient(p => ({ ...p, client_company: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "البريد الإلكتروني" : "Email"} value={newClient.client_email} onChange={e => setNewClient(p => ({ ...p, client_email: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "الهاتف" : "Phone"} value={newClient.client_phone} onChange={e => setNewClient(p => ({ ...p, client_phone: e.target.value }))} className="text-xs h-8" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addClient} className="gap-2"><Plus className="w-3.5 h-3.5" />{R ? "إضافة" : "Add"}</Button>
                <Button size="sm" variant="outline" onClick={() => setAddingClient(false)}>{R ? "إلغاء" : "Cancel"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clients list + Commissions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clients */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />{R ? "عملائي" : "My Clients"}
                <Badge className="ml-auto text-[9px]">{clients.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">{R ? "لا يوجد عملاء بعد" : "No clients yet"}</div>
              ) : (
                <div className="space-y-2">
                  {clients.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                          {c.client_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{c.client_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {c.client_phone && <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{c.client_phone}</span>}
                            {c.client_company && <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5" />{c.client_company}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={c.status}
                          onChange={e => updateClientStatus(c.id, e.target.value)}
                          className={cn("text-[9px] px-2 py-1 rounded-lg border cursor-pointer bg-transparent", STATUS_COLORS[c.status] || "text-muted-foreground")}>
                          {["onboarding","active","qualified","converted","inactive","lost"].map(s => (
                            <option key={s} value={s} className="bg-background text-foreground">{s}</option>
                          ))}
                        </select>
                        <button onClick={() => deleteClient(c.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commissions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />{R ? "عمولاتي" : "Commissions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">{R ? "لا عمولات بعد" : "No commissions yet"}</div>
              ) : (
                <div className="space-y-2">
                  {commissions.slice(0, 8).map(cm => (
                    <div key={cm.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-xs font-medium">{cm.source_type}</p>
                        <p className="text-[9px] text-muted-foreground">{format(new Date(cm.created_at), "dd MMM")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">${(cm.amount_cents/100).toFixed(2)}</p>
                        <Badge className={cn("text-[8px] px-1 py-0",
                          cm.status === "paid" ? "text-green-400 bg-green-500/10 border-green-500/30" :
                          cm.status === "pending" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" :
                          "text-muted-foreground")}>
                          {cm.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {agentProfile && (
                <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                  {R ? "نسبة العمولة: " : "Commission rate: "}
                  <span className="text-emerald-400 font-bold">{agentProfile.commission_rate}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AgentLayout>
  );
}
