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
import { CheckSquare, Plus, RefreshCcw, Clock, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// We use support_tickets as tasks — it has title, description, priority, status, assigned_to
const PRIORITY_COLOR: Record<string, string> = {
  low:      "text-blue-400 border-blue-400/30 bg-blue-400/10",
  medium:   "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  high:     "text-orange-400 border-orange-400/30 bg-orange-400/10",
  urgent:   "text-red-400 border-red-400/30 bg-red-400/10",
};
const STATUS_COLOR: Record<string, string> = {
  open:        "text-blue-400 border-blue-400/30 bg-blue-400/10",
  "in-progress":"text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  resolved:    "text-green-400 border-green-400/30 bg-green-400/10",
  closed:      "text-muted-foreground border-border",
};
const STATUS_ICON: Record<string, React.ElementType> = {
  open:         Clock,
  "in-progress":AlertCircle,
  resolved:     CheckCircle2,
  closed:       CheckCircle2,
};

const empty = { title: "", description: "", priority: "medium", category: "Task", assigned_to: "" };

export default function ManagerTasks() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const db = supabase as any;

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await db
      .from("support_tickets")
      .select("*")
      .eq("category", "Task")
      .order("created_at", { ascending: false });
    setTasks(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = statusFilter === "all" ? tasks : tasks.filter(t => t.status === statusFilter);

  const addTask = async () => {
    if (!form.title.trim()) return toast.error(R ? "العنوان مطلوب" : "Title required");
    const { error } = await db.from("support_tickets").insert({ ...form, status: "open" });
    if (error) return toast.error(error.message);
    toast.success(R ? "تمت الإضافة" : "Task added");
    setModal(false);
    setForm(empty);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await db.from("support_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم التحديث" : "Updated");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(R ? "حذف المهمة؟" : "Delete task?")) return;
    await db.from("support_tickets").delete().eq("id", id);
    toast.success(R ? "تم الحذف" : "Deleted");
    load();
  };

  const counts = {
    open: tasks.filter(t => t.status === "open").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    resolved: tasks.filter(t => t.status === "resolved").length,
  };

  return (
    <ManagerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-emerald-400" />
              {R ? "إدارة المهام" : "Tasks"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tasks.length} {R ? "مهمة" : "tasks"} — {counts.open} {R ? "مفتوحة" : "open"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
            </Button>
            <Button size="sm" onClick={() => setModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />{R ? "مهمة جديدة" : "New Task"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: R ? "مفتوحة" : "Open", value: counts.open, icon: Clock, color: "text-blue-400" },
            { label: R ? "قيد التنفيذ" : "In Progress", value: counts.inProgress, icon: AlertCircle, color: "text-yellow-400" },
            { label: R ? "منتهية" : "Resolved", value: counts.resolved, icon: CheckCircle2, color: "text-green-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn("w-6 h-6", s.color)} />
                <div>
                  <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "open", "in-progress", "resolved", "closed"] as const).map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
              {s === "all" ? (R ? "الكل" : "All") : s}
            </Button>
          ))}
        </div>

        {/* Tasks Board */}
        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا توجد مهام" : "No tasks"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(task => {
              const StatusIcon = STATUS_ICON[task.status] || Clock;
              return (
                <Card key={task.id} className="border-border/50 hover:border-emerald-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <StatusIcon className={cn("w-4 h-4 mt-0.5 shrink-0", STATUS_COLOR[task.status]?.split(" ")[0] || "text-muted-foreground")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{task.title}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="outline" className={cn("text-xs", PRIORITY_COLOR[task.priority] ?? "")}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline" className={cn("text-xs", STATUS_COLOR[task.status] ?? "")}>
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                        {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                        {task.assigned_to && <p className="text-xs text-muted-foreground mt-1">→ {task.assigned_to}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Select value={task.status} onValueChange={v => updateStatus(task.id, v)}>
                          <SelectTrigger className="w-32 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => remove(task.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{R ? "مهمة جديدة" : "New Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{R ? "العنوان *" : "Title *"}</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>{R ? "الوصف" : "Description"}</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{R ? "الأولوية" : "Priority"}</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{R ? "تكليف إلى" : "Assign To"}</Label>
                <Input value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} placeholder={R ? "الاسم أو الإيميل" : "Name or email"} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>{R ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={addTask} className="bg-emerald-600 hover:bg-emerald-700">{R ? "إضافة" : "Add Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  );
}
