import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/context/UserRoleContext";
import { ROLE_META } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, UserPlus, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PermissionsCard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin, role } = useUserRole();
  const db = supabase as any;
  const R = i18n.language === "ar";

  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    (async () => {
      const { data } = await db.from("user_profiles").select("role");
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((u: any) => { counts[u.role] = (counts[u.role] || 0) + 1; });
        setRoleCounts(counts);
        setTotal(data.length);
      }
      setLoading(false);
    })();
  }, [isAdmin]);

  if (!isAdmin) return null;

  // Top roles to display (exclude plain "user" to focus on privileged roles)
  const shownRoles = ROLE_META.filter(r => r.value !== "user").slice(0, 6);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 shrink-0">
            <Shield className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <CardTitle className="text-sm">
              {R ? "الصلاحيات وإدارة المستخدمين" : "Permissions & User Management"}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {R ? "توزيع الأدوار على المنصة" : "Platform role distribution"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              size="sm" variant="outline"
              className="gap-1.5 h-7 text-xs hidden sm:flex"
              onClick={() => navigate("/permissions")}
            >
              <UserPlus className="w-3 h-3" />
              {R ? "إضافة مستخدم" : "Add User"}
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => navigate("/permissions")}
          >
            {R ? "إدارة الصلاحيات" : "Manage"}
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {shownRoles.map(rm => {
              const count = roleCounts[rm.value] || 0;
              return (
                <button
                  key={rm.value}
                  onClick={() => navigate("/permissions")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105",
                    rm.color
                  )}
                >
                  <span className="text-2xl font-bold font-display leading-none">{count}</span>
                  <span className="text-[10px] text-center leading-tight opacity-80">
                    {R ? rm.labelAr : rm.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/30 pt-3">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {R ? `الإجمالي: ${total} مستخدم` : `Total: ${total} users`}
          </span>
          <button
            onClick={() => navigate("/permissions")}
            className="text-primary hover:underline flex items-center gap-0.5"
          >
            {R ? "صلاحيات الصفحات" : "Page Permissions"}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
