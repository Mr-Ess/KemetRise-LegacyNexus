import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target, Heart, Users, Globe, Award, TrendingUp,
  Rocket, Shield, Code2, ArrowRight, CheckCircle, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible: v };
}

const TEAM = [
  { name: "Youssef El-Sayed",  nameAr: "يوسف السيد",   role: "CEO & Founder",       roleAr: "المدير التنفيذي والمؤسس",   avatar: "YE", bg: "bg-primary/20", color: "text-primary" },
  { name: "Mona Ibrahim",      nameAr: "منى إبراهيم",   role: "CTO",                 roleAr: "مدير التقنية",               avatar: "MI", bg: "bg-indigo-500/20", color: "text-indigo-400" },
  { name: "Kareem Nasser",     nameAr: "كريم ناصر",    role: "Head of Product",      roleAr: "رئيس المنتج",                avatar: "KN", bg: "bg-emerald-500/20", color: "text-emerald-400" },
  { name: "Dina Fouad",        nameAr: "دينا فؤاد",    role: "Head of Marketing",    roleAr: "رئيسة التسويق",              avatar: "DF", bg: "bg-pink-500/20", color: "text-pink-400" },
];

const VALUES = [
  { icon: Target,  en: "Mission-Driven",    ar: "موجه بالرسالة",    desc_en: "Every feature serves a purpose aligned with our mission to empower businesses.",     desc_ar: "كل ميزة تخدم هدفاً متوافقاً مع رسالتنا لتمكين الأعمال." },
  { icon: Heart,   en: "Human-Centered",    ar: "محوره الإنسان",    desc_en: "We design for real people with real problems, in both Arabic and English.",           desc_ar: "نصمم لأناس حقيقيين بمشاكل حقيقية، بالعربية والإنجليزية." },
  { icon: Shield,  en: "Security First",    ar: "الأمان أولاً",     desc_en: "Multi-layer RLS security ensures your data never leaks across tenants.",             desc_ar: "أمان متعدد الطبقات يضمن عدم تسرب بياناتك عبر المستأجرين." },
  { icon: Rocket,  en: "Relentless Growth", ar: "نمو مستمر",        desc_en: "We ship fast, iterate faster, and stay ahead of the industry.",                      desc_ar: "نشحن بسرعة، ونكرر بسرعة أكبر، ونبقى في المقدمة." },
];

const MILESTONES = [
  { year: "2024", en: "Founded in Cairo, Egypt with a vision to unify enterprise tools.", ar: "تأسست في القاهرة بهدف توحيد أدوات المؤسسات." },
  { year: "Q1 2025", en: "First 50 enterprise clients onboarded across 4 sectors.", ar: "أول 50 عميل مؤسسي في 4 قطاعات." },
  { year: "Q2 2025", en: "AI Chat agents launched — 70% query deflection rate.", ar: "إطلاق وكلاء AI — معدل انحراف 70% للاستفسارات." },
  { year: "Q4 2025", en: "Full ERP + HR module released with QR biometric attendance.", ar: "إصدار وحدة ERP + HR الكاملة مع الحضور البيومتري QR." },
  { year: "2026", en: "8-portal architecture deployed — Legacy Nexus edition launched.", ar: "نشر معمارية 8 بوابات — إصدار Legacy Nexus." },
];

