import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { tenantDb } from "@/lib/tenantDb";

export type ContactInfo = { name: string; phone: string; email: string; whatsapp: string; };
export type Owner = ContactInfo & { id: string };
export type TeamMember = ContactInfo & { id: string; position: string };
export type ProductItem = { id: string; name: string; description: string; attachmentName?: string };
export type DocFile = { id: string; name: string; url?: string };
export type MarketingPlan = { id: string; title: string; description: string; attachmentName?: string };
export type SocialLinks = { website: string; facebook: string; instagram: string; twitter: string; linkedin: string; tiktok: string; };
export type ResponsiblePersonContact = { phone: string; email: string; whatsapp: string; linkedin: string; twitter: string; };

export type Brand = {
  id: string;
  name: string;
  logoUrl?: string;
  address: string;
  industry: string;
  responsiblePerson?: string;
  responsiblePersonContact?: ResponsiblePersonContact;
  humanCount?: number;
  aiCount?: number;
  owners: Owner[];
  team: TeamMember[];
  products: ProductItem[];
  legalDocs: DocFile[];
  financialDocs: DocFile[];
  marketingPlans: MarketingPlan[];
  companyProfiles: DocFile[];
  socialLinks: SocialLinks;
  createdAt: string;
};

const emptySocial = (): SocialLinks => ({ website: "", facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "" });

type Ctx = {
  brands: Brand[];
  loading: boolean;
  addBrand: (brand: Omit<Brand, "id" | "createdAt">) => Promise<void>;
  updateBrand: (id: string, brand: Partial<Brand>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  getBrand: (id: string) => Brand | undefined;
  refresh: () => Promise<void>;
};

const BrandsContext = createContext<Ctx | undefined>(undefined);

const rowToBrand = (r: any): Brand => {
  const d = r.data || {};
  return {
    id: r.id,
    name: r.name,
    logoUrl: r.logo_url ?? d.logoUrl,
    address: r.address ?? d.address ?? "",
    industry: r.industry ?? d.industry ?? "",
    responsiblePerson: d.responsiblePerson,
    responsiblePersonContact: d.responsiblePersonContact || { phone:"", email:"", whatsapp:"", linkedin:"", twitter:"" },
    humanCount: r.human_count ?? d.humanCount,
    aiCount: r.ai_count ?? d.aiCount,
    owners: d.owners || [],
    team: d.team || [],
    products: d.products || [],
    legalDocs: d.legalDocs || [],
    financialDocs: d.financialDocs || [],
    marketingPlans: d.marketingPlans || [],
    companyProfiles: d.companyProfiles || [],
    socialLinks: d.socialLinks || emptySocial(),
    createdAt: r.created_at,
  };
};

const brandToData = (b: Partial<Brand>) => {
  const { id, name, createdAt, ...d } = b as any;
  return d;
};

const toBrandColumns = (brand: Partial<Brand>) => ({
  name: brand.name,
  address: brand.address || null,
  industry: brand.industry || null,
  logo_url: brand.logoUrl || null,
  website: brand.socialLinks?.website || null,
  social_links: brand.socialLinks || emptySocial(),
  human_count: Number(brand.humanCount || 0),
  ai_count: Number(brand.aiCount || 0),
  data: brandToData(brand),
  updated_at: new Date().toISOString(),
});

const missingRelationRegex = /relation\s+"[^"]+"\s+does not exist/i;

const isMissingRelationError = (error: any) => missingRelationRegex.test(String(error?.message || ""));

