import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBrands, Owner, TeamMember, ProductItem, DocFile, MarketingPlan, SocialLinks } from "@/context/BrandsContext";
import { ArrowLeft, Plus, X, Upload, Save, User, Users, Package, FileText, Megaphone, Building2, Briefcase, Globe, DollarSign, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import EntityApiHub from "@/components/shared/EntityApiHub";
import StaffMetrics from "@/components/shared/StaffMetrics";
import ResponsiblePerson from "@/components/shared/ResponsiblePerson";

const emptyOwner = (): Owner => ({ id: crypto.randomUUID(), name: "", phone: "", email: "", whatsapp: "" });
const emptyTeam = (): TeamMember => ({ id: crypto.randomUUID(), name: "", position: "", phone: "", email: "", whatsapp: "" });
const emptyProduct = (): ProductItem => ({ id: crypto.randomUUID(), name: "", description: "" });
const emptyDoc = (): DocFile => ({ id: crypto.randomUUID(), name: "" });
const emptyPlan = (): MarketingPlan => ({ id: crypto.randomUUID(), title: "", description: "" });
const emptySocial = (): SocialLinks => ({ website: "", facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "" });

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
    <Icon className="w-4 h-4 text-primary" />
    <h2 className="font-display text-sm tracking-wider text-primary">{title}</h2>
  </div>
);

// Hoisted out of AddBrand to prevent remount on every keystroke (which caused input focus loss).
const FileUploadRow = ({ doc, onRemove, onUpload, label }: { doc: DocFile; onRemove: () => void; onUpload: (name: string) => void; label?: string }) => (
  <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md border border-border">
    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
    <span className="flex-1 font-body text-sm text-foreground truncate">{doc.name || label || "No file selected"}</span>
    <label className="cursor-pointer px-2 py-1 text-xs font-body text-primary hover:underline">
      Upload
      <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f.name); }} />
    </label>
    <button type="button" onClick={onRemove} className="p-1 text-destructive hover:bg-destructive/10 rounded"><X className="w-3.5 h-3.5" /></button>
  </div>
);

