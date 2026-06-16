/**
 * Marketplace seed data — 5 types with full category trees.
 * seedMarketplaceDefaults() is safe to call on every load (no-ops if already seeded).
 */

export const MARKETPLACE_SEED_TYPES = [
  {
    code: "digital", label: "Digital Products", label_ar: "منتجات رقمية",
    icon: "💾", color: "violet", sort_order: 1, is_active: true, is_built_in: true,
    default_categories: [
      "Software","Templates","E-books","Online Courses","Plugins & Extensions",
      "UI Kits & Design","Fonts","Audio","Video","Graphics","3D Assets","Games & Game Assets",
    ],
  },
  {
    code: "physical", label: "Physical Products", label_ar: "منتجات ملموسة",
    icon: "📦", color: "emerald", sort_order: 2, is_active: true, is_built_in: true,
    default_categories: [
      "Electronics","Fashion","Furniture","Food & Beverage","Books",
      "Sports & Fitness","Beauty & Care","Home & Kitchen","Toys & Games",
      "Health","Automotive","Art & Collectibles","Handcraft",
    ],
  },
  {
    code: "virtual", label: "Virtual Goods", label_ar: "منتجات افتراضية",
    icon: "🎮", color: "blue", sort_order: 3, is_active: true, is_built_in: true,
    default_categories: [
      "In-game Items","NFTs & Collectibles","Virtual Real Estate",
      "Gift Cards","License Keys","Accounts & Access",
    ],
  },
  {
    code: "service", label: "Services", label_ar: "خدمات",
    icon: "🛠️", color: "amber", sort_order: 4, is_active: true, is_built_in: true,
    default_categories: [
      "Design","Development","Marketing","Writing & Translation",
      "Photography & Video","Education & Coaching","Consulting",
      "Engineering","Finance","Legal","Health & Wellness",
    ],
  },
  {
    code: "subscription", label: "Subscriptions", label_ar: "اشتراكات",
    icon: "♾️", color: "pink", sort_order: 5, is_active: true, is_built_in: true,
    default_categories: [
      "SaaS Tools","Media & Entertainment","Education Platforms",
      "Cloud & Hosting","Business Tools","Security & Privacy",
      "News & Research","Health & Fitness",
    ],
  },
];

