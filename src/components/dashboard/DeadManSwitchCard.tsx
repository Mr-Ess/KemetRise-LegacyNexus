import { Info, CheckCircle, Mail, UserPlus, Settings as SettingsIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { dmsApi, heirsApi, type Heir } from "@/services/system";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_WARNING_DAYS = 1;

const DeadManSwitchCard = () => {
  const navigate = useNavigate();
  const [deadlineDays, setDeadlineDays] = useState(3);
  const [warningDays, setWarningDays] = useState(DEFAULT_WARNING_DAYS);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  const [seconds, setSeconds] = useState(deadlineDays * 24 * 3600);
  const [time, setTime] = useState("00:00:00");
  const [deadlineWarningShown, setDeadlineWarningShown] = useState(false);
  const [heirs, setHeirs] = useState<Heir[]>([]);
  const [active, setActive] = useState(true);

  const loadDms = useCallback(() => {
    dmsApi.get().then((d) => {
      if (d) {
        setDeadlineDays(d.deadline_days);
        setWarningDays((d as any).warning_days ?? DEFAULT_WARNING_DAYS);
        setLastHeartbeat(new Date(d.last_heartbeat));
        setActive((d as any).active ?? true);
      }
    }).catch(() => {});
    heirsApi.list().then(setHeirs).catch(() => {});
  }, []);

  useEffect(() => {
    loadDms();
    const ch = supabase.channel("dms-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "dead_man_switch" }, loadDms)
      .on("postgres_changes", { event: "*", schema: "public", table: "digital_inheritance" }, loadDms)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadDms]);

  useEffect(() => {
    const total = deadlineDays * 24 * 3600;
    const elapsed = Math.floor((Date.now() - lastHeartbeat.getTime()) / 1000);
    setSeconds(Math.max(0, total - elapsed));
  }, [deadlineDays, lastHeartbeat]);

  // Warning only meaningful when warning window < total deadline
  const totalSeconds = deadlineDays * 24 * 3600;
  const effectiveWarningDays = Math.min(warningDays, Math.max(0, deadlineDays - 1));
  const warningSeconds = effectiveWarningDays * 24 * 3600;
  const inWarning = active && warningSeconds > 0 && seconds <= warningSeconds && seconds > 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => {
        const ns = Math.max(0, s - 1);
        const days = Math.floor(ns / 86400);
        const h = Math.floor((ns % 86400) / 3600);
        const m = Math.floor((ns % 3600) / 60);
        const sec = ns % 60;
        const pad = (n: number) => n.toString().padStart(2, "0");
        setTime(days > 0 ? `${days}d ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`);
        return ns;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Deadline warning — fire once per heartbeat cycle
  useEffect(() => {
    if (!inWarning || deadlineWarningShown) return;
    const key = `dms-warned-${lastHeartbeat.getTime()}`;
    if (sessionStorage.getItem(key)) { setDeadlineWarningShown(true); return; }
    sessionStorage.setItem(key, "1");
    setDeadlineWarningShown(true);
    toast.warning(`⚠️ Heartbeat deadline in less than ${effectiveWarningDays} day(s)!`, {
      description: "An email notification would be sent to heirs. Confirm your heartbeat now.",
      duration: 10000,
    });
  }, [inWarning, deadlineWarningShown, lastHeartbeat, effectiveWarningDays]);

  const confirmHeartbeat = useCallback(async () => {
    try {
      const r = await dmsApi.heartbeat();
      setLastHeartbeat(new Date(r.last_heartbeat));
      setDeadlineWarningShown(false);
      toast.success("✅ Heartbeat confirmed! Timer has been reset.");
    } catch (e: any) { toast.error(e.message); }
  }, []);

  const saveTiming = useCallback(async (next: { deadline_days?: number; warning_days?: number }) => {
    const newDeadline = next.deadline_days ?? deadlineDays;
    const newWarning = Math.min(next.warning_days ?? warningDays, Math.max(1, newDeadline - 1));
    try {
      await dmsApi.update({ active, deadline_days: newDeadline, warning_days: newWarning } as any);
      setDeadlineDays(newDeadline);
      setWarningDays(newWarning);
      setDeadlineWarningShown(false);
      toast.success("Timing updated");
    } catch (e: any) { toast.error(e.message); }
  }, [deadlineDays, warningDays, active]);

  const initials = (n: string) => (n || "?").split(" ").map(x => x[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const nextConfirmation = useMemo(() => {
    const d = new Date(lastHeartbeat.getTime() + deadlineDays * 24 * 3600 * 1000);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }, [lastHeartbeat, deadlineDays]);

  return (
    <div className="bg-card rounded-lg border border-border p-4 lg:p-5 relative overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔱</span>
          <h3 className="font-display text-xs font-bold text-primary tracking-wider">DEAD MAN'S SWITCH & DIGITAL HEIR PLAN</h3>
        </div>
        <div className="flex items-center gap-1">
          {!active && (
            <span className="px-2 py-0.5 rounded bg-muted/40 border border-border text-[9px] font-display text-muted-foreground">DISABLED</span>
          )}
          {active && seconds <= warningSeconds && seconds > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blood-red/20 border border-blood-red/40 animate-pulse">
              <Mail className="w-3 h-3 text-blood-red" />
              <span className="text-[9px] font-display text-blood-red">EMAIL ALERT</span>
            </span>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10" title="Adjust timing">
                <SettingsIcon className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 bg-card border-border z-50">
              <div className="space-y-3">
                <p className="font-display text-xs text-primary">HEARTBEAT TIMING</p>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Deadline (days)</Label>
                  <Input type="number" min={1} max={365} value={deadlineDays}
                    onChange={(e) => setDeadlineDays(Math.max(1, +e.target.value || 1))}
                    onBlur={(e) => saveTiming({ deadline_days: Math.max(1, +e.target.value || 1) })}
                    className="h-8 bg-secondary border-border text-foreground text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Warning Before (days)</Label>
                  <Input type="number" min={1} max={Math.max(1, deadlineDays - 1)} value={warningDays}
                    onChange={(e) => setWarningDays(Math.max(1, +e.target.value || 1))}
                    onBlur={(e) => saveTiming({ warning_days: Math.max(1, +e.target.value || 1) })}
                    className="h-8 bg-secondary border-border text-foreground text-xs" />
                  <p className="text-[9px] text-muted-foreground">Must be less than deadline. Auto-clamped.</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {!active && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="font-display text-sm text-muted-foreground mb-1">⏸️ SWITCH DISABLED</p>
            <p className="text-xs text-muted-foreground">Enable from Settings → Emergency</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left - Heartbeat */}
        <div>
          <div className="mb-2">
            <span className="text-xs font-display text-foreground">DEAD MAN'S SWITCH HEARTBEAT: </span>
            <span className={`text-xs font-display font-bold ${seconds <= warningSeconds ? "text-blood-red animate-pulse" : "text-scarab"}`}>
              {seconds <= 0 ? "EXPIRED" : seconds <= warningSeconds ? "WARNING" : "ACTIVE"}
            </span>
          </div>

          {/* Heartbeat line animation */}
          <div className="relative h-24 bg-secondary/20 rounded-md mb-3 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 400 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={seconds <= warningSeconds ? "hsl(0,72%,50%)" : "hsl(180, 70%, 45%)"} stopOpacity="0.1" />
                  <stop offset="30%" stopColor={seconds <= warningSeconds ? "hsl(0,72%,50%)" : "hsl(180, 70%, 45%)"} stopOpacity="0.8" />
                  <stop offset="70%" stopColor={seconds <= warningSeconds ? "hsl(0,72%,50%)" : "hsl(180, 70%, 45%)"} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={seconds <= warningSeconds ? "hsl(0,72%,50%)" : "hsl(180, 70%, 45%)"} stopOpacity="0.1" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M0,40 L50,40 L60,40 L70,12 L80,68 L90,20 L100,58 L110,35 L120,40 L180,40 L190,40 L200,12 L210,68 L220,20 L230,58 L240,35 L250,40 L310,40 L320,40 L330,12 L340,68 L350,20 L360,58 L370,35 L380,40 L400,40"
                fill="none"
                stroke={seconds <= warningSeconds ? "hsl(0,72%,50%)" : "hsl(180, 70%, 45%)"}
                strokeWidth="2.5"
                filter="url(#glow)"
                opacity="0.9"
              />
              <path
                d="M0,40 L50,40 L60,40 L70,12 L80,68 L90,20 L100,58 L110,35 L120,40 L180,40 L190,40 L200,12 L210,68 L220,20 L230,58 L240,35 L250,40 L310,40 L320,40 L330,12 L340,68 L350,20 L360,58 L370,35 L380,40 L400,40"
                fill="none"
                stroke={seconds <= warningSeconds ? "hsl(0,72%,50%)" : "hsl(180, 70%, 45%)"}
                strokeWidth="1"
                opacity="0.2"
              />
            </svg>
          </div>

          <p className="text-xs font-body text-muted-foreground mb-3">
            Countdown: <span className={`font-display font-bold ${seconds <= warningSeconds ? "text-blood-red" : "text-nile"}`}>{time}</span> | Next confirmation: <span className="text-primary">{nextConfirmation}</span>
          </p>

          <button
            onClick={confirmHeartbeat}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold tracking-widest hover:bg-primary/90 transition-all active:scale-[0.98] gold-glow"
          >
            CONFIRM HEARTBEAT
          </button>
        </div>

        {/* Right - Digital Heir */}
        <div>
          <div className="mb-3 text-right lg:text-left">
            <span className="text-xs font-display text-foreground">DIGITAL HEIR STATUS: </span>
            <span className="text-xs font-display font-bold text-scarab">CONFIRMED</span>
            <Info className="w-3 h-3 inline ml-1 text-muted-foreground" />
          </div>

          {/* Heir portraits */}
          <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
            {heirs.length === 0 && (
              <button onClick={() => navigate("/digital-inheritance")} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-primary/40 text-xs font-display text-primary hover:bg-primary/10">
                <UserPlus className="w-3.5 h-3.5" /> Add heirs
              </button>
            )}
            {heirs.map((h, i) => (
              <div key={h.id || i} className="relative group" title={`${h.name}${h.email ? ` · ${h.email}` : ""}`}>
                <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden border-2 flex items-center justify-center font-display text-sm font-bold text-primary bg-primary/10 ${i === 0 ? 'border-primary gold-glow' : 'border-primary/40'} transition-all`}>
                  {initials(h.name)}
                </div>
                <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-scarab absolute -bottom-1 left-1/2 -translate-x-1/2 drop-shadow-lg" />
              </div>
            ))}
          </div>
          <p className="text-xs font-display text-primary tracking-wider text-center">THE GOLDEN HEIRS SUCCESSION TREE · {heirs.length}</p>
        </div>
      </div>
    </div>
  );
};

export default DeadManSwitchCard;
