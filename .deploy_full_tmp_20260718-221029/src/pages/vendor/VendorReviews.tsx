import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import VendorLayout from "@/layouts/VendorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, RefreshCcw, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("w-3.5 h-3.5", i <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />
      ))}
    </div>
  );
}

export default function VendorReviews() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const db = supabase as any;

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, avg: 0, positive: 0, negative: 0 });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = db.from("product_reviews").select("*, public_products(name)").eq("vendor_user_id", user.id).order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("rating", Number(filter));
    const { data } = await q;
    const list = data ?? [];
    const avg = list.length > 0 ? list.reduce((s: number, r: any) => s + (r.rating || 0), 0) / list.length : 0;
    const positive = list.filter((r: any) => (r.rating || 0) >= 4).length;
    const negative = list.filter((r: any) => (r.rating || 0) <= 2).length;
    setReviews(list);
    setStats({ total: list.length, avg, positive, negative });
    setLoading(false);
  }, [user, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <VendorLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Star className="w-6 h-6 text-orange-400" />
              {R ? "التقييمات" : "Reviews"}
            </h1>
            <p className="text-sm text-muted-foreground">{stats.total} {R ? "تقييم" : "reviews"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />{R ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: R ? "إجمالي التقييمات" : "Total Reviews", value: stats.total,              icon: Star,       color: "text-orange-400" },
            { label: R ? "المتوسط"           : "Avg. Rating",   value: stats.avg.toFixed(1),     icon: Star,       color: "text-yellow-400" },
            { label: R ? "إيجابية"           : "Positive (4-5)",value: stats.positive,           icon: ThumbsUp,   color: "text-green-400"  },
            { label: R ? "سلبية"             : "Negative (1-2)",value: stats.negative,           icon: ThumbsDown, color: "text-red-400"    },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <s.icon className={cn("w-5 h-5", s.color)} />
                <div className={cn("text-2xl font-bold font-display", s.color)}>{loading ? "—" : s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rating filter */}
        <div className="flex gap-2 flex-wrap">
          {[{ v: "all", l: R ? "الكل" : "All" }, { v: "5", l: "★★★★★" }, { v: "4", l: "★★★★" }, { v: "3", l: "★★★" }, { v: "2", l: "★★" }, { v: "1", l: "★" }].map(opt => (
            <Button key={opt.v} size="sm" variant={filter === opt.v ? "default" : "outline"}
              className={cn(filter === opt.v && "bg-orange-600 hover:bg-orange-700")}
              onClick={() => setFilter(opt.v)}>
              {opt.l}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{R ? "لا توجد تقييمات" : "No reviews yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <Card key={r.id} className="border-border/50 hover:border-orange-500/30 transition-colors">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{r.reviewer_name || R ? "مجهول" : "Anonymous"}</p>
                      {r.public_products?.name && <p className="text-xs text-muted-foreground">{R ? "المنتج:" : "Product:"} {r.public_products.name}</p>}
                    </div>
                    <div className="text-right">
                      <StarRating rating={r.rating || 0} />
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString(R ? "ar-EG" : "en-US")}</p>
                    </div>
                  </div>
                  {r.review_text && <p className="text-sm text-muted-foreground">{r.review_text}</p>}
                  {r.reply && (
                    <div className="mt-2 px-3 py-2 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                      <p className="text-xs font-semibold text-orange-400 mb-1">{R ? "ردك:" : "Your reply:"}</p>
                      <p className="text-xs text-muted-foreground">{r.reply}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
