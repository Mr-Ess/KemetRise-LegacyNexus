import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Zap, Shield, Globe, Sparkles, TrendingUp, ArrowRight, Check } from "lucide-react";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";

export default function Landing() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const features = [
    { icon: Crown, title: t('feature_empire_title'), desc: t('feature_empire_desc') },
    { icon: Sparkles, title: t('feature_ai_title'), desc: t('feature_ai_desc') },
    { icon: Shield, title: t('feature_security_title'), desc: t('feature_security_desc') },
    { icon: Zap, title: t('feature_automation_title'), desc: t('feature_automation_desc') },
    { icon: TrendingUp, title: t('feature_revenue_title'), desc: t('feature_revenue_desc') },
    { icon: Globe, title: t('feature_global_title'), desc: t('feature_global_desc') },
  ];

  const plans = [
    { name: t('plan_starter'), price: "$29", features: [t('plan_1_brand'), t('plan_5_members'), t('plan_basic_analytics'), t('plan_email_support')] },
    { name: t('plan_pro'), price: "$99", popular: true, features: [t('plan_unlimited_brands'), t('plan_20_members'), t('plan_ai_agents'), t('plan_priority_support'), t('plan_api_access')] },
    { name: t('plan_empire'), price: "$299", features: [t('plan_everything_pro'), t('plan_unlimited_team'), t('plan_white_label'), t('plan_sso'), t('plan_csm')] },
  ];

  return (
    <>
    <SEO
      title="KemetRise — Egyptian Cyberpunk Empire Management Platform"
      description="Manage unlimited brands, AI agents, and global operations from one cyberpunk command center. 2FA, automation, and revenue optimization built-in."
      canonical="https://kemetrise.com/landing"
      jsonLd={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "KemetRise", applicationCategory: "BusinessApplication", offers: { "@type": "Offer", price: "29", priceCurrency: "USD" } }}
    />
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="font-display text-lg text-primary tracking-widest">KEMETRISE</div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => nav("/blog")}>{t('blog')}</Button>
          <Button variant="ghost" onClick={() => nav("/pricing")}>{t('pricing')}</Button>
          <Button variant="ghost" onClick={() => nav("/auth")}>{t('sign_in')}</Button>
          <Button onClick={() => nav("/auth")}>{t('get_started')}</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-block px-3 py-1 mb-6 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary">
          {t('hero_badge')}
        </div>
        <h1 className="font-display text-5xl md:text-6xl text-primary mb-6 tracking-tight">
          {t('hero_title')}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('hero_subtitle')}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button size="lg" onClick={() => nav("/auth")}>{t('start_free_trial')} <ArrowRight className="w-4 h-4 ml-2" /></Button>
          <Button size="lg" variant="outline" onClick={() => nav("/pricing")}>{t('view_pricing')}</Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl text-primary text-center mb-12">{t('features_heading')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <Card key={f.title} className="p-6">
                <f.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-display text-lg text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl text-primary text-center mb-12">{t('pricing_heading')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(p => (
              <Card key={p.name} className={`p-6 ${p.popular ? "border-primary border-2" : ""}`}>
                {p.popular && <div className="text-xs text-primary font-bold mb-2">{t('most_popular')}</div>}
                <h3 className="font-display text-2xl text-primary">{p.name}</h3>
                <div className="my-4"><span className="text-4xl font-display text-foreground">{p.price}</span><span className="text-muted-foreground">{t('per_month')}</span></div>
                <ul className="space-y-2 mb-6">
                  {p.features.map(f => <li key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary" />{f}</li>)}
                </ul>
                <Button className="w-full" variant={p.popular ? "default" : "outline"} onClick={() => nav("/auth")}>{t('get_started')}</Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} KemetRise. {t('footer_tagline')}
      </footer>
    </div>
    </>
  );
}
