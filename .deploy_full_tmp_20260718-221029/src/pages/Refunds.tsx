import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import ExportButton from "@/components/shared/ExportButton";
import { tenantDb } from "@/lib/tenantDb";

export default function Refunds() {
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [active, setActive] = useState<any | null>(null);
  const [notes, setNotes] = useState("");

  const load = async () => {
    const data = await tenantDb.select("refund_requests", { orderBy: "created_at", ascending: false });
    setItems((data as any[]) || []);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (status: "approved" | "rejected") => {
    if (!active) return;
    try {
      await tenantDb.update("refund_requests", {
        status, admin_notes: notes, processed_at: new Date().toISOString(),
      }, { id: active.id });
    } catch (error: any) {
      return toast.error(error?.message || String(error));
    }
    if (status === "approved") {
      await tenantDb.update("invoices", { status: "refunded", refunded_amount: active.amount }, { id: active.invoice_id });
    }
    toast.success(status === "approved" ? "Refund approved" : "Refund rejected");
    setActive(null); setNotes(""); load();
  };

  const filtered = filter === "all" ? items : items.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => nav("/")}><ArrowLeft className="w-4 h-4 mr-2" /> رجوع</Button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
            <RotateCcw className="w-6 h-6" /> Refunds
          </h1>
          <ExportButton data={items} filename="refunds" title="Refunds" />
        </div>

        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>
          ))}
        </div>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Invoice</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Reason</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">لا توجد طلبات استرداد</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3 font-mono text-xs">{r.invoice_id?.slice(0, 8)}</td>
                  <td className="p-3 font-bold">{r.amount} {r.currency}</td>
                  <td className="p-3 text-xs max-w-[280px] truncate">{r.reason || "—"}</td>
                  <td className="p-3"><Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "outline"}>{r.status}</Badge></td>
                  <td className="p-3">
                    {r.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => { setActive(r); setNotes(""); }}>Review</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Dialog open={!!active} onOpenChange={() => setActive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Process Refund</DialogTitle></DialogHeader>
          {active && (
            <div className="space-y-3">
              <p className="text-sm">Amount: <span className="font-bold text-primary">{active.amount} {active.currency}</span></p>
              <p className="text-xs text-muted-foreground">Reason: {active.reason || "—"}</p>
              <Textarea placeholder="Admin notes..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => updateStatus("rejected")}><X className="w-4 h-4 mr-1" /> Reject</Button>
            <Button onClick={() => updateStatus("approved")}><Check className="w-4 h-4 mr-1" /> Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
