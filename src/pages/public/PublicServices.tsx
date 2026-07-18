import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import RequestReceivedMessage from "@/components/shared/RequestReceivedMessage";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Layers, Bot, Wallet, BarChart3, Users, Shield,
  Building2, Globe, Code2, CheckCircle, ArrowRight, Zap, Search,
  Server, FileCode, Monitor, Film, Database, Cpu, HardDrive,
  Network, Wifi, Award, BookOpen, Settings2, Megaphone, Package,
  Truck, Camera, LucideIcon, Loader2, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3, Users, Wallet, Bot, Building2, Globe, Code2, Layers, Shield,
  Server, FileCode, Monitor, Film, Database, Cpu, HardDrive, Network,
  Wifi, Award, BookOpen, Settings2, Megaphone, Package, Truck, Camera,
  Search,
};

interface WsService {
  id: string;
  name_ar: string;
  name_en: string;
  desc_ar: string;
  desc_en: string;
  category: string;
  color: string;
  icon_name: string;
  features_ar: string[];
  features_en: string[];
  is_active: boolean;
  sort_order: number;
}

// ── Per-service examples ─────────────────────────────────────
const SERVICE_EXAMPLES: Record<string, { emoji: string; title_ar: string; title_en: string; lines_ar: string[]; lines_en: string[] }[]> = {
  erp: [
    { emoji: "🧾", title_ar: "فاتورة بيع لعميل", title_en: "Customer Sales Invoice",
      lines_ar: ["العميل: شركة النور للتجارة", "المنتج: 50 وحدة × 120 ج = 6,000 ج", "ضريبة القيمة المضافة 14%: 840 ج — الإجمالي: 6,840 ج"],
      lines_en: ["Client: Al-Nour Trading Co.", "Product: 50 units × $120 = $6,000", "VAT 14%: $840 — Total: $6,840"] },
    { emoji: "📊", title_ar: "تقرير الربح والخسارة", title_en: "P&L Report",
      lines_ar: ["إجمالي الإيرادات: 250,000 ج", "إجمالي المصروفات: 180,000 ج", "صافي الربح: 70,000 ج (+28%)"],
      lines_en: ["Total Revenue: $250,000", "Total Expenses: $180,000", "Net Profit: $70,000 (+28%)"] },
    { emoji: "📒", title_ar: "كشف حساب المورد", title_en: "Supplier Account Statement",
      lines_ar: ["مورد: مصنع الأهرام", "إجمالي المشتريات: 45,000 ج", "المدفوع: 30,000 ج — المتبقي: 15,000 ج"],
      lines_en: ["Supplier: Pyramid Factory", "Total Purchases: $45,000", "Paid: $30,000 — Balance: $15,000"] },
  ],
  hr: [
    { emoji: "✅", title_ar: "بصمة حضور يومية", title_en: "Daily Attendance Log",
      lines_ar: ["أحمد محمد — حضور: 8:02 ص", "مريم علي — حضور: 8:15 ص (تأخر 15 د)", "محمود حسن — غياب — إشعار أُرسل للمدير"],
      lines_en: ["Ahmed Mohamed — In: 8:02 AM", "Mariam Ali — In: 8:15 AM (15 min late)", "Mahmoud Hassan — Absent — Manager notified"] },
    { emoji: "💰", title_ar: "قسيمة راتب", title_en: "Payslip",
      lines_ar: ["الراتب الأساسي: 5,000 ج", "بدل مواصلات: 500 ج — بدل إنتاج: 800 ج", "خصم غياب: -200 ج — الصافي: 6,100 ج"],
      lines_en: ["Basic Salary: $5,000", "Transport: $500 — Production: $800", "Absence Deduction: -$200 — Net: $6,100"] },
    { emoji: "📅", title_ar: "طلب إجازة سنوية", title_en: "Annual Leave Request",
      lines_ar: ["الموظف: سارة أحمد", "من 25 يونيو → 5 يوليو (11 يوم)", "الرصيد المتبقي: 10 أيام — الحالة: بانتظار موافقة المدير"],
      lines_en: ["Employee: Sara Ahmed", "Jun 25 → Jul 5 (11 days)", "Remaining Balance: 10 days — Status: Awaiting approval"] },
  ],
  vendor: [
    { emoji: "🛒", title_ar: "صفحة منتج في المتجر", title_en: "Store Product Page",
      lines_ar: ["سماعات لاسلكية Pro X | السعر: 450 ج", "المخزون: 23 قطعة | SKU: AUD-PRX-001", "التقييم: ⭐ 4.7 (142 مراجعة)"],
      lines_en: ["Wireless Headphones Pro X | Price: $45", "Stock: 23 units | SKU: AUD-PRX-001", "Rating: ⭐ 4.7 (142 reviews)"] },
    { emoji: "💳", title_ar: "محفظة البائع", title_en: "Vendor Wallet",
      lines_ar: ["الرصيد المتاح: 12,400 ج", "إجمالي المبيعات: 18,000 ج — عمولة المنصة (5%): 900 ج", "طلب سحب: 10,000 ج — الحالة: تحت المراجعة"],
      lines_en: ["Available Balance: $1,240", "Total Sales: $1,800 — Commission (5%): $90", "Withdrawal Request: $1,000 — Status: Under review"] },
    { emoji: "📦", title_ar: "إدارة طلب جديد", title_en: "New Order Management",
      lines_ar: ["طلب #4521 — عميل: محمد سامي", "3 منتجات — الإجمالي: 750 ج", "الحالة: ✅ تم التأكيد — الشحن: خلال 24 ساعة"],
      lines_en: ["Order #4521 — Customer: Mohamed Sami", "3 items — Total: $75", "Status: ✅ Confirmed — Ships within 24h"] },
  ],
  marketing: [
    { emoji: "🎯", title_ar: "خط مبيعات Kanban", title_en: "Sales Kanban Pipeline",
      lines_ar: ["جديد (12 عميل) → اتصال أولي (7) → عرض سعر (4)", "تفاوض (3) → ✅ تم الإغلاق (8 هذا الشهر)", "إجمالي الصفقات المحتملة: 145,000 ج"],
      lines_en: ["New (12) → First Contact (7) → Quote (4)", "Negotiation (3) → ✅ Closed (8 this month)", "Total Pipeline Value: $14,500"] },
    { emoji: "📣", title_ar: "حملة إعلانية على فيسبوك", title_en: "Facebook Ad Campaign",
      lines_ar: ["الميزانية: 2,000 ج — المدة: 14 يوم", "الوصول: 45,200 شخص — النقرات: 1,840", "ROI: 320% — تكلفة العميل: 8 ج"],
      lines_en: ["Budget: $200 — Duration: 14 days", "Reach: 45,200 people — Clicks: 1,840", "ROI: 320% — Cost per lead: $0.8"] },
    { emoji: "📧", title_ar: "حملة بريد إلكتروني", title_en: "Email Campaign",
      lines_ar: ["القائمة: 8,500 مشترك", "معدل الفتح: 34% — معدل النقر: 12%", "تحويلات: 180 عملية شراء — إيراد: 27,000 ج"],
      lines_en: ["List: 8,500 subscribers", "Open Rate: 34% — Click Rate: 12%", "Conversions: 180 purchases — Revenue: $2,700"] },
  ],
  ai: [
    { emoji: "🤖", title_ar: "محادثة مع الوكيل الذكي", title_en: "AI Agent Conversation",
      lines_ar: ["العميل: ما مواعيد العمل؟", "الوكيل: نعمل من 9 ص حتى 5 م يومياً ماعدا الجمعة.", "العميل: هل لديكم توصيل؟ الوكيل: نعم! توصيل خلال 48 ساعة."],
      lines_en: ["Customer: What are your business hours?", "Agent: We work Sun-Thu 9AM to 5PM.", "Customer: Do you deliver? Agent: Yes! 48-hour delivery."] },
    { emoji: "📈", title_ar: "إحصائيات الوكيل الذكي", title_en: "AI Agent Analytics",
      lines_ar: ["إجمالي المحادثات هذا الشهر: 3,240", "متوسط وقت الرد: 1.2 ثانية", "رضا العملاء: 94% — تصعيد لبشري: 6%"],
      lines_en: ["Total chats this month: 3,240", "Avg response time: 1.2 seconds", "Customer satisfaction: 94% — Human escalation: 6%"] },
    { emoji: "🧠", title_ar: "تدريب الوكيل على منتجاتك", title_en: "Agent Training on Your Data",
      lines_ar: ["مصادر التدريب: كتالوج منتجات، FAQ، سياسة الإرجاع", "الوكيل يعرف 450+ سؤال وجواب", "تحديث تلقائي عند إضافة منتجات جديدة"],
      lines_en: ["Training sources: Product catalog, FAQ, Return policy", "Agent knows 450+ Q&A pairs", "Auto-updates when new products are added"] },
  ],
  partner: [
    { emoji: "🏢", title_ar: "لوحة تحكم الشريك", title_en: "Partner Dashboard",
      lines_ar: ["الشريك: شركة الخليج للتقنية | كود: KGL-2024", "العلامات التجارية: 4 | الموظفون: 23", "الإيرادات هذا الشهر: 48,200 ج"],
      lines_en: ["Partner: Gulf Tech Co. | Code: KGL-2024", "Brands: 4 | Staff: 23", "Revenue this month: $4,820"] },
    { emoji: "⚙️", title_ar: "تفعيل قطاعات للشريك", title_en: "Partner Sector Activation",
      lines_ar: ["✅ قطاع التجزئة — مفعّل منذ يناير 2024", "✅ قطاع المطاعم — مفعّل منذ مارس 2024", "⏸ قطاع العيادات — معطّل (اضغط لتفعيله)"],
      lines_en: ["✅ Retail Sector — Active since Jan 2024", "✅ Restaurants Sector — Active since Mar 2024", "⏸ Clinics Sector — Disabled (click to activate)"] },
    { emoji: "👥", title_ar: "إدارة فريق الشريك", title_en: "Partner Team Management",
      lines_ar: ["مدير: أحمد خالد — admin | ✅ نشط", "محاسب: نور السيد — finance | ✅ نشط", "موظف مبيعات: كريم طارق — sales | 🔒 معلق"],
      lines_en: ["Manager: Ahmed Khaled — admin | ✅ Active", "Accountant: Nour El-Sayed — finance | ✅ Active", "Sales Rep: Kareem Tarek — sales | 🔒 Suspended"] },
  ],
  agent: [
    { emoji: "🗂️", title_ar: "ملف وكيل مبيعات", title_en: "Sales Agent Profile",
      lines_ar: ["الوكيل: ياسمين فؤاد | المنطقة: القاهرة الجديدة", "عملاؤه النشطون: 34 عميل", "إجمالي العمولة المستحقة: 4,800 ج"],
      lines_en: ["Agent: Yasmine Fouad | Zone: New Cairo", "Active clients: 34", "Total due commission: $480"] },
    { emoji: "📋", title_ar: "خط سير الصفقات", title_en: "Deal Pipeline",
      lines_ar: ["شركة النهضة — عرض سعر مرسل — 15,000 ج", "مؤسسة الفجر — تفاوض نهائي — 8,500 ج", "متجر الأمل — ✅ تم الإغلاق — 6,200 ج"],
      lines_en: ["Al-Nahda Co. — Quote sent — $1,500", "Al-Fajr Group — Final negotiation — $850", "Al-Amal Store — ✅ Closed — $620"] },
    { emoji: "💸", title_ar: "طلب سحب عمولة", title_en: "Commission Withdrawal",
      lines_ar: ["الوكيل: سامر أمين", "العمولة المتراكمة: 9,200 ج", "طلب سحب: 7,000 ج — الحالة: ✅ تمت التحويل للبنك"],
      lines_en: ["Agent: Samer Amin", "Accumulated commission: $920", "Withdrawal: $700 — Status: ✅ Transferred to bank"] },
  ],
  security: [
    { emoji: "🛡️", title_ar: "سجل التدقيق", title_en: "Audit Log",
      lines_ar: ["10:32 — admin@company.com — حذف مستخدم (ID: 441)", "10:45 — sara@company.com — تغيير صلاحيات", "11:02 — IP 197.x.x.x — محاولة دخول مرفوضة ❌"],
      lines_en: ["10:32 — admin@company.com — Deleted user (ID: 441)", "10:45 — sara@company.com — Changed permissions", "11:02 — IP 197.x.x.x — Login attempt blocked ❌"] },
    { emoji: "🔐", title_ar: "إعداد المصادقة الثنائية", title_en: "2FA Setup",
      lines_ar: ["✅ SMS لرقم: 01x-xxxx-1234", "✅ تطبيق Google Authenticator", "رمز احتياطي: XXXX-XXXX-XXXX (محفوظ)"],
      lines_en: ["✅ SMS to: 01x-xxxx-1234", "✅ Google Authenticator App", "Backup code: XXXX-XXXX-XXXX (saved)"] },
    { emoji: "⚙️", title_ar: "إدارة الصلاحيات", title_en: "Permissions Management",
      lines_ar: ["دور: محاسب — يرى: الفواتير، التقارير", "دور: مبيعات — يرى: العملاء، الطلبات فقط", "دور: مشرف — صلاحيات كاملة على كل شيء"],
      lines_en: ["Role: Accountant — View: Invoices, Reports", "Role: Sales — View: Clients, Orders only", "Role: Superadmin — Full access to everything"] },
  ],
  sectors: [
    { emoji: "🏪", title_ar: "قطاع التجزئة", title_en: "Retail Sector",
      lines_ar: ["وحدات مفعّلة: نقطة البيع، المخزون، الولاء", "التقارير: أكثر المنتجات مبيعاً، ساعات الذروة", "مثال: متجر ملابس يدير 5 فروع من مكان واحد"],
      lines_en: ["Modules: POS, Inventory, Loyalty Program", "Reports: Best sellers, Peak hours", "Example: Clothing store managing 5 branches"] },
    { emoji: "🍽️", title_ar: "قطاع المطاعم", title_en: "Restaurants Sector",
      lines_ar: ["وحدات: الطلبات، المطبخ، الطاولات، التوصيل", "لوحة المطبخ: طلبات مباشرة من الكاشير", "مثال: سلسلة مطاعم 3 فروع + تطبيق توصيل"],
      lines_en: ["Modules: Orders, Kitchen, Tables, Delivery", "Kitchen display: live orders from cashier", "Example: 3-branch restaurant chain + delivery app"] },
    { emoji: "🏥", title_ar: "قطاع العيادات", title_en: "Clinics Sector",
      lines_ar: ["وحدات: المواعيد، سجلات المرضى، الوصفات", "حجز أونلاين + تذكير تلقائي بالرسائل", "مثال: عيادة دكتور يخدم 80 مريض يومياً"],
      lines_en: ["Modules: Appointments, Patient Records, Prescriptions", "Online booking + SMS reminders", "Example: Doctor serving 80 patients/day"] },
  ],
  api: [
    { emoji: "🔗", title_ar: "استدعاء REST API", title_en: "REST API Call",
      lines_ar: ["GET /api/v1/orders?status=pending", "Authorization: Bearer eyJhbGc...", "Response: 24 طلب معلق | 200 OK"],
      lines_en: ["GET /api/v1/orders?status=pending", "Authorization: Bearer eyJhbGc...", "Response: 24 pending orders | 200 OK"] },
    { emoji: "🪝", title_ar: "Webhook عند إتمام طلب", title_en: "Order Completed Webhook",
      lines_ar: ["الحدث: order.completed", "البيانات: رقم الطلب، العميل، المبلغ، الوقت", "الوجهة: https://yourapp.com/webhooks/orders"],
      lines_en: ["Event: order.completed", "Data: Order ID, customer, amount, timestamp", "Destination: https://yourapp.com/webhooks/orders"] },
    { emoji: "📲", title_ar: "تكامل جهاز بيومترية", title_en: "Biometric Device Integration",
      lines_ar: ["الجهاز: ZKTeco K40 — IP: 192.168.1.100", "مزامنة تلقائية كل 5 دقائق", "آخر مزامنة: 14:35 — 128 سجل حضور محدث"],
      lines_en: ["Device: ZKTeco K40 — IP: 192.168.1.100", "Auto-sync every 5 minutes", "Last sync: 14:35 — 128 attendance records updated"] },
  ],
  itmanuf: [
    { emoji: "🖥️", title_ar: "توريد خوادم لمركز بيانات", title_en: "Server Supply for Data Center",
      lines_ar: ["العميل: بنك القاهرة", "المعدات: 12 خادم Dell PowerEdge R750", "التسليم: 3 أسابيع + تركيب وتشغيل"],
      lines_en: ["Client: Cairo Bank", "Equipment: 12x Dell PowerEdge R750 servers", "Delivery: 3 weeks + installation"] },
    { emoji: "🏗️", title_ar: "تصميم مركز بيانات", title_en: "Data Center Design",
      lines_ar: ["المساحة: 200 م² — القدرة: 50 Rack", "أنظمة تبريد N+1 وكهرباء احتياطية UPS", "توافر: 99.9% uptime مضمون"],
      lines_en: ["Area: 200m² — Capacity: 50 Racks", "N+1 cooling and UPS backup power", "Availability: 99.9% uptime guaranteed"] },
    { emoji: "🔧", title_ar: "عقد صيانة سنوي", title_en: "Annual Maintenance Contract",
      lines_ar: ["الأجهزة المشمولة: 45 جهاز", "زيارات وقائية: 4 مرات/سنة", "استجابة طوارئ: خلال 4 ساعات"],
      lines_en: ["Covered devices: 45 units", "Preventive visits: 4 times/year", "Emergency response: within 4 hours"] },
  ],
  softdev: [
    { emoji: "📱", title_ar: "تطبيق موبايل للمتجر", title_en: "E-store Mobile App",
      lines_ar: ["iOS + Android — تصميم مخصص للعلامة التجارية", "تسجيل، تصفح منتجات، سلة، دفع إلكتروني", "مدة التطوير: 6-8 أسابيع"],
      lines_en: ["iOS + Android — custom branded design", "Registration, browsing, cart, online payment", "Development timeline: 6-8 weeks"] },
    { emoji: "🗄️", title_ar: "قاعدة بيانات للمستشفى", title_en: "Hospital Database",
      lines_ar: ["100,000+ سجل مريض مخزن بأمان", "بحث فوري خلال 0.3 ثانية", "نسخ احتياطي تلقائي يومياً"],
      lines_en: ["100,000+ patient records stored securely", "Instant search in 0.3 seconds", "Daily automatic backup"] },
    { emoji: "🔄", title_ar: "هجرة بيانات من النظام القديم", title_en: "Legacy Data Migration",
      lines_ar: ["نقل 15 سنة من البيانات من Excel للنظام الجديد", "250,000 سجل — بدون فقدان بيانات", "مدة المشروع: 3 أسابيع"],
      lines_en: ["15 years of data migrated from Excel", "250,000 records — zero data loss", "Project duration: 3 weeks"] },
  ],
  appdesign: [
    { emoji: "🎨", title_ar: "تصميم تطبيق مطعم", title_en: "Restaurant App Design",
      lines_ar: ["الشاشات: الرئيسية، القائمة، السلة، التتبع", "ألوان: برتقالي وأبيض — خط عربي حديث", "نموذج أولي تفاعلي جاهز خلال أسبوع"],
      lines_en: ["Screens: Home, Menu, Cart, Order Tracking", "Colors: orange & white — modern Arabic font", "Interactive prototype ready in 1 week"] },
    { emoji: "📲", title_ar: "تطبيق حجوزات عيادة", title_en: "Clinic Booking App",
      lines_ar: ["الدكتور يعرض أوقاته — المريض يختار ويحجز", "تأكيد فوري + تذكير قبل 24 ساعة", "iOS + Android — التطوير خلال 5 أسابيع"],
      lines_en: ["Doctor lists slots — patient picks & books", "Instant confirmation + 24h reminder", "iOS + Android — delivered in 5 weeks"] },
    { emoji: "🌐", title_ar: "موقع PWA لشركة لوجستية", title_en: "Logistics Company PWA",
      lines_ar: ["يعمل بدون إنترنت — سرعة تحميل: 0.8 ثانية", "تتبع الشحنات، إصدار الفواتير، التقارير", "يُحمَّل على الموبايل كتطبيق عادي"],
      lines_en: ["Works offline — Load time: 0.8 seconds", "Shipment tracking, invoicing, reports", "Installable on mobile like a native app"] },
  ],
  digcontent: [
    { emoji: "✍️", title_ar: "محتوى سوشيال ميديا لمطعم", title_en: "Restaurant Social Media Content",
      lines_ar: ["30 منشور شهري (10 فيسبوك + 10 انستقرام + 10 تيك توك)", "تصوير الأطباق + كتابة النصوص + هاشتاقات", "التفاعل: +240% خلال أول شهرين"],
      lines_en: ["30 posts/month (FB + IG + TikTok)", "Food photography + copywriting + hashtags", "Engagement: +240% in first 2 months"] },
    { emoji: "🎬", title_ar: "فيديو ترويجي لمنتج", title_en: "Product Promo Video",
      lines_ar: ["مدة الفيديو: 30 ثانية — للإعلانات", "موشن جرافيك + موسيقى + صوت معلق", "تسليم: 7 أيام عمل — بصيغة MP4/MOV"],
      lines_en: ["Duration: 30 seconds — for ads", "Motion graphics + music + voice-over", "Delivery: 7 working days — MP4/MOV"] },
    { emoji: "📰", title_ar: "مقال SEO لموقع طبي", title_en: "SEO Article for Medical Website",
      lines_ar: ["الموضوع: أعراض ارتفاع ضغط الدم وعلاجه", "الطول: 1,200 كلمة — كثافة الكلمات المفتاحية: 2%", "المرتبة: الأولى على Google خلال 60 يوم"],
      lines_en: ["Topic: Hypertension symptoms and treatment", "Length: 1,200 words — Keyword density: 2%", "Ranked #1 on Google within 60 days"] },
  ],
  dataentry: [
    { emoji: "📄", title_ar: "تحويل عقود ورقية", title_en: "Paper Contract Conversion",
      lines_ar: ["500 عقد ورقي → ملفات Word وPDF مفهرسة", "دقة الإدخال: 99.8% — مراجعة مزدوجة", "مدة التسليم: 5 أيام عمل"],
      lines_en: ["500 paper contracts → indexed Word & PDF files", "Entry accuracy: 99.8% — double-checked", "Delivery: 5 working days"] },
    { emoji: "📊", title_ar: "استبيان بحثي", title_en: "Research Survey Entry",
      lines_ar: ["1,200 استبيان → Excel مع ترميز متغيرات", "تحليل إحصائي أولي (SPSS-ready)", "مدة الإنجاز: أسبوع واحد"],
      lines_en: ["1,200 surveys → Excel with variable coding", "Preliminary statistical analysis (SPSS-ready)", "Completion: 1 week"] },
    { emoji: "🗃️", title_ar: "أرشفة سجلات مستشفى", title_en: "Hospital Records Archiving",
      lines_ar: ["رقمنة 30,000 ملف مريض", "نظام بحث فوري بالاسم أو رقم الملف", "أمان كامل وسرية طبية مضمونة"],
      lines_en: ["Digitization of 30,000 patient files", "Instant search by name or file number", "Full security and medical confidentiality"] },
  ],
  sysdesign: [
    { emoji: "🖧", title_ar: "نظام شبكي لمجمع تجاري", title_en: "Network System for Mall",
      lines_ar: ["150 جهاز — 3 طوابق — واي فاي مركزي", "VLAN منفصلة لكل تاجر — أمان كامل", "التصميم + التوريد + التركيب في 3 أسابيع"],
      lines_en: ["150 devices — 3 floors — centralized WiFi", "Separate VLAN per tenant — full security", "Design + supply + install in 3 weeks"] },
    { emoji: "☁️", title_ar: "هجرة لبنية سحابية", title_en: "Cloud Infrastructure Migration",
      lines_ar: ["الانتقال من خوادم محلية → AWS", "تقليل التكلفة: 40% — الأداء: +3x", "Zero downtime أثناء الهجرة"],
      lines_en: ["On-premise servers → AWS migration", "Cost reduction: 40% — Performance: +3x", "Zero downtime during migration"] },
    { emoji: "📐", title_ar: "توثيق النظام لشركة صناعية", title_en: "System Documentation for Factory",
      lines_ar: ["مخططات شاملة لكل الأنظمة والشبكات", "دليل تشغيل وصيانة مفصل", "تسليم كامل مع ملفات Visio وPDF"],
      lines_en: ["Full diagrams of all systems and networks", "Detailed operation and maintenance manual", "Delivered as Visio + PDF files"] },
  ],
  embedded: [
    { emoji: "🏭", title_ar: "نظام مراقبة خط إنتاج", title_en: "Production Line Monitoring",
      lines_ar: ["50 جهاز استشعار على خط الإنتاج", "مراقبة درجة الحرارة والضغط والسرعة", "تنبيه فوري عند أي خلل — دقة 0.01%"],
      lines_en: ["50 sensors on production line", "Temperature, pressure, speed monitoring", "Instant alert on any fault — 0.01% precision"] },
    { emoji: "🚗", title_ar: "نظام تتبع أسطول سيارات", title_en: "Fleet Tracking System",
      lines_ar: ["200 سيارة — GPS + قياس الوقود", "تقارير لحظية: الموقع، السرعة، التوقف", "تكامل مع تطبيق موبايل للمدير"],
      lines_en: ["200 vehicles — GPS + fuel monitoring", "Real-time: location, speed, stops", "Mobile app integration for managers"] },
    { emoji: "🏠", title_ar: "نظام منزل ذكي", title_en: "Smart Home System",
      lines_ar: ["تحكم في الإضاءة والتكييف والأمان", "من الموبايل أو بالصوت (Alexa/Google)", "توفير طاقة: حتى 35%"],
      lines_en: ["Control lighting, AC, and security", "Via mobile or voice (Alexa/Google)", "Energy saving: up to 35%"] },
  ],
  netdesign: [
    { emoji: "🗺️", title_ar: "تصميم شبكة مستشفى", title_en: "Hospital Network Design",
      lines_ar: ["500 نقطة شبكية — 8 طوابق", "شبكة مخصصة للأجهزة الطبية (VLAN)", "سرعة: 10 Gbps backbone"],
      lines_en: ["500 network points — 8 floors", "Dedicated VLAN for medical devices", "Speed: 10 Gbps backbone"] },
    { emoji: "📡", title_ar: "شبكة واي فاي لفندق", title_en: "Hotel Wi-Fi Network",
      lines_ar: ["تغطية 300 غرفة + مناطق عامة", "شبكة منفصلة للنزلاء والموظفين", "سرعة لكل غرفة: 50 Mbps مضمونة"],
      lines_en: ["Coverage: 300 rooms + common areas", "Separate network for guests and staff", "Guaranteed 50 Mbps per room"] },
    { emoji: "🔒", title_ar: "VPN للعمل عن بعد", title_en: "Remote Work VPN",
      lines_ar: ["100 موظف يعمل من المنزل بأمان", "تشفير 256-bit — لا يمكن اختراقه", "تسجيل دخول بثوانٍ"],
      lines_en: ["100 employees working securely from home", "256-bit encryption — unbreakable", "Login in seconds"] },
  ],
  netmgmt: [
    { emoji: "📺", title_ar: "لوحة مراقبة الشبكة", title_en: "Network Monitoring Dashboard",
      lines_ar: ["85 جهاز نشط — 2 تنبيه نشط", "استهلاك الإنترنت: 2.3 Gbps / 10 Gbps", "آخر عطل: 15 يوم 3 ساعات منذ"],
      lines_en: ["85 active devices — 2 active alerts", "Internet usage: 2.3 Gbps / 10 Gbps", "Last outage: 15 days 3 hours ago"] },
    { emoji: "🚨", title_ar: "تنبيه عطل ومعالجته", title_en: "Fault Alert & Resolution",
      lines_ar: ["02:14 ص — سقوط Switch الطابق الثالث ❌", "02:16 ص — فريق الدعم أُبلغ تلقائياً", "02:55 ص — تم الإصلاح ✅ (41 دقيقة)"],
      lines_en: ["02:14 AM — 3rd floor switch down ❌", "02:16 AM — Support team auto-notified", "02:55 AM — Resolved ✅ (41 minutes)"] },
    { emoji: "📋", title_ar: "تقرير أداء شهري", title_en: "Monthly Performance Report",
      lines_ar: ["متوسط الاستجابة: 12ms — Packet Loss: 0.01%", "Uptime: 99.94% — Downtime: 26 دقيقة فقط", "توصية: ترقية الـ Core Switch في Q3"],
      lines_en: ["Avg Latency: 12ms — Packet Loss: 0.01%", "Uptime: 99.94% — Downtime: 26 minutes only", "Recommendation: Upgrade Core Switch in Q3"] },
  ],
  telecom: [
    { emoji: "📞", title_ar: "نظام هاتفي VoIP لشركة", title_en: "Company VoIP Phone System",
      lines_ar: ["50 تحويلة داخلية — مجاناً بين الفروع", "IVR: 'للمبيعات اضغط 1، للدعم اضغط 2'", "توفير: -70% مقارنة بالهاتف التقليدي"],
      lines_en: ["50 internal extensions — free inter-branch calls", "IVR: 'For sales press 1, support press 2'", "Savings: -70% vs traditional phone"] },
    { emoji: "🌐", title_ar: "إنترنت مخصص للأعمال", title_en: "Dedicated Business Internet",
      lines_ar: ["سرعة: 500 Mbps محمي ومخصص بالكامل", "SLA: 99.9% — تعويض عن كل ساعة عطل", "دعم فني: 24/7 — استجابة خلال ساعة"],
      lines_en: ["Speed: 500 Mbps fully dedicated and protected", "SLA: 99.9% — Compensation per downtime hour", "24/7 support — 1-hour response"] },
    { emoji: "🎥", title_ar: "مؤتمر فيديو لـ 10 فروع", title_en: "Video Conference for 10 Branches",
      lines_ar: ["جودة 4K — بدون تقطع — مشفر بالكامل", "مشاركة الشاشة + السبورة التفاعلية", "يعمل على جميع الأجهزة"],
      lines_en: ["4K quality — no lag — fully encrypted", "Screen sharing + interactive whiteboard", "Works on all devices"] },
  ],
  ip: [
    { emoji: "📜", title_ar: "تسجيل براءة اختراع", title_en: "Patent Registration",
      lines_ar: ["الاختراع: جهاز طبي لقياس السكر لاسلكياً", "تسجيل محلي (ITIDA) + دولي (PCT)", "مدة الحماية: 20 سنة"],
      lines_en: ["Invention: Wireless blood glucose device", "Local (ITIDA) + International (PCT) registration", "Protection period: 20 years"] },
    { emoji: "™️", title_ar: "تسجيل علامة تجارية", title_en: "Trademark Registration",
      lines_ar: ["العلامة: NEXO — قطاع التكنولوجيا (Cls 42)", "حماية في مصر + دول الخليج الست", "المدة: أسبوعين للتقديم — 6-12 شهر للقبول"],
      lines_en: ["Brand: NEXO — Technology sector (Cls 42)", "Protection in Egypt + 6 Gulf countries", "Timeline: 2 weeks to file — 6-12 months approval"] },
    { emoji: "⚖️", title_ar: "قضية انتهاك ملكية فكرية", title_en: "IP Infringement Case",
      lines_ar: ["شركة منافسة نسخت تصميم التطبيق", "إشعار قانوني أُرسل — وقف الاستخدام", "تسوية ودية: تعويض 50,000 ج"],
      lines_en: ["Competitor copied the app design", "Legal notice sent — usage stopped", "Amicable settlement: $5,000 compensation"] },
  ],
  advtelecom: [
    { emoji: "📡", title_ar: "تركيب شبكة ألياف ضوئية", title_en: "Fiber Optic Network Installation",
      lines_ar: ["5 كم ألياف ضوئية داخل منطقة صناعية", "تربط: المصنع الرئيسي + 4 مستودعات", "السرعة: 10 Gbps — أي انقطاع: صفر"],
      lines_en: ["5 km fiber optic in industrial zone", "Connecting: Main factory + 4 warehouses", "Speed: 10 Gbps — Zero downtime"] },
    { emoji: "📺", title_ar: "نظام بث تلفزيوني رقمي", title_en: "Digital TV Broadcast System",
      lines_ar: ["قناة تلفزيونية مؤسسية داخلية", "بث مباشر للاجتماعات والتدريبات", "50 شاشة موزعة في المبنى"],
      lines_en: ["Internal corporate TV channel", "Live broadcast for meetings and training", "50 screens distributed across building"] },
    { emoji: "🛰️", title_ar: "اتصال عبر الأقمار الاصطناعية", title_en: "Satellite Communication",
      lines_ar: ["للمواقع النائية بدون إنترنت أرضي", "سرعة: 50 Mbps — كمون: 600ms", "مثال: منصة نفط بعيدة في الصحراء"],
      lines_en: ["For remote sites without ground internet", "Speed: 50 Mbps — Latency: 600ms", "Example: Remote oil platform in desert"] },
  ],
  rnd: [
    { emoji: "🤖", title_ar: "نموذج AI للكشف عن الأمراض", title_en: "AI Disease Detection Model",
      lines_ar: ["تحليل صور الأشعة بالذكاء الاصطناعي", "دقة: 94.7% — أسرع من طبيب بـ 10x", "تم تطويره بالتعاون مع جامعة القاهرة"],
      lines_en: ["AI analysis of X-ray images", "Accuracy: 94.7% — 10x faster than a doctor", "Developed in collaboration with Cairo University"] },
    { emoji: "🔬", title_ar: "دراسة جدوى تقنية", title_en: "Technical Feasibility Study",
      lines_ar: ["مشروع: تطوير تطبيق طلب سيارات", "التقرير: 45 صفحة — التكلفة/العائد/المخاطر", "توصية: جدوى عالية — ROI خلال 18 شهر"],
      lines_en: ["Project: Car-hailing app development", "Report: 45 pages — cost/return/risks", "Recommendation: High viability — ROI in 18 months"] },
    { emoji: "📡", title_ar: "بحث استشعار عن بعد", title_en: "Remote Sensing Research",
      lines_ar: ["تحليل صور الأقمار الاصطناعية للزراعة", "رصد الجفاف والآفات مبكراً", "تغطية: 1,200 كم² في نشرة واحدة"],
      lines_en: ["Satellite image analysis for agriculture", "Early drought and pest detection", "Coverage: 1,200 km² per report"] },
  ],
  training: [
    { emoji: "💻", title_ar: "دورة Python للمبتدئين", title_en: "Python for Beginners Course",
      lines_ar: ["المدة: 6 أسابيع — 3 جلسات/أسبوع", "المحتوى: أساسيات، OOP، قواعد البيانات", "الشهادة: معتمدة من Python Institute"],
      lines_en: ["Duration: 6 weeks — 3 sessions/week", "Content: Basics, OOP, Databases", "Certificate: Python Institute accredited"] },
    { emoji: "🔐", title_ar: "دورة الأمن السيبراني", title_en: "Cybersecurity Course (CEH)",
      lines_ar: ["اختبار الاختراق — تحليل البرمجيات الخبيثة", "مدة: 10 أسابيع — امتحان دولي EC-Council", "معدل النجاح: 89%"],
      lines_en: ["Penetration testing — malware analysis", "Duration: 10 weeks — EC-Council exam", "Pass rate: 89%"] },
    { emoji: "☁️", title_ar: "شهادة AWS Cloud Practitioner", title_en: "AWS Cloud Practitioner",
      lines_ar: ["4 أسابيع — نظري وعملي على AWS الحقيقي", "تشمل: EC2، S3، RDS، Lambda، IAM", "شهادة Amazon مُعترف بها دولياً"],
      lines_en: ["4 weeks — theory & hands-on on real AWS", "Covers: EC2, S3, RDS, Lambda, IAM", "Amazon internationally recognized certificate"] },
  ],
  bizcenters: [
    { emoji: "🏢", title_ar: "مساحة عمل مرنة لشركة ناشئة", title_en: "Flexible Workspace for Startup",
      lines_ar: ["مكتب مشترك: 500 ج/شهر", "مكتب خاص: 2,500 ج/شهر", "يشمل: إنترنت، طابعة، غرفة اجتماعات"],
      lines_en: ["Shared desk: $50/month", "Private office: $250/month", "Includes: internet, printer, meeting room"] },
    { emoji: "🚀", title_ar: "برنامج تسريع الشركات الناشئة", title_en: "Startup Acceleration Program",
      lines_ar: ["6 شهور — إرشاد أسبوعي من خبراء", "وصول للمستثمرين وصناديق التمويل", "خريجو البرنامج جمعوا 45 مليون ج تمويلاً"],
      lines_en: ["6 months — weekly expert mentorship", "Access to investors and funding funds", "Alumni raised $4.5M in funding"] },
    { emoji: "📋", title_ar: "خدمة تأسيس شركة", title_en: "Company Establishment Service",
      lines_ar: ["تسجيل شركة ذات مسؤولية محدودة", "السجل التجاري + البطاقة الضريبية + الختم", "الإنجاز خلال 5-7 أيام عمل"],
      lines_en: ["LLC company registration", "Commercial register + Tax card + Stamp", "Completed in 5-7 working days"] },
  ],
  digconv: [
    { emoji: "📸", title_ar: "رقمنة أرشيف صور قديمة", title_en: "Old Photo Archive Digitization",
      lines_ar: ["5,000 صورة فوتوغرافية ورقية", "مسح ضوئي بدقة 600 DPI — تنظيف وتحسين", "نسخ احتياطية على Cloud وهارد ديسك"],
      lines_en: ["5,000 paper photographs", "Scanned at 600 DPI — cleaned and enhanced", "Cloud + hard drive backup copies"] },
    { emoji: "🎵", title_ar: "تحويل تسجيلات صوتية قديمة", title_en: "Old Audio Recording Conversion",
      lines_ar: ["شرائط كاسيت → MP3 بجودة عالية", "تنقية الصوت وإزالة التشويش", "أرشيف موسيقي لشركة إنتاج"],
      lines_en: ["Cassette tapes → high-quality MP3", "Noise reduction and audio cleanup", "Music archive for production company"] },
    { emoji: "📖", title_ar: "تحويل كتاب لنسخة إلكترونية", title_en: "Book to E-book Conversion",
      lines_ar: ["كتاب 350 صفحة → EPUB + PDF تفاعلي", "فهرس قابل للبحث — نصوص قابلة للنسخ", "متوافق مع Kindle وiBooks وكل الأجهزة"],
      lines_en: ["350-page book → EPUB + interactive PDF", "Searchable index — copyable text", "Compatible with Kindle, iBooks, all devices"] },
  ],
  digmkt: [
    { emoji: "📱", title_ar: "حملة انستقرام لعلامة أزياء", title_en: "Instagram Campaign for Fashion Brand",
      lines_ar: ["ميزانية: 3,000 ج — مدة: 30 يوم", "التفاعل: +180% — متابعون جدد: 4,200", "مبيعات مباشرة من الإعلانات: 22,500 ج"],
      lines_en: ["Budget: $300 — Duration: 30 days", "Engagement: +180% — New followers: 4,200", "Direct sales from ads: $2,250"] },
    { emoji: "🔍", title_ar: "SEO لموقع محل إلكتروني", title_en: "SEO for Online Store",
      lines_ar: ["قبل: المرتبة 48 — بعد 4 شهور: المرتبة 3", "الزيارات العضوية: +340%", "المبيعات من البحث الطبيعي: +120%"],
      lines_en: ["Before: Rank 48 — After 4 months: Rank 3", "Organic traffic: +340%", "Sales from organic search: +120%"] },
    { emoji: "📧", title_ar: "حملة واتساب مارقتنج", title_en: "WhatsApp Marketing Campaign",
      lines_ar: ["الرسالة أُرسلت لـ 12,000 عميل سابق", "معدل الفتح: 89% (vs 22% للإيميل)", "تحويلات: 680 طلب جديد خلال 48 ساعة"],
      lines_en: ["Message sent to 12,000 past customers", "Open rate: 89% (vs 22% for email)", "Conversions: 680 new orders in 48 hours"] },
  ],
  webmgmt: [
    { emoji: "🌐", title_ar: "موقع شركة محاسبة", title_en: "Accounting Firm Website",
      lines_ar: ["تصميم احترافي — سرعة: 0.9 ثانية", "صفحات: الرئيسية، الخدمات، الفريق، اتصل بنا", "SEO: المرتبة الأولى على 'مكتب محاسبة في القاهرة'"],
      lines_en: ["Professional design — Speed: 0.9 seconds", "Pages: Home, Services, Team, Contact", "SEO: #1 for 'accounting firm in Cairo'"] },
    { emoji: "🛍️", title_ar: "موقع متجر إلكتروني", title_en: "E-store Website",
      lines_ar: ["500 منتج — فئات — بحث — فلترة", "دفع إلكتروني (فوري، PayMob)", "تحديث المخزون تلقائياً"],
      lines_en: ["500 products — categories — search — filters", "Online payment (Fawry, PayMob)", "Inventory auto-updated"] },
    { emoji: "📰", title_ar: "موقع إخباري بلوحة تحكم", title_en: "News Site with CMS",
      lines_ar: ["نشر مقالات بدون مبرمج من لوحة تحكم بسيطة", "تصنيفات، تعليقات، صور، فيديو", "يدعم العربية والإنجليزية + RTL"],
      lines_en: ["Publish articles without a developer", "Categories, comments, images, video", "Arabic & English + RTL support"] },
  ],
  ecom: [
    { emoji: "🏪", title_ar: "متجر إلكتروني لمستحضرات تجميل", title_en: "Cosmetics Online Store",
      lines_ar: ["350 منتج — 12 فئة — صور احترافية", "دفع: فوري، بطاقات، كاش عند الاستلام", "المبيعات في أول 3 أشهر: 185,000 ج"],
      lines_en: ["350 products — 12 categories — pro photos", "Payment: Fawry, cards, cash on delivery", "Sales in first 3 months: $18,500"] },
    { emoji: "📦", title_ar: "تكامل شركة شحن", title_en: "Shipping Company Integration",
      lines_ar: ["تكامل مع Bosta وAramex وMylerz", "تتبع آلي + إشعار العميل عند الشحن", "توليد بوليصة الشحن بنقرة واحدة"],
      lines_en: ["Integration with Bosta, Aramex, Mylerz", "Auto tracking + customer notified on ship", "Generate shipping label in one click"] },
    { emoji: "🎁", title_ar: "نظام كوبونات وعروض", title_en: "Coupons & Offers System",
      lines_ar: ["كوبون RAMADAN25 — خصم 25%", "صالح: 20 استخدام — ينتهي 30 يونيو", "نتيجة: 340 طلب إضافي خلال الحملة"],
      lines_en: ["Coupon RAMADAN25 — 25% discount", "Valid: 20 uses — expires June 30", "Result: 340 extra orders during campaign"] },
  ],
  exportimp: [
    { emoji: "🚢", title_ar: "تصدير آلات لدولة خليجية", title_en: "Machinery Export to Gulf",
      lines_ar: ["شحن 5 حاويات من ميناء الإسكندرية → دبي", "الوثائق: فاتورة، شهادة منشأ، شهادة مطابقة", "التخليص الجمركي في دبي: 3 أيام"],
      lines_en: ["5 containers: Alexandria port → Dubai", "Docs: Invoice, certificate of origin, conformity cert", "Dubai customs clearance: 3 days"] },
    { emoji: "✈️", title_ar: "استيراد مواد خام جوي", title_en: "Raw Materials Air Import",
      lines_ar: ["2,000 كجم مواد خام طبية — شحن جوي", "من: ألمانيا → مطار القاهرة", "تخليص جمركي خلال 24 ساعة من الوصول"],
      lines_en: ["2,000 kg medical raw materials — air freight", "From: Germany → Cairo Airport", "Customs cleared within 24 hours of arrival"] },
    { emoji: "📋", title_ar: "توثيق عقد استيراد", title_en: "Import Contract Documentation",
      lines_ar: ["عقد استيراد مع مورد صيني", "LC بنكية + شهادة فحص SGS", "الامتثال للوائح الجمارك المصرية"],
      lines_en: ["Import contract with Chinese supplier", "Bank LC + SGS inspection certificate", "Compliance with Egyptian customs regulations"] },
  ],
  filmtv: [
    { emoji: "🎬", title_ar: "إعلان تلفزيوني لبنك", title_en: "TV Commercial for a Bank",
      lines_ar: ["مدة الإعلان: 60 ثانية — للتلفزيون الوطني", "فريق: مخرج، ممثلون، تصوير، مونتاج", "ميزانية الإنتاج: 350,000 ج"],
      lines_en: ["Duration: 60 seconds — for national TV", "Team: director, actors, cinematography, editing", "Production budget: $35,000"] },
    { emoji: "🎥", title_ar: "فيلم وثائقي عن التراث", title_en: "Heritage Documentary Film",
      lines_ar: ["مدة: 45 دقيقة — لقناة وثائقية", "تصوير في 12 موقع — 3 أشهر إنتاج", "عُرض في 3 مهرجانات دولية"],
      lines_en: ["Duration: 45 minutes — for documentary channel", "Shot in 12 locations — 3 months production", "Screened at 3 international festivals"] },
    { emoji: "📺", title_ar: "مسلسل رقمي لمنصة سترييمنج", title_en: "Digital Series for Streaming",
      lines_ar: ["10 حلقات × 20 دقيقة — جودة 4K", "إتاحة على Netflix وShahed وOSN", "المشاهدات في الأسبوع الأول: 2.3 مليون"],
      lines_en: ["10 episodes × 20 minutes — 4K quality", "Available on Netflix, Shahed, OSN", "Views in first week: 2.3 million"] },
  ],
  creative: [
    { emoji: "📸", title_ar: "جلسة تصوير منتجات", title_en: "Product Photography Session",
      lines_ar: ["150 منتج مجوهرات — خلفية بيضاء وسوداء", "تعديل احترافي وريتاشينج", "التسليم: خلال 48 ساعة"],
      lines_en: ["150 jewelry products — white & black backgrounds", "Professional editing and retouching", "Delivery: within 48 hours"] },
    { emoji: "🎤", title_ar: "دوبلاج مسلسل للعربية", title_en: "Series Arabic Dubbing",
      lines_ar: ["مسلسل تركي — 30 حلقة × 45 دقيقة", "فريق أصوات + مزامنة شفاه احترافية", "تسليم: حلقتان يومياً"],
      lines_en: ["Turkish series — 30 episodes × 45 minutes", "Voice cast + professional lip-sync", "Delivery: 2 episodes per day"] },
    { emoji: "🎨", title_ar: "هوية بصرية كاملة", title_en: "Complete Visual Identity",
      lines_ar: ["لوغو + ألوان + خطوط + دليل الاستخدام", "قوالب جاهزة: بطاقة عمل، ورقة رسمية، حسابات سوشيال", "الإنجاز خلال 10 أيام عمل"],
      lines_en: ["Logo + colors + fonts + brand guidelines", "Ready templates: business card, letterhead, social", "Completed in 10 working days"] },
  ],
  vfx: [
    { emoji: "✨", title_ar: "مؤثرات CGI لفيلم قصير", title_en: "CGI Effects for Short Film",
      lines_ar: ["إضافة مبنى مستقبلي في خلفية المشهد", "انفجار رقمي بجودة سينمائية", "30 ثانية VFX — 2 أسبوع إنتاج"],
      lines_en: ["Adding futuristic building in scene background", "Digital explosion at cinematic quality", "30 seconds VFX — 2 weeks production"] },
    { emoji: "🚁", title_ar: "تصوير جوي لمشروع عقاري", title_en: "Drone Aerial for Real Estate",
      lines_ar: ["تصوير مجمع سكني من الجو", "فيديو 4K + صور بانورامية 360°", "عُرض في معرض سيتي سكيب"],
      lines_en: ["Aerial filming of residential compound", "4K video + 360° panoramic photos", "Showcased at Cityscape exhibition"] },
    { emoji: "🖼️", title_ar: "معالجة صور أرشيف قديم", title_en: "Old Archive Photo Restoration",
      lines_ar: ["صور أبيض وأسود من الخمسينيات", "تلوين + إزالة خدوش + تحسين الوضوح", "النتيجة: كأنها التُقطت اليوم"],
      lines_en: ["Black & white photos from the 1950s", "Colorization + scratch removal + clarity", "Result: looks like taken today"] },
  ],
  distrib: [
    { emoji: "🗺️", title_ar: "توزيع منتج غذائي وطني", title_en: "National Food Product Distribution",
      lines_ar: ["التغطية: 27 محافظة — 1,200 نقطة بيع", "الأسطول: 45 سيارة توزيع مبردة", "الطلبات يومياً: 340 طلب توصيل"],
      lines_en: ["Coverage: 27 governorates — 1,200 points of sale", "Fleet: 45 refrigerated delivery vehicles", "Daily orders: 340 deliveries"] },
    { emoji: "📦", title_ar: "مستودع تخزين معتمد", title_en: "Certified Storage Warehouse",
      lines_ar: ["المساحة: 5,000 م² — مكيف ومتحكم فيه", "نظام RFID لتتبع كل قطعة", "معتمد من هيئة الغذاء والدواء"],
      lines_en: ["Area: 5,000 m² — air-conditioned and controlled", "RFID system for tracking every item", "FDA certified"] },
    { emoji: "🌍", title_ar: "توزيع دولي في الخليج", title_en: "International Gulf Distribution",
      lines_ar: ["تصدير منتجات مصرية للسعودية والإمارات والكويت", "موزعون محليون معتمدون في كل دولة", "وقت التوصيل: 5-7 أيام عمل"],
      lines_en: ["Egyptian products exported to KSA, UAE, Kuwait", "Certified local distributors in each country", "Delivery time: 5-7 business days"] },
  ],
  tradagency: [
    { emoji: "🤝", title_ar: "تمثيل شركة ألمانية في مصر", title_en: "German Company Rep in Egypt",
      lines_ar: ["شركة آلات صناعية ألمانية", "المبيعات في أول سنة: 4.2 مليون يورو", "عقد تمثيل حصري لمدة 5 سنوات"],
      lines_en: ["German industrial machinery company", "First-year sales: €4.2 million", "Exclusive 5-year representation contract"] },
    { emoji: "📊", title_ar: "دراسة سوق المنتجات الغذائية", title_en: "Food Products Market Study",
      lines_ar: ["السوق المصري للشوكولاتة الفاخرة", "حجم السوق: 2.8 مليار ج — نمو 12% سنوياً", "توصية: دخول عبر المراكز التجارية الكبرى"],
      lines_en: ["Egyptian premium chocolate market", "Market size: $280M — 12% annual growth", "Recommendation: Enter via large malls"] },
    { emoji: "📝", title_ar: "إدارة عقد توكيل تجاري", title_en: "Commercial Agency Contract Mgmt",
      lines_ar: ["عقد توكيل حصري — 10 دول عربية", "تجديد تلقائي كل 3 سنوات بشروط واضحة", "رسوم الوكالة: 8% من كل عملية بيع"],
      lines_en: ["Exclusive agency contract — 10 Arab countries", "Auto-renewal every 3 years with clear terms", "Agency fee: 8% of every sale"] },
  ],
  logistics: [
    { emoji: "🚢", title_ar: "شحن بحري لـ 20 طن بضاعة", title_en: "Sea Freight for 20 Tons",
      lines_ar: ["الشحنة: أثاث مكتبي — القاهرة → ميناء جدة", "الحاوية: 40 قدم — مدة الشحن: 6 أيام", "التخليص + التوصيل النهائي مشمول"],
      lines_en: ["Shipment: office furniture — Cairo → Jeddah port", "Container: 40ft — Shipping time: 6 days", "Customs clearance + last mile included"] },
    { emoji: "✈️", title_ar: "شحن جوي عاجل", title_en: "Urgent Air Freight",
      lines_ar: ["قطع غيار طائرة — شحن جوي عاجل", "من: لندن → القاهرة في 18 ساعة", "تخليص جمركي مسبق — توصيل مباشر للمطار"],
      lines_en: ["Aircraft spare parts — urgent air freight", "From: London → Cairo in 18 hours", "Pre-clearance — direct airport delivery"] },
    { emoji: "📦", title_ar: "تغليف احترافي للشحن", title_en: "Professional Shipping Packaging",
      lines_ar: ["تغليف مقاوم للصدمات لأجهزة إلكترونية", "معايير ISPM-15 للشحن الدولي", "تأمين شامل على الشحنة ضد التلف"],
      lines_en: ["Shock-resistant packaging for electronics", "ISPM-15 standard for international shipping", "Comprehensive cargo insurance against damage"] },
  ],
  mktagency: [
    { emoji: "🎨", title_ar: "هوية بصرية لعلامة تجارية جديدة", title_en: "New Brand Visual Identity",
      lines_ar: ["الاسم: GreenLeaf Organics", "لوغو + 3 أوزان — ألوان: أخضر وذهبي", "دليل العلامة: 24 صفحة — قوالب جاهزة"],
      lines_en: ["Name: GreenLeaf Organics", "Logo + 3 weights — Colors: green & gold", "Brand guide: 24 pages — ready templates"] },
    { emoji: "📺", title_ar: "حملة إطلاق منتج تلفزيوني", title_en: "TV Product Launch Campaign",
      lines_ar: ["إعلان 30 ثانية — 3 قنوات مصرية", "مدة الحملة: 4 أسابيع", "الوعي بالعلامة بعد الحملة: +67%"],
      lines_en: ["30-second ad — 3 Egyptian channels", "Campaign duration: 4 weeks", "Brand awareness after campaign: +67%"] },
    { emoji: "🎤", title_ar: "تنظيم مؤتمر أعمال", title_en: "Business Conference Organization",
      lines_ar: ["500 حضور — فندق النيل هيلتون", "الاهتمام بكل التفاصيل: ديكور، ضيافة، تغطية", "تغطية إعلامية في 12 وسيلة إعلام"],
      lines_en: ["500 attendees — Nile Hilton Hotel", "Full details: decor, hospitality, coverage", "Media coverage in 12 outlets"] },
  ],
  swagency: [
    { emoji: "🪟", title_ar: "ترخيص Microsoft 365 لشركة", title_en: "Microsoft 365 Licensing for Company",
      lines_ar: ["150 مستخدم — Microsoft 365 Business Premium", "يشمل: Outlook، Teams، SharePoint، OneDrive", "الدعم الفني والتدريب مشمول"],
      lines_en: ["150 users — Microsoft 365 Business Premium", "Includes: Outlook, Teams, SharePoint, OneDrive", "Technical support and training included"] },
    { emoji: "🏗️", title_ar: "تطبيق SAP ERP لمصنع", title_en: "SAP ERP Implementation for Factory",
      lines_ar: ["وحدات: المالية، المشتريات، الإنتاج، المخزون", "مدة التطبيق: 4 أشهر — 30 مستخدم", "ROI محقق خلال 14 شهراً"],
      lines_en: ["Modules: Finance, Procurement, Production, Inventory", "Implementation: 4 months — 30 users", "ROI achieved in 14 months"] },
    { emoji: "📊", title_ar: "Oracle Analytics لبنك", title_en: "Oracle Analytics for a Bank",
      lines_ar: ["تحليل بيانات 2 مليون عميل", "لوحات BI تفاعلية للإدارة العليا", "تقارير فورية — استغراق: 0.3 ثانية"],
      lines_en: ["Analysis of 2 million customer records", "Interactive BI dashboards for top management", "Real-time reports — processing: 0.3 seconds"] },
  ],
};

