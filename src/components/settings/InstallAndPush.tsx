import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, Download } from "lucide-react";
import { pushApi } from "@/services/system";
import { toast } from "sonner";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const VAPID_PUBLIC = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

export const InstallAndPush = () => {
  const [installable, setInstallable] = useState<any>(null);
  const [pushOn, setPushOn] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window);
    const handler = (e: any) => { e.preventDefault(); setInstallable(e); };
    window.addEventListener("beforeinstallprompt", handler);
    navigator.serviceWorker?.getRegistration().then((reg) => {
      reg?.pushManager.getSubscription().then((s) => setPushOn(!!s));
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!installable) { toast.info("Use browser menu → Add to Home Screen"); return; }
    installable.prompt();
    const r = await installable.userChoice;
    if (r.outcome === "accepted") toast.success("App installed");
    setInstallable(null);
  };

  const togglePush = async () => {
    if (!supported) { toast.error("Push not supported on this device"); return; }
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
        await pushApi.unsubscribe(existing.endpoint);
        setPushOn(false);
        toast.success("Push disabled");
      } else {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") { toast.error("Permission denied"); return; }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
        await pushApi.subscribe(sub);
        setPushOn(true);
        toast.success("Push enabled");
      }
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Mobile & Notifications</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full gap-2" onClick={install}>
          <Download className="h-4 w-4" /> Install App
        </Button>
        <Button variant="outline" className="w-full gap-2" onClick={togglePush} disabled={!supported}>
          {pushOn ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {pushOn ? "Disable Push Notifications" : "Enable Push Notifications"}
        </Button>
        <p className="text-xs text-muted-foreground">PWA & push only work on the published deployment.</p>
      </CardContent>
    </Card>
  );
};
