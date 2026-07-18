import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { Crown, Globe, MapPin, Building2 } from "lucide-react";
import SEO from "@/components/SEO";

const PublicBrand = () => {
  const { id } = useParams<{ id: string }>();
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    tenantDb.select("brands", {
      select: "name,logo_url,website,address,industry,social_links",
      eq: { id },
      limit: 1,
    }).then((rows) => { setBrand((rows as any[])[0] || null); setLoading(false); });
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!brand) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Brand not found or not public</div>;

  const social = (brand.social_links || {}) as Record<string, string>;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${brand.name} — KemetRise`} description={`${brand.industry || "Brand"} · ${brand.address || ""}`} image={brand.logo_url} canonical={typeof window !== "undefined" ? window.location.href : undefined} jsonLd={{ "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.website, logo: brand.logo_url }} />
      <header className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="container mx-auto px-4 py-12 text-center">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.name} className="w-24 h-24 mx-auto rounded-full object-cover gold-glow mb-4" />
          ) : (
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Crown className="w-10 h-10 text-primary" />
            </div>
          )}
          <h1 className="font-display text-3xl text-primary tracking-wider gold-text-glow">{brand.name}</h1>
          {brand.industry && <p className="font-body text-sm text-muted-foreground mt-2">{brand.industry}</p>}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
        {brand.address && (
          <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
            <MapPin className="w-4 h-4 text-primary mt-1" />
            <div><p className="text-xs text-muted-foreground">Address</p><p className="text-sm text-foreground">{brand.address}</p></div>
          </div>
        )}
        {brand.website && (
          <a href={brand.website} target="_blank" rel="noreferrer" className="bg-card border border-border rounded-lg p-4 flex items-start gap-3 hover:border-primary transition-colors">
            <Globe className="w-4 h-4 text-primary mt-1" />
            <div><p className="text-xs text-muted-foreground">Website</p><p className="text-sm text-primary">{brand.website}</p></div>
          </a>
        )}
        {Object.keys(social).length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Social</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(social).filter(([,v]) => v).map(([k,v]) => (
                <a key={k} href={String(v)} target="_blank" rel="noreferrer" className="px-3 py-1 bg-secondary rounded-full text-xs text-foreground hover:bg-primary/20">{k}</a>
              ))}
            </div>
          </div>
        )}
      </main>
      <footer className="text-center py-6 text-xs text-muted-foreground"><Building2 className="w-3 h-3 inline mr-1" /> Powered by KemetRise</footer>
    </div>
  );
};

export default PublicBrand;
