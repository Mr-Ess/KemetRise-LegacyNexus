import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTenant, SECTOR_META, type SectorCode, type CreateTenantDto } from "@/services/erp/tenantService";
import { useERP } from "@/context/ERPContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

export default function TenantSetupModal({ onClose }: Props) {
  const { refetchTenants, setActiveTenant } = useERP();
  const qc = useQueryClient();

  const [form, setForm] = useState<CreateTenantDto>({
    name: '',
    slug: '',
    sector_code: 'CMP-01',
    subscription_plan: 'starter',
    default_currency: 'USD',
    country_code: 'US',
    timezone: 'UTC',
    primary_color: '#6366f1',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (dto: CreateTenantDto) => createTenant(dto),
    onSuccess: (tenant) => {
      toast.success(`Tenant "${tenant.name}" created! Workflows auto-seeded.`);
      refetchTenants();
      qc.invalidateQueries({ queryKey: ['erp-tenants'] });
      setActiveTenant(tenant);
      onClose();
    },
    onError: (err: Error) => {
      toast.error(`Failed: ${err.message}`);
    },
  });

  const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleNameChange = (v: string) => {
    setForm(f => ({ ...f, name: v, slug: slugify(v) }));
  };

  const sectorMeta = SECTOR_META[form.sector_code];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-2xl border w-full max-w-lg max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold">Create Business Tenant</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Workflows auto-seed based on your sector.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground ml-4 shrink-0 mt-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

        {/* Sector Picker */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Business Sector
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(SECTOR_META) as [SectorCode, typeof SECTOR_META[SectorCode]][])
              .filter(([code]) => code !== 'MULTI' && code !== 'RET-01')
              .map(([code, m]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, sector_code: code, primary_color: m.color }))}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-all ${
                    form.sector_code === code
                      ? 'border-2 shadow-sm'
                      : 'hover:bg-muted/50 border-border'
                  }`}
                  style={form.sector_code === code ? { borderColor: m.color } : {}}
                >
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="font-medium leading-tight">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{code}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              placeholder="e.g. Nile Fitness Club"
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="nile-fitness-club"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={form.default_currency} onValueChange={v => setForm(f => ({ ...f, default_currency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['USD','EUR','GBP','EGP','SAR','AED','KWD'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={form.subscription_plan} onValueChange={v => setForm(f => ({ ...f, subscription_plan: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Live preview */}
        <div
          className="rounded-xl p-4 text-white"
          style={{ background: `linear-gradient(135deg, ${sectorMeta.color}ee, ${sectorMeta.color}77)` }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{sectorMeta.icon}</span>
            <div>
              <p className="font-semibold text-sm">{form.name || 'Business Name'}</p>
              <p className="text-xs opacity-80">{sectorMeta.label} · {form.sector_code} · {form.default_currency}</p>
            </div>
          </div>
        </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-4 border-t shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 gap-2"
            disabled={!form.name || !form.slug || isPending}
            onClick={() => mutate(form)}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Tenant & Seed Workflows
          </Button>
        </div>
      </div>
    </div>
  );
}
