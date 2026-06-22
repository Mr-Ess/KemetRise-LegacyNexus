import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StaffLayout from "@/layouts/StaffLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, RefreshCcw, CheckCircle, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_COLOR: Record<string, string> = {
  announcement:  "text-blue-400 border-blue-400/30 bg-blue-400/10",
  task_assigned: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  alert:         "text-red-400 border-red-400/30 bg-red-400/10",
  info:          "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

export default function StaffNotifications() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db
      .from("notifications")
      .select("*")
      .or(`user_id.eq.${user.id},assignee_ref.eq.${user.email}`)
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = filter === "unread" ? items.filter(n => !n.is_read) : items;
  const unread = items.filter(n => !n.is_read).length;

  const markRead = async (id: string) => {
    await db.from("notifications").update({ is_read: true }).eq("id", id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await db.from("notifications").update({ is_read: true })
      .or(`user_id.eq.${user.id},assignee_ref.eq.${user.email}`)
      .eq("is_read", false);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success(R ? "تم تعليم الكل كمقروء" : "All marked as read");
  };

  const remove = async (id: string) => {
    await db.from("notifications").delete().eq("id", id);
    setItems(prev => prev.filter(n => n.id !== id));
  };

  const fmt = (s: string) =>
    new Date(s).toLocaleString(R ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <StaffLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Bell className="w-6 h-6 text-violet-400" />
              {R ? "الإشعارات" : "Notifications"}
              {unread > 0 && <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">{unread}</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">
              {unread} {R ? "إشعار جديد" : "new"} / {items.length} {R ? "إجمالاً" : "total"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCcw className="w-4 h-4" />{R ? "تحديث" : "Refresh"}
            </Button>
            {unread > 0 && (
              <Button size="sm" variant="outline" onClick={markAllRead} className="gap-2">
                <Check className="w-4 h-4" />{R ? "تعليم الكل" : "Mark All Read"}
              </Button>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "unread"] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? (R ? "الكل" : "All") : (R ? "غير مقروء" : "Unread")}
              {f === "unread" && unread > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1 rounded-full">{unread}</span>}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {filter === "unread" ? (R ? "لا توجد إشعارات غير مقروءة" : "No unread notifications") : (R ? "لا توجد إشعارات" : "No notifications")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filtered.map(n => (
                  <div key={n.id} className={cn("flex items-start gap-4 px-4 py-4 hover:bg-muted/10 transition-colors", !n.is_read && "bg-violet-500/5")}>
                    <div className="mt-1 shrink-0">
                      {!n.is_read
                        ? <div className="w-2 h-2 rounded-full bg-violet-500" />
                        : <div className="w-2 h-2 rounded-full bg-transparent border border-muted-foreground/30" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm", !n.is_read && "font-semibold")}>{n.title}</p>
                        <Badge variant="outline" className={cn("text-xs shrink-0", TYPE_COLOR[n.type] ?? "")}>
                          {n.type?.replace("_", " ")}
                        </Badge>
                      </div>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{fmt(n.created_at)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!n.is_read && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-violet-400 hover:text-violet-300"
                          onClick={() => markRead(n.id)} title={R ? "تعليم كمقروء" : "Mark as read"}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => remove(n.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
