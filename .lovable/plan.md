# خطة الإكمال الشاملة — KemetRise

سأنفذ كل المطلوب على **4 مراحل متتالية**. كل مرحلة هتترسل لوحدها عشان نقدر نختبر ونتأكد.

---

## المرحلة 1 — Foundation (الأساسيات الأمنية والوظيفية)

1. **Auth System كامل**
   - صفحة `/auth` (Login + Signup tabs)
   - صفحة `/reset-password`
   - Google OAuth button
   - Protected routes wrapper
   - تفعيل HIBP password check

2. **Realtime Notifications**
   - Bell icon في Top bar مع badge للعدد
   - Toast تلقائي لما يجيلك `system_alert` جديد
   - Subscribe على `system_alerts` realtime
   - صفحة `/notifications` لعرض الكل

3. **File Upload Component عام**
   - `<FileUploader />` reusable للـ `entity-files` bucket
   - ربط Brand Logo upload
   - ربط Legal Vault file upload

---

## المرحلة 2 — Operations Hub Real CRUD

4. **استبدال raw data view بـ proper CRUD UI** لكل tab:
   - **Inventory**: Materials/Suppliers tables + add/edit dialogs
   - **Logistics**: Shipments + Import/Export forms
   - **Finance**: Monthly analytics + Payment gateways + Assets
   - **CRM**: Clients + Interactions timeline + Campaigns
   - **Legacy**: Heirs + Legal docs + Alerts

---

## المرحلة 3 — Intelligence & Automation

5. **AI Chat Edge Function**
   - `supabase/functions/ai-chat/index.ts` يستخدم Lovable AI Gateway
   - Streaming responses في Chat Hub
   - حفظ conversations + messages في DB

6. **Dead Man Switch Cron**
   - Edge function `dms-monitor` يفحص heartbeats
   - Cron job كل ساعة عبر pg_cron
   - بيعمل system_alerts للتحذيرات والـ trigger

7. **Global Search شغال**
   - بيدور في Brands, Customers, Projects, Tasks, Employees
   - Command palette (Cmd+K)

8. **Audit Logs Viewer**
   - صفحة `/audit-logs` مع filters (level, module, date)

---

## المرحلة 4 — Polish & Advanced

9. **Brand Members & Invitations UI** — صفحة دعوة فريق + قبول invitation
10. **Real Dashboard Charts** — recharts من finance_analytics و marketing_campaigns
11. **PDF/Excel Export** — jsPDF + xlsx لكل الجداول
12. **Multi-language toggle** — i18n AR/EN شغال فعلياً
13. **PWA + Push Notifications** — service worker + push subscriptions

---

## التقدير

- **مرحلة 1**: ~8 ملفات جديدة + 1 migration
- **مرحلة 2**: ~10 ملفات (component لكل entity)
- **مرحلة 3**: 2 edge functions + cron + 2 صفحات
- **مرحلة 4**: 5+ ملفات + i18n setup

## الخطوات اللي هتتم تلقائياً بدون سؤال
- استخدام Lovable AI Gateway (مفيش API keys)
- استخدام Lovable Cloud Storage الموجود
- HSL semantic tokens فقط
- RLS على أي جدول جديد

**هل أبدأ بالمرحلة 1 دلوقتي؟** أو عايز ترتيب مختلف؟