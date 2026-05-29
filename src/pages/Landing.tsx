import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Zap, Shield, Globe, Sparkles, TrendingUp, ArrowRight, Check } from "lucide-react";
import SEO from "@/components/SEO";

export default function Landing() {
  const nav = useNavigate();
  const features = [
    { icon: Crown, title: "Empire Management", desc: "Manage unlimited brands, projects, employees, and customers from one dashboard." },
    { icon: Sparkles, title: "AI-Powered Insights", desc: "Predictive analytics, auto-categorization, and intelligent recommendations." },
    { icon: Shield, title: "Enterprise Security", desc: "2FA, IP whitelisting, SSO/SAML, audit logs, and end-to-end encryption." },
    { icon: Zap, title: "Automation Engine", desc: "Webhooks, scheduled tasks, and AI agents that work 24/7." },
    { icon: TrendingUp, title: "Revenue Optimization", desc: "MRR/ARR tracking, churn prediction, and dunning management." },
    { icon: Globe, title: "Global by Default", desc: "Multi-currency, multi-language, white-label, and worldwide infrastructure." },
  ];

  const plans = [
    { name: "Starter", price: "$29", features: ["1 brand", "5 team members", "Basic analytics", "Email support"] },
    { name: "Pro", price: "$99", popular: true, features: ["Unlimited brands", "20 team members", "AI agents", "Priority support", "API access"] },
    { name: "Empire", price: "$299", features: ["Everything in Pro", "Unlimited team", "White label", "SSO/SAML", "Dedicated CSM"] },
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
          <Button variant="ghost" onClick={() => nav("/blog")}>Blog</Button>
          <Button variant="ghost" onClick={() => nav("/pricing")}>Pricing</Button>
          <Button variant="ghost" onClick={() => nav("/auth")}>Sign In</Button>
          <Button onClick={() => nav("/auth")}>Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-block px-3 py-1 mb-6 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary">
          ⚡ Egyptian Cyberpunk OS for Modern Empires
        </div>
        <h1 className="font-display text-5xl md:text-6xl text-primary mb-6 tracking-tight">
          Build Your Digital Empire
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          KemetRise is the all-in-one platform to run your brands, automate operations, and scale revenue — powered by AI agents and enterprise-grade security.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button size="lg" onClick={() => nav("/auth")}>Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Button>
          <Button size="lg" variant="outline" onClick={() => nav("/pricing")}>View Pricing</Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl text-primary text-center mb-12">Everything you need to scale</h2>
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
          <h2 className="font-display text-3xl text-primary text-center mb-12">Simple, transparent pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(p => (
              <Card key={p.name} className={`p-6 ${p.popular ? "border-primary border-2" : ""}`}>
                {p.popular && <div className="text-xs text-primary font-bold mb-2">MOST POPULAR</div>}
                <h3 className="font-display text-2xl text-primary">{p.name}</h3>
                <div className="my-4"><span className="text-4xl font-display text-foreground">{p.price}</span><span className="text-muted-foreground">/mo</span></div>
                <ul className="space-y-2 mb-6">
                  {p.features.map(f => <li key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary" />{f}</li>)}
                </ul>
                <Button className="w-full" variant={p.popular ? "default" : "outline"} onClick={() => nav("/auth")}>Get Started</Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} KemetRise. Built for empires.
      </footer>
    </div>
    </>
  );
}
