import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Search, ShoppingBag, Star, ArrowRight, Package, ShoppingCart, Zap, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  price_cents: number;
  compare_price_cents?: number;
  category?: string;
  icon?: string;
  color?: string;
  image_url?: string;
  stock_qty?: number;
  sub_category?: string;
  rating?: number;
  reviews_count?: number;
  is_featured?: boolean;
  is_new?: boolean;
  pricing_model?: string;
  vendor_user_id?: string;
};

const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1", icon: "⚡", color: "amber",
    name: "Enterprise ERP License", name_ar: "رخصة ERP المؤسسي",
    description: "Full ERP — finance, HR, inventory, CRM & analytics for 1 year.", description_ar: "ERP كامل: مالية، موارد بشرية، مخزون، CRM وتحليلات لمدة سنة.",
    price_cents: 99900, compare_price_cents: 149900, category: "Software",
    rating: 4.9, reviews_count: 128, is_featured: true, pricing_model: "annual",
  },
  {
    id: "p2", icon: "🤖", color: "cyan",
    name: "AI Agent Pack — 10 Agents", name_ar: "حزمة وكلاء AI — 10 وكلاء",
    description: "Deploy 10 custom brand AI agents (ANUBIS, ISIS, HORUS…) powered by GPT-4.", description_ar: "نشر 10 وكلاء AI مخصصين بالعلامة التجارية مدعومين بـ GPT-4.",
    price_cents: 49900, category: "AI",
    rating: 4.8, reviews_count: 89, is_new: true, pricing_model: "annual",
  },
  {
    id: "p3", icon: "👥", color: "violet",
    name: "HR & Attendance Module", name_ar: "وحدة الموارد البشرية والحضور",
    description: "QR biometric attendance, payroll processing, leave & shift management.", description_ar: "حضور QR البيومتري، معالجة الرواتب، إدارة الإجازات والورديات.",
    price_cents: 29900, compare_price_cents: 39900, category: "Software",
    rating: 4.7, reviews_count: 74, pricing_model: "annual",
  },
  {
    id: "p4", icon: "📣", color: "pink",
    name: "Marketing Suite", name_ar: "حزمة التسويق",
    description: "CRM + campaign manager + lead pipeline + ROI analytics — 3 months.", description_ar: "CRM + مدير حملات + خط عملاء + تحليلات ROI — 3 أشهر.",
    price_cents: 14900, category: "Marketing",
    rating: 4.6, reviews_count: 52, is_featured: true, pricing_model: "monthly",
  },
  {
    id: "p5", icon: "🏗️", color: "orange",
    name: "Sector Activation Bundle", name_ar: "حزمة تفعيل القطاعات",
    description: "Unlock any 5 business sectors: Hospitality, Healthcare, Retail, Education…", description_ar: "افتح 5 قطاعات أعمال: ضيافة، رعاية صحية، تجزئة، تعليم…",
    price_cents: 19900, category: "Platform",
    rating: 4.5, reviews_count: 210, is_featured: true, pricing_model: "one_time",
  },
  {
    id: "p6", icon: "🔑", color: "blue",
    name: "API Access Token — Unlimited", name_ar: "رمز وصول API — غير محدود",
    description: "Unlimited REST API calls, webhooks, sandbox & developer portal.", description_ar: "طلبات API غير محدودة، Webhooks، Sandbox ومنصة المطورين.",
    price_cents: 9900, category: "Tech",
    rating: 4.4, reviews_count: 38, is_new: true, pricing_model: "annual",
  },
  {
    id: "p7", icon: "🛡️", color: "red",
    name: "Security & Compliance Pack", name_ar: "حزمة الأمان والامتثال",
    description: "Row Level Security, audit logs, IP whitelist, SSO + 2FA activation.", description_ar: "أمان RLS، سجلات تدقيق، قائمة IP البيضاء، SSO + تفعيل 2FA.",
    price_cents: 24900, category: "Tech",
    rating: 4.8, reviews_count: 41, pricing_model: "annual",
  },
  {
    id: "p8", icon: "🤝", color: "emerald",
    name: "Partner Workspace Licence", name_ar: "رخصة بيئة عمل الشريك",
    description: "Isolated multi-tenant workspace with team management & revenue sharing.", description_ar: "بيئة عمل معزولة متعددة المستأجرين مع إدارة فريق وتشارك إيرادات.",
    price_cents: 59900, compare_price_cents: 79900, category: "Platform",
    rating: 4.7, reviews_count: 33, is_featured: true, pricing_model: "annual",
  },
  {
    id: "p9", icon: "📦", color: "indigo",
    name: "Inventory & Warehouse Module", name_ar: "وحدة المخزون والمستودع",
    description: "SKU management, barcode scanning, low-stock alerts & multi-location tracking.", description_ar: "إدارة SKU، مسح باركود، تنبيهات المخزون المنخفض وتتبع متعدد المواقع.",
    price_cents: 34900, category: "Software",
    rating: 4.5, reviews_count: 57, pricing_model: "annual",
  },
  {
    id: "p10", icon: "💬", color: "teal",
    name: "Live Chat & Support Hub", name_ar: "حزمة الدعم والمحادثة المباشرة",
    description: "Multi-channel chat, ticket system, SLA tracking & customer satisfaction reports.", description_ar: "دردشة متعددة القنوات، نظام تذاكر، تتبع SLA وتقارير رضا العملاء.",
    price_cents: 12900, category: "Marketing",
    rating: 4.6, reviews_count: 65, is_new: true, pricing_model: "monthly",
  },
];

