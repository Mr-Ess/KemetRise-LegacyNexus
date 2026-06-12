/**
 * Digital Mall — seed data + seed function.
 * Safe to call on every load (no-ops if already seeded).
 */

export interface MallFloor {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface MallStore {
  id: string;
  floor_id: string | null;
  owner_user_id: string | null;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  cover_color: string;
  owner_name: string;
  contact_email: string | null;
  tags: string[];
  rating: number;
  reviews_count: number;
  products_count: number;
  sales_count: number;
  followers_count: number;
  is_featured: boolean;
  is_verified: boolean;
  is_new: boolean;
  is_active: boolean;
  status: "pending" | "active" | "suspended" | "rejected";
  meta: Record<string, any>;
  created_at: string;
}

export interface MallProduct {
  id: string;
  store_id: string;
  name: string;
  name_ar: string;
  description: string;
  thumbnail_url: string | null;
  category: string;
  tags: string[];
  price_cents: number;
  compare_price_cents: number | null;
  currency: string;
  pricing_model: string;
  stock_qty: number | null;
  is_digital: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  sales_count: number;
  meta: Record<string, any>;
  created_at: string;
}

export const MALL_FLOOR_COLORS: Record<string, {
  gradient: string; border: string; badgeClass: string; hoverBorder: string; shadow: string; barColor: string;
}> = {
  violet:  { gradient:"from-violet-600/20 via-blue-600/10 to-transparent",  border:"border-violet-500/40",  badgeClass:"bg-violet-500/20 text-violet-300 border-violet-500/40",   hoverBorder:"hover:border-violet-500/60",  shadow:"hover:shadow-violet-500/10",  barColor:"bg-violet-500"  },
  emerald: { gradient:"from-emerald-600/20 via-teal-600/10 to-transparent",  border:"border-emerald-500/40", badgeClass:"bg-emerald-500/20 text-emerald-300 border-emerald-500/40",  hoverBorder:"hover:border-emerald-500/60", shadow:"hover:shadow-emerald-500/10", barColor:"bg-emerald-500" },
  amber:   { gradient:"from-amber-600/20 via-orange-600/10 to-transparent",  border:"border-amber-500/40",   badgeClass:"bg-amber-500/20 text-amber-300 border-amber-500/40",     hoverBorder:"hover:border-amber-500/60",   shadow:"hover:shadow-amber-500/10",   barColor:"bg-amber-500"   },
  pink:    { gradient:"from-pink-600/20 via-rose-600/10 to-transparent",     border:"border-pink-500/40",    badgeClass:"bg-pink-500/20 text-pink-300 border-pink-500/40",        hoverBorder:"hover:border-pink-500/60",    shadow:"hover:shadow-pink-500/10",    barColor:"bg-pink-500"    },
  blue:    { gradient:"from-blue-600/20 via-cyan-600/10 to-transparent",     border:"border-blue-500/40",    badgeClass:"bg-blue-500/20 text-blue-300 border-blue-500/40",        hoverBorder:"hover:border-blue-500/60",    shadow:"hover:shadow-blue-500/10",    barColor:"bg-blue-500"    },
  rose:    { gradient:"from-rose-600/20 via-pink-600/10 to-transparent",     border:"border-rose-500/40",    badgeClass:"bg-rose-500/20 text-rose-300 border-rose-500/40",        hoverBorder:"hover:border-rose-500/60",    shadow:"hover:shadow-rose-500/10",    barColor:"bg-rose-500"    },
  orange:  { gradient:"from-orange-600/20 via-amber-600/10 to-transparent",  border:"border-orange-500/40",  badgeClass:"bg-orange-500/20 text-orange-300 border-orange-500/40",  hoverBorder:"hover:border-orange-500/60",  shadow:"hover:shadow-orange-500/10",  barColor:"bg-orange-500"  },
  purple:  { gradient:"from-purple-600/20 via-violet-600/10 to-transparent", border:"border-purple-500/40",  badgeClass:"bg-purple-500/20 text-purple-300 border-purple-500/40",  hoverBorder:"hover:border-purple-500/60",  shadow:"hover:shadow-purple-500/10",  barColor:"bg-purple-500"  },
  teal:    { gradient:"from-teal-600/20 via-emerald-600/10 to-transparent",  border:"border-teal-500/40",    badgeClass:"bg-teal-500/20 text-teal-300 border-teal-500/40",        hoverBorder:"hover:border-teal-500/60",    shadow:"hover:shadow-teal-500/10",    barColor:"bg-teal-500"    },
  yellow:  { gradient:"from-yellow-600/20 via-amber-600/10 to-transparent",  border:"border-yellow-500/40",  badgeClass:"bg-yellow-500/20 text-yellow-300 border-yellow-500/40",  hoverBorder:"hover:border-yellow-500/60",  shadow:"hover:shadow-yellow-500/10",  barColor:"bg-yellow-500"  },
  cyan:    { gradient:"from-cyan-600/20 via-teal-600/10 to-transparent",     border:"border-cyan-500/40",    badgeClass:"bg-cyan-500/20 text-cyan-300 border-cyan-500/40",        hoverBorder:"hover:border-cyan-500/60",    shadow:"hover:shadow-cyan-500/10",    barColor:"bg-cyan-500"    },
  red:     { gradient:"from-red-600/20 via-rose-600/10 to-transparent",      border:"border-red-500/40",     badgeClass:"bg-red-500/20 text-red-300 border-red-500/40",           hoverBorder:"hover:border-red-500/60",     shadow:"hover:shadow-red-500/10",     barColor:"bg-red-500"     },
};

export const FALLBACK_FLOOR_CFG = MALL_FLOOR_COLORS.violet;

export const SEED_FLOORS = [
  { name: "Electronics & Tech",  name_ar: "إلكترونيات وتقنية", icon: "💻", color: "blue",    sort_order: 1, is_active: true },
  { name: "Fashion & Apparel",   name_ar: "أزياء وملابس",       icon: "👗", color: "pink",    sort_order: 2, is_active: true },
  { name: "Food & Beverages",    name_ar: "أغذية ومشروبات",     icon: "🍔", color: "orange",  sort_order: 3, is_active: true },
  { name: "Home & Furniture",    name_ar: "منزل وأثاث",          icon: "🛋️",color: "emerald", sort_order: 4, is_active: true },
  { name: "Beauty & Health",     name_ar: "جمال وصحة",           icon: "💄", color: "rose",    sort_order: 5, is_active: true },
  { name: "Books & Education",   name_ar: "كتب وتعليم",          icon: "📚", color: "violet",  sort_order: 6, is_active: true },
  { name: "Sports & Fitness",    name_ar: "رياضة ولياقة",        icon: "⚽", color: "amber",   sort_order: 7, is_active: true },
  { name: "Digital & Services",  name_ar: "رقمي وخدمات",        icon: "💾", color: "purple",  sort_order: 8, is_active: true },
  { name: "Art & Handcraft",     name_ar: "فن وحرف يدوية",       icon: "🎨", color: "teal",    sort_order: 9, is_active: true },
  { name: "Toys & Kids",         name_ar: "ألعاب وأطفال",        icon: "🧸", color: "yellow", sort_order: 10, is_active: true },
];

export async function seedMallDefaults(db: any): Promise<void> {
  try {
    const { count } = await db.from("mall_floors").select("*", { count: "exact", head: true });
    if ((count ?? 0) === 0) {
      await db.from("mall_floors").insert(SEED_FLOORS);
    }
  } catch (e) {
    console.warn("Mall seed failed:", e);
  }
}
