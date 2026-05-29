import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";

const KEY = "kemetrise_onboarded_v1";

export const OnboardingWizard = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [org, setOrg] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profileRows, brandRows] = await Promise.all([
        tenantDb.select("profiles", { select: "display_name", eq: { user_id: user.id }, limit: 1 }),
        tenantDb.select("brands", { select: "id", eq: { user_id: user.id }, limit: 1 }),
      ]);
      const profile = (profileRows as any[])[0] || null;
      const brandCount = (brandRows as any[]).length;
      const hasName = !!profile?.display_name && profile.display_name.trim().length >= 2;
      const hasBrand = (brandCount || 0) > 0;
      const seen = localStorage.getItem(KEY + ":" + user.id);
      if (seen || hasName) {
        localStorage.setItem(KEY + ":" + user.id, "1");
        return;
      }
      setName(profile?.display_name || "");
      setOpen(true);
    })();
  }, [user]);

  const finish = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    try {
      await tenantDb.update("profiles", { display_name: name }, { eq: { user_id: user!.id } }, { includeUserId: false });
      if (org.trim()) {
        await tenantDb.insert("brands", { user_id: user!.id, name: org, status: "active", data: { role } } as any, {
          includeClientId: false,
          includeBrandId: false,
        });
      }
      localStorage.setItem(KEY + ":" + user!.id, "1");
      toast.success("Welcome to KemetRise");
      setOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader><DialogTitle className="font-display text-primary">Welcome — Step {step} of 3</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-2"><Label>Your Name *</Label><Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" placeholder="Pharaoh Admin" /></div>
          )}
          {step === 2 && (
            <div className="space-y-2"><Label>Your Role</Label><Input value={role} onChange={e => setRole(e.target.value)} className="bg-secondary border-border" placeholder="Founder, CEO, Admin..." /></div>
          )}
          {step === 3 && (
            <div className="space-y-2"><Label>First Brand (optional)</Label><Input value={org} onChange={e => setOrg(e.target.value)} className="bg-secondary border-border" placeholder="Your brand or company name" /></div>
          )}
        </div>
        <DialogFooter className="gap-2">
          {step === 1 && <Button variant="ghost" onClick={() => { localStorage.setItem(KEY + ":" + user!.id, "1"); setOpen(false); }}>Skip</Button>}
          {step > 1 && <Button variant="outline" onClick={() => setStep(s => s - 1)}>Back</Button>}
          {step < 3 && <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !name.trim()}>Next</Button>}
          {step === 3 && <Button onClick={finish}>Finish</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
