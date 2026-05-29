import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown, Layers, Bell } from "lucide-react";

const KEY = "kemet-tour-done";

const STEPS = [
  { icon: Crown, title: "Welcome to KemetRise", body: "Your AI-powered empire OS — manage brands, teams, finances, and operations from one command center." },
  { icon: Layers, title: "Operations Hub", body: "Centralized view of all modules: tasks, chat, branches, finance and analytics — all live and connected." },
  { icon: Bell, title: "Smart Notifications", body: "Real-time alerts for warnings, errors, and important events. Press ? anytime to see all keyboard shortcuts." },
  { icon: Sparkles, title: "Meet KEMET AI", body: "Click the gold sparkle in the bottom-right to chat with your AI assistant. Ask anything about your empire." },
];

export const OnboardingTour = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => { if (!localStorage.getItem(KEY)) setOpen(true); }, []);

  const close = () => { localStorage.setItem(KEY, "1"); setOpen(false); };
  const next = () => step < STEPS.length - 1 ? setStep(step + 1) : close();

  const S = STEPS[step];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2 font-display text-primary tracking-wider">
          <S.icon className="w-5 h-5" /> {S.title}
        </DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground font-body py-3">{S.body}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">{STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === step ? "bg-primary" : "bg-secondary"}`} />
          ))}</div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={close}>Skip</Button>
            <Button size="sm" onClick={next}>{step < STEPS.length - 1 ? "Next" : "Start"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
