import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CartItem {
  id: string;           // mp_cart_items row id
  listing_id: string;
  quantity: number;
  name: string;
  description: string;
  thumbnail_url?: string;
  listing_type: string;
  price_cents: number;
  currency: string;
  pricing_model: string;
  publisher_name: string;
  meta: Record<string, any>;
}

interface CartCtx {
  items: CartItem[];
  loading: boolean;
  addToCart: (listing: any) => Promise<void>;
  removeFromCart: (listingId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
  isInCart: (listingId: string) => boolean;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartCtx | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const db = supabase as any;

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const { data } = await db
        .from("mp_cart_items")
        .select(`
          id, listing_id, quantity,
          listing:listing_id(
            id, name, description, thumbnail_url, listing_type,
            price_cents, currency, pricing_model, publisher_name, meta
          )
        `)
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      setItems(
        (data || []).map((r: any) => ({
          id: r.id,
          listing_id: r.listing_id,
          quantity: r.quantity,
          name: r.listing?.name || "",
          description: r.listing?.description || "",
          thumbnail_url: r.listing?.thumbnail_url,
          listing_type: r.listing?.listing_type || "digital",
          price_cents: r.listing?.price_cents || 0,
          currency: r.listing?.currency || "USD",
          pricing_model: r.listing?.pricing_model || "one_time",
          publisher_name: r.listing?.publisher_name || "",
          meta: r.listing?.meta || {},
        }))
      );
    } catch { /* tables may not exist yet */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, [load]);

  const addToCart = async (listing: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in to add to cart"); return; }
    if (items.some(i => i.listing_id === listing.id)) {
      toast.info(`"${listing.name}" is already in your cart`);
      return;
    }
    try {
      await db.from("mp_cart_items").upsert(
        { user_id: user.id, listing_id: listing.id, quantity: 1 },
        { onConflict: "user_id,listing_id" }
      );
      await load();
      toast.success(`"${listing.name}" added to cart 🛒`);
    } catch { toast.error("Failed to add to cart"); }
  };

  const removeFromCart = async (listingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setItems(prev => prev.filter(i => i.listing_id !== listingId));
    try {
      await db.from("mp_cart_items").delete().eq("user_id", user.id).eq("listing_id", listingId);
    } catch { await load(); }
  };

  const clearCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setItems([]);
    try {
      await db.from("mp_cart_items").delete().eq("user_id", user.id);
    } catch { await load(); }
  };

  const isInCart = (listingId: string) => items.some(i => i.listing_id === listingId);

  return (
    <CartContext.Provider value={{
      items, loading, addToCart, removeFromCart, clearCart,
      cartCount: items.length,
      cartTotal: items.reduce((s, i) => s + i.price_cents * i.quantity, 0),
      isInCart,
      refresh: load,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
