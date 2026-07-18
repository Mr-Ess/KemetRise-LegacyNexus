import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, DollarSign, TrendingUp, TrendingDown, Plus,
  RefreshCw, FileText, CheckCircle, Clock, AlertTriangle,
  ChevronDown, Filter, Download, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface LedgerEntry {
  id: string;
  entry_date: string;
  entry_type: string;
  reference_type?: string;
  reference_id?: string;
  description: string;
  description_ar?: string;
  debit_amount: number;
  credit_amount: number;
  account_code?: string;
  account_name?: string;
  account_name_ar?: string;
  currency: string;
  balance_after: number;
  created_at: string;
}

interface TaxEntry {
  id: string;
  period_label: string;
  tax_type: string;
  gross_amount: number;
  tax_amount: number;
  net_amount: number;
  status: string;
  due_date?: string;
  filed_at?: string;
  notes?: string;
}

const ENTRY_TYPES: Record<string, string> = {
  revenue: "text-green-400", expense: "text-red-400", transfer: "text-blue-400",
  refund: "text-orange-400", fee: "text-yellow-400", adjustment: "text-purple-400",
};

const TAX_STATUS: Record<string, { label: string; labelAr: string; color: string }> = {
  draft:    { label: "Draft",    labelAr: "مسودة",     color: "text-muted-foreground" },
  pending:  { label: "Pending",  labelAr: "قيد الانتظار", color: "text-yellow-400" },
  filed:    { label: "Filed",    labelAr: "مُودَع",    color: "text-green-400"  },
  overdue:  { label: "Overdue",  labelAr: "متأخر",     color: "text-red-400"    },
  paid:     { label: "Paid",     labelAr: "مدفوع",     color: "text-blue-400"   },
};