const FALLBACK_SERVICES: WsService[] = [
  { id:"erp",      name_ar:"ERP والمالية",               name_en:"ERP & Finance",             desc_ar:"نظام ERP مالي متكامل يوفر محاسبة احترافية كاملة — دفتر الأستاذ، الفواتير، التقارير الضريبية، وتقارير الربح والخسارة الفورية.",                              desc_en:"Complete ERP finance system — general ledger, invoices, tax reports, and real-time P&L.",            category:"business", color:"#D4A017", icon_name:"BarChart3", features_ar:["دفتر الأستاذ العام","فواتير البيع والشراء","تقارير ضريبية","تحليل التدفق النقدي","تقرير الربح والخسارة","ميزان المراجعة","مراكز التكلفة","دعم العملات المتعددة"], features_en:["General Ledger","Sales & Purchase Invoices","Tax Reports","Cash Flow Analysis","P&L Reports","Trial Balance","Cost Centers","Multi-Currency"], is_active:true, sort_order:10 },
  { id:"hr",       name_ar:"الموارد البشرية والحضور",    name_en:"HR & Attendance",           desc_ar:"نظام متكامل للحضور بـ QR والبيومترية، كشوف الرواتب، إدارة الإجازات، وتقييم الأداء.",                                                                        desc_en:"Integrated HR system — QR/biometric attendance, payroll, leave management, and performance reviews.", category:"business", color:"#8B5CF6", icon_name:"Users",    features_ar:["حضور QR وبيومترية","كشوف الرواتب","إدارة الإجازات","ملف الموظف الشامل","تقارير الغيابات","تقييم الأداء","مزامنة الأجهزة","نظام الإشعارات"],        features_en:["QR & Biometric Attendance","Payroll","Leave Management","Employee Profile","Absence Reports","Performance Appraisal","Device Sync","Notifications"],  is_active:true, sort_order:20 },
  { id:"vendor",   name_ar:"البائع والتجارة",             name_en:"Vendor & Commerce",         desc_ar:"منصة تجارة إلكترونية متكاملة — محفظة البائع، خصم عمولة تلقائي، إدارة منتجات SKU، وتتبع الطلبات.",                                                           desc_en:"Full e-commerce platform — vendor wallet, auto commission, SKU products, order tracking.",            category:"commerce", color:"#F97316", icon_name:"Package",  features_ar:["محفظة البائع","خصم عمولة تلقائي","طلبات السحب","إدارة SKU","تتبع المخزون","إدارة الطلبات","تقييمات العملاء","إحصائيات المبيعات"],                 features_en:["Vendor Wallet","Auto Commission","Withdrawal Requests","SKU Management","Inventory Tracking","Order Management","Customer Reviews","Sales Analytics"], is_active:true, sort_order:30 },
  { id:"marketing",name_ar:"التسويق وإدارة العملاء",     name_en:"Marketing & CRM",           desc_ar:"نظام CRM متكامل — خط مبيعات Kanban، إدارة حملات متعددة القنوات، تحليلات ROI، وأتمتة المتابعة.",                                                            desc_en:"Full CRM — Kanban pipeline, multi-channel campaigns, ROI analytics, follow-up automation.",           category:"marketing",color:"#EC4899", icon_name:"BarChart3", features_ar:["خط مبيعات Kanban","حملات متعددة القنوات","تحليلات ROI","أتمتة المتابعة","تقسيم العملاء","تاريخ التواصل","تقارير المبيعات","نماذج جمع البيانات"],   features_en:["Kanban Pipeline","Multi-channel Campaigns","ROI Analytics","Follow-up Automation","Segmentation","Interaction History","Sales Reports","Lead Forms"],   is_active:true, sort_order:40 },
  { id:"ai",       name_ar:"وكلاء المحادثة الذكية",      name_en:"AI Chat Agents",            desc_ar:"وكلاء AI بـ GPT-4 مخصصون لكل علامة تجارية — دعم 24/7، تاريخ محادثات، وتحويل لموظف بشري.",                                                                   desc_en:"GPT-4 AI agents per brand — 24/7 support, conversation history, and human handoff.",                  category:"tech",     color:"#06B6D4", icon_name:"Bot",      features_ar:["وكيل مخصص لكل براند","دعم 24/7","تاريخ المحادثات","عربي وإنجليزي","تدريب على بياناتك","تقييم الردود","تدفق فوري","تحويل لموظف بشري"],             features_en:["Brand-specific Agent","24/7 Support","Conversation History","Arabic & English","Custom Training","Response Rating","Streaming","Human Handoff"],      is_active:true, sort_order:50 },
  { id:"partner",  name_ar:"بيئات عمل الشركاء",          name_en:"Partner Workspaces",        desc_ar:"بيئات عمل معزولة لكل شريك — إدارة علامات تجارية، فريق عمل، قطاعات، وتقارير إيرادات خاصة.",                                                                 desc_en:"Isolated workspaces per partner — brands, team, sectors, and private revenue reports.",               category:"business", color:"#6366F1", icon_name:"Building2", features_ar:["بيئة معزولة","إدارة علامات تجارية","تفعيل القطاعات","إدارة الفريق","تقارير إيرادات","كود فريد","تعدد المستأجرين","نظام الموافقة"],               features_en:["Isolated Workspace","Brand Management","Sector Activation","Team Management","Revenue Reports","Unique Code","Multi-tenant","Approval System"],       is_active:true, sort_order:60 },
  { id:"agent",    name_ar:"شبكة الوكلاء",               name_en:"Agent Network",             desc_ar:"إدارة شبكة الوكلاء — تتبع العملاء، عمولات تلقائية، خط مبيعات، وتحليلات الأداء.",                                                                           desc_en:"Agent network management — client tracking, auto commissions, deal pipeline, performance analytics.",  category:"sales",    color:"#10B981", icon_name:"Users",    features_ar:["ملف الوكيل الشامل","تتبع العملاء","عمولات تلقائية","طلبات سحب","خط مبيعات","تقارير الأداء","نظام الإشعارات","مقارنة الوكلاء"],                    features_en:["Agent Profile","Client Tracking","Auto Commissions","Withdrawals","Sales Pipeline","Performance Reports","Notifications","Agent Comparison"],        is_active:true, sort_order:70 },
  { id:"security", name_ar:"الأمان والامتثال",            name_en:"Security & Compliance",     desc_ar:"منظومة أمان شاملة — RLS، 2FA، SSO، قائمة IP البيضاء، سجلات تدقيق، وإدارة صلاحيات دقيقة.",                                                                  desc_en:"Full security system — RLS, 2FA, SSO, IP whitelist, audit logs, granular permissions.",               category:"tech",     color:"#EF4444", icon_name:"Shield",   features_ar:["أمان RLS","توثيق 2FA","تسجيل دخول SSO","قائمة IP البيضاء","سجلات التدقيق","إدارة الأدوار","تشفير البيانات","تنبيهات الاختراق"],                     features_en:["Row Level Security","2FA","SSO","IP Whitelist","Audit Logs","Role Management","Data Encryption","Breach Alerts"],                                    is_active:true, sort_order:80 },
  { id:"sectors",  name_ar:"القطاعات الديناميكية",        name_en:"Dynamic Sectors",           desc_ar:"مصنع قطاعات ديناميكي — تفعيل/تعطيل وحدات صناعات متخصصة فوراً مع أدوات وتقارير مخصصة.",                                                                      desc_en:"Dynamic sector factory — instantly activate/deactivate specialized industry modules.",                category:"business", color:"#F59E0B", icon_name:"Layers",   features_ar:["تفعيل فوري للقطاعات","وحدات مخصصة","قطاعات جاهزة","أدوات لكل قطاع","تحكم إداري","تخصيص للشركاء","إضافة قطاعات","تكامل بين القطاعات"],            features_en:["Instant Activation","Custom Modules","Ready Sectors","Sector Tools","Admin Control","Partner Sectors","Add Sectors","Cross-sector Integration"],   is_active:true, sort_order:90 },
  { id:"api",      name_ar:"APIs مفتوحة وتكامل",         name_en:"Open APIs & Integrations",  desc_ar:"واجهات برمجية مفتوحة — REST API، Webhooks، Edge Functions، ومزامنة الأجهزة البيومترية.",                                                                     desc_en:"Open APIs — REST, webhooks, Edge Functions, biometric sync, full developer toolkit.",                 category:"tech",     color:"#A855F7", icon_name:"Code2",   features_ar:["REST API موثق","Webhooks","Edge Functions","مزامنة بيومترية","مفاتيح API","سجل الطلبات","دعم GraphQL","SDK جاهز"],                                    features_en:["Documented REST API","Webhooks","Edge Functions","Biometric Sync","API Keys","Request Logs","GraphQL Support","Ready SDK"],                         is_active:true, sort_order:100 },
  { id:"itmanuf",  name_ar:"صناعة تكنولوجيا المعلومات",  name_en:"IT Industry Manufacturing", desc_ar:"تصنيع وتوريد المعدات الإلكترونية، تصميم وإنشاء مراكز البيانات، وحلول البنية التحتية الرقمية الشاملة.",                                                       desc_en:"Electronic equipment supply, data center design, and comprehensive digital infrastructure.",           category:"tech",     color:"#3B82F6", icon_name:"Server",   features_ar:["توريد معدات إلكترونية","مراكز البيانات","حلول الخوادم","بنية تحتية شبكية","أنظمة تبريد وطاقة","صيانة المعدات","استشارات الأجهزة","حلول DR"],      features_en:["Equipment Supply","Data Centers","Server Solutions","Network Infrastructure","Cooling & Power","Equipment Maintenance","HW Consulting","DR"],       is_active:true, sort_order:110 },
  { id:"softdev",  name_ar:"تطوير البرمجيات وقواعد البيانات",name_en:"Software & Database Development",desc_ar:"تطوير برمجيات مخصصة وقواعد بيانات احترافية — تطبيقات ويب وموبايل، ERP/CRM مخصص، ونقل البيانات.",desc_en:"Custom software and database development — web/mobile apps, custom ERP/CRM, data migration.",       category:"tech",     color:"#8B5CF6", icon_name:"FileCode", features_ar:["تطبيقات ويب وموبايل","قواعد بيانات عالية الأداء","ERP/CRM مخصص","نقل البيانات","تطوير API","اختبار الجودة","تدريب الفريق","صيانة مستمرة"],        features_en:["Web & Mobile Apps","High-performance DB","Custom ERP/CRM","Data Migration","API Development","QA Testing","Team Training","Ongoing Maintenance"],  is_active:true, sort_order:120 },
  { id:"appdesign",name_ar:"تصميم وإنتاج التطبيقات",     name_en:"App Design & Production",  desc_ar:"تصميم UI/UX متكامل، نماذج أولية، تطبيقات iOS/Android، PWA، وأنظمة إدارة المحتوى.",                                                                          desc_en:"Complete UI/UX, prototypes, iOS/Android apps, PWA, and content management systems.",                  category:"tech",     color:"#06B6D4", icon_name:"Monitor",  features_ar:["تصميم UI/UX","نماذج أولية","تطبيقات iOS وAndroid","تطبيقات PWA","أنظمة CMS","تحسين الأداء","تصميم متجاوب","اختبار على أجهزة حقيقية"],           features_en:["UI/UX Design","Prototypes","iOS & Android","PWA","CMS","Performance","Responsive Design","Real Device Testing"],                                   is_active:true, sort_order:130 },
  { id:"digcontent",name_ar:"إنتاج المحتوى الرقمي",      name_en:"Digital Content Production",desc_ar:"محتوى رقمي متنوع — كتابة تسويقية، إنفوغرافيك، فيديوهات، بودكاست، ومحتوى وسائل التواصل.",                                                                  desc_en:"Diverse digital content — copywriting, infographics, videos, podcasts, social media content.",       category:"media",    color:"#EC4899", icon_name:"Film",     features_ar:["كتابة تسويقية","إنفوغرافيك ورسوم متحركة","فيديوهات ترويجية","محتوى سوشيال ميديا","بودكاست","ترجمة عربي/إنجليزي","تحرير المحتوى","خطة شهرية"],    features_en:["Copywriting","Infographics & Animation","Promo Videos","Social Media Content","Podcast","Translation","Content Editing","Monthly Plan"],           is_active:true, sort_order:140 },
  { id:"dataentry",name_ar:"إدخال البيانات الإلكترونية", name_en:"Electronic Data Entry",     desc_ar:"إدخال بيانات دقيق من وثائق ورقية، تحويل الصيغ، أرشفة إلكترونية، ومعالجة البيانات الكبيرة.",                                                                  desc_en:"Accurate data entry, format conversion, electronic archiving, and big data processing.",              category:"tech",     color:"#F59E0B", icon_name:"Database", features_ar:["إدخال من وثائق ورقية","تحويل PDF إلى Excel","أرشفة إلكترونية","معالجة بيانات كبيرة","التحقق من الدقة","عربي وإنجليزي","معالجة النماذج","سرية تامة"],features_en:["Paper-to-Digital Entry","PDF to Excel","Electronic Archiving","Big Data","Accuracy Verification","Arabic & English","Forms","Full Confidentiality"], is_active:true, sort_order:150 },
  { id:"sysdesign",name_ar:"تصميم نظم الحاسبات",         name_en:"Computer Systems Design",  desc_ar:"تصميم معمارية الأنظمة، اختيار المواصفات، تكامل الأجهزة والبرمجيات، وخطط الصيانة والاستمرارية.",                                                              desc_en:"System architecture, spec selection, hardware/software integration, maintenance and continuity.",      category:"tech",     color:"#10B981", icon_name:"Cpu",      features_ar:["معمارية النظام","مواصفات تقنية","تكامل أجهزة وبرمجيات","تحسين الأداء","استشارات التوسع","توثيق النظام","اختبار وقبول","خطط الاستمرارية"],        features_en:["System Architecture","Technical Specs","HW/SW Integration","Performance","Scaling Consulting","Documentation","Testing & Acceptance","Continuity"],  is_active:true, sort_order:160 },
  { id:"embedded", name_ar:"النظم المدمجة والمضمنة",     name_en:"Embedded & Integrated Systems",desc_ar:"تصميم أنظمة IoT ونظم مدمجة صناعية — برمجة متحكمات، أتمتة، أجهزة ذكية، ومزامنة أجهزة الاستشعار.",desc_en:"IoT and embedded systems — microcontrollers, industrial automation, smart devices, sensor integration.", category:"tech",     color:"#F97316", icon_name:"HardDrive",features_ar:["برمجة متحكمات دقيقة","بروتوكولات الاتصال","أتمتة صناعية","أجهزة IoT","أجهزة الاستشعار","واجهات تحكم","أنظمة إنذار مبكر","تدريب الفريق"],       features_en:["Microcontroller Programming","Communication Protocols","Industrial Automation","IoT Devices","Sensors","Control Interfaces","Alarm Systems","Training"],is_active:true, sort_order:170 },
  { id:"netdesign",name_ar:"تصميم شبكات البيانات",       name_en:"Data Network Design",       desc_ar:"تصميم شبكات LAN/WAN/VPN احترافية، اختيار المعدات، وضمان الأمان والأداء الأمثل.",                                                                              desc_en:"Professional LAN/WAN/VPN network design, equipment selection, security and optimal performance.",     category:"telecom",  color:"#6366F1", icon_name:"Network",  features_ar:["هندسة الشبكة","LAN وWAN وVPN","شبكات Wi-Fi","MPLS وSD-WAN","أمان وجدران نارية","توثيق المخططات","اختبار الأداء","التحقق من التصميم"],              features_en:["Network Architecture","LAN WAN VPN","Wi-Fi Planning","MPLS & SD-WAN","Security & Firewalls","Diagrams","Performance Testing","Design Verification"], is_active:true, sort_order:180 },
  { id:"netmgmt",  name_ar:"إدارة شبكات البيانات",       name_en:"Data Network Management",   desc_ar:"مراقبة شبكات 24/7، صيانة دورية، استجابة سريعة للأعطال، وضمان استمرارية 99.9%.",                                                                               desc_en:"24/7 network monitoring, periodic maintenance, rapid fault response, 99.9% uptime guarantee.",        category:"telecom",  color:"#14B8A6", icon_name:"Wifi",     features_ar:["مراقبة 24/7","إدارة الأداء","صيانة دورية","استجابة سريعة للأعطال","ترقية مكونات الشبكة","تقارير شهرية","إدارة IP","ضمان 99.9% uptime"],            features_en:["24/7 Monitoring","Performance Mgmt","Periodic Maintenance","Rapid Response","Upgrades","Monthly Reports","IP Management","99.9% Uptime"],          is_active:true, sort_order:190 },
  { id:"telecom",  name_ar:"خدمات الاتصالات والإنترنت",  name_en:"Telecom & Internet Services",desc_ar:"إنترنت عالي السرعة للأعمال، VoIP، خدمات كلاود، خطوط مخصصة، ودعم فني 24/7.",                                                                                desc_en:"High-speed business internet, VoIP, cloud services, leased lines, and 24/7 technical support.",       category:"telecom",  color:"#3B82F6", icon_name:"Globe",    features_ar:["إنترنت عالي السرعة","خدمات VoIP","حلول الكلاود","خطوط مخصصة","مؤتمرات صوتية ومرئية","دعم 24/7","SLA مضمون","مراقبة الخدمة"],                      features_en:["High-speed Internet","VoIP Services","Cloud Solutions","Leased Lines","Audio/Video Conferencing","24/7 Support","Guaranteed SLA","Monitoring"],    is_active:true, sort_order:200 },
  { id:"ip",       name_ar:"حماية الملكية الفكرية",      name_en:"Intellectual Property & Innovation",desc_ar:"تسجيل براءات اختراع وعلامات تجارية، حماية حقوق الطبع، استشارات قانونية، وإدارة محفظة الملكية الفكرية.",desc_en:"Patent & trademark registration, copyright protection, legal consulting, IP portfolio management.", category:"legal",    color:"#EF4444", icon_name:"Award",    features_ar:["تسجيل براءات اختراع","تسجيل العلامات التجارية","حقوق الطبع","استشارات قانونية","حماية الابتكار","إدارة المحفظة","اتفاقيات الترخيص","متابعة القضايا"],features_en:["Patent Registration","Trademark Registration","Copyright","Legal Consulting","Innovation Protection","Portfolio Mgmt","Licensing Agreements","Litigation"],is_active:true, sort_order:210 },
  { id:"advtelecom",name_ar:"شبكات الاتصالات المتقدمة",  name_en:"Advanced Telecom Networks", desc_ar:"تركيب محطات اتصالات، ألياف ضوئية، شبكات 4G/5G خاصة، بث رقمي، وحلول الأقمار الاصطناعية.",                                                                   desc_en:"Telecom stations, fiber optics, private 4G/5G, digital broadcast, satellite communication.",          category:"telecom",  color:"#A855F7", icon_name:"Wifi",     features_ar:["محطات اتصالات","ألياف ضوئية FTTx","شبكات 4G/5G","بث رقمي","أقمار اصطناعية","شبكات ميكروويف","IPTV","صيانة وضمان"],                               features_en:["Telecom Stations","Fiber Optics (FTTx)","4G/5G Networks","Digital Broadcast","Satellite","Microwave","IPTV","Maintenance & Warranty"],             is_active:true, sort_order:220 },
  { id:"rnd",      name_ar:"البحث والتطوير التقني",       name_en:"Technology R&D",            desc_ar:"أبحاث تطبيقية في الذكاء الاصطناعي، نماذج أولية للمنتجات، دراسات جدوى، وتقارير الاتجاهات التكنولوجية.",                                                       desc_en:"Applied AI research, product prototypes, feasibility studies, and technology trend reports.",         category:"tech",     color:"#F59E0B", icon_name:"Search",   features_ar:["أبحاث AI","نماذج أولية","أبحاث الفضاء","دراسات الجدوى","تقارير الاتجاهات","شراكات أكاديمية","تعلم الآلة","ابتكار صناعي"],                         features_en:["AI Research","Prototypes","Space Research","Feasibility Studies","Trend Reports","Academic Partnerships","ML Solutions","Industry Innovation"],     is_active:true, sort_order:230 },
  { id:"training", name_ar:"مراكز التدريب التقني",        name_en:"Technical Training Centers",desc_ar:"برامج تدريب معتمدة في البرمجة، الشبكات، الأمن السيبراني، الذكاء الاصطناعي، وتقنيات الكلاود.",                                                                 desc_en:"Accredited training in programming, networking, cybersecurity, AI, and cloud technologies.",          category:"business", color:"#10B981", icon_name:"BookOpen", features_ar:["برمجة Python/JS","شبكات CCNA","أمن سيبراني CEH","ذكاء اصطناعي","قواعد بيانات SQL","كلاود AWS/Azure","شهادات دولية","تدريب عملي"],                  features_en:["Python/JS Programming","CCNA Networking","CEH Cybersecurity","AI","SQL Databases","AWS/Azure Cloud","International Certifications","Hands-on Training"],is_active:true, sort_order:240 },
  { id:"bizcenters",name_ar:"مراكز الأعمال التكنولوجية", name_en:"Technology Business Centers",desc_ar:"مراكز أعمال لدعم الشركات الناشئة — مساحات مرنة، خدمات إدارية، إرشاد ريادي، وتسهيل التمويل.",                                                               desc_en:"Business centers for startups — flexible spaces, admin services, mentorship, funding facilitation.",  category:"business", color:"#6366F1", icon_name:"Building2", features_ar:["مساحات عمل مرنة","خدمات إدارية وقانونية","إرشاد ريادي","شبكات أعمال","تسهيل التمويل","برامج تسريع","شراكات أكاديمية","تأسيس الشركات"],           features_en:["Flexible Workspaces","Admin & Legal Services","Mentorship","Business Networks","Funding Access","Acceleration Programs","Academic Partnerships","Company Setup"],is_active:true, sort_order:250 },
  { id:"digconv",  name_ar:"تحويل المحتوى الرقمي",       name_en:"Digital Content Conversion",desc_ar:"تحويل وثائق ورقية لرقمية، تحويل صيغ صوتية/مرئية، رقمنة الأرشيفات، وضغط الملفات.",                                                                            desc_en:"Paper-to-digital documents, audio/video conversion, archive digitization, file compression.",         category:"media",    color:"#EC4899", icon_name:"Settings2",features_ar:["تحويل وثائق ورقية","تحويل صيغ صوتية","تحويل صيغ مرئية","رقمنة الأرشيفات","ضغط الملفات","تنظيم الأرشيف","استخراج النصوص OCR","كتب إلكترونية"],  features_en:["Paper-to-Digital","Audio Format Conversion","Video Format Conversion","Archive Digitization","Compression","Archive Organization","OCR","E-books"],  is_active:true, sort_order:260 },
  { id:"digmkt",   name_ar:"التسويق الإلكتروني",          name_en:"Digital Marketing",         desc_ar:"تسويق رقمي شامل — إدارة سوشيال ميديا، Google/Facebook Ads، SEO، وتسويق بالمحتوى.",                                                                           desc_en:"Full digital marketing — social media, Google/Facebook Ads, SEO, content marketing.",                 category:"marketing",color:"#EC4899", icon_name:"Megaphone",features_ar:["إدارة السوشيال ميديا","Google Ads وFacebook Ads","تحسين SEO","تسويق بالمحتوى","تسويق بالإيميل","تحليلات ROI","استراتيجية تسويقية","تقارير أسبوعية"],  features_en:["Social Media Management","Google & Facebook Ads","SEO","Content Marketing","Email Marketing","ROI Analytics","Marketing Strategy","Weekly Reports"],  is_active:true, sort_order:270 },
  { id:"webmgmt",  name_ar:"إدارة المواقع الإلكترونية",  name_en:"Website Management",        desc_ar:"تصميم وتطوير مواقع احترافية بـ WordPress وReact وNext.js، تحسين SEO، واستضافة آمنة.",                                                                        desc_en:"Professional websites with WordPress, React, Next.js, SEO optimization, and secure hosting.",         category:"tech",     color:"#06B6D4", icon_name:"Globe",    features_ar:["تصميم عصري","WordPress وReact وNext.js","تحسين السرعة","SEO متكامل","استضافة آمنة SSL","تحديثات دورية","موقع متجاوب","لوحة تحكم CMS"],              features_en:["Modern Design","WordPress React Next.js","Speed Optimization","Full SEO","Secure SSL Hosting","Periodic Updates","Responsive","CMS Panel"],         is_active:true, sort_order:280 },
  { id:"ecom",     name_ar:"التجارة الإلكترونية",         name_en:"E-Commerce Solutions",      desc_ar:"حلول متجر إلكتروني متكاملة — تصميم، بوابات دفع (فوري، PayMob، Stripe)، إدارة مخزون، وتسويق.",                                                               desc_en:"Full e-commerce — store design, payments (Fawry, PayMob, Stripe), inventory, marketing.",             category:"commerce", color:"#F97316", icon_name:"Package",  features_ar:["تصميم متجر احترافي","بوابات دفع محلية ودولية","إدارة المنتجات","نظام المخزون","تكامل الشحن","كوبونات وعروض","تسويق المتجر","تقارير يومية"],         features_en:["Professional Store Design","Local & Global Payments","Product Management","Inventory","Shipping Integration","Coupons & Offers","Marketing","Daily Reports"],is_active:true, sort_order:290 },
  { id:"exportimp",name_ar:"خدمات التصدير والاستيراد",   name_en:"Export & Import Services",  desc_ar:"تخليص جمركي بري/بحري/جوي، توثيق التجارة الدولية، شهادات المنشأ، وتمويل التجارة الخارجية.",                                                                   desc_en:"Land/sea/air customs clearance, trade documentation, certificates of origin, trade financing.",       category:"commerce", color:"#D4A017", icon_name:"Truck",    features_ar:["تخليص جمركي بري/بحري/جوي","توثيق تجاري دولي","شهادات المنشأ","تمويل التجارة LC/TT","تنسيق الموانئ","تتبع الشحنات","امتثال جمركي دولي","استشارات"],features_en:["Land/Sea/Air Customs","International Documentation","Certificates of Origin","Trade Finance","Port Coordination","Tracking","Compliance","Consulting"],is_active:true, sort_order:300 },
  { id:"filmtv",   name_ar:"الإنتاج الفني والسينمائي",   name_en:"Film, TV & Artistic Production",desc_ar:"إنتاج أفلام ومسلسلات وإعلانات تجارية، توزيع على المنصات الرقمية، وإنتاج مشترك دولي.",desc_en:"Film, series, commercial production, digital platform distribution, international co-production.", category:"media",    color:"#A855F7", icon_name:"Film",     features_ar:["إنتاج أفلام","مسلسلات تلفزيونية","إعلانات تجارية","توزيع على Netflix/YouTube","برامج وثائقية","محتوى مسرحي","إنتاج مشترك دولي","ما بعد الإنتاج"],  features_en:["Film Production","TV Series","Commercials","Netflix/YouTube Distribution","Documentaries","Theater","International Co-production","Post-production"],is_active:true, sort_order:310 },
  { id:"creative", name_ar:"الأعمال الفنية والإبداعية",  name_en:"Creative & Artistic Services",desc_ar:"تصوير احترافي، مكساج صوتي، مونتاج، دوبلاج، تصحيح ألوان سينمائي، ورسوم متحركة.",         desc_en:"Photography, audio mixing, video editing, dubbing, color grading, and motion graphics.",              category:"media",    color:"#EC4899", icon_name:"Camera",   features_ar:["تصوير احترافي","مكساج صوتي","مونتاج فيديو","دوبلاج وتعليق صوتي","تصحيح ألوان","رسوم متحركة","هوية بصرية","محتوى رقمي"],                           features_en:["Professional Photography","Audio Mixing","Video Editing","Dubbing & Voice-over","Color Grading","Motion Graphics","Visual Identity","Digital Content"],is_active:true, sort_order:320 },
  { id:"vfx",      name_ar:"التصوير والمؤثرات البصرية",  name_en:"Photography & Visual Effects",desc_ar:"تصوير منتجات وفعاليات، تعديل صور، مؤثرات بصرية CGI/VFX، كروما كي، وتصوير جوي بالدرون.",desc_en:"Product/event photography, retouching, CGI/VFX, chroma key, and aerial drone photography.",          category:"media",    color:"#F59E0B", icon_name:"Camera",   features_ar:["تصوير منتجات","تصوير فعاليات","ريتاشينج احترافي","مؤثرات CGI وVFX","كروما كي","تصوير جوي بالدرون","تصوير 360","معالجة صور قديمة"],                features_en:["Product Photography","Event Photography","Retouching","CGI & VFX","Chroma Key","Drone Photography","360 Photography","Photo Restoration"],         is_active:true, sort_order:330 },
  { id:"distrib",  name_ar:"وكالة توزيع المنتجات",        name_en:"Product Distribution Agency",desc_ar:"توزيع منتجات محلي ودولي بشبكة موزعين معتمدة، إدارة سلسلة التوريد، وتتبع لوجستي متكامل.",  desc_en:"Local & international distribution, certified distributor network, supply chain and logistics.",      category:"agency",   color:"#10B981", icon_name:"Package",  features_ar:["شبكة موزعين معتمدة","إدارة سلسلة التوريد","مستودعات معتمدة","شحن وتوزيع سريع","تتبع الشحنات","إدارة الموزعين","تقارير التوزيع","توزيع دولي"],    features_en:["Certified Distributor Network","Supply Chain","Certified Warehouses","Fast Delivery","Shipment Tracking","Distributor Management","Reports","International"],is_active:true, sort_order:340 },
  { id:"tradagency",name_ar:"وكالة التجارة الدولية",     name_en:"International Trade Agency", desc_ar:"تمثيل تجاري حصري للشركات الأجنبية في السوق المصري والعربي، دراسات سوقية، وشراكات استراتيجية.", desc_en:"Exclusive commercial representation for foreign companies, market studies, strategic partnerships.",  category:"agency",   color:"#D4A017", icon_name:"Globe",    features_ar:["تمثيل تجاري حصري","تسويق منتجات دولية","إدارة عقود التوكيلات","دراسات سوقية","شراكات استراتيجية","ترجمة وتفاوض","امتثال قانوني","تقارير السوق"],   features_en:["Exclusive Representation","International Product Marketing","Agency Contracts","Market Studies","Strategic Partnerships","Negotiation","Compliance","Market Reports"],is_active:true, sort_order:350 },
  { id:"logistics",name_ar:"وكالة الخدمات اللوجستية",    name_en:"Logistics Services Agency",  desc_ar:"شحن دولي بري/بحري/جوي، تخزين معتمد، تعبئة وتغليف، تخليص جمركي، وتأمين الشحنات.",           desc_en:"International shipping, certified warehousing, packaging, customs clearance, cargo insurance.",       category:"agency",   color:"#3B82F6", icon_name:"Truck",    features_ar:["شحن دولي بري/بحري/جوي","مستودعات معتمدة","تعبئة وتغليف","تخليص جمركي","تتبع الشحنات","توصيل الميل الأخير","شحن بضائع خاصة","تأمين الشحنات"],    features_en:["International Shipping","Certified Warehouses","Packaging","Customs Clearance","Tracking","Last Mile","Special Cargo","Cargo Insurance"],          is_active:true, sort_order:360 },
  { id:"mktagency",name_ar:"وكالة التسويق والإعلان",     name_en:"Marketing & Advertising Agency",desc_ar:"وكالة إبداعية — هوية بصرية، حملات تلفزيونية وإذاعية، إعلانات رقمية، وتنظيم فعاليات.",  desc_en:"Creative agency — visual identity, TV/radio campaigns, digital ads, event organizing.",               category:"agency",   color:"#EC4899", icon_name:"Megaphone",features_ar:["هوية بصرية كاملة","حملات تلفزيونية","إعلانات رقمية","مطبوعات تسويقية","إدارة السمعة الرقمية","تنظيم فعاليات","تسويق بالمؤثرين","استراتيجية العلامة"],features_en:["Full Visual Identity","TV Campaigns","Digital Ads","Print Materials","Reputation Management","Event Organizing","Influencer Marketing","Brand Strategy"],is_active:true, sort_order:370 },
  { id:"swagency", name_ar:"وكالة البرمجيات والتقنية",   name_en:"Software & Technology Agency",desc_ar:"توزيع حصري لتراخيص Microsoft وOracle وSAP، تطبيق الحلول، دعم فني، وتدريب الفرق.",       desc_en:"Exclusive distribution of Microsoft, Oracle, SAP licenses, implementation, support, training.",      category:"agency",   color:"#8B5CF6", icon_name:"Code2",   features_ar:["توزيع Microsoft وOracle وSAP","تطبيق وتنفيذ","دعم فني ما بعد البيع","تدريب الفرق","ترخيص حصري","استشارات الحل","إدارة الاشتراكات","تكامل الأنظمة"],features_en:["Microsoft Oracle SAP Distribution","Implementation","After-sales Support","Team Training","Exclusive Licensing","Solution Consulting","Subscription Mgmt","System Integration"],is_active:true, sort_order:380 },
];