type CategoryDef = { id: string; label: string; labelAr: string; icon: string; sub: { id: string; label: string; labelAr: string }[] };

const CATEGORY_TREE: CategoryDef[] = [
  { id: "All", label: "All Products", labelAr: "كل المنتجات", icon: "🏛️", sub: [] },
  { id: "Software", label: "Software", labelAr: "برمجيات", icon: "💻", sub: [
    { id: "ERP", label: "ERP & Finance", labelAr: "ERP والمالية" },
    { id: "HR", label: "HR & Payroll", labelAr: "موارد بشرية ورواتب" },
    { id: "Inventory", label: "Inventory & Warehouse", labelAr: "مخزون ومستودعات" },
  ]},
  { id: "AI", label: "AI & Automation", labelAr: "ذكاء اصطناعي", icon: "🤖", sub: [
    { id: "Agents", label: "AI Agents", labelAr: "وكلاء AI" },
    { id: "Analytics", label: "Analytics & BI", labelAr: "تحليلات وذكاء الأعمال" },
  ]},
  { id: "Platform", label: "Platform", labelAr: "المنصة", icon: "🏗️", sub: [
    { id: "Sectors", label: "Sector Bundles", labelAr: "حزم القطاعات" },
    { id: "Partner", label: "Partner & Workspace", labelAr: "شريك وبيئة عمل" },
  ]},
  { id: "Marketing", label: "Marketing", labelAr: "تسويق", icon: "📣", sub: [
    { id: "CRM", label: "CRM & Leads", labelAr: "CRM وعملاء" },
    { id: "Campaigns", label: "Campaigns", labelAr: "حملات" },
    { id: "Chat", label: "Live Chat & Support", labelAr: "دردشة ودعم" },
  ]},
  { id: "Tech", label: "Tech & Security", labelAr: "تقنية وأمان", icon: "🔐", sub: [
    { id: "API", label: "API & Developer", labelAr: "API ومطورين" },
    { id: "Security", label: "Security & Compliance", labelAr: "أمان وامتثال" },
  ]},
];

// Map sub-category id → parent category
const SUB_TO_PARENT: Record<string, string> = {};
CATEGORY_TREE.forEach(c => c.sub.forEach(s => { SUB_TO_PARENT[s.id] = c.id; }));