const safeSelect = async (table: string, opts: Parameters<typeof tenantDb.select>[1] = {}) => {
  try {
    return await tenantDb.select(table, opts as any);
  } catch (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
};

const safeSync = async (work: () => Promise<void>) => {
  try {
    await work();
  } catch (error) {
    if (isMissingRelationError(error)) return;
    throw error;
  }
};

const syncBrandOwners = async (brandId: string, owners: Owner[]) => {
  await tenantDb.remove(
    "brand_owners",
    { eq: { brand_id: brandId } },
    { includeBrandId: false, includeClientId: false },
  );

  const rows = (owners || [])
    .filter((o) => o.name?.trim())
    .map((o, idx) => ({
      brand_id: brandId,
      name: o.name.trim(),
      phone: o.phone || null,
      email: o.email || null,
      whatsapp: o.whatsapp || null,
      sort_order: idx,
    }));

  for (const row of rows) {
    await tenantDb.insert("brand_owners", row, { includeBrandId: false, includeClientId: false });
  }
};

const syncBrandTeam = async (brandId: string, team: TeamMember[]) => {
  await tenantDb.remove(
    "brand_team_members",
    { eq: { brand_id: brandId } },
    { includeBrandId: false, includeClientId: false },
  );

  const rows = (team || [])
    .filter((m) => m.name?.trim())
    .map((m, idx) => ({
      id: m.id,
      brand_id: brandId,
      name: m.name.trim(),
      position: m.position || null,
      phone: m.phone || null,
      email: m.email || null,
      whatsapp: m.whatsapp || null,
      sort_order: idx,
    }));

  for (const row of rows) {
    await tenantDb.insert("brand_team_members", row, { includeBrandId: false, includeClientId: false });
  }
};

const syncBrandProducts = async (brandId: string, products: ProductItem[]) => {
  await tenantDb.remove(
    "brand_products",
    { eq: { brand_id: brandId } },
    { includeBrandId: false, includeClientId: false },
  );

  const rows = (products || [])
    .filter((p) => p.name?.trim())
    .map((p, idx) => ({
      id: p.id,
      brand_id: brandId,
      name: p.name.trim(),
      description: p.description || null,
      attachment_name: p.attachmentName || null,
      sort_order: idx,
    }));

  for (const row of rows) {
    await tenantDb.insert("brand_products", row, { includeBrandId: false, includeClientId: false });
  }
};

const syncBrandDocuments = async (
  brandId: string,
  docs: DocFile[],
  docType: "legal" | "financial" | "company_profile",
) => {
  await tenantDb.remove(
    "brand_documents",
    { eq: { brand_id: brandId, doc_type: docType } },
    { includeBrandId: false, includeClientId: false },
  );

  const rows = (docs || [])
    .filter((d) => d.name?.trim())
    .map((d, idx) => ({
      id: d.id,
      brand_id: brandId,
      doc_type: docType,
      name: d.name.trim(),
      url: d.url || null,
      sort_order: idx,
    }));

  for (const row of rows) {
    await tenantDb.insert("brand_documents", row, { includeBrandId: false, includeClientId: false });
  }
};

const syncBrandMarketingPlans = async (brandId: string, plans: MarketingPlan[]) => {
  await tenantDb.remove(
    "brand_marketing_plans",
    { eq: { brand_id: brandId } },
    { includeBrandId: false, includeClientId: false },
  );

  const rows = (plans || [])
    .filter((p) => p.title?.trim())
    .map((p, idx) => ({
      id: p.id,
      brand_id: brandId,
      title: p.title.trim(),
      description: p.description || null,
      attachment_name: p.attachmentName || null,
      sort_order: idx,
    }));

  for (const row of rows) {
    await tenantDb.insert("brand_marketing_plans", row, { includeBrandId: false, includeClientId: false });
  }
};

const syncBrandSections = async (brandId: string, brand: Partial<Brand>) => {
  await safeSync(() => syncBrandOwners(brandId, brand.owners || []));
  await safeSync(() => syncBrandTeam(brandId, brand.team || []));
  await safeSync(() => syncBrandProducts(brandId, brand.products || []));
  await safeSync(() => syncBrandDocuments(brandId, brand.legalDocs || [], "legal"));
  await safeSync(() => syncBrandDocuments(brandId, brand.financialDocs || [], "financial"));
  await safeSync(() => syncBrandDocuments(brandId, brand.companyProfiles || [], "company_profile"));
  await safeSync(() => syncBrandMarketingPlans(brandId, brand.marketingPlans || []));
};

const hydrateBrandSections = async (brand: Brand): Promise<Brand> => {
  const [ownersRows, teamRows, productRows, docRows, planRows] = await Promise.all([
    safeSelect("brand_owners", { eq: { brand_id: brand.id }, orderBy: "sort_order", ascending: true }),
    safeSelect("brand_team_members", { eq: { brand_id: brand.id }, orderBy: "sort_order", ascending: true }),
    safeSelect("brand_products", { eq: { brand_id: brand.id }, orderBy: "sort_order", ascending: true }),
    safeSelect("brand_documents", { eq: { brand_id: brand.id }, orderBy: "sort_order", ascending: true }),
    safeSelect("brand_marketing_plans", { eq: { brand_id: brand.id }, orderBy: "sort_order", ascending: true }),
  ]);

  const owners = ownersRows.length
    ? ownersRows.map((o: any) => ({
        id: o.id,
        name: o.name || "",
        phone: o.phone || "",
        email: o.email || "",
        whatsapp: o.whatsapp || "",
      }))
    : brand.owners;

  const team = teamRows.length
    ? teamRows.map((m: any) => ({
        id: m.id,
        name: m.name || "",
        position: m.position || "",
        phone: m.phone || "",
        email: m.email || "",
        whatsapp: m.whatsapp || "",
      }))
    : brand.team;

  const products = productRows.length
    ? productRows.map((p: any) => ({
        id: p.id,
        name: p.name || "",
        description: p.description || "",
        attachmentName: p.attachment_name || undefined,
      }))
    : brand.products;

  const legalDocs = docRows.length
    ? docRows
        .filter((d: any) => d.doc_type === "legal")
        .map((d: any) => ({ id: d.id, name: d.name || "", url: d.url || undefined }))
    : brand.legalDocs;

  const financialDocs = docRows.length
    ? docRows
        .filter((d: any) => d.doc_type === "financial")
        .map((d: any) => ({ id: d.id, name: d.name || "", url: d.url || undefined }))
    : brand.financialDocs;

  const companyProfiles = docRows.length
    ? docRows
        .filter((d: any) => d.doc_type === "company_profile")
        .map((d: any) => ({ id: d.id, name: d.name || "", url: d.url || undefined }))
    : brand.companyProfiles;

  const marketingPlans = planRows.length
    ? planRows.map((p: any) => ({
        id: p.id,
        title: p.title || "",
        description: p.description || "",
        attachmentName: p.attachment_name || undefined,
      }))
    : brand.marketingPlans;

  return {
    ...brand,
    owners,
    team,
    products,
    legalDocs,
    financialDocs,
    companyProfiles,
    marketingPlans,
  };
};

export const BrandsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setBrands([]); setLoading(false); return; }
    setLoading(true);
    const data = await tenantDb.select("brands", { orderBy: "created_at", ascending: false });
    const baseBrands = (data || []).map(rowToBrand);
    const hydratedBrands = await Promise.all(baseBrands.map(hydrateBrandSections));
    setBrands(hydratedBrands);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addBrand = async (brand: Omit<Brand, "id" | "createdAt">) => {
    if (!user) return;
    const data = await tenantDb.insert(
      "brands",
      {
        user_id: user.id,
        status: "active",
        ...toBrandColumns(brand),
      },
      { includeClientId: false, includeBrandId: false },
    );
    if (data) {
      const brandId = (data as any).id;
      await syncBrandSections(brandId, brand);
      const hydrated = await hydrateBrandSections(rowToBrand(data as any));
      setBrands(prev => [hydrated, ...prev]);
    }
  };

  const updateBrand = async (id: string, patch: Partial<Brand>) => {
    const current = brands.find(b => b.id === id);
    if (!current) return;
    const merged = { ...current, ...patch };
    const data = await tenantDb.update(
      "brands",
      {
        ...toBrandColumns(merged),
      },
      { id },
      { includeBrandId: false, includeClientId: false },
    );
    if (data) {
      await syncBrandSections(id, merged);
      const hydrated = await hydrateBrandSections(rowToBrand(data));
      setBrands(prev => prev.map(b => b.id === id ? hydrated : b));
    }
  };

  const deleteBrand = async (id: string) => {
    await safeSync(async () => {
      await tenantDb.remove(
        "brand_owners",
        { eq: { brand_id: id } },
        { includeBrandId: false, includeClientId: false },
      );
    });
    await safeSync(async () => {
      await tenantDb.remove(
        "brand_team_members",
        { eq: { brand_id: id } },
        { includeBrandId: false, includeClientId: false },
      );
    });
    await safeSync(async () => {
      await tenantDb.remove(
        "brand_products",
        { eq: { brand_id: id } },
        { includeBrandId: false, includeClientId: false },
      );
    });
    await safeSync(async () => {
      await tenantDb.remove(
        "brand_documents",
        { eq: { brand_id: id } },
        { includeBrandId: false, includeClientId: false },
      );
    });
    await safeSync(async () => {
      await tenantDb.remove(
        "brand_marketing_plans",
        { eq: { brand_id: id } },
        { includeBrandId: false, includeClientId: false },
      );
    });
    await tenantDb.remove(
      "brands",
      { id },
      { includeBrandId: false, includeClientId: false, includeUserName: false },
    );

    const stillThere = await tenantDb.select("brands", { eq: { id }, limit: 1 });
    if (stillThere.length > 0) {
      throw new Error("Brand delete failed. Please check permissions and try again.");
    }

    setBrands(prev => prev.filter(b => b.id !== id));
  };

  const getBrand = (id: string) => brands.find(b => b.id === id);

  return (
    <BrandsContext.Provider value={{ brands, loading, addBrand, updateBrand, deleteBrand, getBrand, refresh }}>
      {children}
    </BrandsContext.Provider>
  );
};

export const useBrands = () => {
  const ctx = useContext(BrandsContext);
  if (!ctx) throw new Error("useBrands must be used within BrandsProvider");
  return ctx;
};
