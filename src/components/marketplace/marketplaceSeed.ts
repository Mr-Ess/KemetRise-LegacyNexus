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
  } catch (e) {
    console.warn("Marketplace seed failed:", e);
  }
}