const COLOR_MAP: Record<string, { bg: string; border: string; badge: string; bar: string }> = {
  amber:   { bg: "from-amber-500/20 to-amber-500/5",   border: "border-amber-500/30",   badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",   bar: "bg-amber-500"   },
  cyan:    { bg: "from-cyan-500/20 to-cyan-500/5",     border: "border-cyan-500/30",     badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",       bar: "bg-cyan-500"    },
  violet:  { bg: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/30",   badge: "bg-violet-500/15 text-violet-400 border-violet-500/30", bar: "bg-violet-500"  },
  pink:    { bg: "from-pink-500/20 to-pink-500/5",     border: "border-pink-500/30",     badge: "bg-pink-500/15 text-pink-400 border-pink-500/30",       bar: "bg-pink-500"    },
  orange:  { bg: "from-orange-500/20 to-orange-500/5", border: "border-orange-500/30",   badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", bar: "bg-orange-500"  },
  blue:    { bg: "from-blue-500/20 to-blue-500/5",     border: "border-blue-500/30",     badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",       bar: "bg-blue-500"    },
  red:     { bg: "from-red-500/20 to-red-500/5",       border: "border-red-500/30",      badge: "bg-red-500/15 text-red-400 border-red-500/30",          bar: "bg-red-500"     },
  emerald: { bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", bar: "bg-emerald-500" },
  indigo:  { bg: "from-indigo-500/20 to-indigo-500/5", border: "border-indigo-500/30",   badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", bar: "bg-indigo-500"  },
  teal:    { bg: "from-teal-500/20 to-teal-500/5",     border: "border-teal-500/30",     badge: "bg-teal-500/15 text-teal-400 border-teal-500/30",       bar: "bg-teal-500"    },
};
const fallbackColor = COLOR_MAP.amber;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-2.5 h-2.5 ${n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="ml-1 text-[10px] text-muted-foreground">{rating.toFixed(1)}</span>
    </span>
  );
}

function priceStr(cents: number, model?: string) {
  const amt = `$${(cents / 100).toFixed(0)}`;
  if (model === "monthly") return `${amt}/mo`;
  if (model === "annual") return `${amt}/yr`;
  return amt;
}

export default function PublicProducts() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const R = i18n.language === "ar";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [subCat, setSubCat] = useState("All");

  const handleCatChange = (id: string) => { setCat(id); setSubCat("All"); };

  const activeCatDef = CATEGORY_TREE.find(c => c.id === cat) || CATEGORY_TREE[0];

  useEffect(() => {
    (async () => {
      try {
        const db = supabase as any;
        const { data, error } = await db.from("public_products").select("*").eq("is_active", true).order("created_at", { ascending: false });
        setProducts((!error && data?.length) ? data : MOCK_PRODUCTS);
      } catch {
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = products.filter(p => {
    const parentMatch = cat === "All" || p.category === cat || SUB_TO_PARENT[p.category || ""] === cat;
    const subMatch = subCat === "All" || p.category === subCat || p.sub_category === subCat;
    const textMatch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    return parentMatch && subMatch && textMatch;
  });

  return (
    <PublicLayout>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-xs gap-2 px-4 py-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            {R ? "كتالوج المنتجات" : "Product Catalog"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-black mb-4">
            {R ? "تصفح منتجاتنا" : "Browse Our Products"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm mb-8">
            {R
              ? "اكتشف حلولنا وحزمنا التجارية. كل ما تحتاجه لتشغيل مؤسستك."
              : "Discover our software solutions and commercial packages. Everything you need to run your business."}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
            {[
              { icon: "⚡", text: R ? "تفعيل فوري" : "Instant activation" },
              { icon: "🛡️", text: R ? "دفع آمن" : "Secure payment" },
              { icon: "🔄", text: R ? "ترقية مجانية" : "Free upgrades" },
              { icon: "💬", text: R ? "دعم 24/7" : "24/7 support" },
            ].map(f => (
              <span key={f.text} className="flex items-center gap-1.5 bg-secondary/30 px-3 py-1 rounded-full border border-border/40">
                {f.icon} {f.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters & Grid ─────────────────────────────────────────────── */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={R ? "ابحث عن منتج..." : "Search products..."}
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* Main categories */}
          <div className="flex gap-2 flex-wrap mb-3">
            {CATEGORY_TREE.map(c => (
              <button key={c.id} onClick={() => handleCatChange(c.id)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  cat === c.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/30 text-muted-foreground hover:text-foreground border border-border/40 hover:border-border/80")}>
                <span>{c.icon}</span> {R ? c.labelAr : c.label}
              </button>
            ))}
          </div>

          {/* Sub-categories */}
          {activeCatDef.sub.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-6 pl-2 border-l-2 border-primary/20 ml-1">
              <button onClick={() => setSubCat("All")}
                className={cn("px-2.5 py-1 rounded-md text-[11px] transition-all",
                  subCat === "All" ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground")}>
                {R ? "الكل" : "All"}
              </button>
              {activeCatDef.sub.map(s => (
                <button key={s.id} onClick={() => setSubCat(s.id)}
                  className={cn("px-2.5 py-1 rounded-md text-[11px] transition-all",
                    subCat === s.id
                      ? "bg-primary/10 text-primary font-semibold border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40")}>
                  {R ? s.labelAr : s.label}
                </button>
              ))}
            </div>
          )}

          {/* Count */}
          <p className="text-xs text-muted-foreground mb-5">
            {R ? `عرض ${filtered.length} منتج` : `Showing ${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
            {cat !== "All" && <span className="ml-1 text-foreground font-medium">{R ? `في ${activeCatDef.labelAr}` : `in ${activeCatDef.label}`}</span>}
            {subCat !== "All" && <span className="ml-1 text-muted-foreground">› {subCat}</span>}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-secondary/20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(p => {
                const pal = COLOR_MAP[p.color || "amber"] || fallbackColor;
                const discount = p.compare_price_cents && p.compare_price_cents > p.price_cents
                  ? Math.round(((p.compare_price_cents - p.price_cents) / p.compare_price_cents) * 100) : null;
                return (
                  <Card key={p.id}
                    className={`group flex flex-col overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${pal.border} bg-background/60 backdrop-blur-sm`}>
                    {/* Top banner */}
                    <div className={`h-28 bg-gradient-to-br ${pal.bg} border-b ${pal.border} flex items-center justify-center relative`}>
                      <span className="text-5xl">{p.icon || "📦"}</span>
                      {p.is_featured && (
                        <Badge className="absolute top-2 left-2 text-[9px] px-1.5 py-0 bg-amber-500/80 text-amber-950 border-amber-400">⭐ Featured</Badge>
                      )}
                      {p.is_new && (
                        <Badge className="absolute top-2 right-2 text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/40">New</Badge>
                      )}
                      {discount && (
                        <Badge className="absolute bottom-2 right-2 text-[9px] px-1.5 py-0 bg-red-500/80 text-white border-red-400">-{discount}%</Badge>
                      )}
                    </div>

                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="mb-1 flex items-start justify-between gap-1">
                        <h3 className="text-sm font-bold leading-tight flex-1">{R && p.name_ar ? p.name_ar : p.name}</h3>
                        {p.category && (
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${pal.badge}`}>{p.category}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                        {R && p.description_ar ? p.description_ar : p.description}
                      </p>

                      {p.rating && (
                        <div className="flex items-center gap-2 mb-3">
                          <Stars rating={p.rating} />
                          {p.reviews_count && <span className="text-[10px] text-muted-foreground">({p.reviews_count})</span>}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto gap-2">
                        <div>
                          <span className="text-base font-black text-primary">{priceStr(p.price_cents, p.pricing_model)}</span>
                          {p.compare_price_cents && (
                            <span className="text-xs text-muted-foreground line-through ml-1">${(p.compare_price_cents / 100).toFixed(0)}</span>
                          )}
                        </div>
                        {user ? (
                          <Button size="sm" className={`text-xs h-7 gap-1 px-2 ${pal.bar} text-white border-0`}
                            onClick={() => navigate("/marketplace")}>
                            <ShoppingCart className="w-3 h-3" />{R ? "اشترِ" : "Buy"}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="text-xs h-7 gap-1 px-2"
                            onClick={() => navigate("/auth?tab=signin&redirect=/marketplace")}>
                            <Zap className="w-3 h-3" />{R ? "سجّل للشراء" : "Get it"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">{R ? "لا توجد منتجات تطابق بحثك" : "No products match your search"}</p>
              <button onClick={() => { setSearch(""); setCat("All"); }} className="text-xs text-primary hover:underline mt-2">
                {R ? "إظهار الكل" : "Clear filters"}
              </button>
            </div>
          )}

          {/* CTA banner */}
          {!loading && (
            <div className="mt-16 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-amber-500/5 p-8 text-center">
              <h2 className="text-2xl font-display font-bold mb-2">
                {R ? "هل أنت مستعد لبدء رحلتك؟" : "Ready to get started?"}
              </h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                {R ? "سجّل الدخول للشراء وتفعيل منتجاتك فورياً." : "Sign in to purchase and instantly activate your products."}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button onClick={() => navigate("/auth?tab=signin")} className="gap-2">
                  <CheckCircle className="w-4 h-4" />{R ? "ابدأ مجاناً" : "Get Started Free"}
                </Button>
                <Button variant="outline" onClick={() => navigate("/marketplace")} className="gap-2">
                  {R ? "تصفح المتجر الكامل" : "Browse Full Marketplace"} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

