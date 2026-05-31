import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit, Play, GitBranch, List, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { extApi } from "@/services/extended";
import ExportButton from "@/components/shared/ExportButton";

const DEP_TYPES = ["sequential", "parallel", "conditional", "trigger"];
const ACTION_TYPES = ["task", "decision", "parallel", "wait", "notify", "webhook"];

type WorkflowEdge = {
  id: string; from_agent_code: string; to_agent_code: string;
  dependency_type: string; description?: string; workflow_name?: string;
  workflow_version?: string; is_active?: boolean; priority?: number;
  condition_expr?: string; timeout_seconds?: number; retry_count?: number;
  created_at: string;
};

type WorkflowStep = {
  id: string; workflow_name: string; step_order: number; step_label: string;
  agent_code?: string; action_type: string; condition_expr?: string;
  timeout_seconds?: number; retry_count?: number; is_active?: boolean;
  notes?: string; created_at: string;
};

const emptyEdge = {
  from_agent_code: "", to_agent_code: "", dependency_type: "sequential",
  description: "", workflow_name: "", workflow_version: "1.0",
  is_active: true, priority: 1, condition_expr: "",
  timeout_seconds: "", retry_count: 0,
};

const emptyStep = {
  workflow_name: "", step_order: 1, step_label: "",
  agent_code: "", action_type: "task", condition_expr: "",
  timeout_seconds: "", retry_count: 0, is_active: true, notes: "",
};

