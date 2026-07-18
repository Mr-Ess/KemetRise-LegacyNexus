import { X, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  typeConfigMap: Record<string, any>;
}

export default function CartDrawer({ open, onClose, onCheckout, typeConfigMap }: Props) {
  const { items, removeFromCart, cartTotal, loading } = useCart();

  const formatPrice = (cents: number, currency: string) =>
    cents === 0 ? "Free" : `${(cents / 100).toFixed(2)} ${currency}`;

  const currency = items[0]?.currency || "USD";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Shopping Cart</span>
            {items.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/40">
                {items.length}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 animate-pulse bg-secondary/20 rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <ShoppingCart className="w-14 h-14 text-muted-foreground/15 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">Your cart is empty</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-70">
                Browse the marketplace to add items
              </p>
            </div>
          ) : (
            items.map(item => {
              const cfg = typeConfigMap[item.listing_type];
              return (
                <div
                  key={item.listing_id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-colors"
                >
                  <div
                    className={`text-xl w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${
                      cfg?.gradient || "from-violet-600/20"
                    } border ${cfg?.border || "border-violet-500/40"} shrink-0 overflow-hidden`}
                  >
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} className="w-8 h-8 object-contain" alt="" />
                    ) : (
                      cfg?.icon || "📦"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.publisher_name}</p>
                    <p className="text-xs font-bold text-primary mt-0.5">
                      {formatPrice(item.price_cents, item.currency)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.listing_id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors shrink-0 mt-0.5"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-border shrink-0 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
              <span className="font-bold text-base text-foreground">
                {cartTotal === 0 ? "Free" : `${(cartTotal / 100).toFixed(2)} ${currency}`}
              </span>
            </div>
            <Button className="w-full gap-2 text-sm" onClick={() => { onClose(); onCheckout(); }}>
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
