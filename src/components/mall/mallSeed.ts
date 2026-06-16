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
    // ── Seed floors ───────────────────────────────────────────────────────
    const { count } = await db.from("mall_floors").select("*", { count: "exact", head: true });
    if ((count ?? 0) === 0) {
      const { data: floorRows } = await db.from("mall_floors").insert(SEED_FLOORS).select();

      // ── Seed demo stores ────────────────────────────────────────────────
      if (floorRows?.length) {
        const floorByOrder: Record<number, string> = Object.fromEntries(
          floorRows.map((f: any) => [f.sort_order, f.id])
        );
        const DEMO_STORES = [
          { floor_id: floorByOrder[1], name: "TechZone Egypt",    slug: "techzone-egypt",   description: "Latest electronics, phones, laptops & accessories.", owner_name: "Ahmed Khalil",  contact_email: "info@techzone.eg",       cover_color: "blue",    tags: ["electronics","tech"],       rating: 4.8, reviews_count: 234, sales_count: 1870, products_count: 45, followers_count: 892,  is_active: true, is_featured: true,  is_verified: true,  is_new: false, status: "active", meta: {} },
          { floor_id: floorByOrder[2], name: "FashionHub",         slug: "fashionhub",       description: "Trendy clothing, shoes & accessories for all occasions.", owner_name: "Sara Mohamed",  contact_email: "hello@fashionhub.co",   cover_color: "pink",    tags: ["fashion","clothes"],        rating: 4.6, reviews_count: 189, sales_count: 2340, products_count: 120, followers_count: 1204, is_active: true, is_featured: true,  is_verified: true,  is_new: false, status: "active", meta: {} },
          { floor_id: floorByOrder[3], name: "FoodCorner",         slug: "foodcorner",       description: "Fresh groceries, snacks, beverages & organic products.", owner_name: "Omar Hassan",   contact_email: "orders@foodcorner.eg",  cover_color: "emerald", tags: ["food","organic"],           rating: 4.5, reviews_count: 98,  sales_count: 760,  products_count: 82,  followers_count: 430,  is_active: true, is_featured: false, is_verified: true,  is_new: true,  status: "active", meta: {} },
          { floor_id: floorByOrder[1], name: "GadgetWorld",        slug: "gadgetworld",      description: "Smart gadgets, wearables, gaming & PC peripherals.", owner_name: "Karim Nasser",  contact_email: null,                    cover_color: "violet",  tags: ["gadgets","gaming"],         rating: 4.7, reviews_count: 156, sales_count: 1120, products_count: 63,  followers_count: 671,  is_active: true, is_featured: false, is_verified: true,  is_new: false, status: "active", meta: {} },
          { floor_id: floorByOrder[4], name: "HomeStyle",          slug: "homestyle",        description: "Furniture, décor, kitchen essentials & home improvement.", owner_name: "Nour Ibrahim", contact_email: "support@homestyle.eg",  cover_color: "amber",   tags: ["furniture","home"],         rating: 4.4, reviews_count: 72,  sales_count: 480,  products_count: 97,  followers_count: 320,  is_active: true, is_featured: false, is_verified: false, is_new: true,  status: "active", meta: {} },
          { floor_id: floorByOrder[5], name: "BeautyBox",          slug: "beautybox",        description: "Skincare, cosmetics, perfumes & wellness products.", owner_name: "Aya Sayed",     contact_email: "hello@beautybox.eg",    cover_color: "rose",    tags: ["beauty","skincare"],        rating: 4.9, reviews_count: 301, sales_count: 2890, products_count: 144, followers_count: 1560, is_active: true, is_featured: true,  is_verified: true,  is_new: false, status: "active", meta: {} },
          { floor_id: floorByOrder[6], name: "BookNest",           slug: "booknest",         description: "Arabic & English books, e-books, courses & stationery.", owner_name: "Hassan Ali",   contact_email: null,                    cover_color: "blue",    tags: ["books","education"],        rating: 4.6, reviews_count: 88,  sales_count: 640,  products_count: 280, followers_count: 390,  is_active: true, is_featured: false, is_verified: true,  is_new: false, status: "active", meta: {} },
          { floor_id: floorByOrder[8], name: "KemetRise Store",    slug: "kemetrise-store",  description: "Official KemetRise software, licences & digital products.", owner_name: "KemetRise Team", contact_email: "store@kemetrise.com", cover_color: "amber",   tags: ["software","erp"],           rating: 5.0, reviews_count: 47,  sales_count: 320,  products_count: 18,  followers_count: 890,  is_active: true, is_featured: true,  is_verified: true,  is_new: false, status: "active", meta: {} },
          { floor_id: floorByOrder[7], name: "SportsPro",          slug: "sportspro",        description: "Premium sports equipment, gym gear & outdoor adventure.", owner_name: "Mostafa Fathi", contact_email: "info@sportspro.eg",   cover_color: "amber",   tags: ["sports","gym","fitness"],   rating: 4.5, reviews_count: 63,  sales_count: 410,  products_count: 55,  followers_count: 280,  is_active: true, is_featured: false, is_verified: true,  is_new: false, status: "active", meta: {} },
          { floor_id: floorByOrder[9], name: "ArtisanCraft",       slug: "artisancraft",     description: "Handmade Egyptian art, pottery, textiles & collectibles.", owner_name: "Mariam Adel",  contact_email: "hello@artisancraft.eg", cover_color: "teal",   tags: ["art","handcraft","egypt"],  rating: 4.8, reviews_count: 44,  sales_count: 190,  products_count: 38,  followers_count: 210,  is_active: true, is_featured: false, is_verified: true,  is_new: true,  status: "active", meta: {} },
        ];
        const { data: storeRows } = await db.from("mall_stores").insert(DEMO_STORES).select();

        // ── Seed demo products ────────────────────────────────────────────
        if (storeRows?.length) {
          const storeBySlug: Record<string, string> = Object.fromEntries(
            storeRows.map((s: any) => [s.slug, s.id])
          );
          const DEMO_PRODUCTS = [
            { store_id: storeBySlug["techzone-egypt"],  name: "iPhone 16 Pro",            category: "Phones & Tablets",    price_cents: 129900, currency: "USD", pricing_model: "one_time", is_digital: false, is_featured: true,  is_new: true,  is_active: true, rating: 4.9, reviews_count: 87, sales_count: 230, tags: ["apple","iphone","smartphone"], meta: {} },
            { store_id: storeBySlug["techzone-egypt"],  name: "MacBook Pro M4",           category: "Laptops & PCs",       price_cents: 249900, currency: "USD", pricing_model: "one_time", is_digital: false, is_featured: true,  is_new: true,  is_active: true, rating: 4.8, reviews_count: 42, sales_count: 95,  tags: ["apple","laptop","macbook"],   meta: {} },
            { store_id: storeBySlug["fashionhub"],      name: "Egyptian Cotton Thobe",    category: "Men's Clothing",      price_cents: 4900,  currency: "USD", pricing_model: "one_time", is_digital: false, is_featured: false, is_new: false, is_active: true, rating: 4.7, reviews_count: 56, sales_count: 340, tags: ["cotton","traditional"],       meta: {} },
            { store_id: storeBySlug["fashionhub"],      name: "Silk Evening Dress",       category: "Women's Clothing",    price_cents: 8900,  currency: "USD", pricing_model: "one_time", is_digital: false, is_featured: true,  is_new: false, is_active: true, rating: 4.6, reviews_count: 91, sales_count: 180, tags: ["silk","dress","women"],       meta: {} },
            { store_id: storeBySlug["foodcorner"],      name: "Organic Honey 1kg",        category: "Organic Products",    price_cents: 2500,  currency: "USD", pricing_model: "one_time", is_digital: false, is_featured: false, is_new: false, is_active: true, rating: 4.9, reviews_count: 34, sales_count: 520, tags: ["honey","organic","natural"],  meta: {} },
            { store_id: storeBySlug["beautybox"],       name: "Argan Oil Serum",          category: "Skincare",            price_cents: 3500,  currency: "USD", pricing_model: "one_time", is_digital: false, is_featured: true,  is_new: false, is_active: true, rating: 4.8, reviews_count: 128, sales_count: 890, tags: ["argan","serum","skincare"],  meta: {} },
            { store_id: storeBySlug["booknest"],        name: "أسرار العقل المفكر",       category: "Non-fiction",         price_cents: 1500,  currency: "USD", pricing_model: "one_time", is_digital: false, is_featured: false, is_new: false, is_active: true, rating: 4.5, reviews_count: 67, sales_count: 430, tags: ["arabic","book","mindset"],   meta: {} },
            { store_id: storeBySlug["kemetrise-store"], name: "ERP Enterprise License",   category: "Software",            price_cents: 99900, currency: "USD", pricing_model: "annual",   is_digital: true,  is_featured: true,  is_new: false, is_active: true, rating: 5.0, reviews_count: 23, sales_count: 78,  tags: ["erp","license","enterprise"], meta: {} },
            { store_id: storeBySlug["gadgetworld"],     name: "DJI Mini 4 Pro Drone",     category: "Gaming Hardware",     price_cents: 75900, currency: "USD", pricing_model: "one_time", is_digital: false, is_featured: true,  is_new: true,  is_active: true, rating: 4.7, reviews_count: 19, sales_count: 45,  tags: ["drone","dji","aerial"],       meta: {} },
            { store_id: storeBySlug["sportspro"],       name: "Pro Treadmill X5",         category: "Gym Equipment",       price_cents: 89900, currency: "USD", pricing_model: "one_time", is_digital: false, is_featured: false, is_new: false, is_active: true, rating: 4.6, reviews_count: 31, sales_count: 62,  tags: ["treadmill","gym","cardio"],   meta: {} },
            { store_id: storeBySlug["artisancraft"],    name: "Handmade Pharaonic Vase",  category: "Pottery & Ceramics",  price_cents: 5900,  currency: "USD", pricing_model: "one_time", is_digital: false, is_featured: false, is_new: true,  is_active: true, rating: 4.8, reviews_count: 12, sales_count: 28,  tags: ["pottery","pharaonic","egypt"], meta: {} },
          ];
          await db.from("mall_products").insert(DEMO_PRODUCTS);
        }
      }
    }
  } catch (e) {
    console.warn("Mall seed failed:", e);
  }
}