export default function ERPLedger() {
  const { i18n } = useTranslation();
  const db = supabase as any;
  const R = i18n.language === "ar";

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [taxes, setTaxes] = useState<TaxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addingEntry, setAddingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    description: "", entry_type: "revenue", debit_amount: "", credit_amount: "", account_code: "", account_name: "",
  });

  // Summary stats
  const totalRevenue = entries.filter(e => e.entry_type === "revenue").reduce((s, e) => s + e.credit_amount, 0);
  const totalExpenses = entries.filter(e => e.entry_type === "expense").reduce((s, e) => s + e.debit_amount, 0);
  const totalFees = entries.filter(e => e.entry_type === "fee").reduce((s, e) => s + e.debit_amount, 0);
  const netIncome = totalRevenue - totalExpenses - totalFees;

  const pendingTax = taxes.filter(t => t.status === "pending").reduce((s, t) => s + t.tax_amount, 0);
  const overdueTax = taxes.filter(t => t.status === "overdue").length;

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: le }, { data: te }] = await Promise.all([
      db.from("erp_ledger").select("*").order("entry_date", { ascending: false }).limit(100),
      db.from("erp_tax_entries").select("*").order("due_date", { ascending: false }).limit(50),
    ]);
    setEntries(le || []);
    setTaxes(te || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createEntry = async () => {
    if (!newEntry.description.trim()) return;
    const { error } = await db.from("erp_ledger").insert({
      ...newEntry,
      entry_date: new Date().toISOString().split("T")[0],
      debit_amount: parseFloat(newEntry.debit_amount) || 0,
      credit_amount: parseFloat(newEntry.credit_amount) || 0,
      currency: "USD",
    });
    if (error) { toast.error(error.message); return; }
    toast.success(R ? "تم إنشاء القيد المحاسبي" : "Journal entry created");
    setNewEntry({ description: "", entry_type: "revenue", debit_amount: "", credit_amount: "", account_code: "", account_name: "" });
    setAddingEntry(false);
    load();
  };

  const filteredEntries = entries.filter(e =>
    (typeFilter === "all" || e.entry_type === typeFilter) &&
    (e.description?.toLowerCase().includes(search.toLowerCase()) || e.account_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              {R ? "دفتر الأستاذ العام — ERP" : "ERP General Ledger"}
            </h1>
            <p className="text-sm text-muted-foreground">{R ? "القيود المحاسبية والامتثال الضريبي" : "Journal entries and tax compliance"}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={load} className="gap-2"><RefreshCw className="w-3.5 h-3.5" /></Button>
            <Button size="sm" onClick={() => setAddingEntry(true)} className="gap-2"><Plus className="w-3.5 h-3.5" />{R ? "قيد جديد" : "New Entry"}</Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: R ? "إجمالي الإيرادات" : "Total Revenue",  value: `$${totalRevenue.toLocaleString("en", { minimumFractionDigits: 2 })}`,  color: "text-green-400",  bg: "bg-green-500/10",  icon: TrendingUp    },
            { label: R ? "إجمالي المصروفات" : "Total Expenses",  value: `$${totalExpenses.toLocaleString("en", { minimumFractionDigits: 2 })}`, color: "text-red-400",    bg: "bg-red-500/10",    icon: TrendingDown  },
            { label: R ? "صافي الدخل" : "Net Income",            value: `$${netIncome.toLocaleString("en", { minimumFractionDigits: 2 })}`,     color: netIncome >= 0 ? "text-cyan-400" : "text-red-400", bg: "bg-cyan-500/10", icon: DollarSign },
            { label: R ? "ضرائب معلقة" : "Pending Tax",          value: `$${pendingTax.toLocaleString("en", { minimumFractionDigits: 2 })}`,    color: "text-yellow-400", bg: "bg-yellow-500/10", icon: AlertTriangle },
          ].map(k => (
            <Card key={k.label} className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", k.bg)}>
                  <k.icon className={cn("w-5 h-5", k.color)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className={cn("text-base font-display font-bold", k.color)}>{loading ? "…" : k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tax alert */}
        {overdueTax > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-300">{R ? `تحذير: يوجد ${overdueTax} قيد ضريبي متأخر!` : `Warning: ${overdueTax} overdue tax ${overdueTax === 1 ? "entry" : "entries"}!`}</p>
          </div>
        )}

        {/* Add entry form */}
        {addingEntry && (
          <Card className="border-cyan-500/30 bg-cyan-500/5">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">{R ? "قيد محاسبي جديد" : "New Journal Entry"}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <Input placeholder={R ? "الوصف *" : "Description *"} value={newEntry.description} onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))} className="text-xs h-8 col-span-2 md:col-span-1" />
                <select value={newEntry.entry_type} onChange={e => setNewEntry(p => ({ ...p, entry_type: e.target.value }))} className="text-xs h-8 rounded-md border border-border bg-background px-2">
                  {["revenue", "expense", "fee", "refund", "transfer", "adjustment"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <Input placeholder={R ? "كود الحساب" : "Account Code"} value={newEntry.account_code} onChange={e => setNewEntry(p => ({ ...p, account_code: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "اسم الحساب" : "Account Name"} value={newEntry.account_name} onChange={e => setNewEntry(p => ({ ...p, account_name: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "مدين (Debit)" : "Debit"} type="number" value={newEntry.debit_amount} onChange={e => setNewEntry(p => ({ ...p, debit_amount: e.target.value }))} className="text-xs h-8" />
                <Input placeholder={R ? "دائن (Credit)" : "Credit"} type="number" value={newEntry.credit_amount} onChange={e => setNewEntry(p => ({ ...p, credit_amount: e.target.value }))} className="text-xs h-8" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={createEntry}>{R ? "حفظ القيد" : "Save Entry"}</Button>
                <Button size="sm" variant="outline" onClick={() => setAddingEntry(false)}>{R ? "إلغاء" : "Cancel"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="ledger">
          <TabsList className="bg-secondary/30 border border-border">
            <TabsTrigger value="ledger">{R ? "دفتر الأستاذ" : "General Ledger"}</TabsTrigger>
            <TabsTrigger value="tax">{R ? "الامتثال الضريبي" : "Tax Compliance"}</TabsTrigger>
          </TabsList>

          {/* Ledger */}
          <TabsContent value="ledger" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Input placeholder={R ? "بحث في القيود..." : "Search entries..."} value={search} onChange={e => setSearch(e.target.value)} className="text-xs h-8 max-w-xs" />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-xs h-8 rounded-md border border-border bg-background px-2">
                <option value="all">{R ? "كل الأنواع" : "All Types"}</option>
                {Object.keys(ENTRY_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-xs text-muted-foreground">{filteredEntries.length} {R ? "قيد" : "entries"}</span>
            </div>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left px-4 py-2.5 text-muted-foreground">{R ? "التاريخ" : "Date"}</th>
                      <th className="text-left px-4 py-2.5 text-muted-foreground">{R ? "الوصف" : "Description"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "النوع" : "Type"}</th>
                      <th className="text-right px-4 py-2.5 text-muted-foreground">{R ? "مدين" : "Debit"}</th>
                      <th className="text-right px-4 py-2.5 text-muted-foreground">{R ? "دائن" : "Credit"}</th>
                      <th className="text-right px-4 py-2.5 text-muted-foreground">{R ? "الرصيد" : "Balance"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">{R ? "لا توجد قيود" : "No entries found"}</td></tr>
                    ) : filteredEntries.map(e => (
                      <tr key={e.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground">{format(new Date(e.entry_date), "dd MMM yyyy")}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium truncate max-w-[180px]">{R && e.description_ar ? e.description_ar : e.description}</p>
                          {e.account_name && <p className="text-[9px] text-muted-foreground">{e.account_code} · {R && e.account_name_ar ? e.account_name_ar : e.account_name}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge className={cn("text-[9px] px-1.5", ENTRY_TYPES[e.entry_type] || "text-muted-foreground")}>{e.entry_type}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right text-red-400 font-mono">{e.debit_amount > 0 ? `$${e.debit_amount.toFixed(2)}` : "—"}</td>
                        <td className="px-4 py-2.5 text-right text-green-400 font-mono">{e.credit_amount > 0 ? `$${e.credit_amount.toFixed(2)}` : "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">{e.balance_after !== undefined ? `$${e.balance_after?.toFixed(2)}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax compliance */}
          <TabsContent value="tax" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="text-left px-4 py-2.5 text-muted-foreground">{R ? "الفترة" : "Period"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "نوع الضريبة" : "Tax Type"}</th>
                      <th className="text-right px-4 py-2.5 text-muted-foreground">{R ? "المبلغ الإجمالي" : "Gross"}</th>
                      <th className="text-right px-4 py-2.5 text-muted-foreground">{R ? "الضريبة" : "Tax"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "تاريخ الاستحقاق" : "Due Date"}</th>
                      <th className="text-center px-4 py-2.5 text-muted-foreground">{R ? "الحالة" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxes.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">{R ? "لا توجد إدخالات ضريبية" : "No tax entries"}</td></tr>
                    ) : taxes.map(t => {
                      const s = TAX_STATUS[t.status] || TAX_STATUS.draft;
                      return (
                        <tr key={t.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                          <td className="px-4 py-2.5 font-medium">{t.period_label}</td>
                          <td className="px-4 py-2.5 text-center capitalize">{t.tax_type.replace("_", " ")}</td>
                          <td className="px-4 py-2.5 text-right font-mono">${t.gross_amount?.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-yellow-400">${t.tax_amount?.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-center text-muted-foreground">{t.due_date ? format(new Date(t.due_date), "dd MMM yyyy") : "—"}</td>
                          <td className="px-4 py-2.5 text-center"><Badge className={cn("text-[9px] px-1.5", s.color)}>{R ? s.labelAr : s.label}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