const AddBrand = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addBrand, getBrand, updateBrand } = useBrands();
  const existingBrand = id ? getBrand(id) : undefined;
  const isEditing = !!existingBrand;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [humanCount, setHumanCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [owners, setOwners] = useState<Owner[]>([emptyOwner()]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([emptyProduct()]);
  const [legalDocs, setLegalDocs] = useState<DocFile[]>([]);
  const [financialDocs, setFinancialDocs] = useState<DocFile[]>([]);
  const [marketingPlans, setMarketingPlans] = useState<MarketingPlan[]>([]);
  const [companyProfiles, setCompanyProfiles] = useState<DocFile[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(emptySocial());

  useEffect(() => {
    if (existingBrand) {
      setName(existingBrand.name);
      setAddress(existingBrand.address);
      setIndustry(existingBrand.industry);
      setLogoUrl(existingBrand.logoUrl || "");
      setResponsiblePerson(existingBrand.responsiblePerson || "");
      setHumanCount(existingBrand.humanCount || 0);
      setAiCount(existingBrand.aiCount || 0);
      setOwners(existingBrand.owners.length ? existingBrand.owners : [emptyOwner()]);
      setTeam(existingBrand.team);
      setProducts(existingBrand.products.length ? existingBrand.products : [emptyProduct()]);
      setLegalDocs(existingBrand.legalDocs);
      setFinancialDocs(existingBrand.financialDocs);
      setMarketingPlans(existingBrand.marketingPlans);
      setCompanyProfiles(existingBrand.companyProfiles || []);
      setSocialLinks(existingBrand.socialLinks || emptySocial());
    }
  }, [existingBrand]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Brand name is required"); return; }
    const data = {
      name, address, industry, logoUrl, socialLinks, responsiblePerson, humanCount, aiCount,
      companyProfiles: companyProfiles.filter(d => d.name),
      owners: owners.filter(o => o.name.trim()),
      team: team.filter(t => t.name.trim()),
      products: products.filter(p => p.name.trim()),
      legalDocs: legalDocs.filter(d => d.name),
      financialDocs: financialDocs.filter(d => d.name),
      marketingPlans: marketingPlans.filter(m => m.title.trim()),
    };
    if (isEditing) {
      updateBrand(existingBrand!.id, data);
      toast.success(`${name} updated successfully!`);
      navigate(`/brands/${existingBrand!.id}`);
    } else {
      addBrand(data);
      toast.success(`${name} added successfully!`);
      navigate("/");
    }
  };

  // Use useCallback to prevent re-renders that cause focus loss
  const updateOwner = useCallback((idx: number, field: keyof Owner, value: string) => {
    setOwners(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  }, []);
  const updateTeamMember = useCallback((idx: number, field: keyof TeamMember, value: string) => {
    setTeam(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  }, []);
  const updateProduct = useCallback((idx: number, field: keyof ProductItem, value: string) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }, []);
  const updatePlan = useCallback((idx: number, field: keyof MarketingPlan, value: string) => {
    setMarketingPlans(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(isEditing ? `/brands/${existingBrand!.id}` : "/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span>
        </button>

        <div className="bg-card border border-border rounded-lg p-6 gold-glow">
          <h1 className="font-display text-xl text-primary mb-6">⚜ {isEditing ? "EDIT BRAND" : "ADD NEW BRAND"}</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* GENERAL INFO */}
            <section>
              <SectionHeader icon={Building2} title="GENERAL INFORMATION" />
              <div className="space-y-4">
                <div className="space-y-1"><Label className="font-body text-foreground">Brand Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter brand name" className="bg-secondary border-border text-foreground" /></div>
                <div className="space-y-1">
                  <Label className="font-body text-foreground">Brand Logo / Image</Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-md cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" /><span className="font-body text-sm text-muted-foreground">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        try {
                          const { supabase } = await import("@/integrations/supabase/client");
                          const { data: u } = await supabase.auth.getUser();
                          if (!u.user) throw new Error("Not authenticated");
                          const path = `${u.user.id}/brand-${Date.now()}-${f.name}`;
                          const { error } = await supabase.storage.from("avatars").upload(path, f, { upsert: true });
                          if (error) throw error;
                          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
                          setLogoUrl(data.publicUrl);
                        } catch (err: any) {
                          const { toast } = await import("sonner");
                          toast.error(err.message || "Upload failed");
                        }
                      }} />
                    </label>
                    {logoUrl && <img src={logoUrl} alt="Preview" className="w-10 h-10 rounded-md object-cover border border-border" />}
                  </div>
                </div>
                <div className="space-y-1"><Label className="font-body text-foreground">Business Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter address" className="bg-secondary border-border text-foreground" /></div>
                <div className="space-y-1"><Label className="font-body text-foreground">Industry / Specialization</Label><Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Jewelry, Tech" className="bg-secondary border-border text-foreground" /></div>
                <ResponsiblePerson value={responsiblePerson} onChange={setResponsiblePerson} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="font-body text-foreground">Human Staff Count</Label><Input type="number" min={0} value={humanCount} onChange={e => setHumanCount(+e.target.value)} className="bg-secondary border-border text-foreground" /></div>
                  <div className="space-y-1"><Label className="font-body text-foreground">AI Agent Count</Label><Input type="number" min={0} value={aiCount} onChange={e => setAiCount(+e.target.value)} className="bg-secondary border-border text-foreground" /></div>
                </div>
                <StaffMetrics humanCount={humanCount} aiCount={aiCount} />
              </div>
            </section>

            {/* SOCIAL MEDIA / CONTACT LINKS */}
            <section>
              <SectionHeader icon={Globe} title="SOCIAL MEDIA & CONTACT LINKS" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Website</Label><Input value={socialLinks.website} onChange={e => setSocialLinks(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className="bg-secondary border-border text-foreground" /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Facebook</Label><Input value={socialLinks.facebook} onChange={e => setSocialLinks(p => ({ ...p, facebook: e.target.value }))} placeholder="Facebook URL or handle" className="bg-secondary border-border text-foreground" /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Instagram</Label><Input value={socialLinks.instagram} onChange={e => setSocialLinks(p => ({ ...p, instagram: e.target.value }))} placeholder="@handle" className="bg-secondary border-border text-foreground" /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Twitter / X</Label><Input value={socialLinks.twitter} onChange={e => setSocialLinks(p => ({ ...p, twitter: e.target.value }))} placeholder="@handle" className="bg-secondary border-border text-foreground" /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">LinkedIn</Label><Input value={socialLinks.linkedin} onChange={e => setSocialLinks(p => ({ ...p, linkedin: e.target.value }))} placeholder="LinkedIn URL" className="bg-secondary border-border text-foreground" /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">TikTok</Label><Input value={socialLinks.tiktok} onChange={e => setSocialLinks(p => ({ ...p, tiktok: e.target.value }))} placeholder="@handle" className="bg-secondary border-border text-foreground" /></div>
              </div>
            </section>

            {/* COMPANY PROFILES */}
            <section>
              <SectionHeader icon={FolderOpen} title="COMPANY PROFILES" />
              <div className="space-y-2">
                {companyProfiles.map((doc, i) => (
                  <FileUploadRow key={doc.id} doc={doc} label="Company Profile Document"
                    onRemove={() => setCompanyProfiles(prev => prev.filter((_, idx) => idx !== i))}
                    onUpload={n => setCompanyProfiles(prev => prev.map((d, idx) => idx === i ? { ...d, name: n } : d))} />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setCompanyProfiles(prev => [...prev, emptyDoc()])} className="gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Company Profile
                </Button>
              </div>
            </section>

            {/* LEGAL & FINANCIAL */}
            <section>
              <SectionHeader icon={Briefcase} title="LEGAL DOCUMENTS" />
              <div className="space-y-2">
                {legalDocs.map((doc, i) => (
                  <FileUploadRow key={doc.id} doc={doc} label="Legal Document"
                    onRemove={() => setLegalDocs(prev => prev.filter((_, idx) => idx !== i))}
                    onUpload={n => setLegalDocs(prev => prev.map((d, idx) => idx === i ? { ...d, name: n } : d))} />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setLegalDocs(prev => [...prev, emptyDoc()])} className="gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Legal Document
                </Button>
              </div>
            </section>

            <section>
              <SectionHeader icon={DollarSign} title="FINANCIAL DOCUMENTS" />
              <p className="text-xs text-muted-foreground mb-3">Upload budgets, sales reports, financial statements, and other financial documentation.</p>
              <div className="space-y-2">
                {financialDocs.map((doc, i) => (
                  <FileUploadRow key={doc.id} doc={doc} label="Financial Document"
                    onRemove={() => setFinancialDocs(prev => prev.filter((_, idx) => idx !== i))}
                    onUpload={n => setFinancialDocs(prev => prev.map((d, idx) => idx === i ? { ...d, name: n } : d))} />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setFinancialDocs(prev => [...prev, emptyDoc()])} className="gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Financial Document
                </Button>
              </div>
            </section>

            {/* OWNERS */}
            <section>
              <SectionHeader icon={User} title="OWNERS" />
              <div className="space-y-4">
                {owners.map((owner, i) => (
                  <div key={owner.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs text-muted-foreground">Owner #{i + 1}</span>
                      {owners.length > 1 && <button type="button" onClick={() => setOwners(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-destructive hover:bg-destructive/10 rounded"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">Full Name</Label><Input value={owner.name} onChange={e => updateOwner(i, "name", e.target.value)} placeholder="Full Name" className="bg-secondary border-border text-foreground" /></div>
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">Phone</Label><Input value={owner.phone} onChange={e => updateOwner(i, "phone", e.target.value)} placeholder="+20 100 000 0000" className="bg-secondary border-border text-foreground" /></div>
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">Email</Label><Input value={owner.email} onChange={e => updateOwner(i, "email", e.target.value)} placeholder="email@example.com" className="bg-secondary border-border text-foreground" /></div>
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">WhatsApp</Label><Input value={owner.whatsapp} onChange={e => updateOwner(i, "whatsapp", e.target.value)} placeholder="+20 100 000 0000" className="bg-secondary border-border text-foreground" /></div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setOwners(prev => [...prev, emptyOwner()])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Add Owner</Button>
              </div>
            </section>

            {/* KEY PERSONNEL */}
            <section>
              <SectionHeader icon={Users} title="KEY PERSONNEL / TEAM" />
              <div className="space-y-4">
                {team.map((member, i) => (
                  <div key={member.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs text-muted-foreground">Member #{i + 1}</span>
                      <button type="button" onClick={() => setTeam(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-destructive hover:bg-destructive/10 rounded"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">Full Name</Label><Input value={member.name} onChange={e => updateTeamMember(i, "name", e.target.value)} placeholder="Full Name" className="bg-secondary border-border text-foreground" /></div>
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">Position</Label><Input value={member.position} onChange={e => updateTeamMember(i, "position", e.target.value)} placeholder="Position / Title" className="bg-secondary border-border text-foreground" /></div>
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">Phone</Label><Input value={member.phone} onChange={e => updateTeamMember(i, "phone", e.target.value)} placeholder="+20 100 000 0000" className="bg-secondary border-border text-foreground" /></div>
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">Email</Label><Input value={member.email} onChange={e => updateTeamMember(i, "email", e.target.value)} placeholder="email@example.com" className="bg-secondary border-border text-foreground" /></div>
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">WhatsApp</Label><Input value={member.whatsapp} onChange={e => updateTeamMember(i, "whatsapp", e.target.value)} placeholder="+20 100 000 0000" className="bg-secondary border-border text-foreground" /></div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setTeam(prev => [...prev, emptyTeam()])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Add Team Member</Button>
              </div>
            </section>

            {/* PRODUCTS */}
            <section>
              <SectionHeader icon={Package} title="PRODUCTS & SERVICES" />
              <div className="space-y-4">
                {products.map((product, i) => (
                  <div key={product.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs text-muted-foreground">Product #{i + 1}</span>
                      {products.length > 1 && <button type="button" onClick={() => setProducts(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-destructive hover:bg-destructive/10 rounded"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Product Name</Label><Input value={product.name} onChange={e => updateProduct(i, "name", e.target.value)} placeholder="Product / Service Name" className="bg-secondary border-border text-foreground" /></div>
                    <Textarea value={product.description} onChange={e => updateProduct(i, "description", e.target.value)} placeholder="Description" className="bg-secondary border-border min-h-[60px] text-foreground" />
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-md cursor-pointer hover:border-primary transition-colors text-xs font-body text-muted-foreground w-fit">
                      <Upload className="w-3.5 h-3.5" />{product.attachmentName || "Attach File"}
                      <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) updateProduct(i, "attachmentName", f.name); }} />
                    </label>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setProducts(prev => [...prev, emptyProduct()])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Add Product</Button>
              </div>
            </section>

            {/* MARKETING */}
            <section>
              <SectionHeader icon={Megaphone} title="MARKETING PLANS" />
              <div className="space-y-4">
                {marketingPlans.map((plan, i) => (
                  <div key={plan.id} className="p-3 bg-secondary/30 rounded-md border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs text-muted-foreground">Plan #{i + 1}</span>
                      <button type="button" onClick={() => setMarketingPlans(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-destructive hover:bg-destructive/10 rounded"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <Input value={plan.title} onChange={e => updatePlan(i, "title", e.target.value)} placeholder="Plan Title" className="bg-secondary border-border text-foreground" />
                    <Textarea value={plan.description} onChange={e => updatePlan(i, "description", e.target.value)} placeholder="Description" className="bg-secondary border-border min-h-[60px] text-foreground" />
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-md cursor-pointer hover:border-primary transition-colors text-xs font-body text-muted-foreground w-fit">
                      <Upload className="w-3.5 h-3.5" />{plan.attachmentName || "Attach File"}
                      <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) updatePlan(i, "attachmentName", f.name); }} />
                    </label>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setMarketingPlans(prev => [...prev, emptyPlan()])} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Add Marketing Plan</Button>
              </div>
            </section>

            {/* API HUB */}
            <section>
              <EntityApiHub entityName={name || "Brand"} ownerKind="brand" ownerId={id || undefined} />
            </section>

            <Button type="submit" className="w-full gap-2 font-display text-sm tracking-wider">
              <Save className="w-4 h-4" />{isEditing ? "SAVE CHANGES" : "SAVE BRAND"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBrand;