const CATEGORIES = [
  { id: "all",      en: "All Services",           ar: "كل الخدمات" },
  { id: "business", en: "Business",               ar: "الأعمال" },
  { id: "commerce", en: "Commerce",               ar: "التجارة" },
  { id: "marketing",en: "Marketing",              ar: "التسويق" },
  { id: "sales",    en: "Sales",                  ar: "المبيعات" },
  { id: "tech",     en: "Technology",             ar: "التقنية" },
  { id: "telecom",  en: "Telecom",                ar: "الاتصالات" },
  { id: "media",    en: "Media & Production",     ar: "الإعلام والإنتاج" },
  { id: "legal",    en: "Legal & IP",             ar: "الملكية الفكرية" },
  { id: "agency",   en: "Commercial Agencies",    ar: "التوكيلات التجارية" },
];

interface RequestForm {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

export default function PublicServices() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const R = i18n.language === "ar";
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [services, setServices] = useState<WsService[]>([]);
  const [loading, setLoading] = useState(true);

  // Request dialog state
  const [reqOpen, setReqOpen] = useState(false);
  const [selectedSvc, setSelectedSvc] = useState<WsService | null>(null);
  const [form, setForm] = useState<RequestForm>({ fullName: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const toggleEx = (id: string) => setExpandedEx(p => p === id ? null : id);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from("website_services")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (error) {
          console.error("website_services fetch error:", error);
          setServices(FALLBACK_SERVICES);
        } else if (data && data.length > 0) {
          setServices(data);
        } else {
          setServices(FALLBACK_SERVICES);
        }
      } catch (e) {
        console.error("website_services exception:", e);
        setServices(FALLBACK_SERVICES);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = services.filter(s =>
    (cat === "all" || s.category === cat) &&
    (search === "" ||
      (R ? s.name_ar : s.name_en).toLowerCase().includes(search.toLowerCase()) ||
      (R ? s.desc_ar : s.desc_en).toLowerCase().includes(search.toLowerCase()))
  );

  const openRequest = (svc: WsService) => {
    setSelectedSvc(svc);
    setForm({ fullName: "", email: "", phone: "", company: "", message: "" });
    setRequestSent(false);
    setReqOpen(true);
  };

  const submitRequest = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error(R ? "الاسم والبريد الإلكتروني مطلوبان" : "Name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("service_requests").insert({
        service_id: selectedSvc?.id ?? null,
        service_name_ar: selectedSvc?.name_ar ?? "",
        service_name_en: selectedSvc?.name_en ?? "",
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        message: form.message.trim() || null,
      });
      if (error) throw error;
      setRequestSent(true);
      toast.success(R ? "تم استلام طلبك بنجاح." : "Your request was received successfully.");
    } catch {
      toast.error(R ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again");
    }
    setSubmitting(false);
  };

