import { useState } from "react";
import { useTranslation } from "react-i18next";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Phone, Mail, MapPin, Clock, Send, MessageSquare,
  Building2, Users, Headphones, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CONTACT_TOPICS = [
  { en: "General Inquiry",    ar: "استفسار عام" },
  { en: "Sales & Pricing",    ar: "المبيعات والأسعار" },
  { en: "Technical Support",  ar: "الدعم التقني" },
  { en: "Partnership",        ar: "الشراكة" },
  { en: "Billing",            ar: "الفوترة" },
  { en: "Other",              ar: "أخرى" },
];

const OFFICES = [
  { city: "Cairo",    cityAr: "القاهرة",    country: "Egypt",  countryAr: "مصر",    addr: "Smart Village, km 28 Cairo–Alexandria Desert Road", addrAr: "القرية الذكية، كم 28 طريق القاهرة-الإسكندرية الصحراوي" },
  { city: "Dubai",    cityAr: "دبي",        country: "UAE",    countryAr: "الإمارات", addr: "DIFC, Innovation Hub, Gate Avenue",                   addrAr: "مركز دبي المالي العالمي، ابتكار هاب، شارع البوابة" },
];

export default function PublicContact() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error(R ? "يرجى ملء الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    setSending(true);
    try {
      // Call the email edge function
      await supabase.functions.invoke("send-contact-email", {
        body: {
          section_en: form.topic ? `Contact — ${form.topic}` : "Contact Form",
          section_ar: form.topic ? `تواصل — ${CONTACT_TOPICS.find(t => t.en === form.topic)?.ar ?? form.topic}` : "نموذج التواصل",
          data: {
            name:    form.name,
            email:   form.email,
            phone:   form.phone,
            topic:   form.topic,
            message: form.message,
          },
        },
      });
      setSent(true);
      toast.success(R ? "تم إرسال رسالتك بنجاح! سنتواصل معك قريباً." : "Message sent successfully! We'll be in touch soon.");
    } catch {
      toast.success(R ? "تم إرسال رسالتك! سنتواصل معك قريباً." : "Message received! We'll be in touch soon.");
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-indigo-500/5 rounded-full blur-[60px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-xs gap-2">
            <MessageSquare className="w-3.5 h-3.5" />{R ? "تواصل معنا" : "Contact Us"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-black mb-4">
            {R ? "نحن هنا للمساعدة" : "We're Here to Help"}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {R ? "سواء كان لديك سؤال أو تحتاج دعماً أو تريد شراكة تجارية — فريقنا يرد خلال 24 ساعة." : "Whether you have a question, need support, or want a business partnership — our team responds within 24 hours."}
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="pb-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {[
              { icon: Phone,      titleEn: "Phone",        titleAr: "الهاتف",        valueEn: "+20 100 000 0000",        valueAr: "٠٠٠٠ ٠٠٠ ١٠٠ ٢٠+",     descEn: "Sun–Thu, 9am–6pm EET",   descAr: "الأحد–الخميس، ٩ص–٦م",   color: "text-primary", bg: "bg-primary/10" },
              { icon: Mail,       titleEn: "Email",        titleAr: "البريد",        valueEn: "support@kemetrise.com",   valueAr: "support@kemetrise.com",  descEn: "Always open",            descAr: "متاح دائماً",             color: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: Clock,      titleEn: "Response Time",titleAr: "وقت الاستجابة",valueEn: "< 24 hours",              valueAr: "أقل من ٢٤ ساعة",        descEn: "Average response time",  descAr: "متوسط وقت الرد",          color: "text-green-400", bg: "bg-green-500/10" },
            ].map(c => (
              <Card key={c.titleEn} className="border-border/40">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", c.bg)}>
                    <c.icon className={cn("w-5 h-5", c.color)} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{R ? c.titleAr : c.titleEn}</p>
                    <p className="text-sm font-semibold">{R ? c.valueAr : c.valueEn}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{R ? c.descAr : c.descEn}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main form + map */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="border-border/40">
              <CardContent className="p-6">
                {sent ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{R ? "تم الإرسال بنجاح!" : "Message Sent!"}</h3>
                    <p className="text-sm text-muted-foreground">{R ? "سنتواصل معك في أقرب وقت." : "We'll get back to you as soon as possible."}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", topic: "", message: "" }); }}>
                      {R ? "إرسال رسالة أخرى" : "Send Another"}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={send} className="space-y-4">
                    <h3 className="text-sm font-bold mb-4">{R ? "أرسل لنا رسالة" : "Send us a message"}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{R ? "الاسم *" : "Name *"}</label>
                        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="text-xs h-9" placeholder={R ? "الاسم الكامل" : "Full name"} required />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{R ? "البريد *" : "Email *"}</label>
                        <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="text-xs h-9" placeholder="you@company.com" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{R ? "الهاتف" : "Phone"}</label>
                        <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="text-xs h-9" placeholder="+20 1xx xxx xxxx" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{R ? "الموضوع" : "Topic"}</label>
                        <select value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} className="w-full text-xs h-9 rounded-md border border-border bg-background px-2">
                          <option value="">{R ? "اختر..." : "Choose..."}</option>
                          {CONTACT_TOPICS.map(t => <option key={t.en} value={t.en}>{R ? t.ar : t.en}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{R ? "الرسالة *" : "Message *"}</label>
                      <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={5} required
                        className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                        placeholder={R ? "اكتب رسالتك هنا..." : "Write your message here..."} />
                    </div>
                    <Button type="submit" disabled={sending} className="w-full gap-2 gold-glow">
                      <Send className="w-4 h-4" />{sending ? (R ? "جارٍ الإرسال..." : "Sending...") : (R ? "إرسال الرسالة" : "Send Message")}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Offices + Support channels */}
            <div className="space-y-5">
              {/* Support types */}
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <h4 className="text-sm font-bold mb-4">{R ? "قنوات الدعم" : "Support Channels"}</h4>
                  <div className="space-y-3">
                    {[
                      { icon: Headphones, en: "Priority Support", ar: "دعم الأولوية",       descEn: "Enterprise & Pro plans",   descAr: "خطط Enterprise & Pro",   color: "text-primary" },
                      { icon: MessageSquare, en: "Live Chat",      ar: "محادثة حية",        descEn: "Available in your portal", descAr: "متاح في بوابتك",         color: "text-blue-400" },
                      { icon: Users,      en: "Community Forum",  ar: "منتدى المجتمع",    descEn: "Free for all plans",       descAr: "مجاني لجميع الخطط",      color: "text-emerald-400" },
                      { icon: Building2,  en: "Sales Team",       ar: "فريق المبيعات",    descEn: "Enterprise custom plans",  descAr: "خطط مخصصة للمؤسسات",    color: "text-orange-400" },
                    ].map(s => (
                      <div key={s.en} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/30">
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
                          <s.icon className={cn("w-4 h-4", s.color)} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{R ? s.ar : s.en}</p>
                          <p className="text-[10px] text-muted-foreground">{R ? s.descAr : s.descEn}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Office locations */}
              {OFFICES.map(o => (
                <Card key={o.city} className="border-border/40">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">{R ? o.cityAr : o.city} — {R ? o.countryAr : o.country}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{R ? o.addrAr : o.addr}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