export const MARKETPLACE_SEED_SUBCATEGORIES: Record<string, Record<string, string[]>> = {
  digital: {
    "Software":             ["Desktop Apps","Mobile Apps","Web Apps","Scripts & Utilities","APIs & SDKs"],
    "Templates":            ["Website Templates","Email Templates","Presentation Templates","Document Templates","Social Media Templates"],
    "E-books":              ["Fiction","Non-fiction","Educational","How-to Guides","Comics & Manga"],
    "Online Courses":       ["Programming","Design","Business","Languages","Marketing","Photography","Music & Audio"],
    "Plugins & Extensions": ["WordPress Plugins","Shopify Apps","Browser Extensions","IDE Plugins","Figma Plugins"],
    "UI Kits & Design":     ["UI Kits","Icon Sets","Illustrations","Mockups","Design Systems"],
    "Fonts":                ["Serif","Sans-Serif","Display","Handwritten","Monospace"],
    "Audio":                ["Music Tracks","Sound Effects","Loops & Samples","Voice Packs","Podcasts"],
    "Video":                ["Stock Footage","Motion Graphics","Tutorials","Intros & Outros","Transitions & Overlays"],
    "Graphics":             ["Stock Photos","Vectors","Illustrations","Backgrounds & Textures","Logos & Badges"],
    "3D Assets":            ["3D Models","Textures & Materials","Characters","Environments","Animations"],
    "Games & Game Assets":  ["Indie Games","Game Sprites","Game Audio","Game Maps","Game UI Assets"],
  },
  physical: {
    "Electronics":          ["Phones & Tablets","Laptops & PCs","Cameras & Photography","Gaming Hardware","Smart Home","Audio Equipment","Accessories"],
    "Fashion":              ["Men's Clothing","Women's Clothing","Shoes","Bags & Wallets","Jewelry","Watches","Kids' Wear"],
    "Furniture":            ["Living Room","Bedroom","Office Furniture","Kitchen Furniture","Outdoor Furniture"],
    "Food & Beverage":      ["Fresh Produce","Packaged Foods","Beverages","Sweets & Snacks","Organic Products","Spices & Condiments"],
    "Books":                ["Fiction","Non-fiction","Academic & Educational","Children's Books","Comics & Manga"],
    "Sports & Fitness":     ["Gym Equipment","Outdoor Sports","Team Sports","Fitness Clothing","Water Sports","Cycling"],
    "Beauty & Care":        ["Skincare","Haircare","Makeup","Fragrances","Personal Hygiene","Men's Grooming"],
    "Home & Kitchen":       ["Cookware","Kitchen Appliances","Storage & Organization","Cleaning Supplies","Bedding & Bath"],
    "Toys & Games":         ["Board Games","Action Figures","Educational Toys","Outdoor Toys","Puzzles","Remote Control"],
    "Health":               ["Supplements & Vitamins","Medical Devices","First Aid","Wellness Products","Disability Aids"],
    "Automotive":           ["Car Parts","Car Accessories","Motorcycle Parts","Car Care Products","Tires & Wheels"],
    "Art & Collectibles":   ["Paintings & Prints","Sculptures","Vintage Items","Coins & Stamps","Photography Prints"],
    "Handcraft":            ["Pottery & Ceramics","Textiles & Embroidery","Woodwork","Metalwork","Handmade Jewelry"],
  },
  virtual: {
    "In-game Items":        ["Skins & Cosmetics","Characters & Heroes","Weapons & Gear","Maps & Environments","Game Currency","Boosters & XP"],
    "NFTs & Collectibles":  ["Art NFTs","Music NFTs","Gaming NFTs","Digital Collectibles","Profile Pictures (PFP)"],
    "Virtual Real Estate":  ["Metaverse Land","Virtual Buildings","Virtual Spaces","Domain Names"],
    "Gift Cards":           ["Gaming Gift Cards","Shopping Gift Cards","Streaming Gift Cards","App Store Cards","Food Delivery Cards"],
    "License Keys":         ["Software Keys","Game Activation Keys","Antivirus Keys","VPN Keys","Microsoft & Adobe"],
    "Accounts & Access":    ["Premium Social Accounts","Streaming Access","Lifetime Memberships","Beta Access"],
  },
  service: {
    "Design":               ["Logo Design","UI/UX Design","Graphic Design","Motion Graphics","Brand Identity","Packaging Design"],
    "Development":          ["Web Development","Mobile Development","Backend Development","DevOps & Cloud","QA & Testing","Blockchain Dev"],
    "Marketing":            ["SEO & SEM","Social Media Management","Content Creation","Email Marketing","PPC Advertising","Influencer Marketing"],
    "Writing & Translation":["Copywriting","Proofreading & Editing","Translation","Technical Writing","Creative Writing","Academic Writing"],
    "Photography & Video":  ["Product Photography","Event Photography","Video Production","Video Editing","Animation & VFX"],
    "Education & Coaching": ["Academic Tutoring","Language Lessons","Business Coaching","Life Coaching","Music & Arts"],
    "Consulting":           ["Business Strategy","IT Consulting","Financial Consulting","Legal Consulting","HR Consulting","Startup Consulting"],
    "Engineering":          ["Civil Engineering","Mechanical Engineering","Electrical Engineering","Architecture","Interior Design"],
    "Finance":              ["Bookkeeping","Tax Filing","Financial Planning","Auditing","Investment Advisory"],
    "Legal":                ["Contract Review","Business Registration","IP & Copyright","Legal Advice","Compliance"],
    "Health & Wellness":    ["Personal Training","Nutrition Planning","Mental Health","Medical Consultation","Physiotherapy"],
  },
  subscription: {
    "SaaS Tools":           ["CRM Software","Project Management","Analytics & BI","Communication Tools","HR & Payroll"],
    "Media & Entertainment":["Video Streaming","Music Streaming","Gaming Subscriptions","Podcasts & Audiobooks","Live Sports"],
    "Education Platforms":  ["Online Learning","Language Learning","Professional Certifications","Kids' Learning","Test Prep"],
    "Cloud & Hosting":      ["Web Hosting","Cloud Storage","Email Hosting","CDN Services","VPS & Dedicated Servers"],
    "Business Tools":       ["Accounting Software","Marketing Automation","Customer Support Tools","E-commerce Platforms","ERP Systems"],
    "Security & Privacy":   ["VPN Services","Password Managers","Antivirus & EDR","Identity Protection","Secure Messaging"],
    "News & Research":      ["News Magazines","Research Databases","Industry Reports","Financial Data","Academic Journals"],
    "Health & Fitness":     ["Workout Apps","Meditation & Mindfulness","Diet & Nutrition","Health Monitoring","Telemedicine"],
  },
};

