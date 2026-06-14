import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, ShoppingBag, Star, ArrowRight, Package, Filter, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  category?: string;
  image_url?: string;
  stock_qty?: number;
  vendor_user_id?: string;
};

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Enterprise ERP License", description: "Full ERP access for 1 year", price_cents: 99900, category: "Software", stock_qty: 999 },
  { id: "2", name: "HR Module Add-on", description: "Biometric attendance + payroll", price_cents: 29900, category: "Software", stock_qty: 999 },
  { id: "3", name: "AI Agent Pack (10 agents)", description: "Custom brand AI assistants", price_cents: 49900, category: "AI", stock_qty: 100 },
  { id: "4", name: "Sector Activation Bundle", description: "Activate 5 business sectors", price_cents: 19900, category: "Platform", stock_qty: 500 },
  { id: "5", name: "Marketing Suite 3 months", description: "CRM + campaigns + leads", price_cents: 14900, category: "Marketing", stock_qty: 999 },
  { id: "6", name: "API Access Token", description: "Unlimited REST API calls", price_cents: 9900, category: "Tech", stock_qty: 999 },
];

const CATS = ["All", "Software", "AI", "Platform", "Marketing", "Tech"];

export default function PublicProducts() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const R = i18n.language === "ar";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");

  useEffect(() => {
    (async () => {
      const db = supabase as any;
      const { data } = await db.from("public_products").select("*").eq("is_active", true).order("created_at", { ascending: false });
      setProducts(data?.length ? data : MOCK_PRODUCTS);
      setLoading(false);
    })();
  }, []);

  const filtered = products.filter(p =>
    (cat === "All" || p.category === cat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const price = (cents: number) =>
    new Intl.NumberFormat(R ? "ar-EG" : "en-US", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(cents / 100);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-xs gap-2">
            <ShoppingBag className="w-3.5 h-3.5" />{R ? "متجر المنتجات" : "Product Catalog"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-black mb-4">
            {R ? "تصفح منتجاتنا" : "Browse Our Products"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {R ? "اكتشف حلولنا وحزمنا التجارية. سجّل الدخول للشراء." : "Discover our solutions and commercial packages. Sign in to purchase."}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={R ? "ابحث عن منتج..." : "Search products..."} className="pl-9 text-xs h-9" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATS.map(c => (
                <button key={c} onClick={() => setCat(c)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", cat === c ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground hover:text-foreground border border-border/40")}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-secondary/20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(p => (
                <Card key={p.id} className="border-border/40 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Image placeholder */}
                    <div className="h-36 bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center border-b border-border/30">
                      <Package className="w-12 h-12 text-primary/40" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-sm font-bold leading-tight">{p.name}</h3>
                          {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>}
                        </div>
                        {p.category && (
                          <Badge className="text-[9px] shrink-0">{p.category}</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                        <span className="text-sm font-black text-primary">{price(p.price_cents)}</span>
                        <Button size="sm" variant="outline" onClick={() => navigate("/auth?tab=signin")} className="text-xs h-7 gap-1.5">
                          <LogIn className="w-3 h-3" />{R ? "سجّل للشراء" : "Sign in to buy"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              {R ? "لا توجد منتجات تطابق بحثك" : "No products match your search"}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
