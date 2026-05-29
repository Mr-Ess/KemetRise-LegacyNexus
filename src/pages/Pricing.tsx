import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { plansApi, type Plan } from "@/services/billing";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [interval, setIntervalSel] = useState<"monthly" | "yearly" | "lifetime">("monthly");

  useEffect(() => { plansApi.listPublic().then(setPlans).catch(() => {}); }, []);

  const filtered = plans.filter(p => p.interval === interval || (interval === "monthly" && p.price === 0));

  const select = (p: Plan) => {
    if (!user) { navigate("/auth?redirect=/checkout?plan=" + p.id); return; }
    navigate(`/checkout?plan=${p.id}`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-display text-primary uppercase">
            <Sparkles className="w-3 h-3" /> Choose Your Pharaoh Path
          </div>
          <h1 className="font-display text-2xl md:text-4xl text-primary">{t("pricing")}</h1>
          <p className="text-muted-foreground text-sm">{t("choose_plan")}</p>
          <div className="inline-flex rounded-lg border border-border p-1 bg-secondary/30">
            {(["monthly", "yearly", "lifetime"] as const).map(i => (
              <button key={i} onClick={() => setIntervalSel(i)}
                className={`px-4 py-1.5 rounded-md text-xs font-display uppercase transition-colors ${interval === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t(i)}{i === "yearly" && <span className="ml-1 text-[9px] text-scarab">-20%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id} className={`relative rounded-xl border p-6 flex flex-col ${p.highlighted ? "border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-[0_0_30px_-10px_hsl(var(--primary))]" : "border-border bg-secondary/30"}`}>
              {p.badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-display uppercase whitespace-nowrap">{p.badge}</span>}
              <Crown className={`w-6 h-6 mb-2 ${p.highlighted ? "text-primary" : "text-muted-foreground"}`} />
              <h3 className="font-display text-lg text-foreground">{p.name}</h3>
              <div className="my-3">
                <span className="font-display text-3xl text-primary">{p.price === 0 ? t("free_plan").toUpperCase() : `${p.currency} ${p.price}`}</span>
                {p.price > 0 && <span className="text-xs text-muted-foreground"> /{t(p.interval as any)}</span>}
              </div>
              <ul className="space-y-2 flex-1 mb-4">
                {p.features.map((f, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><Check className="w-3.5 h-3.5 text-scarab mt-0.5 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button onClick={() => select(p)} className="font-display text-xs" variant={p.highlighted ? "default" : "outline"}>
                {p.price === 0 ? t("subscribe") : t("subscribe")}
              </Button>
            </div>
          ))}
          {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">{t("no_results")}</p>}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
