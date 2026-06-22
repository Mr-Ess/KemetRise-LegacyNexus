import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import UserPortalLayout from "@/layouts/UserPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heart, ShoppingCart, Trash2, RefreshCcw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UserWishlist() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const { user } = useAuth();
  const navigate = useNavigate();
  const db = supabase as any;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db
      .from("mp_wishlist")
      .select("*, mp_listings(id, name, price_cents, is_active, listing_type, thumbnail_url, gallery_urls)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    await db.from("mp_wishlist").delete().eq("id", id);
    setItems(p => p.filter(i => i.id !== id));
    toast.success(R ? "تمت الإزالة" : "Removed from wishlist");
  };

  const addToCart = async (item: any) => {
    if (!item.mp_listings?.id) return;
    const { error } = await db.from("mp_cart_items").upsert({ user_id: user!.id, listing_id: item.mp_listings.id, quantity: 1 }, { onConflict: "user_id,listing_id" });
    if (error) return toast.error(error.message);
    toast.success(R ? "تمت الإضافة إلى السلة" : "Added to cart");
  };

  return (
    <UserPortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-400" />
              {R ? "قائمة المفضلة" : "My Wishlist"}
            </h1>
            <p className="text-sm text-muted-foreground">{items.length} {R ? "عنصر" : "items"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-48 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">{R ? "قائمة المفضلة فارغة" : "Your wishlist is empty"}</p>
            <Button variant="outline" onClick={() => navigate("/marketplace")}>{R ? "تصفح السوق" : "Browse Marketplace"}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map(item => {
              const listing = item.mp_listings;
              const price = listing?.price_cents ? `$${(listing.price_cents / 100).toFixed(2)}` : "—";
              const img = listing?.gallery_urls?.[0] || listing?.thumbnail_url || null;
              return (
                <Card key={item.id} className="border-border/50 hover:border-pink-500/30 transition-colors overflow-hidden group">
                  <div className="h-36 bg-muted/30 flex items-center justify-center overflow-hidden">
                    {img ? <img src={img} alt={listing?.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" /> : <Heart className="w-8 h-8 text-muted-foreground/20" />}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <div>
                      <p className="text-sm font-semibold line-clamp-2">{listing?.name || (R ? "منتج محذوف" : "Deleted listing")}</p>
                      <p className="text-sm font-bold text-primary mt-0.5">{price}</p>
                    </div>
                    {listing && (
                      <Badge variant="outline" className={cn("text-[10px]", listing.is_active ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-muted-foreground")}>
                        {listing.is_active ? "active" : "inactive"}
                      </Badge>
                    )}
                    <div className="flex gap-2">
                      {listing?.is_active && (
                        <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => addToCart(item)}>
                          <ShoppingCart className="w-3 h-3" />{R ? "أضف للسلة" : "Add to Cart"}
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={() => remove(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </UserPortalLayout>
  );
}
