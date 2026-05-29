import { useNavigate } from "react-router-dom";
import { ArrowLeft, Code as CodeIcon, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const BASE = `${import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co"}/rest/v1`;

const ENDPOINTS = [
  { method: "GET", path: "/brands", desc: "List your brands", scope: "owner" },
  { method: "POST", path: "/brands", desc: "Create a brand", scope: "owner" },
  { method: "GET", path: "/customers", desc: "List customers", scope: "owner" },
  { method: "GET", path: "/invoices", desc: "List invoices", scope: "owner" },
  { method: "POST", path: "/invoices", desc: "Create invoice", scope: "owner" },
  { method: "GET", path: "/subscriptions", desc: "List subscriptions", scope: "owner" },
  { method: "POST", path: "/coupons", desc: "Create coupon", scope: "owner" },
  { method: "GET", path: "/payment_transactions", desc: "List transactions", scope: "owner" },
  { method: "GET", path: "/audit_logs", desc: "Audit history", scope: "owner" },
];

const Code = ({ children }: { children: string }) => (
  <div className="relative">
    <pre className="bg-secondary/50 border border-border rounded-md p-3 text-xs font-mono overflow-x-auto">{children}</pre>
    <button onClick={() => { navigator.clipboard.writeText(children); toast.success("Copied"); }}
      className="absolute top-2 right-2 p-1 rounded hover:bg-background"><Copy className="w-3 h-3" /></button>
  </div>
);

export default function ApiDocs() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => nav("/")}><ArrowLeft className="w-4 h-4 mr-2" /> رجوع</Button>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: "Orbitron" }}>
          <CodeIcon className="w-6 h-6" /> API Documentation
        </h1>
        <p className="text-sm text-muted-foreground">REST API للوصول إلى بيانات حسابك. جميع الطلبات تحتاج Authorization header.</p>

        <Tabs defaultValue="quickstart">
          <TabsList>
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="quickstart" className="space-y-4">
            <Card className="p-4 space-y-3">
              <h2 className="font-bold">1. Get an API Key</h2>
              <p className="text-sm text-muted-foreground">Settings → API Keys → Create. Copy the secret (shown once).</p>
            </Card>
            <Card className="p-4 space-y-3">
              <h2 className="font-bold">2. Authenticate</h2>
              <Code>{`curl ${BASE}/brands \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</Code>
            </Card>
            <Card className="p-4 space-y-3">
              <h2 className="font-bold">3. Make a request</h2>
              <Code>{`fetch("${BASE}/invoices", {
  headers: {
    "apikey": "YOUR_API_KEY",
    "Authorization": "Bearer YOUR_API_KEY"
  }
}).then(r => r.json())`}</Code>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints">
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs">
                  <tr><th className="text-left p-3">Method</th><th className="text-left p-3">Endpoint</th><th className="text-left p-3">Description</th><th className="text-left p-3">Scope</th></tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map((e, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-3"><Badge variant={e.method === "GET" ? "outline" : "default"}>{e.method}</Badge></td>
                      <td className="p-3 font-mono text-xs">{e.path}</td>
                      <td className="p-3 text-xs">{e.desc}</td>
                      <td className="p-3 text-xs text-muted-foreground">{e.scope}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-3">
            <Card className="p-4 space-y-3">
              <h2 className="font-bold">Event Format</h2>
              <Code>{`POST <your-webhook-url>
Content-Type: application/json

{
  "event": "insert.invoices",
  "audit": {
    "id": "uuid",
    "action": "INSERT invoices",
    "table_name": "invoices",
    "record_id": "uuid",
    "created_at": "2026-..."
  }
}`}</Code>
              <p className="text-xs text-muted-foreground">Configure endpoints at Settings → Webhooks. Supported events: insert.*, update.*, delete.* + wildcard *.</p>
            </Card>
          </TabsContent>

          <TabsContent value="errors">
            <Card className="p-4 space-y-2">
              <h2 className="font-bold mb-3">HTTP Status Codes</h2>
              <div className="space-y-2 text-sm">
                <div><Badge>200</Badge> OK — Request succeeded</div>
                <div><Badge variant="outline">201</Badge> Created — Resource created</div>
                <div><Badge variant="destructive">401</Badge> Unauthorized — Missing/invalid API key</div>
                <div><Badge variant="destructive">403</Badge> Forbidden — RLS blocked</div>
                <div><Badge variant="destructive">404</Badge> Not Found</div>
                <div><Badge variant="destructive">429</Badge> Rate Limited</div>
                <div><Badge variant="destructive">500</Badge> Server Error</div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
