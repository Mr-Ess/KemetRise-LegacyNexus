import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PublicLayout from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Zap, Shield, Globe, BarChart3, Users, Layers,
  CheckCircle, Star, TrendingUp, Building2, MessageSquare,
  ShoppingBag, GraduationCap, Award, ChevronRight,
  Stethoscope, Scale, Briefcase, ShoppingCart, Cpu, Play,
  ChevronDown, Sparkles, Rocket, Lock, Code2, HeartHandshake,
  Bot, Wallet, PieChart, MapPin, Phone, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* â”€â”€â”€ Animated Counter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Counter({ to, suffix = "", duration = 2000 }: { to: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setCount(Math.floor(p * p * to));
          if (p < 1) requestAnimationFrame(tick);
          else setCount(to);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* â”€â”€â”€ Floating Particle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  size: Math.random() * 3 + 1,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 6,
  dur: 4 + Math.random() * 6,
  opacity: 0.15 + Math.random() * 0.4,
}));

/* â”€â”€â”€ Scroll Reveal Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

const FEATURES = [
  { icon: Layers,        ar: "Ù…ØµÙ†Ø¹ Ø§Ù„Ù‚Ø·Ø§Ø¹Ø§Øª",     en: "Sector Factory",        desc_ar: "ØªÙØ¹ÙŠÙ„ Ù‚Ø·Ø§Ø¹Ø§Øª Ù…ØªØ®ØµØµØ© Ø¨Ù„Ù…Ø³Ø© ÙˆØ§Ø­Ø¯Ø©",    desc_en: "Activate specialized sectors instantly",       color: "from-primary/20 to-primary/5",   border: "border-primary/20",  glow: "#D4A017" },
  { icon: Building2,     ar: "Ø¨ÙŠØ¦Ø§Øª Ø´Ø±ÙƒØ§Ø¡ Ù…Ø¹Ø²ÙˆÙ„Ø©", en: "Partner Workspaces",    desc_ar: "ÙƒÙ„ Ø´Ø±ÙŠÙƒ ÙÙŠ Ø¨ÙŠØ¦Ø© Ø¹Ù…Ù„ Ù…Ø¹Ø²ÙˆÙ„Ø© ÙˆÙ…Ø­Ù…ÙŠØ©", desc_en: "Every partner in an isolated workspace",       color: "from-indigo-500/20 to-indigo-500/5", border: "border-indigo-500/20", glow: "#6366F1" },
  { icon: Bot,           ar: "ÙˆÙƒÙ„Ø§Ø¡ Ø°ÙƒØ§Ø¡ Ø§ØµØ·Ù†Ø§Ø¹ÙŠ", en: "AI Brand Agents",       desc_ar: "ÙˆÙƒÙ„Ø§Ø¡ AI Ù…Ø®ØµØµÙˆÙ† Ù„ÙƒÙ„ Ø¹Ù„Ø§Ù…Ø© ØªØ¬Ø§Ø±ÙŠØ©",  desc_en: "Custom AI agents per brand",                   color: "from-cyan-500/20 to-cyan-500/5", border: "border-cyan-500/20", glow: "#06B6D4" },
  { icon: Wallet,        ar: "Ù…Ø­ÙØ¸Ø© Ø§Ù„Ø¨Ø§Ø¦Ø¹ÙŠÙ†",      en: "Vendor Wallet",         desc_ar: "ØªØ³ÙˆÙŠØ© Ù…Ø§Ù„ÙŠØ© Ø¢Ù†ÙŠØ© Ù…Ø¹ Ø®ØµÙ… Ø±Ø³ÙˆÙ… ØªÙ„Ù‚Ø§Ø¦ÙŠ",desc_en: "Real-time settlement with auto fees",          color: "from-orange-500/20 to-orange-500/5", border: "border-orange-500/20", glow: "#F97316" },
  { icon: BarChart3,     ar: "ØªØ­Ù„ÙŠÙ„Ø§Øª ÙˆØªÙ‚Ø§Ø±ÙŠØ±",     en: "Analytics & Reports",   desc_ar: "Kanban + ROI + ØªÙ‚Ø§Ø±ÙŠØ± Ù…Ø¨Ø§Ø´Ø±Ø©",       desc_en: "Kanban pipeline with ROI reporting",           color: "from-pink-500/20 to-pink-500/5", border: "border-pink-500/20", glow: "#EC4899" },
  { icon: Shield,        ar: "Ø£Ù…Ø§Ù† Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ø·Ø¨Ù‚Ø§Øª",  en: "Multi-layer Security",  desc_ar: "RLS + Ø£Ø¯ÙˆØ§Ø± + ØµÙ„Ø§Ø­ÙŠØ§Øª + Ù…Ø±Ø§Ø¬Ø¹Ø©",    desc_en: "RLS + roles + permissions + audit",           color: "from-red-500/20 to-red-500/5",   border: "border-red-500/20",  glow: "#EF4444" },
  { icon: Globe,         ar: "Ø¯Ø¹Ù… Ø«Ù†Ø§Ø¦ÙŠ Ø§Ù„Ù„ØºØ©",     en: "Bilingual Support",     desc_ar: "ÙˆØ§Ø¬Ù‡Ø© ÙƒØ§Ù…Ù„Ø© Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© ÙˆØ§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©",  desc_en: "Full Arabic & English interface",             color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20", glow: "#3B82F6" },
  { icon: Code2,         ar: "API Ù…ÙØªÙˆØ­Ø©",          en: "Open APIs",             desc_ar: "ØªÙƒØ§Ù…Ù„ ÙƒØ§Ù…Ù„ Ù…Ø¹ Ø£Ù†Ø¸Ù…Ø© Ø®Ø§Ø±Ø¬ÙŠØ©",        desc_en: "Full integration with external systems",      color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", glow: "#10B981" },
];

const SECTORS = [
  { icon: Stethoscope, label: "Medical",    ar: "Ø§Ù„Ø·Ø¨",      color: "#EF4444", bg: "bg-red-500/10" },
  { icon: Layers,      label: "Education",  ar: "Ø§Ù„ØªØ¹Ù„ÙŠÙ…",   color: "#8B5CF6", bg: "bg-violet-500/10" },
  { icon: Scale,       label: "Legal",      ar: "Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†",   color: "#6366F1", bg: "bg-indigo-500/10" },
  { icon: Briefcase,   label: "Services",   ar: "Ø§Ù„Ø®Ø¯Ù…Ø§Øª",   color: "#EC4899", bg: "bg-pink-500/10" },
  { icon: ShoppingCart,label: "Retail",     ar: "Ø§Ù„ØªØ¬Ø²Ø¦Ø©",   color: "#F97316", bg: "bg-orange-500/10" },
  { icon: TrendingUp,  label: "Financial",  ar: "Ø§Ù„Ù…Ø§Ù„ÙŠØ©",   color: "#F59E0B", bg: "bg-yellow-500/10" },
  { icon: GraduationCap,label:"Courses",    ar: "Ø§Ù„Ø¯ÙˆØ±Ø§Øª",   color: "#14B8A6", bg: "bg-teal-500/10" },
  { icon: Building2,   label: "Tourism",    ar: "Ø§Ù„Ø³ÙŠØ§Ø­Ø©",   color: "#10B981", bg: "bg-emerald-500/10" },
  { icon: Cpu,         label: "Tech",       ar: "Ø§Ù„ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§",color: "#0EA5E9", bg: "bg-sky-500/10" },
  { icon: HeartHandshake,label:"Consulting",ar: "Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø§Øª",color: "#A855F7", bg: "bg-purple-500/10" },
];

const PRICING = [
  {
    code: "free",     name: "Free",       nameAr: "Ù…Ø¬Ø§Ù†ÙŠ",     price: 0,
    features_en: ["Marketplace access", "5 products", "Basic analytics", "Community support"],
    features_ar: ["ÙˆØµÙˆÙ„ Ù„Ù„Ø³ÙˆÙ‚", "5 Ù…Ù†ØªØ¬Ø§Øª", "ØªØ­Ù„ÙŠÙ„Ø§Øª Ø£Ø³Ø§Ø³ÙŠØ©", "Ø¯Ø¹Ù… Ø§Ù„Ù…Ø¬ØªÙ…Ø¹"],
    color: "border-border", badge: "", cta_en: "Start Free", cta_ar: "Ø§Ø¨Ø¯Ø£ Ù…Ø¬Ø§Ù†Ø§Ù‹",
  },
  {
    code: "starter",  name: "Starter",    nameAr: "Ù…Ø¨ØªØ¯Ø¦",     price: 9.99,
    features_en: ["50 products", "Orders management", "Wallet & payouts", "Email support"],
    features_ar: ["50 Ù…Ù†ØªØ¬", "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø·Ù„Ø¨Ø§Øª", "Ø§Ù„Ù…Ø­ÙØ¸Ø© ÙˆØ§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª", "Ø¯Ø¹Ù… Ø¨Ø±ÙŠØ¯ÙŠ"],
    color: "border-blue-500/40", badge: "", cta_en: "Get Started", cta_ar: "Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø¢Ù†",
  },
  {
    code: "pro",      name: "Pro",        nameAr: "Ø§Ø­ØªØ±Ø§ÙÙŠ",   price: 29.99,
    features_en: ["Unlimited products", "Partner workspace", "AI chat agents", "Analytics dashboard", "API access"],
    features_ar: ["Ù…Ù†ØªØ¬Ø§Øª Ù„Ø§ Ù…Ø­Ø¯ÙˆØ¯Ø©", "Ø¨ÙŠØ¦Ø© Ø´Ø±ÙŠÙƒ", "ÙˆÙƒÙ„Ø§Ø¡ AI", "Ù„ÙˆØ­Ø© ØªØ­Ù„ÙŠÙ„Ø§Øª", "API"],
    color: "border-primary/50", badge: "Popular", cta_en: "Go Pro", cta_ar: "ØªØ±Ù‚ÙŠØ© Ø§Ø­ØªØ±Ø§ÙÙŠØ©",
  },
  {
    code: "enterprise", name: "Enterprise", nameAr: "Ù…Ø¤Ø³Ø³ÙŠ",   price: 99.99,
    features_en: ["Everything in Pro", "Custom sectors", "HR & ERP module", "Dedicated support", "White-label option", "SLA 99.9%"],
    features_ar: ["ÙƒÙ„ Ù…Ø§ ÙÙŠ Pro", "Ù‚Ø·Ø§Ø¹Ø§Øª Ù…Ø®ØµØµØ©", "ÙˆØ­Ø¯Ø© HR ÙˆERP", "Ø¯Ø¹Ù… Ø­ØµØ±ÙŠ", "Ø¹Ù„Ø§Ù…Ø© Ø¨ÙŠØ¶Ø§Ø¡", "Ø¶Ù…Ø§Ù† 99.9%"],
    color: "border-purple-500/40", badge: "Best Value", cta_en: "Contact Sales", cta_ar: "ØªÙˆØ§ØµÙ„ Ù„Ù„Ø¨ÙŠØ¹",
  },
];

const STEPS = [
  { num: "01", icon: Rocket,        titleEn: "Create Account",    titleAr: "Ø£Ù†Ø´Ø¦ Ø­Ø³Ø§Ø¨Ø§Ù‹",       descEn: "Sign up in 60 seconds, choose your role and sector.",          descAr: "Ø³Ø¬Ù‘Ù„ ÙÙŠ 60 Ø«Ø§Ù†ÙŠØ© ÙˆØ§Ø®ØªØ± Ø¯ÙˆØ±Ùƒ ÙˆÙ‚Ø·Ø§Ø¹Ùƒ." },
  { num: "02", icon: Layers,        titleEn: "Configure Portal",  titleAr: "Ù‡ÙŠÙ‘Ø¦ Ø¨ÙˆØ§Ø¨ØªÙƒ",       descEn: "Activate sectors, add brands, configure your workspace.",       descAr: "ÙØ¹Ù‘Ù„ Ø§Ù„Ù‚Ø·Ø§Ø¹Ø§Øª ÙˆØ£Ø¶Ù Ø¨Ø±Ø§Ù†Ø¯Ø§Øª ÙˆÙ‡ÙŠÙ‘Ø¦ Ù…Ø³Ø§Ø­Ø© Ø¹Ù…Ù„Ùƒ." },
  { num: "03", icon: TrendingUp,    titleEn: "Grow & Scale",       titleAr: "Ø§Ù†Ù…Ù ÙˆØªÙˆØ³Ù‘Ø¹",       descEn: "Use AI agents, manage team & finances, and scale globally.",     descAr: "Ø§Ø³ØªØ®Ø¯Ù… ÙˆÙƒÙ„Ø§Ø¡ Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ ÙˆØ§Ø¯Ø± Ø§Ù„ÙØ±ÙŠÙ‚ ÙˆØ§Ù„Ù…Ø§Ù„ÙŠØ©." },
];

const TESTIMONIALS = [
  { name: "Ahmed Khaled",    nameAr: "Ø£Ø­Ù…Ø¯ Ø®Ø§Ù„Ø¯",    role: "E-commerce Director",  roleAr: "Ù…Ø¯ÙŠØ± Ø§Ù„ØªØ¬Ø§Ø±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©",  text_en: "KemetRise unified our 12 brands into one dashboard. Revenue tracking is flawless.",        text_ar: "ÙˆØ­Ù‘Ø¯Øª KemetRise 12 Ø¹Ù„Ø§Ù…Ø© ØªØ¬Ø§Ø±ÙŠØ© ÙÙŠ Ù„ÙˆØ­Ø© ÙˆØ§Ø­Ø¯Ø©. ØªØªØ¨Ø¹ Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª Ù„Ø§ ØªØ´ÙˆØ¨Ù‡ Ø´Ø§Ø¦Ø¨Ø©.",      avatar: "AK" },
  { name: "Sara Al-Nour",   nameAr: "Ø³Ø§Ø±Ø© Ø§Ù„Ù†ÙˆØ±",   role: "Startup Founder",       roleAr: "Ù…Ø¤Ø³Ø³Ø© Ø´Ø±ÙƒØ© Ù†Ø§Ø´Ø¦Ø©",         text_en: "The AI agents handle 70% of our customer queries automatically. Game changer.",            text_ar: "ÙˆÙƒÙ„Ø§Ø¡ Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ ÙŠØªØ¹Ø§Ù…Ù„ÙˆÙ† Ù…Ø¹ 70% Ù…Ù† Ø§Ø³ØªÙØ³Ø§Ø±Ø§Øª Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø¢Ù„ÙŠØ§Ù‹. ØªØºÙŠÙŠØ± Ø¬Ø°Ø±ÙŠ.",        avatar: "SN" },
  { name: "Omar Fawzi",     nameAr: "Ø¹Ù…Ø± ÙÙˆØ²ÙŠ",     role: "Operations Manager",    roleAr: "Ù…Ø¯ÙŠØ± Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª",             text_en: "HR attendance via QR codes + ERP ledger saved us 3 days per month in admin work.",          text_ar: "Ø§Ù„Ø­Ø¶ÙˆØ± Ø¹Ø¨Ø± QR ÙˆØ¯ÙØªØ± Ø§Ù„Ø£Ø³ØªØ§Ø° ERP ÙˆÙÙ‘Ø±Ø§ Ù„Ù†Ø§ 3 Ø£ÙŠØ§Ù… Ø´Ù‡Ø±ÙŠØ§Ù‹ Ù…Ù† Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ.",            avatar: "OF" },
  { name: "Lina Rashid",    nameAr: "Ù„ÙŠÙ†Ø§ Ø±Ø§Ø´Ø¯",    role: "Marketing Lead",        roleAr: "Ù‚ÙŠØ§Ø¯Ø© Ø§Ù„ØªØ³ÙˆÙŠÙ‚",             text_en: "The Kanban leads pipeline and campaign analytics boosted our conversion by 40%.",            text_ar: "Ø®Ø· Ø£Ù†Ø§Ø¨ÙŠØ¨ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ ÙˆØªØ­Ù„ÙŠÙ„Ø§Øª Ø§Ù„Ø­Ù…Ù„Ø§Øª Ø±ÙØ¹Ø§ Ù…Ø¹Ø¯Ù„ ØªØ­ÙˆÙŠÙ„Ù†Ø§ Ø¨Ù†Ø³Ø¨Ø© 40%.",                      avatar: "LR" },
];

export default function PublicLanding() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const R = i18n.language === "ar";
  const [activeTab, setActiveTab] = useState<"monthly" | "annual">("monthly");
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const heroReveal = useReveal();
  const statsReveal = useReveal();
  const featuresReveal = useReveal();
  const sectorsReveal = useReveal();
  const pricingReveal = useReveal();

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <PublicLayout>
      {/* â•â• 1. HERO â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Particle background */}
        <div className="absolute inset-0 pointer-events-none">
          {PARTICLES.map((p, i) => (
            <div key={i} className="absolute rounded-full bg-primary"
              style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, opacity: p.opacity,
                animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite` }} />
          ))}
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[100px] animate-glow-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/8 rounded-full blur-[80px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px]" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(hsl(42 85% 55%) 1px, transparent 1px), linear-gradient(90deg, hsl(42 85% 55%) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 text-center w-full">
          {/* Badge */}
          <div ref={heroReveal.ref} className={cn("transition-all duration-700", heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <Badge className="mb-6 px-5 py-2 bg-primary/10 text-primary border-primary/30 text-xs font-semibold gap-2 animate-glow-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              {R ? "Ø§Ù„Ù…Ù†ØµØ© Ø§Ù„Ù…ÙˆØ­Ø¯Ø© Ù…ØªØ¹Ø¯Ø¯Ø© Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø±ÙŠÙ† Â· SaaS + ERP" : "Unified Multi-Tenant SaaS & ERP Platform"}
            </Badge>
          </div>

          {/* Headline */}
          <div className={cn("transition-all duration-700 delay-150", heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black leading-none mb-4">
              <span className="text-foreground">Kemet</span>
              <span className="text-primary gold-text-glow">Rise</span>
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground font-light tracking-widest mb-2 font-display">
              LEGACY NEXUS
            </p>
          </div>

          {/* Sub-headline */}
          <div className={cn("transition-all duration-700 delay-300 max-w-3xl mx-auto", heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <p className="text-base md:text-xl text-muted-foreground leading-relaxed mt-6 mb-10">
              {R
                ? "Ø«Ù…Ø§Ù†ÙŠØ© Ø¨ÙˆØ§Ø¨Ø§Øª Ù…ÙˆØ­Ø¯Ø© ÙÙŠ Ù†Ø¸Ø§Ù… ÙˆØ§Ø­Ø¯ â€” Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©ØŒ ERPØŒ Ø§Ù„Ù…ØªØ¬Ø±ØŒ Ø§Ù„ØªØ³ÙˆÙŠÙ‚ØŒ Ø§Ù„ÙˆÙƒÙ„Ø§Ø¡ØŒ Ø§Ù„Ø´Ø±ÙƒØ§Ø¡ØŒ ÙˆØ§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ â€” ÙƒÙ„ Ø´ÙŠØ¡ Ù…ØªØ±Ø§Ø¨Ø·."
                : "Eight unified portals in one system â€” HR, ERP, commerce, marketing, agents, partners & AI â€” all interconnected."}
            </p>
          </div>

          {/* CTAs */}
          <div className={cn("flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-500", heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {user ? (
              <Button size="lg" onClick={() => navigate("/portal")} className="gap-2 text-base px-10 gold-glow hover:gold-glow-strong transition-shadow">
                {R ? "Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…" : "Go to Dashboard"} <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate("/auth?tab=signup")} className="gap-2 text-base px-10 gold-glow hover:gold-glow-strong transition-all">
                  <Rocket className="w-5 h-5" />
                  {R ? "Ø§Ø¨Ø¯Ø£ Ù…Ø¬Ø§Ù†Ø§Ù‹ Ø§Ù„Ø¢Ù†" : "Start Free Today"}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/about")} className="text-base px-10 gap-2 border-primary/30 hover:border-primary/60">
                  <Play className="w-4 h-4" />
                  {R ? "Ø§ÙƒØªØ´Ù Ø§Ù„Ù…Ù†ØµØ©" : "Explore Platform"}
                </Button>
              </>
            )}
          </div>

          {/* Stats bar */}
          <div ref={statsReveal.ref} className={cn("mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto transition-all duration-700", statsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {[
              { val: 8,    suffix: "",    labelEn: "Unified Portals",    labelAr: "Ø¨ÙˆØ§Ø¨Ø© Ù…ÙˆØ­Ø¯Ø©" },
              { val: 10,   suffix: "+",   labelEn: "Active Sectors",     labelAr: "Ù‚Ø·Ø§Ø¹ Ù†Ø´Ø·" },
              { val: 99,   suffix: ".9%", labelEn: "Uptime SLA",         labelAr: "Ø¶Ù…Ø§Ù† Ø§Ù„ÙˆÙ‚Øª" },
              { val: 100,  suffix: "%",   labelEn: "Bilingual",          labelAr: "Ø«Ù†Ø§Ø¦ÙŠ Ø§Ù„Ù„ØºØ©" },
            ].map(s => (
              <div key={s.labelEn} className="text-center p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-all">
                <p className="text-3xl font-display font-black text-primary gold-text-glow">
                  <Counter to={s.val} suffix={s.suffix} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">{R ? s.labelAr : s.labelEn}</p>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 flex justify-center animate-bounce opacity-40">
            <ChevronDown className="w-6 h-6 text-primary" />
          </div>
        </div>
      </section>

      {/* â•â• 2. LOGO MARQUEE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-8 border-y border-border/30 bg-secondary/10 overflow-hidden">
        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">
          {R ? "Ù‚Ø·Ø§Ø¹Ø§Øª Ù…Ø¯Ø¹ÙˆÙ…Ø©" : "Supported Sectors"}
        </p>
        <div className="flex gap-12 animate-marquee whitespace-nowrap" style={{ width: "max-content" }}>
          {[...SECTORS, ...SECTORS].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 opacity-50 hover:opacity-100 transition-opacity">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.bg)}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <span className="text-sm font-medium">{R ? s.ar : s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* â•â• 3. FEATURES GRID â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div ref={featuresReveal.ref} className={cn("text-center mb-16 transition-all duration-700", featuresReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "Ø§Ù„Ù…ÙŠØ²Ø§Øª" : "Features"}</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
              {R ? "ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬Ù‡ ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯" : "Everything You Need, One Platform"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {R ? "Ø«Ù…Ø§Ù†ÙŠØ© Ø£Ù†Ø¸Ù…Ø© Ù…ØªÙƒØ§Ù…Ù„Ø© ØªØ¹Ù…Ù„ Ù…Ø¹Ø§Ù‹ Ø¹Ù„Ù‰ Ù‚Ø§Ø¹Ø¯Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ù…ÙˆØ­Ø¯Ø© Ù…Ø¹ Ø£Ù…Ø§Ù† Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ø·Ø¨Ù‚Ø§Øª" : "Eight integrated systems on a unified database with multi-layer security"}
            </p>
          </div>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 delay-200", featuresReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {FEATURES.map((f, i) => (
              <div key={f.en} className={cn("relative p-5 rounded-2xl border bg-gradient-to-br hover:-translate-y-2 hover:shadow-lg transition-all duration-300 cursor-default group overflow-hidden", f.color, f.border)}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{ boxShadow: `inset 0 0 40px ${f.glow}15` }} />
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: f.glow + "20", border: `1px solid ${f.glow}30` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.glow }} />
                </div>
                <h3 className="text-sm font-bold mb-2">{R ? f.ar : f.en}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{R ? f.desc_ar : f.desc_en}</p>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4" style={{ color: f.glow }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â• 4. HOW IT WORKS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-20 bg-secondary/10 border-y border-border/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "ÙƒÙŠÙ ÙŠØ¹Ù…Ù„" : "How It Works"}</Badge>
            <h2 className="text-3xl font-display font-black">{R ? "Ø«Ù„Ø§Ø« Ø®Ø·ÙˆØ§Øª Ù„Ù„Ø§Ù†Ø·Ù„Ø§Ù‚" : "Three Steps to Launch"}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative text-center p-6 rounded-2xl bg-background border border-border/40 hover:border-primary/30 transition-all hover:-translate-y-1 group">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-display font-black flex items-center justify-center gold-glow">
                  {s.num}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 mt-2 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-sm font-bold mb-2">{R ? s.titleAr : s.titleEn}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{R ? s.descAr : s.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â• 5. SECTORS GRID â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section ref={sectorsReveal.ref} className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className={cn("text-center mb-12 transition-all duration-700", sectorsReveal.visible ? "opacity-100" : "opacity-0")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "Ø§Ù„Ù‚Ø·Ø§Ø¹Ø§Øª" : "Sectors"}</Badge>
            <h2 className="text-3xl font-display font-black">{R ? "Ù‚Ø·Ø§Ø¹Ø§Øª Ù…Ø®ØµØµØ© Ù„ÙƒÙ„ ØµÙ†Ø§Ø¹Ø©" : "Industry-Specific Sectors"}</h2>
          </div>
          <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4 transition-all duration-700 delay-200", sectorsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {SECTORS.map(s => (
              <div key={s.label} className={cn("flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-border/30 hover:border-primary/20 bg-background hover:bg-secondary/30 transition-all hover:-translate-y-1 cursor-pointer group")}>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.bg)}>
                  <s.icon className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ color: s.color }} />
                </div>
                <span className="text-xs font-semibold text-center">{R ? s.ar : s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â• 6. PRICING â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section ref={pricingReveal.ref} className="py-24 bg-secondary/10 border-y border-border/30" id="pricing">
        <div className="max-w-5xl mx-auto px-4">
          <div className={cn("text-center mb-12 transition-all duration-700", pricingReveal.visible ? "opacity-100" : "opacity-0")}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "Ø§Ù„Ø£Ø³Ø¹Ø§Ø±" : "Pricing"}</Badge>
            <h2 className="text-3xl font-display font-black mb-3">{R ? "Ø§Ø´ØªØ±Ø§ÙƒØ§Øª Ù„ÙƒÙ„ Ø­Ø¬Ù…" : "Plans for Every Scale"}</h2>
            <p className="text-muted-foreground mb-6">{R ? "Ø§Ø¨Ø¯Ø£ Ù…Ø¬Ø§Ù†Ø§Ù‹ ÙˆÙ‚Ù… Ø¨Ø§Ù„ØªØ±Ù‚ÙŠØ© Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø©" : "Start free, upgrade when you need"}</p>
            {/* Monthly / Annual toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/40">
              <button onClick={() => setActiveTab("monthly")} className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {R ? "Ø´Ù‡Ø±ÙŠ" : "Monthly"}
              </button>
              <button onClick={() => setActiveTab("annual")} className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all", activeTab === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {R ? "Ø³Ù†ÙˆÙŠ (Ø®ØµÙ… 20%)" : "Annual (save 20%)"}
              </button>
            </div>
          </div>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 delay-200", pricingReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
            {PRICING.map(plan => {
              const price = activeTab === "annual" && plan.price > 0 ? (plan.price * 0.8) : plan.price;
              return (
                <div key={plan.code} className={cn("relative rounded-2xl border-2 p-5 hover:-translate-y-2 transition-all duration-300 bg-background", plan.color, plan.code === "pro" && "shadow-xl shadow-primary/10")}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-3 gold-glow">{plan.badge}</Badge>
                    </div>
                  )}
                  <h3 className="text-sm font-bold mb-1">{R ? plan.nameAr : plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-display font-black text-primary">${price === 0 ? "0" : price.toFixed(2)}</span>
                    {plan.price > 0 && <span className="text-xs text-muted-foreground">{R ? "/Ø´Ù‡Ø±" : "/mo"}</span>}
                  </div>
                  <ul className="space-y-2 mb-5">
                    {(R ? plan.features_ar : plan.features_en).map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" className="w-full" variant={plan.code === "pro" ? "default" : "outline"}
                    onClick={() => navigate(user ? "/portal/profile" : "/auth?tab=signup")}>
                    {R ? plan.cta_ar : plan.cta_en}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* â•â• 7. TESTIMONIALS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">{R ? "Ø¢Ø±Ø§Ø¡ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡" : "Testimonials"}</Badge>
            <h2 className="text-3xl font-display font-black">{R ? "Ù…Ø§Ø°Ø§ ÙŠÙ‚ÙˆÙ„ Ø¹Ù…Ù„Ø§Ø¤Ù†Ø§" : "What Our Clients Say"}</h2>
          </div>
          <div className="relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className={cn("p-6 rounded-2xl border border-border/40 bg-secondary/20 transition-all duration-500", i === testimonialIdx || i === (testimonialIdx + 1) % TESTIMONIALS.length ? "opacity-100 scale-100" : "opacity-40 scale-95")}>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="w-3.5 h-3.5 fill-primary text-primary" />)}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    "{R ? t.text_ar : t.text_en}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">{t.avatar}</div>
                    <div>
                      <p className="text-xs font-semibold">{R ? t.nameAr : t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{R ? t.roleAr : t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)} className={cn("w-2 h-2 rounded-full transition-all", i === testimonialIdx ? "bg-primary w-6" : "bg-border")} />
              ))}
            </div>
          </div>
        </div>

      {/* ══ 8b. MARKETPLACE & DIGITAL MALL ══════════════════════ */}
      <section className="py-20 bg-secondary/10 border-y border-border/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs gap-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              {R ? "تسوق معنا" : "Shop With Us"}
            </Badge>
            <h2 className="text-3xl font-display font-black">
              {R ? "المتجر والمول الرقمي" : "Marketplace & Digital Mall"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {R ? "تصفح الآلاف من المنتجات والخدمات من موردين معتمدين" : "Browse thousands of products & services from verified vendors"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Marketplace Card */}
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 hover:-translate-y-1 transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-5">
                  <ShoppingBag className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-black mb-2">{R ? "السوق الإلكتروني" : "Marketplace"}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {R
                    ? "تصفح منتجات وخدمات من بائعين معتمدين. أضف للسلة قارن واشتر بثقة."
                    : "Browse products & services from verified vendors. Add to cart, compare, and buy with confidence."}
                </p>
                <ul className="space-y-1.5 mb-6">
                  {(R
                    ? ["بحث وتصفية متقدم", "تقييمات موثوقة", "دفع آمن", "تتبع الطلبات"]
                    : ["Advanced search & filter", "Verified reviews", "Secure checkout", "Order tracking"]
                  ).map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate(user ? "/marketplace" : "/auth?tab=signin")} className="gap-2 gold-glow">
                  <ShoppingCart className="w-4 h-4" />
                  {R ? "تصفح السوق" : "Browse Marketplace"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Digital Mall Card */}
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent p-8 hover:-translate-y-1 transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mb-5">
                  <Building2 className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-display font-black mb-2">{R ? "المول الرقمي" : "Digital Mall"}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {R
                    ? "تجربة تسوق منظمة في بيئة مول متكاملة — كل قطاع في جناحه الخاص بمتاجر وعروض حصرية."
                    : "Organized shopping in a full mall environment — each sector in its own wing with exclusive stores & offers."}
                </p>
                <ul className="space-y-1.5 mb-6">
                  {(R
                    ? ["أجنحة متخصصة بالقطاع", "عروض حصرية", "تجربة تسوق مرئية", "مقارنة بين المتاجر"]
                    : ["Sector-specific wings", "Exclusive deals", "Visual browsing experience", "Cross-store comparison"]
                  ).map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate(user ? "/digital-mall" : "/auth?tab=signin")} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0">
                  <Building2 className="w-4 h-4" />
                  {R ? "دخول المول" : "Enter Digital Mall"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      </section>

      {/* â•â• 8. BUSINESS CTA â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs mb-6">
            <Award className="w-4 h-4" />
            {R ? "Ø­Ø³Ø§Ø¨ ØªØ¬Ø§Ø±ÙŠØŸ" : "Need a Business Account?"}
          </div>
          <h2 className="text-4xl font-display font-black mb-4">
            {R ? "Ø­ÙˆÙ‘Ù„ Ø­Ø³Ø§Ø¨Ùƒ Ø¥Ù„Ù‰ Ù‚ÙˆØ© ØªØ¬Ø§Ø±ÙŠØ©" : "Upgrade to Business Power"}
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {R
              ? "Ø³ÙˆØ§Ø¡ ÙƒÙ†Øª Ø¨Ø§Ø¦Ø¹Ø§Ù‹ Ø£Ùˆ Ø´Ø±ÙŠÙƒØ§Ù‹ Ø£Ùˆ ÙˆÙƒÙŠÙ„Ø§Ù‹ â€” Ù‚Ø¯Ù‘Ù… Ø·Ù„Ø¨Ùƒ ÙˆØ¨Ø¹Ø¯ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø© ØªÙÙØªØ­ Ù„Ùƒ Ø¨ÙˆØ§Ø¨ØªÙƒ Ø§Ù„Ø®Ø§ØµØ© ÙÙˆØ±Ø§Ù‹."
              : "Whether vendor, partner, or agent â€” submit your request and your dedicated portal unlocks after approval."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate(user ? "/portal/profile" : "/auth?tab=signup")} className="gap-2 px-10 gold-glow">
              <Building2 className="w-5 h-5" />
              {R ? "Ø§Ø·Ù„Ø¨ Ø­Ø³Ø§Ø¨Ø§Ù‹ ØªØ¬Ø§Ø±ÙŠØ§Ù‹" : "Request Business Account"}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")} className="gap-2 px-10">
              <MessageSquare className="w-5 h-5" />
              {R ? "ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª" : "Contact Sales"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-5">{R ? "Ù…Ø±Ø§Ø¬Ø¹Ø© Ø®Ù„Ø§Ù„ 24-48 Ø³Ø§Ø¹Ø© Ø¹Ù…Ù„ Â· Ø¨Ø¯ÙˆÙ† Ø¨Ø·Ø§Ù‚Ø© Ø§Ø¦ØªÙ…Ø§Ù†" : "Review within 24-48 business hours Â· No credit card required"}</p>
        </div>
      </section>
    </PublicLayout>
  );
}