/** Demo listings inserted when mp_listings is empty */
export const SEED_LISTINGS = [
  { listing_type: "digital", name: "Enterprise ERP Suite", description: "Full ERP system — HR, finance, inventory, CRM in one platform.", category: "Software", tags: ["erp","enterprise","software"], price_cents: 99900, currency: "USD", pricing_model: "annual", publisher_name: "KemetRise", rating: 4.9, reviews_count: 128, sales_count: 340, is_featured: true, is_new: false, is_verified: true, is_active: true, meta: { version: "3.0", license_type: "Commercial" } },
  { listing_type: "subscription", name: "AI Agent Pack", description: "10 custom AI brand agents — ANUBIS, ISIS, HORUS & more.", category: "AI", tags: ["ai","agents","automation"], price_cents: 4900, currency: "USD", pricing_model: "monthly", publisher_name: "KemetRise AI", rating: 4.8, reviews_count: 89, sales_count: 210, is_featured: true, is_new: true, is_verified: true, is_active: true, meta: { agents: 10, models: "GPT-4o, Claude" } },
  { listing_type: "service", name: "Business Setup Consulting", description: "End-to-end business setup, legal structure & digital presence.", category: "Consulting", tags: ["consulting","setup","business"], price_cents: 49900, currency: "USD", pricing_model: "one_time", publisher_name: "KemetRise Pro", rating: 4.7, reviews_count: 56, sales_count: 95, is_featured: false, is_new: false, is_verified: true, is_active: true, meta: {} },
  { listing_type: "digital", name: "HR & Attendance Module", description: "Biometric QR attendance, payroll, leave management.", category: "Software", tags: ["hr","payroll","attendance"], price_cents: 29900, currency: "USD", pricing_model: "annual", publisher_name: "KemetRise", rating: 4.6, reviews_count: 42, sales_count: 178, is_featured: false, is_new: false, is_verified: true, is_active: true, meta: { version: "2.1" } },
  { listing_type: "subscription", name: "Marketing Suite", description: "CRM + campaigns + lead pipeline + analytics dashboard.", category: "SaaS Tools", tags: ["crm","campaigns","marketing"], price_cents: 1900, currency: "USD", pricing_model: "monthly", publisher_name: "KemetRise Marketing", rating: 4.5, reviews_count: 71, sales_count: 290, is_featured: true, is_new: false, is_verified: true, is_active: true, meta: {} },
  { listing_type: "digital", name: "API Access Token", description: "Unlimited REST API access for developers and integrations.", category: "Software", tags: ["api","developer","integration"], price_cents: 9900, currency: "USD", pricing_model: "annual", publisher_name: "KemetRise Dev", rating: 4.4, reviews_count: 33, sales_count: 520, is_featured: false, is_new: true, is_verified: true, is_active: true, meta: { version: "v2" } },
  { listing_type: "service", name: "Brand Identity Design", description: "Logo, colour palette, typography, brand guidelines.", category: "Design", tags: ["brand","logo","design"], price_cents: 19900, currency: "USD", pricing_model: "one_time", publisher_name: "KemetRise Studio", rating: 4.8, reviews_count: 19, sales_count: 67, is_featured: false, is_new: true, is_verified: true, is_active: true, meta: {} },
  { listing_type: "subscription", name: "Sector Activation Bundle", description: "Activate any 5 business sectors in your dashboard.", category: "Business Tools", tags: ["sectors","platform","bundle"], price_cents: 0, currency: "USD", pricing_model: "free", publisher_name: "KemetRise", rating: 4.3, reviews_count: 88, sales_count: 1200, is_featured: false, is_new: false, is_verified: true, is_active: true, meta: {} },
  { listing_type: "physical", name: "Smart Attendance Terminal", description: "QR & fingerprint attendance kiosk, plug & play setup.", category: "Electronics", tags: ["hardware","attendance","biometric"], price_cents: 34900, currency: "USD", pricing_model: "one_time", publisher_name: "KemetRise Hardware", rating: 4.7, reviews_count: 24, sales_count: 88, is_featured: true, is_new: false, is_verified: true, is_active: true, meta: { sku: "KR-HW-ATT-01" } },
  { listing_type: "service", name: "White-Label Platform Setup", description: "Full white-label deployment of KemetRise under your brand.", category: "Development", tags: ["whitelabel","deployment","custom"], price_cents: 149900, currency: "USD", pricing_model: "one_time", publisher_name: "KemetRise Pro", rating: 5.0, reviews_count: 12, sales_count: 18, is_featured: true, is_new: false, is_verified: true, is_active: true, meta: {} },
  { listing_type: "digital", name: "E-Commerce Starter Kit", description: "Ready-made online store template with payment integration.", category: "Templates", tags: ["ecommerce","template","store"], price_cents: 7900, currency: "USD", pricing_model: "one_time", publisher_name: "KemetRise Studio", rating: 4.5, reviews_count: 61, sales_count: 340, is_featured: false, is_new: false, is_verified: true, is_active: true, meta: {} },
  { listing_type: "subscription", name: "Cloud Backup & Recovery", description: "Automated daily backups, 99.9% uptime SLA, instant restore.", category: "Cloud & Hosting", tags: ["backup","cloud","security"], price_cents: 2900, currency: "USD", pricing_model: "monthly", publisher_name: "KemetRise Cloud", rating: 4.6, reviews_count: 38, sales_count: 165, is_featured: false, is_new: false, is_verified: true, is_active: true, meta: {} },
];

