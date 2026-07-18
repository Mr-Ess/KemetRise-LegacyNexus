import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { gdprApi } from "@/services/system";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export default function DangerZone() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const exportAll = async () => {
    const data = await gdprApi.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `account-export-${Date.now()}.json`; a.click();
    toast.success("تم تصدير كل بياناتك");
  };
  const del = async () => {
    if (confirm !== "DELETE") return toast.error("اكتب DELETE للتأكيد");
    await gdprApi.deleteAccount();
    toast.success("تم حذف الحساب");
    location.href = "/auth";
  };
  return (
    <div className="border border-blood-red/40 rounded p-4 space-y-3">
      <div className="flex items-center gap-2 text-blood-red">
        <AlertTriangle className="w-5 h-5"/><h3 className="font-bold">منطقة الخطر</h3>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={exportAll}>تصدير كل بياناتي (GDPR)</Button>
        <Button variant="destructive" onClick={()=>setOpen(true)}>حذف الحساب نهائياً</Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">هتفقد كل بياناتك. اكتب <b>DELETE</b> للتأكيد.</p>
          <Input value={confirm} onChange={e=>setConfirm(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={()=>setOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={del}>حذف نهائي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
