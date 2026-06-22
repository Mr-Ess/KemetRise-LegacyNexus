import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StaffLayout from "@/layouts/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckSquare, RefreshCcw, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_COLOR: Record<string, string> = {
  low:    "text-blue-400 border-blue-400/30 bg-blue-400/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  high:   "text-orange-400 border-orange-400/30 bg-orange-400/10",
  urgent: "text-red-400 border-red-400/30 bg-red-400/10",
};

const STATUS_COLOR: Record<string, string> = {
  open:          "text-blue-400 border-blue-400/30 bg-blue-400/10",
  "in-progress": "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  resolved:      "text-green-400 border-green-400/30 bg-green-400/10",
  closed:        "text-muted-foreground border-border",
};

export default function StaffTasks() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    // Fetch tasks assigned to this staff member (by email or user_id)
    const { data: byUser } = await db
      .from("support_tickets")
      .select("*")
      .eq("category", "Task")
      .order("created_at", { ascending: false });

    // Filter by assigned_to matching email
    const mine = (byUser ?? []).filter((t: any) =>
      !t.assigned_to ||
      t.assigned_to === user.email ||
      t.assigned_to?.toLowerCase().includes((user.email || "").toLowerCase())
    );
    setTasks(mine);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = statusFilter === "all" ? tasks : tasks.filter(t => t.status === statusFilter);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await db.from("support_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(R ? "تم التحديث" : "Updated");
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const counts = {
    open:       tasks.filter(t => t.status === "open").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    resolved:   tasks.filter(t => t.status === "resolved").length,
  };

  return (
    <StaffLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-violet-400" />
              {R ? "مهامي" : "My Tasks"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tasks.length} {R ? "مهمة" : "tasks"} — {counts.open} {R ? "مفتوحة" : "open"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: R ? "مفتوحة" : "Open", value: counts.open, icon: Clock, color: "text-blue-400" },
            { label: R ? "جاري" : "In Progress", value: counts.inProgress, icon: AlertCircle, color: "text-yellow-400" },
            { label: R ? "منجزة" : "Done", value: counts.resolved, icon: CheckCircle2, color: "text-green-400" },
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

        {/* Tasks */}
        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا توجد مهام مكلف بها" : "No tasks assigned to you"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(task => (
              <Card key={task.id} className={cn("border-border/50 transition-colors hover:border-violet-500/30", task.status === "resolved" && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckSquare className={cn("w-4 h-4 mt-0.5 shrink-0", task.status === "resolved" ? "text-green-400" : "text-violet-400")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-medium text-sm", task.status === "resolved" && "line-through text-muted-foreground")}>
                          {task.title}
                        </p>
                        <Badge variant="outline" className={cn("text-xs shrink-0", PRIORITY_COLOR[task.priority] ?? "")}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(task.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}
                      </p>
                    </div>
                    <Select value={task.status} onValueChange={v => updateStatus(task.id, v)}>
                      <SelectTrigger className="w-32 h-7 text-xs shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