/**
 * One-shot seed: inserts all 5 types + full category trees if tables are empty.
 * Safe to call on every page load — no-ops if data already exists.
 */
export async function seedMarketplaceDefaults(db: any): Promise<void> {
  try {
    // ── Seed types ──────────────────────────────────────────────────────────
    const { count: tc } = await db
      .from("mp_listing_types")
      .select("*", { count: "exact", head: true });
    if ((tc ?? 0) === 0) {
      await db.from("mp_listing_types").upsert(MARKETPLACE_SEED_TYPES, { onConflict: "code" });
    }

    // ── Seed categories + sub-categories ────────────────────────────────────
    const { count: cc } = await db
      .from("mp_categories")
      .select("*", { count: "exact", head: true });
    if ((cc ?? 0) === 0) {
      for (const [typeCode, catMap] of Object.entries(MARKETPLACE_SEED_SUBCATEGORIES)) {
        const catNames = Object.keys(catMap);
        // Batch-insert all main categories for this type
        const { data: mainCats } = await db
          .from("mp_categories")
          .insert(catNames.map((name, i) => ({ listing_type: typeCode, name, parent_id: null, sort_order: i + 1 })))
          .select("id, name");
        if (!mainCats?.length) continue;

        // Build name→id map, then batch-insert all sub-categories
        const nameToId: Record<string, string> = Object.fromEntries(
          mainCats.map((c: { id: string; name: string }) => [c.name, c.id])
        );
        const subRows: Record<string, unknown>[] = [];
        for (const [catName, subNames] of Object.entries(catMap as Record<string, string[]>)) {
          const pid = nameToId[catName];
          if (pid) {
            subRows.push(
              ...subNames.map((sub, i) => ({
                listing_type: typeCode, name: sub, parent_id: pid, sort_order: i + 1,
              }))
            );
          }
        }
        if (subRows.length > 0) await db.from("mp_categories").insert(subRows);
      }
    }

    // ── Seed demo listings ────────────────────────────────────────────────
    const { count: lc } = await db
      .from("mp_listings")
      .select("*", { count: "exact", head: true });
    if ((lc ?? 0) === 0) {
      await db.from("mp_listings").insert(SEED_LISTINGS);
    }
  } catch (e) {
    console.warn("Marketplace seed failed:", e);
  }
}
