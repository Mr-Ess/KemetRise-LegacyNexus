import { MoreHorizontal, Plus, ChevronRight, Filter, X, Calendar, LayoutGrid } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { tasksApi, aiApi } from "@/services/system";
import { toast } from "sonner";
import CalendarView from "@/components/shared/CalendarView";
import ExportButton from "@/components/shared/ExportButton";
import { SavedViews } from "@/components/shared/SavedViews";

type Task = {
  id: string;
  title: string;
  assignee?: string | null;
  agent_kind: string;
  status: string;
  metadata: any;
};

type StatusCol = { key: string; title: string; color: string };
const statusColumns: StatusCol[] = [
  { key: "todo", title: "To Do", color: "text-muted-foreground" },
  { key: "in-progress", title: "In Progress", color: "text-nile" },
  { key: "review", title: "Under Review", color: "text-primary" },
  { key: "done", title: "Done", color: "text-scarab" },
];
const categories = ["all", "legal", "marketing", "data", "strategy", "operations"] as const;

const HybridTaskFlowCard = () => {
  const [typeFilter, setTypeFilter] = useState<"all" | "AI" | "Human">("all");
  const [categoryFilter, setCategoryFilter] = useState<typeof categories[number]>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newAgent, setNewAgent] = useState<"AI" | "Human">("Human");
  const [view, setView] = useState<"kanban" | "calendar">("kanban");

  useEffect(() => {
    tasksApi.list().then((d) => setTasks(d as any)).catch((e) => toast.error(e.message));
  }, []);

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    const tType = t.agent_kind === "ai" ? "AI" : "Human";
    if (typeFilter !== "all" && tType !== typeFilter) return false;
    if (categoryFilter !== "all" && t.metadata?.category !== categoryFilter) return false;
    return true;
  }), [tasks, typeFilter, categoryFilter]);

  const addTask = async (status: string) => {
    if (!newTitle.trim()) return;
    try {
      let category: string = categoryFilter === "all" ? "operations" : categoryFilter;
      try {
        const c = await aiApi.categorize("task", newTitle);
        if (c && c !== "uncategorized" && c !== "other") category = c;
      } catch { /* fallback */ }
      const row = await tasksApi.create({
        title: newTitle, status, agent_kind: newAgent === "AI" ? "ai" : "human",
        assignee: newAgent, metadata: { category },
      });
      setTasks((p) => [row as any, ...p]);
      setNewTitle(""); setAdding(null);
      toast.success(`Task added · ${category}`);
    } catch (e: any) { toast.error(e.message); }
  };

  const moveTask = async (id: string, status: string) => {
    try { const r = await tasksApi.update(id, { status }); setTasks((p) => p.map((x) => x.id === id ? (r as any) : x)); }
    catch (e: any) { toast.error(e.message); }
  };

  const removeTask = async (id: string) => {
    try { await tasksApi.remove(id); setTasks((p) => p.filter((x) => x.id !== id)); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="font-display text-xs font-bold text-foreground tracking-wider">
            HYBRID TASK FLOW <span className="text-muted-foreground font-body text-xs">(لوحة المهام الهجينة)</span>
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setView(view === "kanban" ? "calendar" : "kanban")} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary" title="Toggle view">
            {view === "kanban" ? <Calendar className="w-4 h-4"/> : <LayoutGrid className="w-4 h-4"/>}
          </button>
          <ExportButton data={tasks as any[]} filename="tasks" title="Tasks Export" />
          <SavedViews page="tasks" currentFilters={{ typeFilter, categoryFilter }} onApply={(f) => { setTypeFilter(f.typeFilter ?? "all"); setCategoryFilter(f.categoryFilter ?? "all"); }} />
          <button onClick={() => setShowFilters(!showFilters)} className={`p-1.5 rounded-md ${showFilters ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
            <Filter className="w-4 h-4" />
          </button>
          <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-3 p-2.5 bg-secondary/30 rounded-md border border-border/50">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-display text-muted-foreground">Type:</span>
            {(["all", "AI", "Human"] as const).map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-2 py-0.5 rounded text-[10px] font-display ${typeFilter === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
                {t === "all" ? "All" : t === "AI" ? "🤖 AI" : "👤 Human"}
              </button>
            ))}
          </div>
          <div className="w-px bg-border self-stretch" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-display text-muted-foreground">Category:</span>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={`px-2 py-0.5 rounded text-[10px] font-display capitalize ${categoryFilter === c ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        </div>
      )}

      {view === "calendar" ? (
        <CalendarView tasks={filteredTasks as any} />
      ) : (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusColumns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="min-w-[160px] flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-display tracking-wider ${col.color}`}>{col.title} ({colTasks.length})</span>
                <button onClick={() => setAdding(col.key)} className="text-muted-foreground hover:text-primary"><Plus className="w-3 h-3" /></button>
              </div>
              {adding === col.key && (
                <div className="mb-2 bg-secondary/70 rounded-md p-2 border border-primary/30 space-y-1">
                  <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask(col.key)} placeholder="Task title..." className="w-full bg-background text-xs px-2 py-1 rounded border border-border text-foreground" />
                  <div className="flex gap-1">
                    <select value={newAgent} onChange={(e) => setNewAgent(e.target.value as any)} className="text-[10px] bg-background border border-border rounded px-1 flex-1 text-foreground"><option>Human</option><option>AI</option></select>
                    <button onClick={() => addTask(col.key)} className="text-[10px] px-2 bg-primary text-primary-foreground rounded">Add</button>
                    <button onClick={() => { setAdding(null); setNewTitle(""); }} className="text-muted-foreground"><X className="w-3 h-3" /></button>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                {colTasks.map((task) => (
                  <div key={task.id} className="bg-secondary/50 rounded-md p-2.5 border border-border/50 group">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-body text-foreground leading-snug mb-2 flex-1">{task.title}</p>
                      <button onClick={() => removeTask(task.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${task.agent_kind === "ai" ? "bg-nile/20 text-nile" : "bg-primary/20 text-primary"}`}>
                          {task.agent_kind === "ai" ? "⚙️" : "👤"}
                        </div>
                        {task.metadata?.category && <span className="text-[8px] px-1.5 py-0.5 rounded bg-secondary border border-border/50 text-muted-foreground capitalize">{task.metadata.category}</span>}
                      </div>
                      <select value={task.status} onChange={(e) => moveTask(task.id, e.target.value)} className="text-[9px] bg-transparent border border-border/50 rounded text-muted-foreground">
                        {statusColumns.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="flex items-center shrink-0"><ChevronRight className="w-5 h-5 text-muted-foreground" /></div>
      </div>
      )}
    </div>
  );
};

export default HybridTaskFlowCard;