  return (
    <PublicLayout>
      <div dir={R ? "rtl" : "ltr"}>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-xs gap-2">
            <Zap className="w-3.5 h-3.5" />{R ? "خدماتنا ووحداتنا" : "Our Services & Modules"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-black mb-4">
            {R ? `${services.length}+ خدمة متكاملة` : `${services.length}+ Integrated Services`}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {R
              ? "كل وحدة مصممة للعمل بشكل مستقل أو كجزء من النظام الموحد — حسب احتياجات عملك."
              : "Each module works standalone or as part of the unified system — based on your business needs."}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={R ? "ابحث عن خدمة..." : "Search services..."}
                className="pl-9 text-xs h-9"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    cat === c.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/30 text-muted-foreground hover:text-foreground border border-border/40"
                  )}
                >
                  {R ? c.ar : c.en}
                </button>
              ))}
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 rounded-xl bg-secondary/20 animate-pulse" />
              ))}
            </div>
          )}

          {/* Services Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(s => {
                const Icon = ICON_MAP[s.icon_name] ?? Layers;
                return (
                  <Card
                    key={s.id}
                    className="border hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                    style={{ borderColor: s.color + "40" }}
                  >
                    <CardContent className="p-0">
                      <div
                        className="p-5 border-b border-border/30"
                        style={{ backgroundColor: s.color + "12" }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-background border border-border/40 flex items-center justify-center">
                            <Icon className="w-6 h-6" style={{ color: s.color }} />
                          </div>
                          <Badge
                            className="text-[9px] px-2 capitalize"
                            style={{ color: s.color, borderColor: s.color + "40", backgroundColor: s.color + "15" }}
                          >
                            {s.category}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-bold mb-2">{R ? s.name_ar : s.name_en}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {R ? s.desc_ar : s.desc_en}
                        </p>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-1.5">
                          {(R ? s.features_ar : s.features_en).map(f => (
                            <div key={f} className="flex items-center gap-1.5 text-[10px]">
                              <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                              <span className="text-muted-foreground">{f}</span>
                            </div>
                          ))}
                        </div>

                        {/* Examples toggle */}
                        {SERVICE_EXAMPLES[s.id] && (
                          <div>
                            <button
                              onClick={() => toggleEx(s.id)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-medium transition-all hover:opacity-80"
                              style={{ borderColor: s.color + "40", color: s.color, backgroundColor: s.color + "08" }}
                            >
                              <span>{R ? "📋 أمثلة تطبيقية" : "📋 Real Examples"}</span>
                              <ChevronDown className={cn("w-3 h-3 transition-transform", expandedEx === s.id && "rotate-180")} />
                            </button>

                            {expandedEx === s.id && (
                              <div className="mt-2 space-y-2">
                                {SERVICE_EXAMPLES[s.id].map((ex, ei) => (
                                  <div
                                    key={ei}
                                    className="p-2.5 rounded-lg border border-border/30"
                                    style={{ backgroundColor: s.color + "08" }}
                                  >
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <span className="text-base leading-none">{ex.emoji}</span>
                                      <span className="text-[10px] font-bold" style={{ color: s.color }}>
                                        {R ? ex.title_ar : ex.title_en}
                                      </span>
                                    </div>
                                    <div className="space-y-0.5 border-t border-border/20 pt-1.5">
                                      {(R ? ex.lines_ar : ex.lines_en).map((line, li) => (
                                        <p key={li} className="text-[9px] text-muted-foreground font-mono leading-relaxed">
                                          {line}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <Button
                          size="sm"
                          className="w-full text-xs h-8 gap-1.5"
                          style={{ backgroundColor: s.color, borderColor: s.color }}
                          onClick={() => openRequest(s)}
                        >
                          {R ? "اطلب الخدمة" : "Request Service"}
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              {R ? "لا توجد خدمات تطابق بحثك" : "No services match your search"}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary/10 border-t border-border/30">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-black mb-4">
            {R ? "جاهز للبدء؟" : "Ready to Start?"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {R
              ? "احصل على وصول فوري لجميع الوحدات بعد إنشاء حسابك."
              : "Get instant access to all modules after creating your account."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth?tab=signup")} className="gap-2 gold-glow">
              {R ? "ابدأ مجاناً" : "Start Free"} <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")} className="gap-2">
              {R ? "تواصل مع المبيعات" : "Contact Sales"}
            </Button>
          </div>
        </div>
      </section>

      {/* Request Service Dialog */}
      <Dialog
        open={reqOpen}
        onOpenChange={(open) => {
          setReqOpen(open);
          if (!open) {
            setRequestSent(false);
          }
        }}
      >
        <DialogContent className="max-w-md" dir={R ? "rtl" : "ltr"}>
          {requestSent ? (
            <RequestReceivedMessage
              isAr={R}
              onAcknowledge={() => {
                setReqOpen(false);
                setRequestSent(false);
              }}
              className="flex flex-col items-center gap-5 py-8 text-center px-2"
            />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm">
                  {selectedSvc && (
                    <>
                      {(() => { const Icon = ICON_MAP[selectedSvc.icon_name] ?? Layers; return <Icon className="w-4 h-4" style={{ color: selectedSvc.color }} />; })()}
                      {R ? selectedSvc.name_ar : selectedSvc.name_en}
                    </>
                  )}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {R ? "أرسل طلبك وسنتواصل معك في أقرب وقت" : "Send your request and we'll contact you shortly"}
                </p>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{R ? "الاسم الكامل *" : "Full Name *"}</Label>
                    <Input
                      value={form.fullName}
                      onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                      className="h-8 text-xs"
                      placeholder={R ? "الاسم الكامل" : "Full name"}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{R ? "البريد الإلكتروني *" : "Email *"}</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="h-8 text-xs"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{R ? "رقم الهاتف" : "Phone"}</Label>
                    <Input
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      className="h-8 text-xs"
                      placeholder={R ? "01xxxxxxxxx" : "+201xxxxxxxxx"}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{R ? "اسم الشركة" : "Company"}</Label>
                    <Input
                      value={form.company}
                      onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                      className="h-8 text-xs"
                      placeholder={R ? "اسم الشركة" : "Company name"}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{R ? "رسالة أو متطلبات إضافية" : "Message / Additional Requirements"}</Label>
                  <Textarea
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    className="text-xs resize-none"
                    rows={3}
                    placeholder={R ? "أخبرنا بمزيد من التفاصيل..." : "Tell us more details..."}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => setReqOpen(false)}>
                  {R ? "إلغاء" : "Cancel"}
                </Button>
                <Button size="sm" onClick={submitRequest} disabled={submitting} className="gap-2">
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  {R ? "إرسال الطلب" : "Send Request"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </PublicLayout>
  );
}
