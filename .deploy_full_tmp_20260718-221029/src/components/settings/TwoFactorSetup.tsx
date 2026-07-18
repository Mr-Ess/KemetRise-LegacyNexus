import { useEffect, useState } from "react";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { twofaApi } from "@/services/system";
import { useAuth } from "@/hooks/useAuth";

export default function TwoFactorSetup() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [setupMode, setSetupMode] = useState(false);

  useEffect(() => { (async () => {
    const r = await twofaApi.get();
    setEnabled(!!r?.enabled);
  })(); }, []);

  const startSetup = async () => {
    const totp = new OTPAuth.TOTP({ issuer: "KemetRise", label: user?.email || "user", algorithm: "SHA1", digits: 6, period: 30 });
    const s = totp.secret.base32;
    setSecret(s);
    setQr(await QRCode.toDataURL(totp.toString()));
    setSetupMode(true);
  };

  const verify = async () => {
    const totp = new OTPAuth.TOTP({ issuer: "KemetRise", label: user?.email || "user", secret: OTPAuth.Secret.fromBase32(secret) });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) { toast.error("Invalid code"); return; }
    await twofaApi.upsert({ secret, enabled: true });
    toast.success("2FA enabled");
    setEnabled(true); setSetupMode(false); setCode("");
  };

  const disable = async () => {
    await twofaApi.disable();
    setEnabled(false);
    toast.success("2FA disabled");
  };

  if (enabled && !setupMode) {
    return (
      <div className="space-y-3 p-4 border border-primary/30 rounded-lg bg-card">
        <p className="text-sm text-primary">✓ Two-Factor Authentication is enabled</p>
        <Button variant="destructive" size="sm" onClick={disable}>Disable 2FA</Button>
      </div>
    );
  }

  if (setupMode) {
    return (
      <div className="space-y-4 p-4 border border-primary/30 rounded-lg bg-card">
        <p className="text-sm">Scan with Google Authenticator / Authy:</p>
        {qr && <img src={qr} alt="2FA QR" className="w-48 h-48 bg-white p-2 rounded" />}
        <p className="text-xs font-mono break-all opacity-60">Manual: {secret}</p>
        <div>
          <Label>Enter 6-digit code</Label>
          <Input value={code} onChange={e => setCode(e.target.value)} maxLength={6} placeholder="123456" />
        </div>
        <div className="flex gap-2">
          <Button onClick={verify}>Verify & Enable</Button>
          <Button variant="ghost" onClick={() => setSetupMode(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return <Button onClick={startSetup}>Enable Two-Factor Authentication</Button>;
}
