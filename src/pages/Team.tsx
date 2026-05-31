import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Bot, User, Search, Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { useEntities } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExportButton from "@/components/shared/ExportButton";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  active:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  online:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  busy:     "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  offline:  "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function Team() {
  const nav = useNavigate();
  const { items: rows, remove } = useEntities("employees");

  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<"all" | "Human" | "AI Agent">("all");
  const [statusFilter,setStatusFilter]= useState("all");

  const items = useMemo(() => rows.map((r: any) => ({
    id:           r.id,
    name:         r.name         ?? r.data?.name         ?? "—",
    type:         r.agent_type === "ai" || r.data?.type === "AI Agent" ? "AI Agent" : "Human",
    position:     r.position     ?? r.data?.position     ?? "—",
    department:   r.department   ?? r.data?.department   ?? "—",
    email:        r.email        ?? r.data?.email        ?? "—",
    status:       r.status       ?? r.data?.status       ?? "inactive",
    availability: r.data?.availability ?? "",
    agent_code:   r.agent_code   ?? r.data?.agent_code   ?? "",
  })), [rows]);

  const filtered = useMemo(() => items.filter(i => {
    if (typeFilter !== "all" && i.type !== typeFilter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.email.toLowerCase().includes(search.toLowerCase()) && !i.department.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, typeFilter, statusFilter, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the team?`)) return;
    try { await remove(id); toast.success("Removed"); }
    catch (e: any) { toast.error(e.message); }
  };

  const aiCount    = items.filter(i => i.type === "AI Agent").length;
  const humanCount = items.filter(i => i.type === "Human").length;
  const onlineCount= items.filter(i => i.status === "active" || i.availability === "online").length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <button onClick={() => nav(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary text-sm">
          <ArrowLeft className="w-4 h-4"/>Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="font-display text-xl text-primary flex items-center gap-2">
            <Users className="w-5 h-5"/>Team
          </h1>
          <div className="flex items-center gap-2">
            <ExportButton data={filtered} filename="team" title="Team"/>
            <Button size="sm" onClick={() => nav("/employees")}>
              <Plus className="w-4 h-4 mr-1"/>Add Member
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",    value: items.length,  icon: Users },
            { label: "Human",    value: humanCount,    icon: User  },
            { label: "AI Agents",value: aiCount,       icon: Bot   },
            { label: "Active",   value: onlineCount,   icon: RefreshCw },
          ].map(s => (
            <Card key={s.label} className="p-3 flex items-center gap-3">
              <s.icon className="w-5 h-5 text-primary shrink-0"/>
              <div>
                <p className="font-display text-lg text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground"/>
            <Input className="pl-9" placeholder="Search name, email, dept…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v as any)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Type"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Human">Human</SelectItem>
              <SelectItem value="AI Agent">AI Agent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          {filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No team members found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Position / Dept</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Status</th>
                    <th className="p-3 w-20"/>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          {m.type === "AI Agent"
                            ? <Bot className="w-4 h-4 text-scarab shrink-0"/>
                            : <User className="w-4 h-4 text-primary shrink-0"/>}
                          <span>{m.name}</span>
                          {m.agent_code && <Badge variant="outline" className="text-[9px] text-muted-foreground">{m.agent_code}</Badge>}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[10px] ${m.type === "AI Agent" ? "border-scarab/40 text-scarab" : ""}`}>{m.type}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        <div>{m.position}</div>
                        {m.department && <div className="text-[10px] opacity-70">{m.department}</div>}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{m.email}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[10px] border ${STATUS_COLOR[m.availability || m.status] ?? STATUS_COLOR.inactive}`}>
                          {m.availability || m.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => nav("/employees")}><Edit className="w-3.5 h-3.5"/></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id, m.name)}><Trash2 className="w-3.5 h-3.5 text-destructive"/></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
