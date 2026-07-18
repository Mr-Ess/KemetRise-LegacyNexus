import { useNavigate } from "react-router-dom";
import { ArrowLeft, Chrome, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function BrowserExtension() {
  const nav = useNavigate();

  const download = () => {
    fetch("/kemetrise-extension.zip")
      .then(r => { if (!r.ok) throw new Error("Download failed"); return r.blob(); })
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "kemetrise-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Download started");
      })
      .catch(e => toast.error(e.message));
  };

  const steps = [
    "Unzip the downloaded file.",
    'Open "chrome://extensions" in Chrome (or Edge, Brave, Arc).',
    "Enable Developer mode (toggle in top-right).",
    'Click "Load unpacked" and select the unzipped folder.',
    "The KemetRise icon will appear in your toolbar.",
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => nav("/")} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <h1 className="font-display text-2xl text-primary mb-2 flex items-center gap-2"><Chrome className="w-5 h-5" />Browser Extension</h1>
        <p className="text-sm text-muted-foreground mb-6">Quick-access KemetRise from any browser tab.</p>

        <Card className="p-6 mb-4 text-center bg-gradient-to-br from-primary/5 to-transparent">
          <Chrome className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="font-display text-xl text-primary mb-2">KemetRise Quick Access</h2>
          <p className="text-sm text-muted-foreground mb-6">Works in Chrome, Edge, Brave, Arc, and Opera.</p>
          <Button size="lg" onClick={download}><Download className="w-4 h-4 mr-2" />Download Extension</Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-lg text-primary mb-4">Installation Steps</h3>
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                <span className="text-sm">{s}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
