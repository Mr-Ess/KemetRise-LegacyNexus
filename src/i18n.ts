import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const en = {
  dashboard: "Dashboard", brands: "Brands", projects: "Projects", customers: "Customers",
  branches: "Branches", employees: "Employees", services: "Services", affiliates: "Affiliates",
  success_partners: "Success Partners", digital_inheritance: "Digital Inheritance",
  legendary_journey: "Legendary Journey", settings: "Settings", logout: "Log out",
  search: "Search...", save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit",
  add: "Add", export: "Export", backup: "Backup", restore: "Restore",
  enable_2fa: "Enable 2FA", disable_2fa: "Disable 2FA", profile: "Profile",
  language: "Language", notifications: "Notifications", team: "Team", invite: "Invite",
  calendar: "Calendar", kanban: "Kanban",
  status_active: "Active", status_inactive: "Inactive", status_maintenance: "Maintenance",
  no_results: "No results", loading: "Loading...", confirm_delete: "Delete?",
  bulk_actions: "Bulk actions", select_all: "Select all", clear: "Clear",
  share: "Share", copy_link: "Copy link", filter: "Filter", apply: "Apply",
  type_human: "Human", type_ai: "AI Agent", revenue: "Revenue", expenses: "Expenses",
  empire_overview: "Empire Overview",
  operations: "Operations", audit_logs: "Audit Logs", inventory: "Inventory",
  logistics: "Logistics", finance: "Finance", crm: "CRM", legacy: "Legacy",
  tasks: "Tasks", chat: "Chat", vault: "Vault", heirs: "Heirs",
  webhooks: "Webhooks", api_keys: "API Keys", install_app: "Install App",
  enable_push: "Enable Push", disable_push: "Disable Push",
  sign_in: "Sign in", sign_up: "Sign up", forgot_password: "Forgot password?",
  reset_password: "Reset password", email: "Email", password: "Password",
  name: "Name", role: "Role", actions: "Actions", created: "Created",
  updated: "Updated", description: "Description", status: "Status",
  // Billing & Plans
  pricing: "Pricing", choose_plan: "Choose your plan", monthly: "Monthly", yearly: "Yearly", lifetime: "Lifetime",
  free_plan: "Free", current_plan: "Current Plan", subscribe: "Subscribe", upgrade: "Upgrade",
  checkout: "Checkout", order_summary: "Order Summary", subtotal: "Subtotal", tax: "Tax", discount: "Discount", total: "Total",
  payment_method: "Payment Method", coupon_code: "Coupon Code", apply_coupon: "Apply", billing_info: "Billing Information",
  full_name: "Full Name", country: "Country", complete_payment: "Complete Payment", payment_processing: "Processing payment...",
  payment_success: "Payment successful", payment_failed: "Payment failed", upload_receipt: "Upload Receipt",
  bank_transfer: "Bank Transfer", crypto: "Crypto Wallet",
  customer_portal: "Customer Portal", my_subscriptions: "My Subscriptions", my_invoices: "My Invoices", my_refunds: "Refunds",
  cancel_subscription: "Cancel Subscription", request_refund: "Request Refund", download_invoice: "Download", view_invoice: "View",
  pl_active: "Active", pl_pending: "Pending", pl_paid: "Paid", pl_cancelled: "Cancelled",
  pl_suspended: "Suspended", pl_expired: "Expired", pl_refunded: "Refunded",
  next_billing: "Next billing", invoice_number: "Invoice #", amount: "Amount", date: "Date", reason: "Reason",
  // Revenue
  revenue_dashboard: "Revenue Dashboard", metrics: "Metrics", coupons: "Coupons", refunds: "Refunds", commissions: "Commissions",
  ai_insights: "AI Insights", mrr: "MRR", arr: "ARR", total_revenue: "Total Revenue", active_subs: "Active Subs",
  churn_rate: "Churn Rate", invoices_paid: "Invoices Paid", top_plan: "Top Plan",
  generate_insights: "Generate Insights", analyzing: "Analyzing...", new_coupon: "New Coupon", code: "Code", value: "Value",
  max_uses: "Max uses", expires: "Expires", percent: "Percent", fixed: "Fixed",
  approve: "Approve", reject: "Reject", mark_paid: "Mark Paid",
  back: "Back", required: "Required",
  materials: "Materials", clients: "Clients", marketing: "Marketing",
  import_export: "Import/Export", artistic_production: "Artistic Production",
  assets: "Assets", payment_gateways: "Payment Gateways", finance_analytics: "Finance Analytics",
  legal_vault: "Legal Vault", affiliated_agents: "Affiliated Agents",
  notification_rules: "Notification Rules", help: "Help", voice_assistant: "Voice Assistant",
  video_conference: "Video Call", online: "Online", offline: "Offline",
};

