import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Search, Zap, Shield, CreditCard, Users, Database, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const sections = [
  { icon: Zap, title: "Getting Started", topics: [
    { q: "How do I add my first brand?", a: "Click the + next to Brands in the sidebar, fill in name, industry, logo and click Save." },
    { q: "How do I invite team members?", a: "Go to Team page, click Invite, enter email and role. They'll receive an invite link." },
    { q: "How do I use Command Palette?", a: "Press ⌘K (Mac) or Ctrl+K (Windows) anywhere in the app to search and navigate quickly." },
  ]},
  { icon: Shield, title: "Security", topics: [
    { q: "How do I enable 2FA?", a: "Go to Settings → Two-Factor Authentication, scan the QR with Google Authenticator or Authy, then verify the 6-digit code." },
    { q: "What is IP Whitelisting?", a: "Restrict admin access to specific IP ranges. Found in Security → IP Whitelist." },
    { q: "How does the Dead Man Switch work?", a: "Confirm your heartbeat every 3 days. If missed, your Golden Heirs gain access to your vault." },
  ]},
  { icon: CreditCard, title: "Billing", topics: [
    { q: "How do I create a coupon?", a: "Go to Coupons → New Coupon. Set code, type (percent/fixed), value, max uses, and expiry." },
    { q: "How do refunds work?", a: "Customers request refunds from their portal. You approve/reject from the Refunds page." },
    { q: "What payment methods are supported?", a: "Stripe, Paddle, manual bank transfer, and crypto. Configure in Payment Gateways." },
  ]},
  { icon: Users, title: "CRM & Operations", topics: [
    { q: "How do I track customers?", a: "Use the Customers and Clients pages. Log every interaction in CRM Interactions." },
    { q: "What's the Hybrid Task Flow?", a: "A Kanban board that distinguishes AI vs Human agents — found on the dashboard." },
  ]},
  { icon: Database, title: "Data & API", topics: [
    { q: "How do I export data?", a: "Every list page has an Export button (CSV/PDF) at the top right." },
    { q: "Where do I get an API key?", a: "Settings → API Keys. Create with a label and use in your integrations." },
    { q: "Where are the API docs?", a: "Visit /api-docs for full REST endpoints documentation." },
  ]},
  { icon: Bot, title: "AI Features", topics: [
    { q: "How does the AI Assistant work?", a: "Bottom-right floating button — ask anything about your data or operations." },
    { q: "What are AI Insights?", a: "On Revenue Dashboard, click Generate Insights for AI-powered analysis." },
  ]},
];

export default function Help() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const filtered = sections.map(s => ({
    ...s,
    topics: s.topics.filter(t =>
      !q || t.q.toLowerCase().includes(q.toLowerCase()) || t.a.toLowerCase().includes(q.toLowerCase()))
  })).filter(s => s.topics.length > 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => nav("/")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2 mb-2" style={{ fontFamily: "Orbitron" }}>
          <BookOpen className="w-7 h-7" /> Help & Documentation
        </h1>
        <p className="text-muted-foreground mb-6">Learn how to get the most out of KemetRise</p>

        <div className="relative mb-8">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search help articles..." className="pl-10" />
        </div>

        <div className="space-y-6">
          {filtered.map((s, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <s.icon className="w-5 h-5" />
                <h2 className="text-lg font-semibold">{s.title}</h2>
              </div>
              <div className="space-y-3">
                {s.topics.map((t, j) => (
                  <details key={j} className="group border-b border-border last:border-0 pb-3">
                    <summary className="cursor-pointer font-medium hover:text-primary">{t.q}</summary>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t.a}</p>
                  </details>
                ))}
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No results for "{q}"</p>}
        </div>
      </div>
    </div>
  );
}
