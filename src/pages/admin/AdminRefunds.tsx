import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import ExportButton from "@/components/shared/ExportButton";
import { tenantDb } from "@/lib/tenantDb";
import { RotateCcw, Check, X, RefreshCcw, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending:  "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  approved: "text-green-400 border-green-400/30 bg-green-400/10",
  rejected: "text-red-400 border-red-400/30 bg-red-400/10",
};

export default function AdminRefunds() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [active, setActive] = useState<any | null>(null);
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await tenantDb.select("refund_requests", { orderBy: "created_at", ascending: false });
    setItems((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (status: "approved" | "rejected") => {
    if (!active) return;
    try {
      await tenantDb.update("refund_requests", {
        status,
        admin_notes: notes,
        processed_at: new Date().toISOString(),
      }, { id: active.id });
    } catch (error: any) {
      return toast.error(error?.message || String(error));
    }
    if (status === "approved") {
      await tenantDb.update("invoices", { status: "refunded", refunded_amount: active.amount }, { id: active.invoice_id });
    }
    toast.success(status === "approved" ? (R ? "تمت الموافقة" : "Refund approved") : (R ? "تم الرفض" : "Refund rejected"));
    setActive(null); setNotes(""); load();
  };

  const filtered = filter === "all" ? items : items.filter((r) => r.status === filter);
  const pendingCount = items.filter((r) => r.status === "pending").length;
  const approvedCount = items.filter((r) => r.status === "approved").length;
  const rejectedCount = items.filter((r) => r.status === "rejected").length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-primary" />
              {R ? "طلبات الاسترداد" : "Refunds"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {pendingCount} {R ? "معلق" : "pending"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
            </Button>
            <ExportButton data={items} filename="refunds" title="Refunds" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: R ? "معلقة" : "Pending", value: pendingCount, icon: Clock, color: "text-yellow-400" },
            { label: R ? "موافق عليها" : "Approved", value: approvedCount, icon: CheckCircle, color: "text-green-400" },
            { label: R ? "مرفوضة" : "Rejected", value: rejectedCount, icon: XCircle, color: "text-red-400" },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <div className="p-4 flex items-center gap-3">
                <s.icon className={cn("w-7 h-7", s.color)} />
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? (R ? "الكل" : "All") : f}
            </Button>
          ))}
        </div>

        {/* Table */}
        <Card className="overflow-x-auto border-border/50">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs">
                <tr>
                  <th className="text-left p-3">{R ? "التاريخ" : "Date"}</th>
                  <th className="text-left p-3">{R ? "الفاتورة" : "Invoice"}</th>
                  <th className="text-left p-3">{R ? "المبلغ" : "Amount"}</th>
                  <th className="text-left p-3">{R ? "السبب" : "Reason"}</th>
                  <th className="text-left p-3">{R ? "الحالة" : "Status"}</th>
                  <th className="text-left p-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      {R ? "لا توجد طلبات استرداد" : "No refund requests"}
                    </td>
                  </tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/10 transition-colors">
                    <td className="p-3 text-xs">
                      {new Date(r.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}
                    </td>
                    <td className="p-3 font-mono text-xs">{r.invoice_id?.slice(0, 8) ?? "—"}</td>
                    <td className="p-3 font-bold">{r.amount} {r.currency}</td>
                    <td className="p-3 text-xs max-w-[240px] truncate">{r.reason || "—"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[r.status] ?? "")}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setActive(r); setNotes(""); }}
                        >
                          {R ? "مراجعة" : "Review"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Process Refund Modal */}
      <Dialog open={!!active} onOpenChange={() => setActive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{R ? "معالجة الاسترداد" : "Process Refund"}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3">
              <p className="text-sm">
                {R ? "المبلغ:" : "Amount:"}{" "}
                <span className="font-bold text-primary">{active.amount} {active.currency}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {R ? "السبب:" : "Reason:"} {active.reason || "—"}
              </p>
              <Textarea
                placeholder={R ? "ملاحظات الإدارة..." : "Admin notes..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActive(null)}>
              {R ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={() => updateStatus("rejected")}>
              <X className="w-4 h-4 mr-1" />{R ? "رفض" : "Reject"}
            </Button>
            <Button onClick={() => updateStatus("approved")}>
              <Check className="w-4 h-4 mr-1" />{R ? "موافقة" : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
