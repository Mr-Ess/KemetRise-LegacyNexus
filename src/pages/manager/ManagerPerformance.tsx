import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import ManagerLayout from "@/layouts/ManagerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TrendingUp, Plus, RefreshCcw, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const SCORE_COLOR = (score: number) => {
  if (score >= 8) return "text-green-400";
  if (score >= 5) return "text-yellow-400";
  return "text-red-400";
};

const empty = { employee_id: "", review_period: "", score: 7, strengths: "", improvements: "", reviewer: "" };

export default function ManagerPerformance() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await db.from("hr_performance").select("*").order("created_at", { ascending: false });
    setReviews(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addReview = async () => {
    if (!form.employee_id.trim() || !form.review_period.trim()) {
      return toast.error(R ? "معرف الموظف وفترة التقييم مطلوبان" : "Employee ID and period required");
    }
    const { error } = await db.from("hr_performance").insert({ ...form, score: Number(form.score) });
    if (error) return toast.error(error.message);
    toast.success(R ? "تم إضافة التقييم" : "Review added");
    setModal(false);
    setForm(empty);
    load();
  };

  const avgScore = reviews.length
    ? (reviews.reduce((s, r) => s + (r.score || 0), 0) / reviews.length).toFixed(1)
    : "—";
  const topPerformers = reviews.filter(r => (r.score || 0) >= 8).length;
  const needsImprovement = reviews.filter(r => (r.score || 0) < 5).length;

  return (
    <ManagerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              {R ? "تقييم الأداء" : "Performance"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {reviews.length} {R ? "تقييم" : "reviews"} — {R ? "متوسط:" : "avg:"} {avgScore}/10
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={() => setModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />{R ? "تقييم جديد" : "New Review"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: R ? "المتوسط العام" : "Overall Average", value: `${avgScore}/10`, color: "text-emerald-400" },
            { label: R ? "أداء ممتاز (≥8)" : "Top Performers (≥8)", value: topPerformers, color: "text-green-400" },
            { label: R ? "يحتاج تحسين (<5)" : "Needs Improvement (<5)", value: needsImprovement, color: "text-red-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4">
                <div className={cn("text-3xl font-bold font-display", s.color)}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reviews List */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              {R ? "سجل التقييمات" : "Performance Reviews"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />)}</div>
            ) : reviews.length === 0 ? (
              <div className="py-16 text-center">
                <TrendingUp className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{R ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {reviews.map(r => (
                  <div key={r.id} className="flex items-start gap-4 px-4 py-4 hover:bg-muted/10 transition-colors">
                    <div className={cn("text-2xl font-bold font-display shrink-0 w-12 text-center", SCORE_COLOR(r.score || 0))}>
                      {r.score ?? "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{r.employee_id?.slice(0, 8) || "—"}</span>
                        <Badge variant="outline" className="text-xs">{r.review_period}</Badge>
                        {r.reviewer && <span className="text-xs text-muted-foreground">by {r.reviewer}</span>}
                      </div>
                      {r.strengths && <p className="text-xs text-green-400 mt-1">✓ {r.strengths}</p>}
                      {r.improvements && <p className="text-xs text-yellow-400 mt-0.5">→ {r.improvements}</p>}
                    </div>
                    <div className="flex shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("w-3 h-3", i < Math.round((r.score || 0) / 2) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Review Modal */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{R ? "تقييم أداء جديد" : "New Performance Review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{R ? "معرف الموظف *" : "Employee ID *"}</Label>
                <Input value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} placeholder="UUID" />
              </div>
              <div>
                <Label>{R ? "فترة التقييم *" : "Review Period *"}</Label>
                <Input value={form.review_period} onChange={e => setForm({ ...form, review_period: e.target.value })} placeholder="Q1 2026" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{R ? "الدرجة (1-10)" : "Score (1-10)"}</Label>
                <Input type="number" min="1" max="10" value={form.score} onChange={e => setForm({ ...form, score: +e.target.value })} />
              </div>
              <div>
                <Label>{R ? "المراجع" : "Reviewer"}</Label>
                <Input value={form.reviewer} onChange={e => setForm({ ...form, reviewer: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{R ? "نقاط القوة" : "Strengths"}</Label>
              <Textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>{R ? "مجالات التحسين" : "Areas for Improvement"}</Label>
              <Textarea value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={addReview} className="bg-emerald-600 hover:bg-emerald-700">{R ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  );
}
