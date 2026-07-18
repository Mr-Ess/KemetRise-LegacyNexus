import { Bell, RefreshCw, Power, ToggleLeft, ToggleRight, Plus, Lock, Unlock, Trash2, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { settingsApi, vaultApi } from "@/services/system";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const SacredVaultCard = () => {
  const { t } = useTranslation();
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [autoEmergency, setAutoEmergency] = useState(true);
  const [threatLevel, setThreatLevel] = useState(12);
  const [confirmStep, setConfirmStep] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showList, setShowList] = useState(false);
  const [form, setForm] = useState({ label: "", category: "", payload: "", threat_level: 0 });

  const refreshEntries = async () => {
    try {
      const list = await vaultApi.list();
      setEntries(list);
      if (list.length) {
        const avg = list.reduce((s: number, e: any) => s + (e.threat_level || 0), 0) / list.length;
        setThreatLevel(Math.round(avg));
      } else setThreatLevel(0);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    (async () => {
      try {
        const v = (await settingsApi.get("emergency")) as any;
        if (v && typeof v === "object") {
          setEmergencyMode(!!v.emergencyMode);
          setAutoEmergency(v.autoEmergency ?? true);
        }
        await refreshEntries();
      } catch { /* ignore */ }
    })();
    const ch = supabase.channel("vault-rt").on("postgres_changes", { event: "*", schema: "public", table: "vault_entries" }, refreshEntries).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const addEntry = async () => {
    if (!form.label.trim()) { toast.error(t('label_required_msg')); return; }
    try {
      let payload: any = {};
      if (form.payload) { try { payload = JSON.parse(form.payload); } catch { payload = { value: form.payload }; } }
      await vaultApi.create({ label: form.label, category: form.category, payload, threat_level: Number(form.threat_level) || 0 });
      setForm({ label: "", category: "", payload: "", threat_level: 0 });
      setShowAdd(false);
      toast.success(t('vault_entry_added'));
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleLock = async (e: any) => {
    try { await vaultApi.update(e.id, { locked: !e.locked }); }
    catch (err: any) { toast.error(err.message); }
  };

  const removeEntry = async (id: string) => {
    try { await vaultApi.remove(id); toast.success(t('deleted')); }
    catch (e: any) { toast.error(e.message); }
  };

  useEffect(() => {
    if (autoEmergency && threatLevel > 80 && !emergencyMode) {
      setEmergencyMode(true);
      settingsApi.set("emergency", { emergencyMode: true, autoEmergency, threatLevel }).catch(() => {});
      toast.error("🚨 EMERGENCY MODE ACTIVATED AUTOMATICALLY", {
        description: "Threat level exceeded 80%. All systems locked down.",
        duration: 8000,
      });
    }
  }, [threatLevel, autoEmergency, emergencyMode]);

  const handleActivate = async () => {
    if (!emergencyMode && !confirmStep) {
      setConfirmStep(true);
      return;
    }
    const next = !emergencyMode;
    setEmergencyMode(next);
    setConfirmStep(false);
    try { await settingsApi.set("emergency", { emergencyMode: next, autoEmergency, threatLevel }); } catch { /* ignore */ }
    if (next) {
      toast.error("🚨 EMERGENCY LOCK ACTIVATED", {
        description: "All sensitive operations are now locked. Heirs notified.",
        duration: 5000,
      });
    } else {
      toast.success("✅ Emergency mode deactivated", {
        description: "All systems returned to normal operation.",
      });
    }
  };

  const toggleAuto = async () => {
    const v = !autoEmergency;
    setAutoEmergency(v);
    try { await settingsApi.set("emergency", { emergencyMode, autoEmergency: v, threatLevel }); } catch { /* ignore */ }
  };

  return (
    <div className={`bg-card rounded-lg border-2 ${emergencyMode ? "border-blood-red" : "border-primary/60"} ${emergencyMode ? "" : "gold-glow-strong"} p-4 lg:p-5 relative overflow-hidden cyber-scanline h-full flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <h3 className="font-display text-xs font-bold text-primary tracking-wider">{t('emergency_protocols_title')}</h3>
        </div>
      </div>

      {/* Two separate panels */}
      <div className="flex-1 grid grid-cols-2 gap-3">
        {/* AUTO PANEL */}
        <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-secondary/30">
          <span className="font-display text-[10px] text-muted-foreground tracking-wider mb-2">{t('auto_trigger_label')}</span>
          <button
            onClick={toggleAuto}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${
              autoEmergency
                ? "border-scarab bg-scarab/20 text-scarab"
                : "border-border bg-secondary text-muted-foreground"
            }`}
          >
            {autoEmergency ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            <span className="font-display text-xs font-bold">{autoEmergency ? t('status_active') : "OFF"}</span>
          </button>
          {autoEmergency && (
            <p className="text-[9px] text-muted-foreground mt-2 text-center">
              {t('triggers_at')}<br />{t('current_threat')} <span className={threatLevel > 60 ? "text-primary" : "text-scarab"}>{threatLevel}%</span>
            </p>
          )}
        </div>

        {/* MANUAL ACTIVATE PANEL */}
        <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-blood-red/30 bg-blood-red/5">
          <span className="font-display text-[10px] text-blood-red tracking-wider mb-2">{t('manual_control_label')}</span>
          {confirmStep && !emergencyMode ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] text-blood-red font-display text-center">{t('confirm_activation_label')}</p>
              <div className="flex gap-2">
                <button onClick={handleActivate} className="px-3 py-1.5 rounded-md bg-blood-red text-foreground text-xs font-display font-bold hover:bg-blood-red/80 transition-colors">
                  {t('yes_btn')}
                </button>
                <button onClick={() => setConfirmStep(false)} className="px-3 py-1.5 rounded-md bg-secondary border border-border text-foreground text-xs font-display hover:bg-secondary/80 transition-colors">
                  {t('no_btn')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleActivate} className={`relative px-6 py-3 rounded-full border-2 transition-all group active:scale-95 ${
              emergencyMode
                ? "border-blood-red bg-blood-red/30 shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                : "border-blood-red/50 bg-blood-red/10 hover:border-blood-red hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            }`}>
              <Power className={`w-5 h-5 ${emergencyMode ? "text-blood-red animate-pulse" : "text-blood-red/70"}`} />
            </button>
          )}
          <span className={`text-[10px] font-display font-bold mt-2 ${emergencyMode ? "text-blood-red animate-pulse" : "text-scarab"}`}>
            {emergencyMode ? t('active_state') : t('secure_state')}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center mt-3">
        <button onClick={() => setShowList(s => !s)} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-secondary border border-border text-foreground text-xs font-display tracking-wider hover:bg-secondary/80">
          <KeyRound className="w-3.5 h-3.5" /> {t('vault_btn')} ({entries.length})
        </button>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary/20 border border-primary/40 text-primary text-xs font-display tracking-wider hover:bg-primary/30">
          <Plus className="w-3.5 h-3.5" /> {t('add_entry_btn')}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-secondary border border-border text-foreground text-xs font-display tracking-wider hover:bg-secondary/80">
          <RefreshCw className="w-3.5 h-3.5" /> {t('shadow_backup_btn')}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-secondary border border-border text-foreground text-xs font-display tracking-wider hover:bg-secondary/80">
          <Bell className="w-3.5 h-3.5" /> {t('heir_notify_btn')}
        </button>
      </div>

      {showList && (
        <div className="mt-3 max-h-44 overflow-auto space-y-1.5 border border-border rounded-md p-2 bg-background/40">
          {entries.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">{t('no_entries')}</p>}
          {entries.map((e: any) => (
            <div key={e.id} className="flex items-center gap-2 p-1.5 rounded bg-secondary/40">
              <button onClick={() => toggleLock(e)} className={e.locked ? "text-blood-red" : "text-scarab"}>
                {e.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-display text-foreground truncate">{e.label}</p>
                <p className="text-[9px] text-muted-foreground truncate">{e.category || t('uncategorized_text')} · {t('threat_level_field')} {e.threat_level}%</p>
              </div>
              <button onClick={() => removeEntry(e.id)} className="text-muted-foreground hover:text-blood-red"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-sm text-primary">{t('add_entry_btn')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">{t('label_field')}</Label><Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="bg-secondary border-border" /></div>
            <div className="space-y-1"><Label className="text-xs">{t('category')}</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="password / api-key / note" className="bg-secondary border-border" /></div>
            <div className="space-y-1"><Label className="text-xs">{t('threat_level_field')} (0-100)</Label><Input type="number" min={0} max={100} value={form.threat_level} onChange={e => setForm({ ...form, threat_level: Number(e.target.value) })} className="bg-secondary border-border" /></div>
            <div className="space-y-1"><Label className="text-xs">{t('description')}</Label><Input value={form.payload} onChange={e => setForm({ ...form, payload: e.target.value })} className="bg-secondary border-border" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>{t('cancel')}</Button>
            <Button onClick={addEntry}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decorative corners */}
      <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />
      <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />
    </div>
  );
};

export default SacredVaultCard;
