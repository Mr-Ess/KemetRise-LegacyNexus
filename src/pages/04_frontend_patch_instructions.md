# Exact Code Injections

## 1. `src/App.tsx`

**Insert after this line** (next to your other admin lazy imports, ~line 89):
```tsx
const SectorFactory     = lazy(() => import("./pages/admin/SectorFactory"));
```
**Add:**
```tsx
const AIProductFactory  = lazy(() => import("./pages/admin/AIProductFactory"));
```

**Insert after this route** (~line 364):
```tsx
<Route path="/admin/sectors" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><SectorFactory /></RoleProtectedRoute></Protected>} />
```
**Add:**
```tsx
<Route path="/admin/ai-factory" element={<Protected><RoleProtectedRoute allowedRoles={["superadmin","admin"]}><AIProductFactory /></RoleProtectedRoute></Protected>} />
```

---

## 2. `src/layouts/AdminLayout.tsx`

**Import addition** — in the lucide-react import block, add `Factory` to the list:
```tsx
import {
  LayoutDashboard, Users, Store, ShoppingBag, CreditCard, BarChart3,
  Settings, LogOut, Menu, Bell, Shield, Cpu, Layers, FileText,
  DollarSign, Package, UserCheck, Building2, Globe, Key, Tag,
  Boxes, RefreshCw, ChevronDown, Sun, Moon, Languages, Crown,
  AlertTriangle, Activity, Webhook, Code, Newspaper, Sparkles,
  Factory, // <-- add this
} from "lucide-react";
```

**Nav item** — inside the `"Core"` group items array, right after the AI Agent Control entry:
```tsx
{ icon: Sparkles, label: "لوحة تحكم الإيجنت", labelEn: "AI Agent Control", path: "/admin/ai-agent" },
```
**Add:**
```tsx
{ icon: Factory, label: "مصنع المنتجات الذكي", labelEn: "AI Product Factory", path: "/admin/ai-factory" },
```

---

## 3. Storefront — no new component needed for listing/checkout

Because the publish edge function inserts directly into `mp_listings` with
`listing_type: "digital"`, AI-generated products **already appear** in
`src/pages/Marketplace.tsx` and `src/pages/DigitalMall.tsx` with zero
frontend changes — they go through your existing card rendering, cart
(`mp_cart_items`), and purchase (`mp_purchases`) flow exactly like any other
digital listing.

The one thing that flow doesn't have yet is a **secure file download** step
for digital goods (today `mp_listings` has no file attached). Add this to
wherever you render an owned digital purchase — the simplest spot is inside
the existing purchased-item card in `Marketplace.tsx` (near where you already
check `mp_purchases` to render "Purchased" state, ~line 724):

```tsx
// Add near your existing purchased-listings state:
const handleSecureDownload = async (listingId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    "https://YOUR_PROJECT_REF.functions.supabase.co/ai-factory-download",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    }
  );
  const json = await res.json();
  if (json.error) { toast.error(json.error); return; }
  window.open(json.url, "_blank"); // 10-minute signed URL
};
```

```tsx
// Render this instead of / alongside "Purchased" badge when
// item.listing_type === "digital" && item.meta?.source === "ai_factory" && isPurchased(item.id):
<Button size="sm" onClick={() => handleSecureDownload(item.id)}>
  <Download className="w-3.5 h-3.5 mr-1.5" /> Download
</Button>
```

Also, tag AI-generated cards visually — inside your existing `ListingCard`
render, add (matching your existing `is_new`/`is_featured` badge pattern):
```tsx
{item.meta?.source === "ai_factory" && (
  <Badge className="text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/40">
    <Sparkles className="w-2.5 h-2.5 mr-1" /> AI Generated
  </Badge>
)}
```

---

## 4. Deploying the edge functions

```bash
cd KemetRise-LegacyNexus-main
supabase functions deploy ai-factory-submit
supabase functions deploy ai-factory-approve --no-verify-jwt   # public, clicked from chat apps
supabase functions deploy ai-factory-publish
supabase functions deploy ai-factory-download

# Secrets (n8n needs these too, as HTTP header auth in its credentials):
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your service role key> --project-ref YOUR_PROJECT_REF
```

Rename the folders you received as: `ai-factory-generate/` → deploy as
`ai-factory-submit`, `ai-factory-approval-webhook/` → deploy as
`ai-factory-approve`, others keep their folder name.

## 5. Apply the DB migration

```bash
supabase db push
# or copy 01_ai_product_factory_schema.sql into
# supabase/migrations/20260706000000_ai_product_factory.sql and commit it
# with your other Lovable-generated migrations, then push.
```

Then seed your factory config once:
```sql
UPDATE aidpf_settings SET
  super_admin_id = '<YOUR_USER_ID>',
  tier2_pool_ids = ARRAY['<TEAM_MEMBER_1_ID>','<TEAM_MEMBER_2_ID>']::uuid[],
  tier1_timeout_minutes = 120,
  tier2_timeout_minutes = 120
WHERE id = 1;
```
