import { useParams, useNavigate } from "react-router-dom";
import { useBrands } from "@/context/BrandsContext";
import { ArrowLeft, Trash2, Pencil, User, Users, Package, FileText, Megaphone, Building2, Briefcase, Phone, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import TeamInvites from "@/components/settings/TeamInvites";
import Comments from "@/components/shared/Comments";
import ActivityTimeline from "@/components/shared/ActivityTimeline";

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 pb-2 border-b border-border mb-4 mt-6">
    <Icon className="w-4 h-4 text-primary" />
    <h2 className="font-display text-sm tracking-wider text-primary">{title}</h2>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-0.5">
    <span className="font-body text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    <p className="font-body text-sm text-foreground">{value || "—"}</p>
  </div>
);

const ContactCard = ({ name, details }: { name: string; details: { icon: React.ElementType; value: string }[] }) => (
  <div className="p-3 bg-secondary/30 rounded-md border border-border space-y-2">
    <p className="font-body text-sm font-medium text-foreground">{name}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {details.filter(d => d.value).map((d, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
          <d.icon className="w-3 h-3 text-primary/60" />
          <span>{d.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const BrandDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBrand, deleteBrand } = useBrands();
  const brand = getBrand(id || "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-display text-primary text-lg">BRAND NOT FOUND</p>
          <Button onClick={() => navigate("/")} variant="outline">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteBrand(brand.id);
      toast.success(`${brand.name} has been deleted`);
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete brand");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-body text-sm">Back to Dashboard</span>
        </button>

        <div className="bg-card border border-border rounded-lg p-6 gold-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name} className="w-10 h-10 rounded-md object-cover border border-border" />}
              <h1 className="font-display text-xl text-primary">⚜ {brand.name.toUpperCase()}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/brands/edit/${brand.id}`)} className="gap-1">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} className="gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>

          {/* General Info */}
          <SectionHeader icon={Building2} title="GENERAL INFORMATION" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Business Address" value={brand.address} />
            <InfoRow label="Industry" value={brand.industry} />
            <InfoRow label="Created" value={new Date(brand.createdAt).toLocaleDateString()} />
          </div>

          {/* Legal & Financial */}
          {(brand.legalDocs.length > 0 || brand.financialDocs.length > 0) && (
            <>
              <SectionHeader icon={Briefcase} title="LEGAL & FINANCIAL DOCUMENTS" />
              {brand.legalDocs.length > 0 && (
                <div className="mb-3">
                  <span className="font-body text-xs text-muted-foreground uppercase tracking-wider">Legal Documents</span>
                  <div className="space-y-1.5 mt-1">
                    {brand.legalDocs.map(d => (
                      <div key={d.id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md border border-border">
                        <FileText className="w-3.5 h-3.5 text-primary/60" />
                        <span className="font-body text-sm text-foreground">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {brand.financialDocs.length > 0 && (
                <div>
                  <span className="font-body text-xs text-muted-foreground uppercase tracking-wider">Financial Documents</span>
                  <div className="space-y-1.5 mt-1">
                    {brand.financialDocs.map(d => (
                      <div key={d.id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md border border-border">
                        <FileText className="w-3.5 h-3.5 text-primary/60" />
                        <span className="font-body text-sm text-foreground">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Owners */}
          {brand.owners.length > 0 && (
            <>
              <SectionHeader icon={User} title="OWNERS" />
              <div className="space-y-2">
                {brand.owners.map(o => (
                  <ContactCard key={o.id} name={o.name} details={[
                    { icon: Phone, value: o.phone },
                    { icon: Mail, value: o.email },
                    { icon: MessageSquare, value: o.whatsapp },
                  ]} />
                ))}
              </div>
            </>
          )}

          {/* Team */}
          {brand.team.length > 0 && (
            <>
              <SectionHeader icon={Users} title="KEY PERSONNEL" />
              <div className="space-y-2">
                {brand.team.map(t => (
                  <ContactCard key={t.id} name={`${t.name} — ${t.position}`} details={[
                    { icon: Phone, value: t.phone },
                    { icon: Mail, value: t.email },
                    { icon: MessageSquare, value: t.whatsapp },
                  ]} />
                ))}
              </div>
            </>
          )}

          {/* Products */}
          {brand.products.length > 0 && (
            <>
              <SectionHeader icon={Package} title="PRODUCTS & SERVICES" />
              <div className="space-y-2">
                {brand.products.map(p => (
                  <div key={p.id} className="p-3 bg-secondary/30 rounded-md border border-border">
                    <p className="font-body text-sm font-medium text-foreground">{p.name}</p>
                    {p.description && <p className="font-body text-xs text-muted-foreground mt-1">{p.description}</p>}
                    {p.attachmentName && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-primary/60 font-body">
                        <FileText className="w-3 h-3" /> {p.attachmentName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Marketing Plans */}
          {brand.marketingPlans.length > 0 && (
            <>
              <SectionHeader icon={Megaphone} title="MARKETING PLANS" />
              <div className="space-y-2">
                {brand.marketingPlans.map(m => (
                  <div key={m.id} className="p-3 bg-secondary/30 rounded-md border border-border">
                    <p className="font-body text-sm font-medium text-foreground">{m.title}</p>
                    {m.description && <p className="font-body text-xs text-muted-foreground mt-1">{m.description}</p>}
                    {m.attachmentName && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-primary/60 font-body">
                        <FileText className="w-3 h-3" /> {m.attachmentName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <SectionHeader icon={FileText} title="TEAM & INVITATIONS" />
          <TeamInvites brandId={brand.id} />
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-display text-sm tracking-wider text-primary mb-3">ACTIVITY TIMELINE</h3>
          <ActivityTimeline table="brands" recordId={brand.id} />
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <Comments entityType="brand" entityId={brand.id} />
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">⚠ DELETE BRAND</DialogTitle>
            <DialogDescription className="font-body text-muted-foreground">
              Are you sure you want to permanently delete <strong className="text-foreground">{brand.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="gap-1" disabled={deleting}><Trash2 className="w-4 h-4" />{deleting ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandDetails;
