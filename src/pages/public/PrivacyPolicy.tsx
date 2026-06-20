import { useTranslation } from "react-i18next";
import PublicLayout from "@/layouts/PublicLayout";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const { i18n } = useTranslation();
  const R = i18n.language === "ar";

  const sections = R ? [
    {
      title: "مقدمة",
      body: `تلتزم كيمت رايز — ليغاسي نيكسس بحماية خصوصيتك. توضح هذه السياسة كيفية جمع معلوماتك الشخصية واستخدامها والحفاظ عليها.
آخر تحديث: يونيو 2026.`,
    },
    {
      title: "المعلومات التي نجمعها",
      body: `• معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف، وكلمة المرور المشفرة.
• بيانات الاستخدام: صفحات الزيارة، مدة الجلسة، عنوان IP، نوع المتصفح.
• بيانات المعاملات: الطلبات، الفواتير، وبيانات الدفع المشفرة عبر مزود الدفع.
• المحتوى الذي تنشئه: الرسائل، الملفات، ومعلومات الملف الشخصي.`,
    },
    {
      title: "كيف نستخدم معلوماتك",
      body: `• تشغيل المنصة وتقديم الخدمات المطلوبة.
• إرسال إشعارات الحساب والتحديثات الأمنية.
• تحسين تجربة المستخدم وتحليل أداء النظام.
• الامتثال للالتزامات القانونية والتنظيمية.
• منع الاحتيال وحماية المنصة والمستخدمين.`,
    },
    {
      title: "مشاركة المعلومات",
      body: `لا نبيع بياناتك الشخصية لأي طرف ثالث. قد نشارك المعلومات مع:
• مزودي الخدمة المرتبطين بتشغيل المنصة (مثل Supabase لتخزين البيانات).
• الجهات التنظيمية والقانونية عند الضرورة القانونية.
• الشركاء التجاريين المعتمدين وفق اتفاقيات سرية صارمة.`,
    },
    {
      title: "أمان البيانات",
      body: `نستخدم تشفير SSL/TLS لجميع الاتصالات. تُخزَّن كلمات المرور مشفرة بخوارزميات bcrypt. نُجري مراجعات أمنية دورية ونلتزم بمعايير OWASP. يُقيَّد الوصول إلى البيانات على أساس الأدوار والصلاحيات.`,
    },
    {
      title: "حقوقك",
      body: `يحق لك في أي وقت:
• الاطلاع على بياناتك الشخصية المخزنة.
• طلب تصحيح أو حذف بياناتك.
• تصدير بياناتك بصيغة قابلة للقراءة الآلية.
• إلغاء الاشتراك في رسائل التسويق.
للتواصل: privacy@kemetrise.com`,
    },
    {
      title: "ملفات تعريف الارتباط (Cookies)",
      body: `نستخدم ملفات تعريف الارتباط الضرورية لتشغيل المنصة وملفات التحليلات لتحسين الخدمة. يمكنك ضبط متصفحك لرفضها، لكن ذلك قد يؤثر على بعض الوظائف.`,
    },
    {
      title: "التغييرات على هذه السياسة",
      body: `قد نحدث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة. استمرارك في استخدام الخدمة بعد التحديث يُعدّ قبولاً للسياسة المحدثة.`,
    },
    {
      title: "تواصل معنا",
      body: `لأي استفسار حول سياسة الخصوصية:\nالبريد الإلكتروني: privacy@kemetrise.com\nالعنوان: كيمت رايز — ليغاسي نيكسس`,
    },
  ] : [
    {
      title: "Introduction",
      body: `KemetRise — Legacy Nexus is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.
Last updated: June 2026.`,
    },
    {
      title: "Information We Collect",
      body: `• Account information: name, email, phone number, and encrypted password.
• Usage data: pages visited, session duration, IP address, browser type.
• Transaction data: orders, invoices, and payment data encrypted via payment provider.
• Content you create: messages, files, and profile information.`,
    },
    {
      title: "How We Use Your Information",
      body: `• Operate the platform and deliver requested services.
• Send account notifications and security updates.
• Improve user experience and analyze system performance.
• Comply with legal and regulatory obligations.
• Prevent fraud and protect the platform and users.`,
    },
    {
      title: "Information Sharing",
      body: `We do not sell your personal data to any third party. We may share information with:
• Service providers integral to platform operation (e.g., Supabase for data storage).
• Regulatory and legal authorities when legally required.
• Approved business partners under strict confidentiality agreements.`,
    },
    {
      title: "Data Security",
      body: `We use SSL/TLS encryption for all communications. Passwords are stored encrypted with bcrypt algorithms. We conduct regular security audits and comply with OWASP standards. Data access is restricted based on roles and permissions.`,
    },
    {
      title: "Your Rights",
      body: `At any time you have the right to:
• Access your stored personal data.
• Request correction or deletion of your data.
• Export your data in a machine-readable format.
• Unsubscribe from marketing communications.
Contact: privacy@kemetrise.com`,
    },
    {
      title: "Cookies",
      body: `We use necessary cookies to operate the platform and analytics cookies to improve the service. You can configure your browser to reject them, but this may affect some functionality.`,
    },
    {
      title: "Changes to This Policy",
      body: `We may update this policy from time to time. We will notify you of any material changes via email or a notice on the platform. Continued use of the service after an update constitutes acceptance of the revised policy.`,
    },
    {
      title: "Contact Us",
      body: `For any questions about our Privacy Policy:\nEmail: privacy@kemetrise.com\nAddress: KemetRise — Legacy Nexus`,
    },
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" dir={R ? "rtl" : "ltr"}>
        {/* Hero */}
        <section className="py-16 px-4 text-center border-b border-border/30">
          <div className="max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
              {R ? "سياسة الخصوصية" : "Privacy Policy"}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {R
                ? "نحن نأخذ خصوصيتك على محمل الجد. اقرأ هذه السياسة لفهم كيفية تعاملنا مع بياناتك."
                : "We take your privacy seriously. Read this policy to understand how we handle your data."}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-3">
              {R ? "آخر تحديث: يونيو 2026" : "Last updated: June 2026"}
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-3xl mx-auto px-4 py-14 space-y-10">
          {sections.map((s, i) => (
            <div key={i} className="rounded-2xl border border-border/40 bg-secondary/10 p-6">
              <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black shrink-0">
                  {i + 1}
                </span>
                {s.title}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </section>
      </div>
    </PublicLayout>
  );
}