export default function WorkflowMap() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"edges" | "steps" | "executions">("edges");
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [edgeForm, setEdgeForm] = useState<any>(emptyEdge);
  const [stepForm, setStepForm] = useState<any>(emptyStep);
  const [showEdgeForm, setShowEdgeForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [editEdgeId, setEditEdgeId] = useState<string | null>(null);
  const [editStepId, setEditStepId] = useState<string | null>(null);
  const [filterWorkflow, setFilterWorkflow] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s, ex] = await Promise.all([
        extApi.list("workflow_map"),
        extApi.list("workflow_steps"),
        extApi.list("workflow_executions"),
      ]);
      setEdges(e as WorkflowEdge[]);
      setSteps(s as WorkflowStep[]);
      setExecutions(ex as any[]);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const workflowNames = Array.from(new Set([
    ...edges.map(e => e.workflow_name).filter(Boolean),
    ...steps.map(s => s.workflow_name).filter(Boolean),
  ])) as string[];

  const filteredEdges = filterWorkflow === "all" ? edges : edges.filter(e => e.workflow_name === filterWorkflow);
  const filteredSteps = filterWorkflow === "all" ? steps : steps.filter(s => s.workflow_name === filterWorkflow);

  const saveEdge = async () => {
    if (!edgeForm.from_agent_code || !edgeForm.to_agent_code) { toast.error("From/To agents required"); return; }
    const payload = { ...edgeForm, timeout_seconds: edgeForm.timeout_seconds ? Number(edgeForm.timeout_seconds) : null };
    try {
      if (editEdgeId) { await extApi.update("workflow_map", editEdgeId, payload); toast.success("Updated"); }
      else { await extApi.create("workflow_map", payload); toast.success("Edge added"); }
      setShowEdgeForm(false); setEdgeForm(emptyEdge); setEditEdgeId(null); load();
    } catch (ex: any) { toast.error(ex.message); }
  };

  const saveStep = async () => {
    if (!stepForm.workflow_name || !stepForm.step_label) { toast.error("Workflow name & label required"); return; }
    const payload = { ...stepForm, step_order: Number(stepForm.step_order), timeout_seconds: stepForm.timeout_seconds ? Number(stepForm.timeout_seconds) : null };
    try {
      if (editStepId) { await extApi.update("workflow_steps", editStepId, payload); toast.success("Updated"); }
      else { await extApi.create("workflow_steps", payload); toast.success("Step added"); }
      setShowStepForm(false); setStepForm(emptyStep); setEditStepId(null); load();
    } catch (ex: any) { toast.error(ex.message); }
  };

  const deleteEdge = async (id: string) => {
    await extApi.remove("workflow_map", id); setEdges(p => p.filter(e => e.id !== id));
  };
  const deleteStep = async (id: string) => {
    await extApi.remove("workflow_steps", id); setSteps(p => p.filter(s => s.id !== id));
  };
  const openEditEdge = (e: WorkflowEdge) => {
    setEdgeForm({ ...e, timeout_seconds: e.timeout_seconds ?? "" }); setEditEdgeId(e.id); setShowEdgeForm(true);
  };
  const openEditStep = (s: WorkflowStep) => {
    setStepForm({ ...s, timeout_seconds: s.timeout_seconds ?? "" }); setEditStepId(s.id); setShowStepForm(true);
  };

  const depColor: Record<string, string> = {
    sequential: "bg-blue-500/20 text-blue-400",
    parallel: "bg-green-500/20 text-green-400",
    conditional: "bg-yellow-500/20 text-yellow-400",
    trigger: "bg-purple-500/20 text-purple-400",
  };
  const statusColor: Record<string, string> = {
    completed: "bg-green-500/20 text-green-400",
    running: "bg-blue-500/20 text-blue-400",
    failed: "bg-red-500/20 text-red-400",
    cancelled: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /><span className="font-body text-sm">Back</span>
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg text-primary">WORKFLOW MAP</h1>
          </div>
          <div className="flex gap-2">
            <ExportButton data={filteredEdges} filename="workflow-edges" title="Workflow Edges" />
            {tab === "edges" && <Button onClick={() => { setEdgeForm(emptyEdge); setEditEdgeId(null); setShowEdgeForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Edge</Button>}
            {tab === "steps" && <Button onClick={() => { setStepForm(emptyStep); setEditStepId(null); setShowStepForm(true); }} className="gap-1 font-display text-xs"><Plus className="w-4 h-4" /> Add Step</Button>}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(["edges", "steps", "executions"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-display transition-colors ${tab === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground border border-transparent"}`}>
              {t === "edges" && <Network className="w-3 h-3" />}
              {t === "steps" && <List className="w-3 h-3" />}
              {t === "executions" && <Play className="w-3 h-3" />}
              {t === "edges" ? `Edges (${edges.length})` : t === "steps" ? `Steps (${steps.length})` : `Executions (${executions.length})`}
            </button>
          ))}
        </div>

        {workflowNames.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {["all", ...workflowNames].map(n => (
              <button key={n} onClick={() => setFilterWorkflow(n)}
                className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${filterWorkflow === n ? "bg-nile/20 text-nile border border-nile/30" : "text-muted-foreground border border-transparent"}`}>
                {n === "all" ? "All Workflows" : n}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-8">Loading...</p>
        ) : tab === "edges" ? (
          <div className="space-y-3">
            {filteredEdges.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No workflow edges. Add one to map agent connections.</p>}
            {filteredEdges.map(e => (
              <Card key={e.id} className="p-4 bg-card border-border">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-sm text-primary">{e.from_agent_code}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="font-display text-sm text-nile">{e.to_agent_code}</span>
                      <Badge className={`text-[10px] ${depColor[e.dependency_type] || "bg-muted text-muted-foreground"}`}>{e.dependency_type}</Badge>
                      {e.workflow_name && <Badge className="text-[10px] bg-primary/10 text-primary">{e.workflow_name} {e.workflow_version}</Badge>}
                      {!e.is_active && <Badge className="text-[10px] bg-muted text-muted-foreground">Inactive</Badge>}
                    </div>
                    {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                    {e.condition_expr && <p className="text-[10px] text-yellow-400 font-mono">if: {e.condition_expr}</p>}
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      {e.priority != null && <span>Priority: {e.priority}</span>}
                      {e.timeout_seconds != null && <span>Timeout: {e.timeout_seconds}s</span>}
                      {!!e.retry_count && <span>Retry: {e.retry_count}x</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditEdge(e)} className="p-1.5 rounded text-muted-foreground hover:text-primary"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteEdge(e.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : tab === "steps" ? (
          <div className="space-y-3">
            {filteredSteps.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No workflow steps. Add ordered steps to define execution sequences.</p>}
            {[...filteredSteps].sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0)).map(s => (
              <Card key={s.id} className="p-4 bg-card border-border">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-xs text-muted-foreground">#{s.step_order}</span>
                      <span className="font-display text-sm text-primary">{s.step_label}</span>
                      <Badge className="text-[10px] bg-primary/10 text-primary">{s.workflow_name}</Badge>
                      <Badge className="text-[10px] bg-secondary text-muted-foreground">{s.action_type}</Badge>
                      {!s.is_active && <Badge className="text-[10px] bg-muted text-muted-foreground">Inactive</Badge>}
                    </div>
                    {s.agent_code && <p className="text-xs text-nile">Agent: {s.agent_code}</p>}
                    {s.condition_expr && <p className="text-[10px] text-yellow-400 font-mono">if: {s.condition_expr}</p>}
                    {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditStep(s)} className="p-1.5 rounded text-muted-foreground hover:text-primary"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteStep(s.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {executions.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No workflow executions recorded yet.</p>}
            {executions.map(ex => (
              <Card key={ex.id} className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm text-primary">{ex.workflow_name}</span>
                      <Badge className={`text-[10px] ${statusColor[ex.status] || "bg-muted text-muted-foreground"}`}>{ex.status}</Badge>
                      {ex.trigger_source && <Badge className="text-[10px] bg-secondary text-muted-foreground">{ex.trigger_source}</Badge>}
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      {ex.initiated_by && <span>By: {ex.initiated_by}</span>}
                      <span>{new Date(ex.started_at || ex.created_at).toLocaleString()}</span>
                    </div>
                    {ex.error_message && <p className="text-[10px] text-destructive">{ex.error_message}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edge Form */}
      <Dialog open={showEdgeForm} onOpenChange={setShowEdgeForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editEdgeId ? "Edit" : "New"} Workflow Edge</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>From Agent *</Label><Input value={edgeForm.from_agent_code} onChange={e => setEdgeForm((p: any) => ({ ...p, from_agent_code: e.target.value }))} placeholder="AG-001" className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>To Agent *</Label><Input value={edgeForm.to_agent_code} onChange={e => setEdgeForm((p: any) => ({ ...p, to_agent_code: e.target.value }))} placeholder="AG-002" className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Dependency Type</Label>
                <Select value={edgeForm.dependency_type} onValueChange={v => setEdgeForm((p: any) => ({ ...p, dependency_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEP_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Workflow Name</Label><Input value={edgeForm.workflow_name} onChange={e => setEdgeForm((p: any) => ({ ...p, workflow_name: e.target.value }))} placeholder="Onboarding Flow" className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Version</Label><Input value={edgeForm.workflow_version} onChange={e => setEdgeForm((p: any) => ({ ...p, workflow_version: e.target.value }))} placeholder="1.0" className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Priority</Label><Input type="number" value={edgeForm.priority} onChange={e => setEdgeForm((p: any) => ({ ...p, priority: Number(e.target.value) }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Timeout (s)</Label><Input type="number" value={edgeForm.timeout_seconds} onChange={e => setEdgeForm((p: any) => ({ ...p, timeout_seconds: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label>Condition Expr</Label><Input value={edgeForm.condition_expr} onChange={e => setEdgeForm((p: any) => ({ ...p, condition_expr: e.target.value }))} placeholder="status === 'approved'" className="bg-secondary border-border text-foreground font-mono text-xs" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={edgeForm.description} onChange={e => setEdgeForm((p: any) => ({ ...p, description: e.target.value }))} rows={2} className="bg-secondary border-border text-foreground" /></div>
            <div className="flex items-center gap-3"><Switch checked={!!edgeForm.is_active} onCheckedChange={v => setEdgeForm((p: any) => ({ ...p, is_active: v }))} /><Label>Active</Label></div>
          </div>
          <DialogFooter><Button onClick={saveEdge} className="font-display text-xs">{editEdgeId ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Form */}
      <Dialog open={showStepForm} onOpenChange={setShowStepForm}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="font-display text-primary">{editStepId ? "Edit" : "New"} Workflow Step</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Workflow Name *</Label><Input value={stepForm.workflow_name} onChange={e => setStepForm((p: any) => ({ ...p, workflow_name: e.target.value }))} placeholder="Onboarding Flow" className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Step Order</Label><Input type="number" value={stepForm.step_order} onChange={e => setStepForm((p: any) => ({ ...p, step_order: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label>Step Label *</Label><Input value={stepForm.step_label} onChange={e => setStepForm((p: any) => ({ ...p, step_label: e.target.value }))} placeholder="Validate Customer Data" className="bg-secondary border-border text-foreground" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Action Type</Label>
                <Select value={stepForm.action_type} onValueChange={v => setStepForm((p: any) => ({ ...p, action_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTION_TYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Agent Code</Label><Input value={stepForm.agent_code} onChange={e => setStepForm((p: any) => ({ ...p, agent_code: e.target.value }))} placeholder="AG-003" className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label>Condition Expr</Label><Input value={stepForm.condition_expr} onChange={e => setStepForm((p: any) => ({ ...p, condition_expr: e.target.value }))} placeholder="input.score > 80" className="bg-secondary border-border text-foreground font-mono text-xs" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Timeout (s)</Label><Input type="number" value={stepForm.timeout_seconds} onChange={e => setStepForm((p: any) => ({ ...p, timeout_seconds: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-2"><Label>Retry Count</Label><Input type="number" value={stepForm.retry_count} onChange={e => setStepForm((p: any) => ({ ...p, retry_count: Number(e.target.value) }))} className="bg-secondary border-border text-foreground" /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={stepForm.notes} onChange={e => setStepForm((p: any) => ({ ...p, notes: e.target.value }))} rows={2} className="bg-secondary border-border text-foreground" /></div>
            <div className="flex items-center gap-3"><Switch checked={!!stepForm.is_active} onCheckedChange={v => setStepForm((p: any) => ({ ...p, is_active: v }))} /><Label>Active</Label></div>
          </div>
          <DialogFooter><Button onClick={saveStep} className="font-display text-xs">{editStepId ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

