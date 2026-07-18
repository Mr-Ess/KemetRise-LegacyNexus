import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Copy, Check, Users, DollarSign, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";
import { toast } from "sonner";
import { toAppUrl } from "@/lib/appUrl";

export default function Referrals() {
  const nav = useNavigate();
  const [ref, setRef] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const rows = await tenantDb.select("referrals", { eq: { user_id: user.id }, limit: 1 });
      const data = rows[0] || null;
      if (data) { setRef(data); return; }
      const code = "KEMET-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const created = await tenantDb.insert("referrals", { user_id: user.id, code } as any, { includeClientId: false, includeBrandId: false });
      setRef(created as any);
    })();
  }, []);

  const link = ref ? toAppUrl(`auth?ref=${ref.code}`) : "";

  const copy = () => {
    navigator.clipboard.writeText(link); setCopied(true);
    toast.success("Link copied"); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => nav("/")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <h1 className="font-display text-2xl text-primary mb-2 flex items-center gap-2"><Share2 className="w-5 h-5" />Referral Program</h1>
        <p className="text-sm text-muted-foreground mb-6">Earn ${ref?.reward_amount || 10} for every customer that signs up using your link.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-5">
            <Users className="w-5 h-5 text-primary mb-2" />
            <div className="text-3xl font-display text-foreground">{ref?.total_referred || 0}</div>
            <div className="text-xs text-muted-foreground">Total Referred</div>
          </Card>
          <Card className="p-5">
            <DollarSign className="w-5 h-5 text-primary mb-2" />
            <div className="text-3xl font-display text-foreground">${ref?.total_earned || 0}</div>
            <div className="text-xs text-muted-foreground">Total Earned</div>
          </Card>
          <Card className="p-5">
            <Gift className="w-5 h-5 text-primary mb-2" />
            <div className="text-3xl font-display text-foreground">${ref?.reward_amount || 10}</div>
            <div className="text-xs text-muted-foreground">Per Referral</div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-display text-lg text-primary mb-4">Your Referral Link</h2>
          <div className="flex gap-2">
            <Input readOnly value={link} className="font-mono text-xs" />
            <Button onClick={copy}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="mt-6 p-4 rounded-md bg-secondary/50 text-sm space-y-2">
            <div className="font-medium text-foreground">How it works:</div>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-xs">
              <li>Share your unique link with friends, customers, or audience.</li>
              <li>When they sign up and become paying customers, you earn ${ref?.reward_amount || 10}.</li>
              <li>Rewards are paid out monthly to your linked payment method.</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  );
}
