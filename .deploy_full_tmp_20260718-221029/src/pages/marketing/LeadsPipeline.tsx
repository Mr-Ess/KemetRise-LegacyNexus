import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MarketingLayout from "@/layouts/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users, Target, TrendingUp, DollarSign, Plus, RefreshCw,
  MoreHorizontal, ArrowRight, Phone, Mail, Building2,
  Clock, CheckCircle, XCircle, AlertCircle, Trash2, Edit3,
  Filter, Search, BarChart3, Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  status: LeadStatus;
  score: number;
  estimated_value: number;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

const COLUMNS: { status: LeadStatus; label: string; labelAr: string; color: string; bg: string }[] = [
  { status: "new",         label: "New",         labelAr: "جديد",          color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20"    },
  { status: "contacted",   label: "Contacted",   labelAr: "تم التواصل",    color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20"    },
  { status: "qualified",   label: "Qualified",   labelAr: "مؤهل",          color: "text-indigo-400",  bg: "bg-indigo-500/10 border-indigo-500/20"},
  { status: "proposal",    label: "Proposal",    labelAr: "عرض سعر",       color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20"},
  { status: "negotiation", label: "Negotiation", labelAr: "تفاوض",         color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20"},
  { status: "won",         label: "Won ✓",       labelAr: "ربحنا ✓",       color: "text-green-400",   bg: "bg-green-500/10 border-green-500/20"  },
  { status: "lost",        label: "Lost",        labelAr: "خسرنا",         color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20"      },
];

export default function LeadsPipeline() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const db = supabase as any;
  const R = i18n.language === "ar";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", company: "", source: "organic" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db.from("marketing_leads").select("*").order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    const ch = db.channel("leads_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "marketing_leads" }, load)
      .subscribe();
    return () => { db.removeChannel(ch); };
  }, [load]);

  const filtered = useMemo(() =>
    leads.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase())),
    [leads, search]
  );

  const addLead = async () => {
    if (!newLead.name.trim()) return;
    const { error } = await db.from("marketing_leads").insert({ ...newLead, assigned_to: user?.id });
    if (error) { toast.error(error.message); return; }
    toast.success(R ? "تم إضافة العميل المحتمل" : "Lead added");
    setNewLead({ name: "", email: "", phone: "", company: "", source: "organic" });
    setAdding(false);
    load();
  };

  const moveLead = async (id: string, status: LeadStatus) => {
    await db.from("marketing_leads").update({ status }).eq("id", id);
    setLeads(p => p.map(l => l.id === id ? { ...l, status } : l));
  };

  const deleteLead = async (id: string) => {
    if (!confirm(R ? "حذف؟" : "Delete?")) return;
    await db.from("marketing_leads").delete().eq("id", id);
    setLeads(p => p.filter(l => l.id !== id));
    toast.success(R ? "تم الحذف" : "Deleted");
  };

  const totalValue = useMemo(() => leads.filter(l => l.status === "won").reduce((s, l) => s + l.estimated_value, 0), [leads]);
  const conversionRate = useMemo(() => leads.length ? ((leads.filter(l => l.status === "won").length / leads.length) * 100).toFixed(1) : "0", [leads]);

  return (
    <MarketingLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-400" />
            {R ? "قناة المبيعات — Kanban" : "Sales Pipeline — Kanban"}
          </h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={load} className="gap-2"><RefreshCw className="w-3.5 h-3.5" /></Button>
            <Button size="sm" onClick={() => setAdding(true)} className="gap-2"><Plus className="w-3.5 h-3.5" />{R ? "عميل محتمل" : "Add Lead"}</Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: R ? "إجمالي العملاء" : "Total Leads",   value: leads.length,                           color: "text-foreground"  },
            { label: R ? "تم التحويل" : "Converted",          value: leads.filter(l=>l.status==="won").length, color: "text-green-400" },
            { label: R ? "معدل التحويل" : "Conv. Rate",       value: `${conversionRate}%`,                   color: "text-primary"     },
            { label: R ? "قيمة المبيعات" : "Won Revenue",    value: `$${(totalValue/100).toFixed(0)}`,      color: "text-primary"     },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-3">
                <p className={cn("text-lg font-bold font-display", s.color)}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={R ? "ابحث في العملاء المحتملين..." : "Search leads..."} className="pl-8 text-xs h-8" />
        </div>

        {/* Add lead form */}
        {adding && (
          <Card className="border-pink-500/30 bg-pink-500/5">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <Input placeholder={R ? "الاسم *" : "Name *"} value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} className="text-xs h-8" />
                <Input placeholder="Email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "الهاتف" : "Phone"} value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "الشركة" : "Company"} value={newLead.company} onChange={e => setNewLead(p => ({ ...p, company: e.target.value }))} className="text-xs h-8" />
                <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} className="text-xs h-8 px-2 rounded-md bg-background border border-border">
                  {["organic","paid_ad","referral","social","event","cold_call","email"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addLead} className="gap-2"><Plus className="w-3.5 h-3.5" />{R ? "إضافة" : "Add"}</Button>
                <Button size="sm" variant="outline" onClick={() => setAdding(false)}>{R ? "إلغاء" : "Cancel"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {COLUMNS.map(col => {
              const colLeads = filtered.filter(l => l.status === col.status);
              return (
                <div key={col.status}
                  onDragOver={e => { e.preventDefault(); setDragOver(col.status); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); if (dragging) moveLead(dragging, col.status); setDragOver(null); setDragging(null); }}
                  className={cn("w-64 rounded-xl border transition-all", col.bg, dragOver === col.status && "ring-2 ring-offset-1 ring-pink-500/40")}>
                  {/* Column header */}
                  <div className="p-3 border-b border-border/30">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-bold", col.color)}>{R ? col.labelAr : col.label}</span>
                      <Badge className={cn("text-[9px] px-1.5 py-0", col.color)}>{colLeads.length}</Badge>
                    </div>
                    {col.status === "won" && colLeads.length > 0 && (
                      <p className="text-[9px] text-green-400 mt-1">${(colLeads.reduce((s,l)=>s+l.estimated_value,0)/100).toFixed(0)}</p>
                    )}
                  </div>
                  {/* Cards */}
                  <div className="p-2 space-y-2 min-h-20">
                    {colLeads.map(lead => (
                      <div key={lead.id}
                        draggable
                        onDragStart={() => setDragging(lead.id)}
                        className="bg-background/80 border border-border/50 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-pink-500/30 transition-all group">
                        <div className="flex items-start justify-between mb-1.5">
                          <p className="text-xs font-semibold leading-tight">{lead.name}</p>
                          <button onClick={() => deleteLead(lead.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {lead.company && <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1"><Building2 className="w-2.5 h-2.5" />{lead.company}</p>}
                        {lead.email && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{lead.email}</p>}
                        {lead.phone && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{lead.phone}</p>}
                        {lead.estimated_value > 0 && <p className="text-[10px] text-green-400 mt-1.5 font-semibold">${(lead.estimated_value/100).toFixed(0)}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <div className="h-1 w-12 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-pink-500/70 rounded-full" style={{ width: `${lead.score}%` }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground">{lead.score}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground">{lead.source}</span>
                        </div>
                      </div>
                    ))}
                    {colLeads.length === 0 && (
                      <div className="text-center py-4 text-[10px] text-muted-foreground/50">{R ? "اسحب هنا" : "Drop here"}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
