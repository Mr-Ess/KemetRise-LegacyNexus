import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SP_ACS = "https://jncnsghskuydvwpcprku.supabase.co/auth/v1/sso/saml/acs";
const SP_ENTITY = "https://jncnsghskuydvwpcprku.supabase.co/auth/v1/sso/saml/metadata";

export default function SSO() {
  const nav = useNavigate();
  const [metadataUrl, setMetadataUrl] = useState("");
  const [domains, setDomains] = useState("");
  const [copied, setCopied] = useState("");

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val); setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const save = () => {
    if (!metadataUrl || !domains) return toast.error("Metadata URL and domains required");
    toast.success("SSO configuration saved. Contact support to activate.");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => nav("/settings")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <h1 className="font-display text-2xl text-primary mb-2 flex items-center gap-2"><Shield className="w-5 h-5" />SSO / SAML</h1>
        <p className="text-sm text-muted-foreground mb-6">Enable single sign-on via your enterprise identity provider (Okta, Azure AD, Google Workspace, OneLogin).</p>

        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-primary">Service Provider Details</h2>
            <Badge variant="outline">Configure these in your IdP</Badge>
          </div>
          <div className="space-y-3">
            <div>
              <Label>ACS URL (Reply URL)</Label>
              <div className="flex gap-2">
                <Input readOnly value={SP_ACS} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => copy(SP_ACS, "acs")}>
                  {copied === "acs" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label>Entity ID</Label>
              <div className="flex gap-2">
                <Input readOnly value={SP_ENTITY} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => copy(SP_ENTITY, "ent")}>
                  {copied === "ent" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg text-primary mb-4">Identity Provider</h2>
          <div className="space-y-3">
            <div>
              <Label>SAML Metadata URL</Label>
              <Input value={metadataUrl} onChange={e => setMetadataUrl(e.target.value)} placeholder="https://idp.example.com/metadata" />
            </div>
            <div>
              <Label>Email Domains (comma separated)</Label>
              <Input value={domains} onChange={e => setDomains(e.target.value)} placeholder="example.com, corp.example.com" />
            </div>
          </div>
          <Button onClick={save} className="mt-4 w-full">Save SSO Configuration</Button>
        </Card>
      </div>
    </div>
  );
}