export default function PublicAbout() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const R = i18n.language === "ar";
  const heroRev = useReveal();
  const teamRev = useReveal();
  const timelineRev = useReveal();

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: "linear-gradient(hsl(42 85% 55%) 1px, transparent 1px), linear-gradient(90deg, hsl(42 85% 55%) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
        </div>
        <div ref={heroRev.ref} className={cn("max-w-4xl mx-auto px-4 text-center transition-all duration-700", heroRev.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-xs gap-2">
            <Globe className="w-3.5 h-3.5" />{R ? "عن KemetRise" : "About KemetRise"}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-display font-black mb-6 leading-tight">
            {R ? "بُنيت في مصر،" : "Built in Egypt,"}<br />
            <span className="text-primary gold-text-glow">{R ? "لخدمة العالم" : "Built for the World"}</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {R
              ? "KemetRise: Legacy Nexus هي منصة SaaS + ERP موحدة تجمع ثمانية بوابات متخصصة في نظام واحد، مصممة لتمكين الشركات من أي حجم في أي صناعة."
              : "KemetRise: Legacy Nexus is a unified SaaS + ERP platform that combines eight specialized portals into one system, designed to empower businesses of any size in any industry."}
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-secondary/10 border-y border-border/30">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-8">
          {[
            { icon: Target,  titleEn: "Our Mission",  titleAr: "رسالتنا",    textEn: "To unify every business operation — from HR attendance to AI chat — in one platform accessible to every company, in every language.",   textAr: "توحيد كل عملية تجارية — من الحضور HR إلى المحادثة AI — في منصة واحدة لكل شركة بكل لغة.",  color: "text-primary", border: "border-primary/20", bg: "bg-primary/5" },
            { icon: Zap,     titleEn: "Our Vision",   titleAr: "رؤيتنا",    textEn: "To become the leading multi-tenant enterprise OS for the MENA region — where every business runs on a single, intelligent system.",          textAr: "أن نكون نظام تشغيل المؤسسات الموحد الرائد في منطقة الشرق الأوسط وشمال أفريقيا.",              color: "text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-500/5" },
          ].map(item => (
            <Card key={item.titleEn} className={cn("border", item.border, item.bg)}>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-background border border-border">
                  <item.icon className={cn("w-6 h-6", item.color)} />
                </div>
                <h3 className="text-lg font-display font-bold mb-3">{R ? item.titleAr : item.titleEn}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{R ? item.textAr : item.textEn}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-black">{R ? "قيمنا الأساسية" : "Our Core Values"}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(v => (
              <div key={v.en} className="p-5 rounded-2xl border border-border/40 hover:border-primary/20 bg-secondary/10 hover:-translate-y-1 transition-all">
                <v.icon className="w-8 h-8 text-primary mb-4" />
                <h4 className="text-sm font-bold mb-2">{R ? v.ar : v.en}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{R ? v.desc_ar : v.desc_en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-secondary/10 border-y border-border/30">
        <div ref={timelineRev.ref} className="max-w-3xl mx-auto px-4">
          <div className={cn("text-center mb-12 transition-all duration-700", timelineRev.visible ? "opacity-100" : "opacity-0")}>
            <h2 className="text-3xl font-display font-black">{R ? "رحلتنا" : "Our Journey"}</h2>
          </div>
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />
            <div className={cn("space-y-8 transition-all duration-700 delay-200", timelineRev.visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4")}>
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center shrink-0 gold-glow">
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="pt-1 pb-4">
                    <Badge className="mb-2 text-[10px] bg-primary/10 text-primary border-primary/20 px-2">{m.year}</Badge>
                    <p className="text-sm text-muted-foreground">{R ? m.ar : m.en}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div ref={teamRev.ref} className="max-w-4xl mx-auto px-4">
          <div className={cn("text-center mb-12 transition-all duration-700", teamRev.visible ? "opacity-100" : "opacity-0")}>
            <h2 className="text-3xl font-display font-black">{R ? "فريقنا القيادي" : "Our Leadership Team"}</h2>
          </div>
          <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-5 transition-all duration-700 delay-200", teamRev.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {TEAM.map(member => (
              <div key={member.name} className="text-center p-5 rounded-2xl border border-border/40 hover:border-primary/20 bg-secondary/10 hover:-translate-y-1 transition-all">
                <div className={cn("w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-lg font-display font-black mb-3", member.bg, member.color)}>
                  {member.avatar}
                </div>
                <p className="text-sm font-bold">{R ? member.nameAr : member.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{R ? member.roleAr : member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-3xl font-display font-black mb-4">{R ? "انضم إلى رحلتنا" : "Join Our Journey"}</h2>
          <p className="text-muted-foreground mb-8">{R ? "كن جزءاً من منظومة KemetRise المتنامية." : "Be part of the growing KemetRise ecosystem."}</p>
          <Button size="lg" onClick={() => navigate("/auth?tab=signup")} className="gap-2 gold-glow">
            <Rocket className="w-5 h-5" />{R ? "ابدأ مجاناً" : "Get Started Free"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
