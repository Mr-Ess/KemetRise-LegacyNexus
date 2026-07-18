import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/context/UserRoleContext";
import ProviderLayout from "@/layouts/ProviderLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCcw, Users, Search, Mail, ShoppingBag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProviderCustomers() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { profile } = useRole();
  const db = supabase as any;

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data: myListings } = await db.from("mp_listings").select("id").eq("publisher_user_id", profile.id);
    const listingIds = (myListings ?? []).map((l: any) => l.id);
    const { data: orderItems } = listingIds.length
      ? await db.from("mp_order_items").select("order_id").in("listing_id", listingIds)
      : { data: [] };
    const orderIds = [...new Set((orderItems ?? []).map((oi: any) => oi.order_id))];
    const { data: orders } = orderIds.length
      ? await db.from("mp_orders").select("buyer_name,buyer_email,total_cents,status,created_at").in("id", orderIds).order("created_at", { ascending: false })
      : { data: [] };
    // Aggregate by buyer_email
    const map = new Map<string, any>();
    for (const o of orders ?? []) {
      const key = o.buyer_email || o.buyer_name || "unknown";
      const prev = map.get(key) || { buyer_name: o.buyer_name, buyer_email: o.buyer_email, totalOrders: 0, totalSpent: 0, lastOrder: o.created_at };
      map.set(key, {
        ...prev,
        totalOrders: prev.totalOrders + 1,
        totalSpent: prev.totalSpent + ((o.status === "completed" || o.status === "paid") ? (o.total_cents || 0) : 0),
        lastOrder: o.created_at > prev.lastOrder ? o.created_at : prev.lastOrder,
      });
    }
    setCustomers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent));
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter(c =>
    search === "" ||
    (c.buyer_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.buyer_email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <ProviderLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              {R ? "العملاء" : "Customers"}
            </h1>
            <p className="text-sm text-muted-foreground">{customers.length} {R ? "عميل فريد" : "unique customers"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: R ? "إجمالي العملاء" : "Total Customers",  value: customers.length,                       icon: Users,      color: "text-blue-400"  },
            { label: R ? "إجمالي الطلبات" : "Total Orders",      value: customers.reduce((s, c) => s + c.totalOrders, 0), icon: ShoppingBag, color: "text-indigo-400" },
            { label: R ? "الإيرادات" : "Revenue",                value: `$${(totalRevenue / 100).toFixed(2)}`,  icon: DollarSign, color: "text-green-400"  },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn("w-8 h-8", s.color)} />
                <div>
                  <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={R ? "بحث عن عميل..." : "Search customers..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا يوجد عملاء" : "No customers yet"}</p>
          </div>
        ) : (
          <Card className="border-border/50">
            <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/10 border-b border-border/50">
              <span>{R ? "العميل" : "Customer"}</span>
              <span>{R ? "البريد" : "Email"}</span>
              <span className="text-center">{R ? "الطلبات" : "Orders"}</span>
              <span className="text-right">{R ? "الإنفاق" : "Total Spent"}</span>
            </div>
            <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
              {filtered.map((c, i) => (
                <div key={i} className="grid grid-cols-4 px-4 py-3 items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                      {c.buyer_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-xs font-semibold truncate">{c.buyer_name || "—"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{c.buyer_email || "—"}</span>
                  <span className="text-center text-xs">{c.totalOrders}</span>
                  <span className="text-right font-semibold text-green-400">${(c.totalSpent / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </ProviderLayout>
  );
}