const ar: typeof en = {
  dashboard: "لوحة التحكم", brands: "البراندات", projects: "المشاريع", customers: "العملاء",
  branches: "الفروع", employees: "الموظفين", services: "الخدمات", affiliates: "الشركاء",
  success_partners: "شركاء النجاح", digital_inheritance: "الميراث الرقمي",
  legendary_journey: "الرحلة الأسطورية", settings: "الإعدادات", logout: "تسجيل الخروج",
  search: "بحث...", save: "حفظ", cancel: "إلغاء", delete: "حذف", edit: "تعديل",
  add: "إضافة", export: "تصدير", backup: "نسخة احتياطية", restore: "استعادة",
  enable_2fa: "تفعيل المصادقة الثنائية", disable_2fa: "تعطيل المصادقة الثنائية",
  profile: "الملف الشخصي", language: "اللغة", notifications: "الإشعارات",
  team: "الفريق", invite: "دعوة", calendar: "التقويم", kanban: "كانبان",
  status_active: "نشط", status_inactive: "غير نشط", status_maintenance: "صيانة",
  no_results: "لا نتائج", loading: "جارِ التحميل...", confirm_delete: "حذف؟",
  bulk_actions: "إجراءات جماعية", select_all: "تحديد الكل", clear: "مسح",
  share: "مشاركة", copy_link: "نسخ الرابط", filter: "فلتر", apply: "تطبيق",
  type_human: "بشري", type_ai: "ذكاء اصطناعي", revenue: "الإيرادات", expenses: "المصروفات",
  empire_overview: "نظرة عامة",
  operations: "العمليات", audit_logs: "سجلات النظام", inventory: "المخزون",
  logistics: "الشحن", finance: "المالية", crm: "إدارة العملاء", legacy: "الإرث",
  tasks: "المهام", chat: "المحادثات", vault: "الخزنة", heirs: "الورثة",
  webhooks: "الويب هوكس", api_keys: "مفاتيح API", install_app: "تثبيت التطبيق",
  enable_push: "تفعيل الإشعارات", disable_push: "تعطيل الإشعارات",
  sign_in: "دخول", sign_up: "تسجيل", forgot_password: "نسيت كلمة المرور؟",
  reset_password: "إعادة تعيين كلمة المرور", email: "البريد", password: "كلمة المرور",
  name: "الاسم", role: "الدور", actions: "إجراءات", created: "تاريخ الإنشاء",
  updated: "آخر تحديث", description: "الوصف", status: "الحالة",
  // Billing & Plans
  pricing: "الأسعار", choose_plan: "اختر باقتك", monthly: "شهري", yearly: "سنوي", lifetime: "مدى الحياة",
  free_plan: "مجاني", current_plan: "باقتك الحالية", subscribe: "اشترك", upgrade: "ترقية",
  checkout: "إتمام الدفع", order_summary: "ملخص الطلب", subtotal: "المجموع الفرعي", tax: "الضريبة", discount: "خصم", total: "الإجمالي",
  payment_method: "طريقة الدفع", coupon_code: "كود الخصم", apply_coupon: "تطبيق", billing_info: "بيانات الفاتورة",
  full_name: "الاسم بالكامل", country: "الدولة", complete_payment: "إتمام الدفع", payment_processing: "جارِ المعالجة...",
  payment_success: "تم الدفع بنجاح", payment_failed: "فشل الدفع", upload_receipt: "ارفع الإيصال",
  bank_transfer: "تحويل بنكي", crypto: "محفظة كريبتو",
  customer_portal: "بوابة العميل", my_subscriptions: "اشتراكاتي", my_invoices: "فواتيري", my_refunds: "طلبات الاسترداد",
  cancel_subscription: "إلغاء الاشتراك", request_refund: "طلب استرداد", download_invoice: "تحميل", view_invoice: "عرض",
  pl_active: "نشط", pl_pending: "قيد الانتظار", pl_paid: "مدفوع", pl_cancelled: "ملغي",
  pl_suspended: "موقوف", pl_expired: "منتهي", pl_refunded: "تم الاسترداد",
  next_billing: "التجديد القادم", invoice_number: "رقم الفاتورة", amount: "المبلغ", date: "التاريخ", reason: "السبب",
  // Revenue
  revenue_dashboard: "لوحة الإيرادات", metrics: "المؤشرات", coupons: "الكوبونات", refunds: "الاستردادات", commissions: "العمولات",
  ai_insights: "تحليلات الذكاء الاصطناعي", mrr: "الإيراد الشهري", arr: "الإيراد السنوي", total_revenue: "إجمالي الإيرادات", active_subs: "اشتراكات نشطة",
  churn_rate: "معدل الفقد", invoices_paid: "فواتير مدفوعة", top_plan: "أفضل باقة",
  generate_insights: "توليد التحليل", analyzing: "جارِ التحليل...", new_coupon: "كوبون جديد", code: "الكود", value: "القيمة",
  max_uses: "أقصى استخدام", expires: "ينتهي", percent: "نسبة", fixed: "ثابت",
  approve: "موافقة", reject: "رفض", mark_paid: "تحديد كمدفوع",
  back: "رجوع", required: "مطلوب",
  materials: "المواد الخام", clients: "العملاء", marketing: "التسويق",
  import_export: "استيراد/تصدير", artistic_production: "إنتاج فني",
  assets: "الأصول", payment_gateways: "بوابات الدفع", finance_analytics: "تحليلات مالية",
  legal_vault: "الخزنة القانونية", affiliated_agents: "وكلاء معتمدون",
  notification_rules: "قواعد التنبيهات", help: "المساعدة", voice_assistant: "المساعد الصوتي",
  video_conference: "مكالمة فيديو", online: "متصل", offline: "غير متصل",
};

const saved = (typeof localStorage !== "undefined" && localStorage.getItem("lang")) || "en";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: saved, fallbackLng: "en", interpolation: { escapeValue: false },
});

export const setLanguage = (lng: "en" | "ar") => {
  i18n.changeLanguage(lng);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  }
  if (typeof localStorage !== "undefined") localStorage.setItem("lang", lng);
};

if (typeof document !== "undefined") {
  document.documentElement.lang = saved;
  document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
}

export default i18n;
